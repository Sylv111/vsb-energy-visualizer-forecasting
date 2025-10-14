const express = require('express');
const sseService = require('../services/sseService');

const router = express.Router();

/**
 * Route SSE pour recevoir les événements en temps réel
 * GET /api/sse?fileName=optional
 */
router.get('/', (req, res) => {
  const fileName = req.query.fileName || null;
  
  console.log(`📡 New SSE connection request for file: ${fileName || 'all'}`);
  
  // Ajouter le client SSE
  const clientId = sseService.addClient(res, fileName);
  
  // Envoyer les statistiques initiales
  const stats = sseService.getStats();
  sseService.sendToClient(clientId, 'stats', stats);
});

/**
 * Route pour obtenir les statistiques des connexions SSE
 * GET /api/sse/stats
 */
router.get('/stats', (req, res) => {
  const stats = sseService.getStats();
  res.json({
    success: true,
    stats: stats
  });
});

/**
 * Route pour tester l'envoi d'événements (développement)
 * POST /api/sse/test
 */
router.post('/test', (req, res) => {
  const { event, data, fileName } = req.body;
  
  if (event && data) {
    sseService.broadcast(event, data, fileName);
    res.json({
      success: true,
      message: `Event '${event}' broadcasted to ${sseService.getClientCount()} clients`
    });
  } else {
    res.status(400).json({
      success: false,
      error: 'Missing event or data'
    });
  }
});

module.exports = router;
