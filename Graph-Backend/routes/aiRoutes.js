const express = require('express');
const aiController = require('../controllers/aiController');

const router = express.Router();

router.post('/predict', aiController.runPrediction);

router.get('/test', aiController.testConnection);

router.get('/models', aiController.getAvailableModels);

module.exports = router;
