const express = require('express');
const sseService = require('../services/sseService');

const router = express.Router();

router.use((req, res, next) => {
  req.headers['x-no-compression'] = 'true';
  next();
});

/**
 * SSE route to receive real-time events
 * GET /api/sse?fileName=optional
 */
router.get('/', (req, res) => {
  const fileName = req.query.fileName || null;
  
  
  const clientId = sseService.addClient(req, res, fileName);
  
  const stats = sseService.getStats();
  sseService.sendToClient(clientId, 'stats', stats);
});

/**
 * Route to get SSE connection statistics
 * GET /api/sse/stats
 */
router.get('/stats', (req, res) => {
  const stats = sseService.getStats();
  res.json({
    success: true,
    stats: stats
  });
});



module.exports = router;
