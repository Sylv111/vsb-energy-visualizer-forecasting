const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

class ElectricityService {
  constructor() {
    this.processedData = null;
    this.dataStats = null;
    this.ndData = null; // Cache for ND calculations
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

  // Get wind data for charts (weekly averages)
  async getWindData() {
    const jsonPath = path.join(__dirname, 'data', 'wind_data.json');
    
    // Try to read from JSON file first
    try {
      if (fs.existsSync(jsonPath)) {
        const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        console.log(`📁 Wind data loaded from JSON cache: ${jsonPath}`);
        return jsonData;
      }
    } catch (error) {
      console.log('❌ Could not read wind data from JSON cache, will recalculate...');
    }

    console.log('🔄 Calculating wind weekly averages from CSV...');
    
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
          windTotal: 0,
          count: 0
        };
      }
      
      weeklyAverages[weekKey].windTotal += item.windGeneration || 0;
      weeklyAverages[weekKey].count++;
    });

    // Calculate averages and format data
    const windData = Object.values(weeklyAverages).map(week => {
      const avgWind = week.count > 0 ? week.windTotal / week.count : 0;
      return {
        weekStart: week.weekStart,
        windAverage: Math.round(avgWind * 100) / 100
      };
    }).sort((a, b) => a.weekStart.localeCompare(b.weekStart));

    const dataToSave = {
      generatedAt: new Date().toISOString(),
      totalWeeks: windData.length,
      data: windData
    };

    try {
      fs.writeFileSync(jsonPath, JSON.stringify(dataToSave, null, 2));
      console.log(`💾 Wind weekly data saved to: ${jsonPath}`);
      console.log(`📊 Calculated ${windData.length} weekly averages`);
    } catch (error) {
      console.error('❌ Error saving wind data to JSON:', error);
    }

    return dataToSave;
  }

  // Get solar data for charts (weekly averages)
  async getSolarData() {
    const jsonPath = path.join(__dirname, 'data', 'solar_data.json');
    
    // Try to read from JSON file first
    try {
      if (fs.existsSync(jsonPath)) {
        const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        console.log(`📁 Solar data loaded from JSON cache: ${jsonPath}`);
        return jsonData;
      }
    } catch (error) {
      console.log('❌ Could not read solar data from JSON cache, will recalculate...');
    }

    console.log('🔄 Calculating solar weekly averages from CSV...');
    
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
          solarTotal: 0,
          count: 0
        };
      }
      
      weeklyAverages[weekKey].solarTotal += item.solarGeneration || 0;
      weeklyAverages[weekKey].count++;
    });

    // Calculate averages and format data
    const solarData = Object.values(weeklyAverages).map(week => {
      const avgSolar = week.count > 0 ? week.solarTotal / week.count : 0;
      return {
        weekStart: week.weekStart,
        solarAverage: Math.round(avgSolar * 100) / 100
      };
    }).sort((a, b) => a.weekStart.localeCompare(b.weekStart));

    const dataToSave = {
      generatedAt: new Date().toISOString(),
      totalWeeks: solarData.length,
      data: solarData
    };

    try {
      fs.writeFileSync(jsonPath, JSON.stringify(dataToSave, null, 2));
      console.log(`💾 Solar weekly data saved to: ${jsonPath}`);
      console.log(`📊 Calculated ${solarData.length} weekly averages`);
    } catch (error) {
      console.error('❌ Error saving solar data to JSON:', error);
    }

    return dataToSave;
  }

  // Get renewable energy percentages by month with JSON caching
  async getRenewablePercentages() {
    const jsonPath = path.join(__dirname, 'data', 'renewable_percentages.json');
    
    // Try to read from JSON file first
    try {
      if (fs.existsSync(jsonPath)) {
        const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        console.log(`📁 Renewable percentages loaded from JSON cache: ${jsonPath}`);
        return jsonData;
      }
    } catch (error) {
      console.log('❌ Could not read renewable percentages from JSON cache, will recalculate...');
    }

    console.log('🔄 Calculating renewable energy percentages by month...');
    
    if (!this.processedData) {
      const result = await this.processCSVData();
      this.processedData = result.data;
    }

    // Group data by month and calculate percentages
    const monthlyData = {};
    
    this.processedData.forEach(item => {
      const date = new Date(item.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          totalDemand: 0,
          totalSolar: 0,
          totalWind: 0,
          count: 0
        };
      }
      
      monthlyData[monthKey].totalDemand += item.demand || 0;
      monthlyData[monthKey].totalSolar += item.solarGeneration || 0;
      monthlyData[monthKey].totalWind += item.windGeneration || 0;
      monthlyData[monthKey].count++;
    });

    // Calculate percentages for each month
    const percentagesData = Object.values(monthlyData).map(month => {
      const totalRenewable = month.totalSolar + month.totalWind;
      const solarPercentage = totalRenewable > 0 ? (month.totalSolar / totalRenewable) * 100 : 0;
      const windPercentage = totalRenewable > 0 ? (month.totalWind / totalRenewable) * 100 : 0;
      const totalPercentage = solarPercentage + windPercentage;
      
      return {
        month: month.month,
        solar: Math.round(solarPercentage * 100) / 100,
        wind: Math.round(windPercentage * 100) / 100,
        total: Math.round(totalPercentage * 100) / 100,
        totalSolarMW: Math.round(month.totalSolar),
        totalWindMW: Math.round(month.totalWind),
        totalDemandMW: Math.round(month.totalDemand)
      };
    }).sort((a, b) => a.month.localeCompare(b.month));

    const dataToSave = {
      generatedAt: new Date().toISOString(),
      totalMonths: percentagesData.length,
      data: percentagesData
    };

    try {
      fs.writeFileSync(jsonPath, JSON.stringify(dataToSave, null, 2));
      console.log(`💾 Renewable percentages saved to: ${jsonPath}`);
      console.log(`📊 Calculated ${percentagesData.length} monthly percentages`);
    } catch (error) {
      console.error('❌ Error saving renewable percentages to JSON:', error);
    }

    return dataToSave;
  }

  // Get statistics with JSON caching
  async getStatsData() {
    const jsonPath = path.join(__dirname, 'data', 'stats_data.json');
    
    // Try to read from JSON file first
    try {
      if (fs.existsSync(jsonPath)) {
        const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        console.log(`📁 Stats data loaded from JSON cache: ${jsonPath}`);
        return jsonData;
      }
    } catch (error) {
      console.log('❌ Could not read stats data from JSON cache, will recalculate...');
    }

    console.log('🔄 Calculating statistics from CSV...');
    
    if (!this.processedData) {
      const result = await this.processCSVData();
      this.processedData = result.data;
    }

    // Calculate statistics
    const stats = {
      totalRecords: this.processedData.length,
      dateRange: { start: null, end: null },
      maxDemand: 0,
      minDemand: Infinity,
      avgDemand: 0,
      totalDemand: 0,
      maxWind: 0,
      minWind: Infinity,
      avgWind: 0,
      totalWind: 0,
      maxSolar: 0,
      minSolar: Infinity,
      avgSolar: 0,
      totalSolar: 0
    };

    this.processedData.forEach(item => {
      // Demand statistics
      if (item.demand > stats.maxDemand) {
        stats.maxDemand = item.demand;
      }
      if (item.demand < stats.minDemand) {
        stats.minDemand = item.demand;
      }
      stats.totalDemand += item.demand;

      // Wind statistics
      if (item.windGeneration > stats.maxWind) {
        stats.maxWind = item.windGeneration;
      }
      if (item.windGeneration < stats.minWind) {
        stats.minWind = item.windGeneration;
      }
      stats.totalWind += item.windGeneration;

      // Solar statistics
      if (item.solarGeneration > stats.maxSolar) {
        stats.maxSolar = item.solarGeneration;
      }
      if (item.solarGeneration < stats.minSolar) {
        stats.minSolar = item.solarGeneration;
      }
      stats.totalSolar += item.solarGeneration;

      // Date range
      const date = new Date(item.date);
      if (!stats.dateRange.start || date < stats.dateRange.start) {
        stats.dateRange.start = date;
      }
      if (!stats.dateRange.end || date > stats.dateRange.end) {
        stats.dateRange.end = date;
      }
    });

    // Calculate averages
    stats.avgDemand = stats.totalDemand / stats.totalRecords;
    stats.avgWind = stats.totalWind / stats.totalRecords;
    stats.avgSolar = stats.totalSolar / stats.totalRecords;

    // Round values
    const roundedStats = {
      generatedAt: new Date().toISOString(),
      maxDemand: Math.round(stats.maxDemand),
      minDemand: Math.round(stats.minDemand),
      avgDemand: Math.round(stats.avgDemand * 100) / 100,
      totalDemand: Math.round(stats.totalDemand),
      totalRecords: stats.totalRecords,
      dateRangeStart: stats.dateRange.start.toISOString().split('T')[0],
      dateRangeEnd: stats.dateRange.end.toISOString().split('T')[0]
    };

    try {
      fs.writeFileSync(jsonPath, JSON.stringify(roundedStats, null, 2));
      console.log(`💾 Stats data saved to: ${jsonPath}`);
    } catch (error) {
      console.error('❌ Error saving stats data to JSON:', error);
    }

    return roundedStats;
  }

  // Get National Demand (ND) data in optimized format
  async getNationalDemandData() {
    const jsonPath = path.join(__dirname, 'data', 'nd_weekly_averages.json');
    
    // Try to read from JSON file first (if it exists)
    try {
      if (fs.existsSync(jsonPath)) {
        const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        console.log(`📁 ND data loaded from JSON cache: ${jsonPath}`);
        console.log(`📊 Using ${jsonData.data.length} pre-calculated weekly averages`);
        return {
          data: jsonData.data,
          count: jsonData.data.length,
          totalRecords: jsonData.data.length,
          savedToFile: jsonPath
        };
      }
    } catch (error) {
      console.log('❌ Could not read from JSON cache, will recalculate...');
    }

    // If no JSON file exists, calculate from CSV
    console.log('🔄 No JSON cache found, calculating ND weekly averages from CSV...');
    
    if (!this.processedData) {
      console.log('📖 Loading CSV data into memory...');
      const result = await this.processCSVData();
      this.processedData = result.data;
      console.log(`📊 Loaded ${this.processedData.length} records from CSV`);
    }

    if (this.ndData) {
      console.log('💾 Using ND data from memory cache');
      return {
        data: this.ndData,
        count: this.ndData.length,
        totalRecords: this.ndData.length,
        savedToFile: null
      };
    }

    console.log('🧮 Calculating weekly averages...');
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

    console.log(`📈 Grouped data into ${Object.keys(weeklyAverages).length} weeks`);

    // Calculate averages and format data
    const ndData = Object.values(weeklyAverages).map(week => {
      week.averageND = week.totalND / week.count;
      return {
        weekStart: week.weekStart,
        averageND: Math.round(week.averageND * 100) / 100 // Round to 2 decimal places
      };
    });

    // Sort by week start date
    ndData.sort((a, b) => a.weekStart.localeCompare(b.weekStart));

    // Save to JSON file
    try {
      fs.writeFileSync(jsonPath, JSON.stringify({
        generatedAt: new Date().toISOString(),
        totalWeeks: ndData.length,
        data: ndData
      }, null, 2));
      console.log(`💾 ND weekly averages saved to: ${jsonPath}`);
      console.log(`📊 Calculated ${ndData.length} weekly averages`);
    } catch (error) {
      console.error('❌ Error saving ND data to JSON:', error);
    }

    this.ndData = ndData; // Cache the result
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
    this.ndData = null; // Clear cached ND data
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