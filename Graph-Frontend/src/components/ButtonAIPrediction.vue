<template>
  <button @click="openModal" class="action-btn ai-prediction-btn">
    <img src="@/assets/icons/ai-neuron-network.svg" alt="AI Prediction" class="action-icon">
    <span>AI Prediction</span>
  </button>
  
  <ModalAIPrediction
    :is-visible="showModal"
    :selected-columns="selectedColumns"
    :chart-data="chartData"
    @close="closeModal"
    @run-prediction="handlePrediction"
  />
</template>

<script>
import ModalAIPrediction from './ModalAIPrediction.vue'

export default {
  name: 'ButtonAIPrediction',
  components: {
    ModalAIPrediction
  },
  props: {
    selectedColumns: {
      type: Object,
      default: () => ({ x: null, y: null })
    },
    chartIndex: {
      type: Number,
      required: true
    },
    allCharts: {
      type: Array,
      default: () => []
    }
  },
  emits: ['run-prediction'],
  data() {
    return {
      showModal: false,
      chartData: null
    }
  },
  methods: {
    async openModal() {
      const activeChart = this.allCharts[this.chartIndex] || {}
      const chartFileName = activeChart.selectedFiles?.[0]
      
      let chartFileData = null
      if (chartFileName) {
        try {
          await this.$store.dispatch('loadSelectedFile', chartFileName)
          chartFileData = this.$store.getters.selectedFileData
        } catch (error) {
          console.error('Error loading chart file:', error)
        }
      }
      
      const chartInfo = {
        chartIndex: this.chartIndex,
        chartData: {
          selectedFiles: activeChart.selectedFiles || [],
          yColumn: activeChart.yColumn,
          xColumns: activeChart.xColumns || [],
          seriesCount: activeChart.series?.length || 0
        },
        csvFile: {
          filename: chartFileName || 'Aucun fichier',
          headers: chartFileData?.headers || [],
          dataRows: chartFileData?.data?.length || 0
        }
      }
      console.log('Graph info:', chartInfo)
      
      // Console.log of all charts
      // console.log('All graphs:', this.allCharts.map((chart, index) => ({
      //   chartIndex: index,
      //   selectedFiles: chart.selectedFiles || [],
      //   yColumn: chart.yColumn,
      //   xColumns: chart.xColumns || [],
      //   seriesCount: chart.series?.length || 0
      // })))
      this.chartData = chartInfo
      this.showModal = true
    },
    closeModal() {
      this.showModal = false
    },
    handlePrediction(config) {
      this.$emit('run-prediction', {
        chartIndex: this.chartIndex,
        config: config
      })
    }
  }
}
</script>

<style scoped>
.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
  border: 2px solid #e9ecef;
  color: #4f502c;
  flex-shrink: 0;
  min-width: fit-content;
  position: relative;
  z-index: 1;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.ai-prediction-btn:hover {
  border-color: #ffc107;
  color: #ffc107;
}

.action-icon {
  width: 18px;
  height: 18px;
  transition: transform 0.2s ease;
  filter: brightness(0) saturate(100%) invert(30%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(0.3) contrast(1);
}

.ai-prediction-btn:hover .action-icon {
  filter: brightness(0) saturate(100%) invert(75%) sepia(100%) saturate(1000%) hue-rotate(320deg) brightness(1) contrast(1);
}

.action-btn:hover .action-icon {
  transform: scale(1.1);
}

.action-btn span {
  white-space: nowrap;
}

/* Responsive design */
@media (max-width: 768px) {
  .action-btn {
    justify-content: center;
    padding: 12px 16px;
  }
}
</style>
