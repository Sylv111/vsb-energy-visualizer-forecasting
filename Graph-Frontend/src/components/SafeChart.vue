<template>
  <div class="safe-chart">
    <div v-if="error" class="chart-error">
      <p>❌ Error loading chart</p>
      <button @click="retry" class="btn-retry">🔄 Retry</button>
    </div>
    <div v-else class="chart-container">
      <apexchart
        :type="type"
        :height="height"
        :options="safeOptions"
        :series="safeSeries"
        @mounted="onChartMounted"
        @error="onChartError"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: 'SafeChart',
  
  props: {
    type: {
      type: String,
      required: true
    },
    height: {
      type: [String, Number],
      default: 400
    },
    options: {
      type: Object,
      required: true
    },
    series: {
      type: Array,
      required: true
    }
  },
  
  data() {
    return {
      error: false,
      loading: false,
      retryCount: 0
    }
  },
  
  computed: {
    safeOptions() {
      try {
        // Create a deep copy of options to avoid mutations
        const options = JSON.parse(JSON.stringify(this.options))
        
        // Ensure formatters are secure
        if (options.yaxis && options.yaxis.labels && options.yaxis.labels.formatter) {
          const originalFormatter = options.yaxis.labels.formatter
          options.yaxis.labels.formatter = (value) => {
            try {
              return originalFormatter(value)
            } catch (error) {
              console.warn('Error in Y formatter:', error)
              return value
            }
          }
        }
        
        if (options.tooltip && options.tooltip.y && options.tooltip.y.formatter) {
          const originalFormatter = options.tooltip.y.formatter
          options.tooltip.y.formatter = (value) => {
            try {
              return originalFormatter(value)
            } catch (error) {
              console.warn('Error in tooltip formatter:', error)
              return value
            }
          }
        }
        
        return options
      } catch (error) {
        console.error('Error creating options:', error)
        return {
          chart: { type: this.type },
          series: []
        }
      }
    },
    
    safeSeries() {
      try {
        if (!Array.isArray(this.series)) {
          return []
        }
        
        return this.series.map(serie => {
          if (!serie || !Array.isArray(serie.data)) {
            return { ...serie, data: [] }
          }
          
          // Filter invalid data
          const validData = serie.data.filter(item => {
            return item && 
                   typeof item.x !== 'undefined' && 
                   typeof item.y !== 'undefined' &&
                   !isNaN(item.y)
          })
          
          return { ...serie, data: validData }
        })
      } catch (error) {
        console.error('Error creating series:', error)
        return []
      }
    }
  },
  
  methods: {
    onChartMounted() {
      this.error = false
      this.retryCount = 0
    },
    
    onChartError(error) {
      console.error('ApexCharts error:', error)
      this.error = true
      this.loading = false
    },
    
    retry() {
      if (this.retryCount < 3) {
        this.retryCount++
        this.error = false
      } else {
        console.error('Maximum number of attempts reached')
      }
    }
  }
}
</script>

<style scoped>
.safe-chart {
  width: 100%;
  height: 100%;
}

.chart-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 8px;
  color: #c33;
}

.btn-retry {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.chart-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.chart-container {
  width: 100%;
  height: 100%;
}
</style> 