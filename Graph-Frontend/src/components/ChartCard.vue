<template>
  <div class="chart-section">
    <div class="chart-container">
      <!-- Initial File Selection -->
      <div v-if="!fileData" class="file-selection">
        <div class="file-selector">
          <label for="file-select">Choose a processed CSV file:</label>
          <select 
            id="file-select" 
            v-model="selectedFile" 
            @change="loadFile"
            class="file-select-control"
          >
            <option value="">Select a file...</option>
            <option 
              v-for="file in availableFiles" 
              :key="file.name" 
              :value="file.name"
            >
              {{ file.name }} ({{ formatFileSize(file.size) }})
            </option>
          </select>
        </div>
        
        <div v-if="selectedFile" class="loading-file">
          <p>Loading file data...</p>
        </div>
      </div>
      
      <!-- Chart Content -->
      <div v-if="!fileData" class="empty-chart">
        <p>No file selected. Please choose a CSV file from the list above to start visualizing.</p>
      </div>
      <div v-else class="chart-content">
        <ChartBlock
          :file-data="fileData"
          :chart-index="chartIndex"
          @open-data-preview="$emit('open-data-preview')"
          @open-file-selector="$emit('open-file-selector', $event)"
        />
      </div>
    </div>
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
    availableFiles: {
      type: Array,
      required: true
    },
    fileData: {
      type: Object,
      default: null
    },
    chartIndex: {
      type: Number,
      required: true
    }
  },
  emits: ['select-file', 'open-data-preview', 'open-file-selector'],
  data() {
    return {
      selectedFile: ''
    }
  },
  methods: {
    loadFile() {
      if (this.selectedFile) {
        this.$emit('select-file', this.selectedFile)
      }
    },
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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

.chart-container {
  min-height: 400px;
}

.file-selection {
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafe 100%);
  border-radius: 16px;
  border: 2px solid #e9ecef;
  box-shadow: 0 4px 25px rgba(102, 126, 234, 0.08);
}

.file-selector {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: stretch;
}

.file-selector label {
  font-weight: 600;
  color: #667eea;
  font-size: 1rem;
  text-align: center;
  margin-bottom: 0.5rem;
}

.file-select-control {
  flex: 1;
  min-width: 300px;
  padding: 1rem 1.5rem;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  font-size: 1rem;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  appearance: none;
  background-image: 
    linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%),
    url('data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23667eea" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6,9 12,15 18,9"></polyline></svg>');
  background-repeat: no-repeat, no-repeat;
  background-position: 0 0, right 1rem center;
  background-size: 100% 100%, 16px 16px;
  color: #2c3e50;
  font-weight: 500;
}

.file-select-control:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1), 0 4px 20px rgba(102, 126, 234, 0.15);
  transform: translateY(-1px);
}

.file-select-control:hover {
  border-color: #667eea;
  box-shadow: 0 4px 20px rgba(0,0,0,0.12);
  transform: translateY(-1px);
}

.file-select-control option {
  padding: 0.75rem;
  background: white;
  color: #2c3e50;
  font-weight: 500;
}

.file-select-control option:hover,
.file-select-control option:checked {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.loading-file {
  margin-top: 1rem;
  text-align: center;
  color: #6c757d;
  font-style: italic;
}

.empty-chart {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
  background: #f8f9fa;
  border: 2px dashed #dee2e6;
  border-radius: 8px;
  color: #6c757d;
  font-size: 1.1rem;
}

.chart-content {
  min-height: 400px;
}
</style>
