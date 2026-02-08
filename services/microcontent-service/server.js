const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.MICROCONTENT_SERVICE_PORT || 3004;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`Microcontent Service: ${req.method} ${req.url}`);
  next();
});

const mediaPath = path.join(__dirname, 'media');
console.log(`Serving static files from: ${mediaPath}`);

app.use('/media', express.static(mediaPath, {
  maxAge: '1h',
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    
    if (ext === '.docx' || ext === '.doc') {
      res.setHeader('Content-Disposition', 'attachment');
    } else if (ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.gif' || ext === '.webp') {
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    } else {
      res.setHeader('Content-Disposition', 'inline');
    }
    
    console.log(`Serving static file: ${path.basename(filePath)}`);
  }
}));

app.get('/media/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(mediaPath, filename);
  
  const fs = require('fs');
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'File not found' });
  }
  
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/octet-stream');
  
  console.log(`Force downloading: ${filename}`);
  res.sendFile(filePath);
});

const connectDB = async () => {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('Microcontent Service: Database connected successfully');
    } else {
      throw new Error('MONGODB_URI not found in environment variables');
    }
  } catch (error) {
    console.error('Microcontent Service: Database connection failed:', error.message);
    console.log('Please make sure MongoDB is running and MONGODB_URI is set in .env file');
    process.exit(1);
  }
};

app.get('/health', (req, res) => {
  res.json({ 
    service: 'Microcontent Service',
    status: 'ok',
    port: PORT,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    mediaPath: mediaPath
  });
});

app.use('/api/microcontents', require('./routes/microcontents'));

app.use((err, req, res, next) => {
  console.error('Microcontent Service error:', err.message);
  res.status(500).json({ 
    message: 'Internal server error',
    service: 'Microcontent Service'
  });
});

const seedMicrocontents = require('./seedMicrocontents');
const microcontentService = require('./microcontentService');

const start = async () => {
  await connectDB();

  // Auto-seed microcontents from JSON file if database is empty
  await seedMicrocontents();

  // Compute embeddings for any microcontents that don't have them yet
  console.log('Checking for microcontents without embeddings...');
  try {
    await microcontentService.computeEmbeddingsForAll();
    console.log('✅ Embedding computation complete!');
  } catch (error) {
    console.error('⚠️  Warning: Failed to compute embeddings:', error.message);
    console.error('The service will still start, but recommendations may not work properly.');
  }

  app.listen(PORT, () => {
    console.log(`Microcontent Service running on port ${PORT}`);
    console.log(`Database: ${process.env.MONGODB_URI}`);
    console.log(`Static media available at: http://localhost:${PORT}/media/`);
    console.log(`Forced downloads available at: http://localhost:${PORT}/media/download/`);
  });
};

start();