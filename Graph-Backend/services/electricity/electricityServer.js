const express = require('express');
const cors = require('../../middleware/cors');
const helmet = require('../../middleware/helmet');
const compression = require('../../middleware/compression');
const electricityRoutes = require('./electricityRoutes');
const { ELECTRICITY_API } = require('../../config/ports');

const app = express();

// Middleware
app.use(helmet);
app.use(compression);
app.use(cors);
app.use(express.json());

// Routes
app.use('/api/electricity', electricityRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    service: 'Electricity API',
    version: '1.0.0',
    endpoints: {
      health: '/api/electricity/health',
      data: '/api/electricity/data',
      stats: '/api/electricity/stats',
      aggregated: '/api/electricity/data/aggregated/:period',
      year: '/api/electricity/data/year/:year',
      reload: '/api/electricity/reload'
    }
  });
});

// 404 error handling
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Electricity API endpoint not found',
    availableEndpoints: [
      '/api/electricity/health',
      '/api/electricity/data',
      '/api/electricity/stats'
    ]
  });
});

// Global error handling
app.use((error, req, res, next) => {
  console.error('Electricity API Error:', error);
  res.status(500).json({ 
    error: 'Internal Electricity API Server Error',
    message: error.message 
  });
});

// Start server
app.listen(ELECTRICITY_API, () => {
  console.log(`Electricity API server started on port ${ELECTRICITY_API}`);
  console.log(`Electricity API available at http://localhost:${ELECTRICITY_API}`);
  console.log(`Health check: http://localhost:${ELECTRICITY_API}/api/electricity/health`);
});

module.exports = app; 