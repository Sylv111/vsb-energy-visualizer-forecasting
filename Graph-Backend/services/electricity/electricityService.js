const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

class ElectricityService {
  constructor() {
    this.processedData = null;
    this.dataStats = null;
    this.csvPath = path.join(__dirname, 'data', 'historic_demand_2009_2024.csv');
  }

  // Fonction pour traiter le CSV
  async processCSVData() {
    return new Promise((resolve, reject) => {
      const results = [];
      const stats = {
        totalRecords: 0,
        dateRange: { start: null, end: null },
        maxDemand: 0,
        minDemand: Infinity,
        avgDemand: 0,
        totalDemand: 0
      };

      fs.createReadStream(this.csvPath)
        .pipe(csv())
        .on('data', (data) => {
          // Clean and validate data
          const cleanData = {
            date: data.settlement_date,
            period: parseInt(data.settlement_period) || 0,
            nd: parseFloat(data.nd) || 0,
            demand: parseFloat(data.england_wales_demand) || 0,
            windGeneration: parseFloat(data.embedded_wind_generation) || 0,
            windCapacity: parseFloat(data.embedded_wind_capacity) || 0,
            solarGeneration: parseFloat(data.embedded_solar_generation) || 0,
            solarCapacity: parseFloat(data.embedded_solar_capacity) || 0,
            ifaFlow: parseFloat(data.ifa_flow) || 0,
            ifa2Flow: parseFloat(data.ifa2_flow) || 0,
            britnedFlow: parseFloat(data.britned_flow) || 0,
            moyleFlow: parseFloat(data.moyle_flow) || 0,
            eastWestFlow: parseFloat(data.east_west_flow) || 0,
            nemoFlow: parseFloat(data.nemo_flow) || 0,
            nslFlow: parseFloat(data.nsl_flow) || 0,
            isHoliday: data.is_holiday === '1'
          };

          if (cleanData.demand > 0) {
            results.push(cleanData);
            
            // Calculer les statistiques
            stats.totalRecords++;
            stats.totalDemand += cleanData.demand;
            
            if (cleanData.demand > stats.maxDemand) {
              stats.maxDemand = cleanData.demand;
            }
            if (cleanData.demand < stats.minDemand) {
              stats.minDemand = cleanData.demand;
            }

            const date = new Date(cleanData.date);
            if (!stats.dateRange.start || date < stats.dateRange.start) {
              stats.dateRange.start = date;
            }
            if (!stats.dateRange.end || date > stats.dateRange.end) {
              stats.dateRange.end = date;
            }
          }
        })
        .on('end', () => {
          stats.avgDemand = stats.totalDemand / stats.totalRecords;
          resolve({ data: results, stats });
        })
        .on('error', reject);
    });
  }

  // Get all data
  async getAllData() {
    if (!this.processedData) {
      const result = await this.processCSVData();
      this.processedData = result.data;
      this.dataStats = result.stats;
    }
    return {
      data: this.processedData,
      stats: this.dataStats,
      count: this.processedData.length
    };
  }

  // Get data by year
  async getDataByYear(year) {
    if (!this.processedData) {
      const result = await this.processCSVData();
      this.processedData = result.data;
    }

    const yearData = this.processedData.filter(item => {
      const itemYear = new Date(item.date).getFullYear();
      return itemYear === year;
    });

    return {
      year,
      data: yearData,
      count: yearData.length
    };
  }

  // Get aggregated data by period
  async getAggregatedData(period) {
    if (!this.processedData) {
      const result = await this.processCSVData();
      this.processedData = result.data;
    }

    const aggregatedData = {};

    this.processedData.forEach(item => {
      const date = new Date(item.date);
      let key;

      switch (period) {
        case 'day':
          key = item.date;
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = item.date;
      }

      if (!aggregatedData[key]) {
        aggregatedData[key] = {
          date: key,
          totalDemand: 0,
          avgDemand: 0,
          maxDemand: 0,
          minDemand: Infinity,
          count: 0,
          totalWind: 0,
          totalSolar: 0
        };
      }

      aggregatedData[key].totalDemand += item.demand;
      aggregatedData[key].totalWind += item.windGeneration;
      aggregatedData[key].totalSolar += item.solarGeneration;
      aggregatedData[key].count++;

      if (item.demand > aggregatedData[key].maxDemand) {
        aggregatedData[key].maxDemand = item.demand;
      }
      if (item.demand < aggregatedData[key].minDemand) {
        aggregatedData[key].minDemand = item.demand;
      }
    });

    // Calculer les moyennes
    Object.values(aggregatedData).forEach(item => {
      item.avgDemand = item.totalDemand / item.count;
    });

    return {
      period,
      data: Object.values(aggregatedData).sort((a, b) => a.date.localeCompare(b.date)),
      count: Object.keys(aggregatedData).length
    };
  }

  // Obtenir les statistiques
  async getStats() {
    if (!this.dataStats) {
      const result = await this.processCSVData();
      this.processedData = result.data;
      this.dataStats = result.stats;
    }
    return this.dataStats;
  }

  // Get Flow data for a specific day (48 periods of 30 minutes)
  async getFlowData(date, flowType = 'ifaFlow') {
    if (!this.processedData) {
      const result = await this.processCSVData();
      this.processedData = result.data;
    }

    const dayData = this.processedData.filter(item => item.date === date);
    
    // Sort by period and format for chart
    const formattedData = dayData
      .sort((a, b) => a.period - b.period)
      .map(item => ({
        x: `${String(Math.floor((item.period - 1) / 2)).padStart(2, '0')}:${String(((item.period - 1) % 2) * 30).padStart(2, '0')}`,
        y: item[flowType] || 0
      }));

    return {
      date,
      flowType,
      data: formattedData,
      count: formattedData.length
    };
  }

  // Get National Demand (ND) data in optimized format
  async getNationalDemandData() {
    if (!this.processedData) {
      const result = await this.processCSVData();
      this.processedData = result.data;
    }

    // Group data by week and calculate weekly averages
    const weeklyAverages = {};
    
    this.processedData.forEach(item => {
      const date = new Date(item.date);
      // Get the start of the week (Monday)
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1));
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyAverages[weekKey]) {
        weeklyAverages[weekKey] = {
          weekStart: weekKey,
          totalND: 0,
          count: 0,
          averageND: 0
        };
      }
      
      weeklyAverages[weekKey].totalND += item.nd || 0;
      weeklyAverages[weekKey].count++;
    });

    // Calculate averages and format data
    const ndData = Object.values(weeklyAverages).map(week => {
      week.averageND = week.totalND / week.count;
      return {
        weekStart: week.weekStart,
        averageND: Math.round(week.averageND * 100) / 100, // Round to 2 decimal places
        totalND: Math.round(week.totalND * 100) / 100,
        count: week.count
      };
    });

    // Sort by week start date
    ndData.sort((a, b) => a.weekStart.localeCompare(b.weekStart));

    // Save to JSON file
    const jsonPath = path.join(__dirname, 'data', 'nd_weekly_averages.json');
    try {
      fs.writeFileSync(jsonPath, JSON.stringify({
        generatedAt: new Date().toISOString(),
        totalWeeks: ndData.length,
        data: ndData
      }, null, 2));
      console.log(`ND weekly averages saved to: ${jsonPath}`);
    } catch (error) {
      console.error('Error saving ND data to JSON:', error);
    }

    return {
      data: ndData,
      count: ndData.length,
      totalRecords: ndData.length,
      savedToFile: jsonPath
    };
  }

  // Reload data
  async reloadData() {
    this.processedData = null;
    this.dataStats = null;
    const result = await this.processCSVData();
    this.processedData = result.data;
    this.dataStats = result.stats;
    return { 
      message: 'Electricity data reloaded successfully', 
      count: this.processedData.length 
    };
  }
}

module.exports = new ElectricityService(); 