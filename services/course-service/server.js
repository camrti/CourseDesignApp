const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.COURSE_SERVICE_PORT || 3001;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`Course Service: ${req.method} ${req.url}`);
  next();
});

const connectDB = async () => {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('Course Service: Database connected successfully');
    } else {
      throw new Error('MONGODB_URI not found in environment variables');
    }
  } catch (error) {
    console.error('Course Service: Database connection failed:', error.message);
    console.log('Please make sure MongoDB is running and MONGODB_URI is set in .env file');
    process.exit(1);
  }
};

app.get('/health', (req, res) => {
  res.json({ 
    service: 'Course Service',
    status: 'ok',
    port: PORT,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.use('/api/courses', require('./routes/courses'));

app.use((err, req, res, next) => {
  console.error('Course Service error:', err.message);
  res.status(500).json({ 
    message: 'Internal server error',
    service: 'Course Service'
  });
});

const start = async () => {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`Course Service running on port ${PORT}`);
    console.log(`Database: ${process.env.MONGODB_URI}`);
  });
};

start();