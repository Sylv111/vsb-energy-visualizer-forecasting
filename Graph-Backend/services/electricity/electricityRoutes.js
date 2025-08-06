const express = require('express');
const electricityService = require('./electricityService');

const router = express.Router();

// Route health check for electricity API
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Electricity API',
    timestamp: new Date().toISOString() 
  });
});

// Route to get all data
router.get('/data', async (req, res) => {
  try {
    const result = await electricityService.getAllData();
    res.json(result);
  } catch (error) {
    console.error('Error getting electricity data:', error);
    res.status(500).json({ error: 'Error processing electricity data' });
  }
});

// Route to get data by year
router.get('/data/year/:year', async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    const result = await electricityService.getDataByYear(year);
    res.json(result);
  } catch (error) {
    console.error('Error filtering electricity data by year:', error);
    res.status(500).json({ error: 'Error filtering electricity data' });
  }
});

// Route to get aggregated data by period
router.get('/data/aggregated/:period', async (req, res) => {
  try {
    const period = req.params.period; // 'day', 'week', 'month'
    const result = await electricityService.getAggregatedData(period);
    res.json(result);
  } catch (error) {
    console.error('Error aggregating electricity data:', error);
    res.status(500).json({ error: 'Error aggregating electricity data' });
  }
});

// Route to get statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await electricityService.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error calculating electricity statistics:', error);
    res.status(500).json({ error: 'Error calculating electricity statistics' });
  }
});

// Route to reload data
router.post('/reload', async (req, res) => {
  try {
    const result = await electricityService.reloadData();
    res.json(result);
  } catch (error) {
    console.error('Error reloading electricity data:', error);
    res.status(500).json({ error: 'Error reloading electricity data' });
  }
});

// Route to get Flow data for a specific day
router.get('/flow/:date/:flowType', async (req, res) => {
  try {
    const { date, flowType } = req.params;
    const result = await electricityService.getFlowData(date, flowType);
    res.json({
      success: true,
      data: result.data,
      date: result.date,
      flowType: result.flowType,
      count: result.count
    });
  } catch (error) {
    console.error('Error getting Flow data:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting Flow data',
      error: error.message
    });
  }
});

// Route to get National Demand (ND) data in optimized format
router.get('/nd', async (req, res) => {
  try {
    const result = await electricityService.getNationalDemandData();
    res.json({
      success: true,
      data: result.data,
      count: result.count,
      totalRecords: result.totalRecords,
      savedToFile: result.savedToFile
    });
  } catch (error) {
    console.error('Error getting National Demand data:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting National Demand data',
      error: error.message
    });
  }
});

module.exports = router; 