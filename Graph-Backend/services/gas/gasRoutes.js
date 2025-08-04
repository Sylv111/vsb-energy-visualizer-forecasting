const express = require('express');
const gasService = require('./gasService');

const router = express.Router();

// Route health check for gas API
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Gas API',
    timestamp: new Date().toISOString(),
    message: 'Gas service is running but not yet implemented'
  });
});

// Route to get all data (empty for now)
router.get('/data', async (req, res) => {
  try {
    const result = await gasService.getAllData();
    res.json(result);
  } catch (error) {
    console.error('Error getting gas data:', error);
    res.status(500).json({ error: 'Gas service not yet implemented' });
  }
});

// Route to get statistics (empty for now)
router.get('/stats', async (req, res) => {
  try {
    const stats = await gasService.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error calculating gas statistics:', error);
    res.status(500).json({ error: 'Gas service not yet implemented' });
  }
});

// Route to reload data (empty for now)
router.post('/reload', async (req, res) => {
  try {
    const result = await gasService.reloadData();
    res.json(result);
  } catch (error) {
    console.error('Error reloading gas data:', error);
    res.status(500).json({ error: 'Gas service not yet implemented' });
  }
});

module.exports = router; 