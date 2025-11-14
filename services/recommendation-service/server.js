const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.RECOMMENDATION_SERVICE_PORT || 3003;

process.env.MICROCONTENT_SERVICE_URL = `http://microcontent-service:${process.env.MICROCONTENT_SERVICE_PORT || 3004}`;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`Recommendation Service: ${req.method} ${req.url}`);
  next();
});

const connectDB = async () => {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('Recommendation Service: Database connected successfully');
    } else {
      throw new Error('MONGODB_URI not found in environment variables');
    }
  } catch (error) {
    console.error('Recommendation Service: Database connection failed:', error.message);
    console.log('Please make sure MongoDB is running and MONGODB_URI is set in .env file');
    process.exit(1);
  }
};

app.get('/health', (req, res) => {
  res.json({ 
    service: 'Recommendation Service',
    status: 'ok',
    port: PORT,
    microcontentService: process.env.MICROCONTENT_SERVICE_URL,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.use('/api/recommendations', require('./routes/recommendations'));

app.use((err, req, res, next) => {
  console.error('Recommendation Service error:', err.message);
  res.status(500).json({ 
    message: 'Internal server error',
    service: 'Recommendation Service'
  });
});

const start = async () => {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`Recommendation Service running on port ${PORT}`);
    console.log(`Connected to Microcontent Service: ${process.env.MICROCONTENT_SERVICE_URL}`);
    console.log(`Database: ${process.env.MONGODB_URI}`);
  });
};

start();