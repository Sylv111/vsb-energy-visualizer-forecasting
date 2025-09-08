const express = require('express');
const HealthController = require('../controllers/healthController');

const router = express.Router();
const healthController = new HealthController();

// Health check route
router.get('/health', (req, res) => {
  healthController.getHealth(req, res);
});

// API information route
router.get('/', (req, res) => {
  healthController.getApiInfo(req, res);
});

module.exports = router;

