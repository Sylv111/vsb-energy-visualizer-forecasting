<template>
  <div class="chart-container-main">
    <div class="chart-wrapper">
      <div class="action-buttons">
        <ButtonChartOptions @click="toggleChartOptions" />
        <ButtonDataPreview @click="$emit('open-data-preview')" />
        <ButtonChangeFile @click="$emit('open-file-selector', chartIndex)" />
        <ButtonRemoveChart @click="$emit('remove-chart', chartIndex)" />
      </div>

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

      <apexchart
        v-if="chartOptions"
        :options="chartOptions"
        :series="chartSeries"
        type="line"
        height="400"
      />
      <div v-else class="chart-loading">
        <p>Loading chart...</p>
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
      if (!this.fileData || !this.fileData.headers || !this.fileData.data) {
        return null
      }
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
            text: this.fileData.headers[0] || 'X Axis',
            style: { fontSize: '14px', fontWeight: 'bold', color: '#2c3e50' }
          },
          type: 'category',
          categories: this.fileData.data.map(row => row[0] || ''),
          labels: {
            style: { colors: '#7f8c8d', fontSize: '12px' },
            rotate: -45,
            rotateAlways: false
          },
          tickAmount: 10
        },
        yaxis: {
          title: {
            text: this.fileData.headers[1] || 'Y Axis',
            style: { fontSize: '14px', fontWeight: 'bold', color: '#2c3e50' }
          },
          labels: {
            style: { colors: '#7f8c8d', fontSize: '12px' },
            formatter: function (val) { return Number(val).toFixed(2) }
          }
        },
        stroke: {
          curve: this.chartSettings.smoothCurve ? 'smooth' : 'straight',
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
      if (!this.fileData || !this.fileData.data) {
        return []
      }
      const seriesData = this.fileData.data.map(row => {
        const xValue = row[0] || ''
        const yValue = row[1] || 0
        const numericValue = parseFloat(yValue)
        const finalValue = isNaN(numericValue) ? 0 : numericValue
        return { x: xValue, y: finalValue }
      })
      return [{ name: this.fileData.headers[1] || 'Value', data: seriesData, type: 'line' }]
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
.chart-container-main { margin-bottom: 1rem; }
.chart-wrapper {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border: 1px solid #e9ecef;
}
.action-buttons { display: flex; gap: 1rem; margin-bottom: 1.5rem; justify-content: flex-end; padding-bottom: 1rem; border-bottom: 1px solid #e9ecef; }
.chart-options-panel { margin-bottom: 1.5rem; padding: 1rem; background: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef; }
.chart-options { display: flex; gap: 2rem; flex-wrap: wrap; }
.checkbox-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; color: #2c3e50; cursor: pointer; }
.chart-loading { display: flex; align-items: center; justify-content: center; height: 400px; color: #6c757d; font-style: italic; }
@media (max-width: 768px) { .action-buttons { flex-direction: column; gap: 8px; } }
</style>
