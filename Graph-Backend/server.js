const express = require('express');
const cors = require('./middleware/cors');
const helmet = require('./middleware/helmet');
const compression = require('./middleware/compression');
const path = require('path');
const { MAIN_SERVER, ELECTRICITY_BASE_URL, GAS_BASE_URL } = require('./config/ports');

const app = express();

// Middleware
app.use(helmet);
app.use(compression);
app.use(cors);
app.use(express.json());

const frontendBuildPath = path.join(__dirname, '../Graph-Frontend/dist');
app.use(express.static(frontendBuildPath));

// Main health route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Main Orchestrator',
    timestamp: new Date().toISOString(),
    services: {
      electricity: `${ELECTRICITY_BASE_URL}/api/electricity/health`,
      gas: `${GAS_BASE_URL}/api/gas/health`
    }
  });
});

// Root route with service information
app.get('/api', (req, res) => {
  res.json({
    service: 'Energy Dashboard Orchestrator',
    version: '1.0.0',
    description: 'Main server that orchestrates electricity and gas APIs',
    services: {
      electricity: {
        url: ELECTRICITY_BASE_URL,
        status: 'Active',
        endpoints: [
          '/api/electricity/health',
          '/api/electricity/data',
          '/api/electricity/stats',
          '/api/electricity/data/aggregated/:period'
        ]
      },
      gas: {
        url: GAS_BASE_URL,
        status: 'Not yet implemented',
        endpoints: [
          '/api/gas/health',
          '/api/gas/data',
          '/api/gas/stats'
        ]
      }
    },
    mainEndpoints: {
      health: '/api/health'
    }
  });
});

// Route pour servir l'application Vue.js (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendBuildPath, 'index.html'));
});

// Global error handling
app.use((error, req, res, next) => {
  console.error('Main Orchestrator Error:', error);
  res.status(500).json({ 
    error: 'Internal Main Orchestrator Server Error',
    message: error.message 
  });
});

// Start server
app.listen(MAIN_SERVER, () => {
  console.log(`Main Orchestrator server started on port ${MAIN_SERVER}`);
  console.log(`Main server available at http://localhost:${MAIN_SERVER}`);
  console.log(`Health check: http://localhost:${MAIN_SERVER}/api/health`);
  console.log(`Electricity API: ${ELECTRICITY_BASE_URL}`);
  console.log(`Gas API: ${GAS_BASE_URL}`);
  console.log(`Frontend: http://localhost:${MAIN_SERVER}`);
  console.log(`\n To start all services, run:`);
  console.log(`   npm run start-electricity`);
  console.log(`   npm run start-gas`);
  console.log(`   npm run start-all`);
  console.log(`\n To build for production:`);
  console.log(`   cd ../Graph-Frontend && npm run build`);
});

module.exports = app; 