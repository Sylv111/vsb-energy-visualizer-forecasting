<template>
  <div class="chart-container-main">
    <div class="chart-wrapper">
      <!-- Boutons d'action -->
      <div class="action-buttons">
        <template v-if="chartOptions">
          <ButtonChartOptions @click="toggleChartOptions" />
          <ButtonDataPreview @click="$emit('open-data-preview')" />
        </template>
        <ButtonChangeFile @click="$emit('open-file-selector', chartIndex)" />
        <ButtonRemoveChart @click="$emit('remove-chart', chartIndex)" />
      </div>

      <!-- Zone de graphique ou d'attente -->
      <div class="chart-area">
        <!-- État : Graphique chargé -->
        <template v-if="chartOptions">
          <div class="chart-content">

            <!-- Options du graphique -->
            <div v-show="showChartOptions" class="chart-options-panel">
              <div class="chart-options">
                <label class="checkbox-label">
                  <input type="checkbox" :checked="chartSettings.showMarkers" @change="updateChartSetting('showMarkers', $event.target.checked)" />
                  Show Markers
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" :checked="chartSettings.smoothCurve" @change="updateChartSetting('smoothCurve', $event.target.checked)" />
                  Smooth Curve
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" :checked="chartSettings.showGrid" @change="updateChartSetting('showGrid', $event.target.checked)" />
                  Show Grid
                </label>
              </div>
            </div>

            <!-- Le graphique -->
            <apexchart
              :options="chartOptions"
              :series="chartSeries"
              type="line"
              height="400"
            />
          </div>
        </template>

        <!-- État : En attente de sélection -->
        <div v-else class="chart-waiting">
          <div class="waiting-content">
            <svg class="waiting-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 6v6l4 2" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="12" cy="12" r="10" stroke-dasharray="4 4"/>
            </svg>
            <p>Waiting for data selection</p>
            <p class="waiting-hint">Click "Change File" to select data for visualization</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ButtonChartOptions from '@/components/ButtonChartOptions.vue'
import ButtonDataPreview from '@/components/ButtonDataPreview.vue'
import ButtonChangeFile from '@/components/ButtonChangeFile.vue'
import ButtonRemoveChart from '@/components/ButtonRemoveChart.vue'

export default {
  name: 'ChartBlock',
  emits: ['open-data-preview', 'open-file-selector', 'remove-chart'],
  components: {
    ButtonChartOptions,
    ButtonDataPreview,
    ButtonChangeFile,
    ButtonRemoveChart
  },
  props: {
    fileData: {
      type: Object,
      required: false,
      default: null
    },
    chartIndex: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      showChartOptions: false
    }
  },

  created() {
    this.$store.commit('INIT_CHART_SETTINGS', this.chartIndex)
  },
  computed: {
    chartSettings() {
      return this.$store.state.chartSettings[this.chartIndex] || {
        showMarkers: true,
        smoothCurve: true,
        showGrid: true
      }
    },
    
    chartOptions() {
      if (!this.fileData?.series?.length) {
        return null
      }
      
      // Utiliser les données de la première série pour les axes
      const firstSerie = this.fileData.series[0]
      
      // Extraire les valeurs X pour les catégories
      const xValues = firstSerie.data.map(point => point.x)
      
      return {
        chart: {
          type: 'line',
          height: 500,
          animations: {
            enabled: true,
            easing: 'easeinout',
            speed: 800,
            animateGradually: { enabled: true, delay: 150 },
            dynamicAnimation: { enabled: true, speed: 350 }
          },
          zoom: { enabled: true, type: 'x', autoScaleYaxis: true },
          toolbar: {
            show: true,
            tools: {
              download: true,
              selection: true,
              zoom: true,
              zoomin: true,
              zoomout: true,
              pan: true,
              reset: true
            },
            autoSelected: 'zoom'
          },
          background: 'transparent'
        },
        xaxis: {
          title: {
            text: firstSerie.name.split(' vs ')[0] || 'X Axis',
            style: { fontSize: '14px', fontWeight: 'bold', color: '#2c3e50' }
          },
          type: 'category',
          categories: xValues,
          labels: {
            style: { colors: '#7f8c8d', fontSize: '12px' },
            rotate: -45,
            rotateAlways: false
          },
          tickAmount: 10
        },
        yaxis: {
          title: {
            text: firstSerie.name.split(' vs ')[1] || 'Y Axis',
            style: { fontSize: '14px', fontWeight: 'bold', color: '#2c3e50' }
          },
          labels: {
            style: { colors: '#7f8c8d', fontSize: '12px' },
            formatter: function (val) { return Number(val).toFixed(2) }
          }
        },
        stroke: {
          curve: this.chartSettings.smoothCurve ? 'monotoneCubic' : 'straight',
          width: 3,
          lineCap: 'round'
        },
        markers: {
          size: this.chartSettings.showMarkers ? 5 : 0,
          hover: { size: this.chartSettings.showMarkers ? 8 : 0 },
          colors: ['#667eea'],
          strokeColors: '#ffffff',
          strokeWidth: 2
        },
        colors: ['#667eea', '#764ba2', '#f093fb'],
        grid: {
          show: this.chartSettings.showGrid,
          borderColor: '#e7e7e7',
          strokeDashArray: 5,
          row: { colors: this.chartSettings.showGrid ? ['#f8f9fa', 'transparent'] : ['transparent'], opacity: 0.5 },
          column: { colors: this.chartSettings.showGrid ? ['#f8f9fa', 'transparent'] : ['transparent'], opacity: 0.5 }
        },
        tooltip: {
          enabled: true,
          shared: true,
          intersect: false,
          theme: 'light',
          style: { fontSize: '12px' },
          y: { formatter: function (val) { return Number(val).toFixed(2) } },
          x: { formatter: function (val) { return val } }
        },
        legend: {
          show: true,
          position: 'top',
          horizontalAlign: 'left',
          fontSize: '14px',
          fontFamily: 'Helvetica, Arial',
          fontWeight: 400,
          markers: { width: 12, height: 12, strokeWidth: 0, strokeColor: '#fff', radius: 12 },
          itemMargin: { horizontal: 10, vertical: 5 }
        },
        dataLabels: { enabled: false },
        theme: { mode: 'light', palette: 'palette1' },
        responsive: [{
          breakpoint: 768,
          options: { chart: { height: 300 }, xaxis: { labels: { rotate: -90 } } }
        }]
      }
    },
    chartSeries() {
      if (!this.fileData?.series?.length) {
        return []
      }

      // Retourner directement les séries sans transformation supplémentaire
      // car les données sont déjà formatées dans handleColumnSelection
      return this.fileData.series.map(serie => ({
        name: serie.name,
        data: serie.data,
        type: 'line',
        color: serie.color
      }))
    }
  },
  methods: {
    toggleChartOptions() {
      this.showChartOptions = !this.showChartOptions
    },
    
    updateChartSetting(setting, value) {
      this.$store.commit('UPDATE_CHART_SETTINGS', {
        chartIndex: this.chartIndex,
        settings: { [setting]: value }
      })
    }
  }
}
</script>

<style scoped>
.chart-container-main { 
  margin-bottom: 1rem; 
}

.chart-wrapper {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border: 1px solid #e9ecef;
}

.action-buttons { 
  display: flex; 
  gap: 1rem; 
  margin-bottom: 1rem;
  justify-content: flex-end;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.chart-area {
  min-height: 400px;
  position: relative;
}

.chart-content {
  position: relative;
}

.chart-options-panel { 
  margin-bottom: 1.5rem; 
  padding: 1rem; 
  background: #f8f9fa; 
  border-radius: 8px; 
  border: 1px solid #e9ecef; 
}

.chart-options { 
  display: flex; 
  gap: 2rem; 
  flex-wrap: wrap; 
}

.checkbox-label { 
  display: flex; 
  align-items: center; 
  gap: 0.5rem; 
  font-size: 0.9rem; 
  color: #2c3e50; 
  cursor: pointer; 
}

.chart-waiting {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px dashed #e9ecef;
}

.waiting-content {
  text-align: center;
  color: #6c757d;
}

.waiting-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 1rem;
  color: #667eea;
  animation: pulse 2s infinite;
}

.waiting-content p {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 500;
}

.waiting-hint {
  margin-top: 0.5rem !important;
  font-size: 0.9rem !important;
  font-style: italic;
  opacity: 0.8;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
}

@media (max-width: 768px) { 
  .action-buttons, .chart-toolbar { 
    flex-direction: column; 
    gap: 8px; 
  } 
}
</style>
