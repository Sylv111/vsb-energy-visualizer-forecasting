<template>
  <div class="chart-section">
    <ChartBlock
      :file-data="fileData"
      :chart-index="chartIndex"
      @open-data-preview="$emit('open-data-preview')"
      @open-file-selector="$emit('open-file-selector', $event)"
      @remove-chart="$emit('remove-chart', chartIndex)"
    />
  </div>
</template>

<script>
import ChartBlock from '@/components/ChartBlock.vue'

export default {
  name: 'ChartCard',
  components: {
    ChartBlock
  },
  props: {
    fileData: {
      type: Object,
      default: null
    },
    chartIndex: {
      type: Number,
      required: true
    }
  },
  emits: ['open-data-preview', 'open-file-selector', 'remove-chart']
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