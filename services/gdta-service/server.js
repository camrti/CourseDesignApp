const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.GDTA_SERVICE_PORT || 3002;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`GDTA Service: ${req.method} ${req.url}`);
  next();
});

const connectDB = async () => {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('GDTA Service: Database connected successfully');
    } else {
      throw new Error('MONGODB_URI not found in environment variables');
    }
  } catch (error) {
    console.error('GDTA Service: Database connection failed:', error.message);
    console.log('Please make sure MongoDB is running and MONGODB_URI is set in .env file');
    process.exit(1);
  }
};

app.get('/health', (req, res) => {
  res.json({ 
    service: 'GDTA Service',
    status: 'ok',
    port: PORT,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.use('/api/gdta', require('./routes/gdta'));

app.use((err, req, res, next) => {
  console.error('GDTA Service error:', err.message);
  res.status(500).json({ 
    message: 'Internal server error',
    service: 'GDTA Service'
  });
});

const start = async () => {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`GDTA Service running on port ${PORT}`);
    console.log(`Database: ${process.env.MONGODB_URI}`);
  });
};

start();