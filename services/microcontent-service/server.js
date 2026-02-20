const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

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

const start = async () => {
  await connectDB();

  // Auto-seed microcontents from JSON file if database is empty
  // Embeddings are pre-computed in the JSON (see annotation-scripts/precompute-embeddings.py)
  await seedMicrocontents();

  app.listen(PORT, () => {
    console.log(`Microcontent Service running on port ${PORT}`);
    console.log(`Database: ${process.env.MONGODB_URI}`);
    console.log(`Static media available at: http://localhost:${PORT}/media/`);
    console.log(`Forced downloads available at: http://localhost:${PORT}/media/download/`);
  });
};

start();