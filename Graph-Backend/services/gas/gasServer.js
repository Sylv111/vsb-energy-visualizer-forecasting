const express = require('express');
const cors = require('../../middleware/cors');
const helmet = require('../../middleware/helmet');
const compression = require('../../middleware/compression');
const gasRoutes = require('./gasRoutes');
const { GAS_API } = require('../../config/ports');

const app = express();

// Middleware
app.use(helmet);
app.use(compression);
app.use(cors);
app.use(express.json());

// Routes
app.use('/api/gas', gasRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    service: 'Gas API',
    version: '1.0.0',
    status: 'Not yet implemented',
    endpoints: {
      health: '/api/gas/health',
      data: '/api/gas/data',
      stats: '/api/gas/stats',
      reload: '/api/gas/reload'
    }
  });
});

// 404 error handling
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Gas API endpoint not found',
    availableEndpoints: [
      '/api/gas/health',
      '/api/gas/data',
      '/api/gas/stats'
    ]
  });
});

// Global error handling
app.use((error, req, res, next) => {
  console.error('Gas API Error:', error);
  res.status(500).json({ 
    error: 'Internal Gas API Server Error',
    message: error.message 
  });
});

// Start server
app.listen(GAS_API, () => {
  console.log(`Gas API server started on port ${GAS_API}`);
  console.log(`Gas API available at http://localhost:${GAS_API}`);
  console.log(`Health check: http://localhost:${GAS_API}/api/gas/health`);
  console.log(`Note: Gas service is not yet implemented`);
});

module.exports = app; 