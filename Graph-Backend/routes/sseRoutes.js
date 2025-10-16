const express = require('express');
const sseService = require('../services/sseService');

const router = express.Router();

router.use((req, res, next) => {
  req.headers['x-no-compression'] = 'true';
  next();
});

/**
 * Route SSE pour recevoir les événements en temps réel
 * GET /api/sse?fileName=optional
 */
router.get('/', (req, res) => {
  const fileName = req.query.fileName || null;
  
  
  // Ajouter le client SSE
  const clientId = sseService.addClient(req, res, fileName);
  
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
