const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.API_GATEWAY_PORT || 8080;

const GDTA_SERVICE_HOST = process.env.GDTA_SERVICE_HOST || 'localhost';
const COURSE_SERVICE_HOST = process.env.COURSE_SERVICE_HOST || 'localhost';
const RECOMMENDATION_SERVICE_HOST = process.env.RECOMMENDATION_SERVICE_HOST || 'localhost';
const MICROCONTENT_SERVICE_HOST = process.env.MICROCONTENT_SERVICE_HOST || 'localhost';

const GDTA_SERVICE_URL = `http://${GDTA_SERVICE_HOST}:${process.env.GDTA_SERVICE_PORT || 3002}`;
const COURSE_SERVICE_URL = `http://${COURSE_SERVICE_HOST}:${process.env.COURSE_SERVICE_PORT || 3001}`;
const RECOMMENDATION_SERVICE_URL = `http://${RECOMMENDATION_SERVICE_HOST}:${process.env.RECOMMENDATION_SERVICE_PORT || 3003}`;
const MICROCONTENT_SERVICE_URL = `http://${MICROCONTENT_SERVICE_HOST}:${process.env.MICROCONTENT_SERVICE_PORT || 3004}`;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`Gateway: ${req.method} ${req.url}`);
  next();
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    gateway: 'API Gateway',
    port: PORT,
    services: {
      gdta: GDTA_SERVICE_URL,
      course: COURSE_SERVICE_URL,
      recommendation: RECOMMENDATION_SERVICE_URL,
      microcontent: MICROCONTENT_SERVICE_URL
    }
  });
});

const proxyRequest = async (req, res, serviceUrl) => {
  try {
    const config = {
      method: req.method.toLowerCase(),
      url: `${serviceUrl}${req.url}`,
      data: req.body,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const response = await axios(config);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error(`Error proxying to ${serviceUrl}:`, error.message);
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message;
    
    res.status(status).json({
      message: `Service error: ${message}`,
      service: serviceUrl
    });
  }
};

app.all('/api/gdta*', (req, res) => {
  proxyRequest(req, res, GDTA_SERVICE_URL);
});

app.all('/api/courses*', (req, res) => {
  proxyRequest(req, res, COURSE_SERVICE_URL);
});

app.all('/api/recommendations*', (req, res) => {
  proxyRequest(req, res, RECOMMENDATION_SERVICE_URL);
});

app.all('/api/microcontents*', (req, res) => {
  proxyRequest(req, res, MICROCONTENT_SERVICE_URL);
});

app.get('/media/*', async (req, res) => {
  try {
    const mediaUrl = `${MICROCONTENT_SERVICE_URL}${req.url}`;
    const response = await axios.get(mediaUrl, {
      responseType: 'stream'
    });

    Object.keys(response.headers).forEach(key => {
      res.setHeader(key, response.headers[key]);
    });

    response.data.pipe(res);
  } catch (error) {
    console.error(`Error proxying media file:`, error.message);
    res.status(error.response?.status || 500).json({
      message: 'Media file not found',
      path: req.url
    });
  }
});

app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl
  });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log('Proxying to:');
  console.log(`  - GDTA Service: ${GDTA_SERVICE_URL}`);
  console.log(`  - Course Service: ${COURSE_SERVICE_URL}`);
  console.log(`  - Recommendation Service: ${RECOMMENDATION_SERVICE_URL}`);
  console.log(`  - Microcontent Service: ${MICROCONTENT_SERVICE_URL}`);
});