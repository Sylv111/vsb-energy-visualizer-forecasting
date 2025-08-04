<template>
      <div class="dashboard">
      <div class="dashboard-header">
        <h1>Overview - UK Electricity Consumption</h1>
        <p class="subtitle">Data from 2009 to 2024 - Real-time analysis</p>
      </div>

    <!-- Error message -->
    <div v-if="hasError" class="error-message">
      ❌ {{ errorMessage }}
    </div>

    <!-- Statistics -->
    <div v-if="stats" class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📈</div>
        <div class="stat-content">
          <h3>Max Demand</h3>
          <p class="stat-value">{{ formatNumber(stats.maxDemand) }} MW</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">📉</div>
        <div class="stat-content">
          <h3>Min Demand</h3>
          <p class="stat-value">{{ formatNumber(stats.minDemand) }} MW</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-content">
          <h3>Average Demand</h3>
          <p class="stat-value">{{ formatNumber(stats.avgDemand) }} MW</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">📅</div>
        <div class="stat-content">
          <h3>Period</h3>
          <p class="stat-value">{{ formatDate(stats.dateRange.start) }} - {{ formatDate(stats.dateRange.end) }}</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">📋</div>
        <div class="stat-content">
          <h3>Records</h3>
          <p class="stat-value">{{ formatNumber(stats.totalRecords) }}</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">⚡</div>
        <div class="stat-content">
          <h3>Total Demand</h3>
          <p class="stat-value">{{ formatNumber(stats.totalDemand) }} MW</p>
        </div>
      </div>
    </div>

    <!-- Charts -->
    <div class="charts-section">
      <h2>📈 Electricity Demand Evolution</h2>
      
      <div class="chart-container">
        <apexchart
          type="line"
          height="400"
          :options="demandChartOptions"
          :series="demandChartSeries"
        />
      </div>
    </div>

         <!-- Renewable Energy Charts -->
     <div class="charts-section">
       <h2>🌱 Renewable Energy</h2>
       
       <div class="renewable-charts">
         <div class="chart-container">
           <h3>🌪️ Wind Generation</h3>
           <apexchart
             type="area"
             height="300"
             :options="windChartOptions"
             :series="windChartSeries"
           />
         </div>
         
         <div class="chart-container">
           <h3>☀️ Solar Generation</h3>
           <apexchart
             type="area"
             height="300"
             :options="solarChartOptions"
             :series="solarChartSeries"
           />
         </div>
       </div>
     </div>

           <!-- Renewable Energy Percentages -->
      <div class="charts-section">
        <h2>📊 Renewable Energy Contribution (Last Month) - Solar: {{ renewablePercentages.solar }}%, Wind: {{ renewablePercentages.wind }}%</h2>
       
       <div class="chart-container">
         <apexchart
           type="radialBar"
           height="400"
           :options="renewablePercentagesOptions"
           :series="renewablePercentagesSeries"
         />
       </div>
     </div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import { format } from 'date-fns'
import { enUS } from 'date-fns/locale'
// import SafeChart from '@/components/SafeChart.vue'

export default {
  name: 'DashboardView',
  components: {
    // SafeChart
  },
  
  data() {
    return {
      selectedPeriod: 'month',
      selectedPrecision: this.$store.state.selectedPrecision || 2
    }
  },
  
  computed: {
    ...mapState(['electricityData', 'stats', 'loading', 'error']),
         ...mapGetters(['isLoading', 'hasError', 'errorMessage', 'aggregatedChartData', 'windSolarData', 'renewablePercentages']),
    

    
    demandChartOptions() {
      return {
        chart: {
          type: 'line',
          zoom: {
            enabled: true
          },
          toolbar: {
            show: true
          }
        },
        dataLabels: {
          enabled: false
        },
        stroke: {
          curve: 'smooth',
          width: 2
        },
        title: {
          text: 'Real-time Electricity Demand',
          align: 'left'
        },
        xaxis: {
          type: 'datetime',
          labels: {
            format: 'dd/MM/yyyy'
          }
        },
        yaxis: {
          title: {
            text: 'Demand (MW)'
          },
          labels: {
            formatter: (value) => {
              try {
                return this.formatNumber(value)
              } catch (error) {
                return value
              }
            }
          }
        },
        tooltip: {
          x: {
            format: 'dd/MM/yyyy HH:mm'
          },
          y: {
            formatter: (value) => {
              try {
                return `${this.formatNumber(value)} MW`
              } catch (error) {
                return `${value} MW`
              }
            }
          }
        },
        colors: ['#667eea']
      }
    },
    
    demandChartSeries() {
      const data = this.aggregatedChartData
      
      // Protection against invalid data
      if (!Array.isArray(data) || data.length === 0) {
        return [{
          name: 'Electricity Demand',
          data: []
        }]
      }
      
      return [{
        name: 'Electricity Demand',
        data: data
      }]
    },
    
    windChartOptions() {
      return {
        chart: {
          type: 'area',
          zoom: {
            enabled: true
          }
        },
        dataLabels: {
          enabled: false
        },
        stroke: {
          curve: 'smooth',
          width: 2
        },
        fill: {
          type: 'gradient',
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.7,
            opacityTo: 0.3,
            stops: [0, 90, 100]
          }
        },
        xaxis: {
          type: 'datetime',
          labels: {
            format: 'dd/MM/yyyy'
          }
        },
        yaxis: {
          title: {
            text: 'Generation (MW)'
          }
        },
        colors: ['#00d4aa']
      }
    },
    
    windChartSeries() {
      const data = this.windSolarData.wind
      
      // Protection against invalid data
      if (!Array.isArray(data) || data.length === 0) {
        return [{
          name: 'Wind Generation',
          data: []
        }]
      }
      
      return [{
        name: 'Wind Generation',
        data: data
      }]
    },
    
    solarChartOptions() {
      return {
        chart: {
          type: 'area',
          zoom: {
            enabled: true
          }
        },
        dataLabels: {
          enabled: false
        },
        stroke: {
          curve: 'smooth',
          width: 2
        },
        fill: {
          type: 'gradient',
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.7,
            opacityTo: 0.3,
            stops: [0, 90, 100]
          }
        },
        xaxis: {
          type: 'datetime',
          labels: {
            format: 'dd/MM/yyyy'
          }
        },
        yaxis: {
          title: {
            text: 'Generation (MW)'
          }
        },
        colors: ['#ffd700']
      }
    },
    
    solarChartSeries() {
      const data = this.windSolarData.solar
      
      // Protection against invalid data
      if (!Array.isArray(data) || data.length === 0) {
        return [{
          name: 'Solar Generation',
          data: []
        }]
      }
      
             return [{
         name: 'Solar Generation',
         data: data
       }]
     },

     renewablePercentagesOptions() {
       return {
         chart: {
           type: 'radialBar',
           height: 400,
           offsetY: -20
         },
         plotOptions: {
           radialBar: {
             startAngle: -135,
             endAngle: 135,
             dataLabels: {
               name: {
                 fontSize: '16px',
                 color: undefined,
                 offsetY: 120
               },
               value: {
                 offsetY: 76,
                 fontSize: '22px',
                 color: undefined,
                 formatter: function (val) {
                   return val + '%'
                 }
               }
             }
           }
         },
         fill: {
           type: 'gradient',
           gradient: {
             shade: 'dark',
             shadeIntensity: 0.15,
             inverseColors: false,
             opacityFrom: 1,
             opacityTo: 1,
             stops: [0, 50, 65, 91]
           }
         },
         stroke: {
           dashArray: 4
         },
         labels: ['Solar Energy', 'Wind Energy', 'Total Renewable'],
         colors: ['#ffd700', '#00d4aa', '#667eea']
       }
     },

     renewablePercentagesSeries() {
       const percentages = this.renewablePercentages
       return [percentages.solar, percentages.wind, percentages.total]
     }
   },
  
  methods: {
    ...mapActions(['fetchElectricityData', 'fetchAggregatedData', 'fetchStats']),
    
    formatNumber(value) {
      return new Intl.NumberFormat('en-US').format(Math.round(value))
    },
    
    formatDate(date) {
      if (!date) return 'N/A'
      return format(new Date(date), 'MM/dd/yyyy', { locale: enUS })
    },
    
    async reloadData() {
      await this.fetchElectricityData()
      await this.fetchAggregatedData(this.selectedPeriod)
    },
    

  },
  
  async mounted() {
    try {
      await this.fetchElectricityData()
      await this.fetchAggregatedData(this.selectedPeriod)
    } catch (error) {
      console.error('Error during initial loading:', error)
    }
  }
}
</script>

<style scoped>
.dashboard {
  max-width: 100%;
}

.dashboard-header {
  text-align: center;
  margin-bottom: 2rem;
}

.dashboard-header h1 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #7f8c8d;
  font-size: 1.1rem;
}

.controls {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.control-group label {
  font-weight: 600;
  color: #2c3e50;
}

.select-control {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  min-width: 150px;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  border: 1px solid #fcc;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  font-size: 2rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
}

.stat-content h3 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #667eea;
}

.charts-section {
  margin-bottom: 3rem;
}

.charts-section h2 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #667eea;
}

.chart-container {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.renewable-charts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
}

.renewable-charts .chart-container {
  margin-bottom: 0;
}


  
  .renewable-charts h3 {
    color: #2c3e50;
    margin-bottom: 1rem;
    text-align: center;
  }

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .renewable-charts {
    grid-template-columns: 1fr;
  }
}
</style> 