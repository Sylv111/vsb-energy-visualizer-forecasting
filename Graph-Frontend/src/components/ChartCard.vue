<template>
  <div class="chart-section">
    <ChartBlock
      :file-data="fileData"
      :chart-index="chartIndex"
      :all-charts="allCharts"
      @open-data-preview="$emit('open-data-preview')"
      @open-file-selector="$emit('open-file-selector', $event)"
      @remove-chart="$emit('remove-chart', chartIndex)"
      @ai-prediction="$emit('ai-prediction', $event)"
      @open-chart-options="showChartOptions = true"
    />
    
    <!-- Chart Options Modal -->
    <ModalChartOptions
      :show="showChartOptions"
      :chart-data="fileData"
      :chart-index="chartIndex"
      :available-columns="availableColumns"
      @close="showChartOptions = false"
      @toggle-series="handleToggleSeries"
      @remove-series="handleRemoveSeries"
      @update-series-color="handleUpdateSeriesColor"
      @update-series-style="handleUpdateSeriesStyle"
    />
  </div>
</template>

<script>
import ChartBlock from '@/components/ChartBlock.vue'
import ModalChartOptions from '@/components/ModalChartOptions.vue'

export default {
  name: 'ChartCard',
  components: {
    ChartBlock,
    ModalChartOptions
  },
  props: {
    fileData: {
      type: Object,
      default: null
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
  emits: ['open-data-preview', 'open-file-selector', 'remove-chart', 'ai-prediction', 'update-series-color', 'update-series-style'],
  data() {
    return {
      showChartOptions: false
    }
  },
  computed: {
    availableColumns() {
      return this.$store.getters.selectedFileData?.headers || []
    }
  },
  methods: {
    handleToggleSeries({ seriesIndex }) {
      // Implement series visibility toggle logic
      console.log('Toggle series:', seriesIndex)
    },
    
    handleRemoveSeries({ seriesIndex }) {
      // Emit to parent to handle series removal
      this.$emit('remove-series', { chartIndex: this.chartIndex, seriesIndex })
    },
    
    handleUpdateSeriesColor({ seriesIndex, color }) {
      // Emit to parent to handle series color update
      this.$emit('update-series-color', { chartIndex: this.chartIndex, seriesIndex, color })
    },
    
    handleUpdateSeriesStyle({ seriesIndex, strokeDashArray }) {
      // Emit to parent to handle series style update
      this.$emit('update-series-style', { chartIndex: this.chartIndex, seriesIndex, strokeDashArray })
    }
  }
}
</script>

<style scoped>
.chart-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}
</style>