class HealthController {
  getHealth(req, res) {
    res.json({ 
      status: 'OK', 
      service: 'Universal CSV Processor',
      timestamp: new Date().toISOString(),
      endpoints: {
        health: '/api/health',
        upload: '/api/csv/upload',
        data: '/api/csv/data'
      }
    });
  }

  getApiInfo(req, res) {
    res.json({
      service: 'Universal CSV Processor',
      description: 'Universal server for processing and visualizing any CSV data'
    });
  }
}

module.exports = HealthController;

