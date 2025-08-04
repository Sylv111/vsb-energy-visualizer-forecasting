class GasService {
  constructor() {
    this.processedData = null;
    this.dataStats = null;
  }

  // Gas service - To be implemented when data is available
  async getAllData() {
    return {
      data: [],
      stats: {
        totalRecords: 0,
        dateRange: { start: null, end: null },
        maxDemand: 0,
        minDemand: 0,
        avgDemand: 0,
        totalDemand: 0
      },
      count: 0,
      message: 'Gas service not yet implemented'
    };
  }

  async getStats() {
    return {
      totalRecords: 0,
      dateRange: { start: null, end: null },
      maxDemand: 0,
      minDemand: 0,
      avgDemand: 0,
      totalDemand: 0,
      message: 'Gas service not yet implemented'
    };
  }

  async reloadData() {
    return { 
      message: 'Gas service not yet implemented', 
      count: 0 
    };
  }
}

module.exports = new GasService(); 