const express = require('express');
const path = require('path');
const cors = require('./middleware/cors');
const helmet = require('./middleware/helmet');
const compression = require('./middleware/compression');
const { MAIN_SERVER } = require('./config/ports');

// Import routes
const csvRoutes = require('./routes/csvRoutes');
const healthRoutes = require('./routes/healthRoutes');

const app = express();

// Middleware
app.use(helmet);
app.use(compression);
app.use(cors);
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// API Routes
app.use('/api/csv', csvRoutes);
app.use('/api', healthRoutes);

// Serve static files from Vue.js build
const frontendBuildPath = path.join(__dirname, '../Graph-Frontend/dist');
app.use(express.static(frontendBuildPath));

// SPA fallback route - serve Vue.js app for all non-API routes
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
  console.log(`Universal CSV Processor server started on port ${MAIN_SERVER}`);
  console.log(`Server available at http://localhost:${MAIN_SERVER}`);
  console.log(`Health check: http://localhost:${MAIN_SERVER}/api/health`);
  console.log(`Frontend: http://localhost:${MAIN_SERVER}`);
});

module.exports = app;