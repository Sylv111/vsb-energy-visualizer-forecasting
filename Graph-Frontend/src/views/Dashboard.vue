<template>
  <!-- Dashboard Header -->
  <div class="dashboard-header">
    <h1>CSV Data Visualizer</h1>
    <p class="subtitle">Import your CSV file and visualize the data</p>
  </div>

  <!-- Import Button -->
  <div class="import-section">
    <button @click="showImportModal = true" class="import-btn">
      📁 Import CSV File
    </button>
    <p v-if="hasData" class="file-info">
      📄 Loaded: {{ fileName }} ({{ totalRows }} rows, {{ totalColumns }} columns)
      <br>
      💾 Saved: {{ savedFileName }}
    </p>
  </div>

  <div class="dashboard">

    <!-- Error Message -->
    <div v-if="hasError" class="error-message">
      ❌ {{ errorMessage }}
      <div v-if="error.response?.data?.error" class="error-details">
        <strong>Details:</strong> {{ error.response.data.error }}
      </div>
    </div>
    
    <!-- Charts Section -->
    <div class="charts-container">
      <ChartCard
        v-for="(chart, index) in charts"
        :key="index"
        :available-files="availableFiles"
        :file-data="chart.fileData"
        :chart-index="index"
        @select-file="(fileName) => selectFileForChart(fileName, index)"
        @open-data-preview="showDataPreview = true"
        @open-file-selector="(index) => { activeChartIndex = index; showFileSelector = true }"
        @remove-chart="removeChart"
      />
    </div>

    <!-- CSV Import Modal -->
    <ModalCsvImport
      :show="showImportModal"
      :selected-file="selectedFile"
      :csv-data="csvData"
      v-model:has-header="hasHeader"
      v-model:delimiter="delimiter"
      v-model:selected-x-column="selectedXColumn"
      v-model:selected-y-column="selectedYColumn"
      :preview-headers="previewHeaders"
      :preview-rows="previewRows"
      :can-import="canImport"
      :is-loading="isLoading"
      @close="closeModal"
      @file-upload="handleFileUpload"
      @update-preview="updatePreview"
      @import-data="importData"
    />

    <!-- Data Preview Modal -->
    <ModalDataPreview
      :show="showDataPreview"
      :file-name="selectedFile"
      :total-rows="selectedFileData?.totalRows || 0"
      :total-columns="selectedFileData?.totalColumns || 0"
      :headers="selectedFileData?.headers || []"
      :displayed-data="displayedData"
      :is-loading-more="isLoadingMore"
      :has-reached-end="hasReachedEnd"
      @close="showDataPreview = false"
      @scroll="handleDataTableScroll"
    />

    <!-- File Selection Modal -->
    <ModalFileSelector
      :show="showFileSelector"
      :available-files="availableFiles"
      :selected-file="null"
      @close="showFileSelector = false"
      @select-file="(fileName) => selectFileForChart(fileName, activeChartIndex)"
    />

    <!-- New Chart Section -->
    <div class="new-chart-section">
      <ButtonPlusCircle @click="handleAddNewChart" />
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import ButtonPlusCircle from '@/components/ButtonPlusCircle.vue'
import ModalCsvImport from '@/components/ModalCsvImport.vue'
import ModalDataPreview from '@/components/ModalDataPreview.vue'
import ModalFileSelector from '@/components/ModalFileSelector.vue'
import ChartCard from '@/components/ChartCard.vue'

export default {
  name: 'DashboardView',
  components: {
    ButtonPlusCircle,
    ModalCsvImport,
    ModalDataPreview,
    ModalFileSelector,
    ChartCard
  },
  
  data() {
    return {
      showImportModal: false,
      selectedFile: null,
      csvData: [],
      hasHeader: true,
      delimiter: ',',
      selectedXColumn: '',
      selectedYColumn: '',
      showDataPreview: false,
      displayedDataCount: 100,
      isLoadingMore: false,
      showFileSelector: false,

      charts: [
        { fileData: null }
      ],
      activeChartIndex: 0
    }
  },
  
  computed: {
    ...mapState(['loading', 'error']),
    ...mapGetters(['isLoading', 'hasError', 'errorMessage', 'hasData', 'dataHeaders', 'dataRows', 'totalRows', 'totalColumns', 'fileName', 'savedFileName', 'availableFiles', 'selectedFile', 'selectedFileData', 'hasSelectedFile']),
    
    previewHeaders() {
      if (this.csvData.length === 0) return []
      const firstRow = this.csvData[0]
      return this.hasHeader ? firstRow : firstRow.map((_, index) => `Column ${index + 1}`)
    },

    previewRows() {
      if (this.csvData.length === 0) return []
      const startIndex = this.hasHeader ? 1 : 0
      return this.csvData.slice(startIndex, startIndex + 5) // Show first 5 rows
    },

    canImport() {
      return this.selectedFile && this.csvData.length > 0 && this.selectedXColumn !== '' && this.selectedYColumn !== ''
    },

    displayedData() {
      if (!this.selectedFileData || !this.selectedFileData.data) {
        return []
      }
      return this.selectedFileData.data.slice(0, this.displayedDataCount)
    },

    hasReachedEnd() {
      if (!this.selectedFileData || !this.selectedFileData.data) {
        return true
      }
      return this.displayedDataCount >= this.selectedFileData.data.length
    }
  },
  
  async mounted() {
    await this.refreshFileList()
  },
  
  watch: {
    showDataPreview(newVal) {
      if (newVal) {
        this.resetDataPreview()
      }
    }
  },
  
  methods: {
    ...mapActions(['uploadCSV', 'fetchAvailableFiles', 'loadSelectedFile']),
    
    closeModal() {
      this.showImportModal = false
      this.selectedFile = null
      this.csvData = []
      this.selectedXColumn = ''
      this.selectedYColumn = ''
    },

    async handleFileUpload(event) {
      const file = event.target.files[0]
      if (!file) return

      this.selectedFile = file
      await this.parseCSV(file)
    },

    async parseCSV(file) {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      const delimiters = [',', ';', '\t', '|']
      let bestDelimiter = ','
      let maxColumns = 0

      for (const delim of delimiters) {
        const columns = lines[0].split(delim).length
        if (columns > maxColumns) {
          maxColumns = columns
          bestDelimiter = delim
        }
      }

      this.delimiter = bestDelimiter
      this.csvData = lines.map(line => line.split(this.delimiter))
      this.updatePreview()
    },

    updatePreview() {
      if (this.selectedFile) {
        this.parseCSV(this.selectedFile)
      }
    },

    async importData() {
      try {
        await this.uploadCSV({
          file: this.selectedFile,
          hasHeader: this.hasHeader,
          delimiter: this.delimiter,
          xColumn: this.selectedXColumn,
          yColumn: this.selectedYColumn
        })

        this.closeModal()
        
        await this.refreshFileList()
        
        if (this.savedFileName && this.availableFiles.length > 0) {
          const newFile = this.availableFiles.find(file => file.name === this.savedFileName)
          if (newFile) {
            this.selectedFileForChart = newFile.name
            await this.loadFileForChart()
            

          }
        }
      } catch (error) {
        console.error('Error importing data:', error)
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          statusText: error.response?.statusText
        })
      }
    },

    async refreshFileList() {
      try {
        await this.fetchAvailableFiles()
      } catch (error) {
        console.error('Error refreshing file list:', error)
      }
    },

    async loadFileForChart() {
      if (!this.selectedFileForChart) {
        return
      }
      
      try {
        await this.loadSelectedFile(this.selectedFileForChart)
      } catch (error) {
        console.error('Error loading file for chart:', error)
      }
    },

    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },

    handleDataTableScroll(event) {
      const container = event.target
      const { scrollTop, scrollHeight, clientHeight } = container
      
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
      
      if (isNearBottom && !this.isLoadingMore && !this.hasReachedEnd) {
        this.loadMoreData()
      }
    },

    async loadMoreData() {
      if (this.isLoadingMore || this.hasReachedEnd) {
        return
      }
      
      this.isLoadingMore = true
      await new Promise(resolve => setTimeout(resolve, 300))
      const newCount = this.displayedDataCount + 100
      const totalRows = this.selectedFileData?.data?.length || 0
      this.displayedDataCount = Math.min(newCount, totalRows)
      this.isLoadingMore = false
    },

    resetDataPreview() {
      this.displayedDataCount = 100
      this.isLoadingMore = false
    },

    async selectFileForChart(fileName, chartIndex) {
      try {
        await this.loadSelectedFile(fileName)
        this.charts[chartIndex].fileData = this.selectedFileData
        this.showFileSelector = false

      } catch (error) {
        console.error('Error loading file for chart:', error)
      }
    },



    handleAddNewChart() {
      this.charts.push({ fileData: null })
    },

    removeChart(index) {
      if (this.charts.length > 1) {
        this.charts.splice(index, 1)
      }
    }
  }
}
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.dashboard-header {
  text-align: center;
  margin-bottom: 3rem;
}

.dashboard-header h1 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
  font-size: 2.5rem;
}

.subtitle {
  color: #7f8c8d;
  font-size: 1.2rem;
}

.import-section {
  text-align: center;
  margin-bottom: 3rem;
}

.import-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  font-size: 1.1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.import-btn:hover {
  transform: translateY(-2px);
}

.file-info {
  margin-top: 1rem;
  color: #667eea;
  font-weight: 600;
  line-height: 1.5;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  border: 1px solid #fcc;
  text-align: center;
}

.error-details {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #fcc;
  font-size: 0.9rem;
}



.new-chart-section {
  margin-top: 3rem;
  margin-bottom: 3rem;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 40px;
}

.charts-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  margin-bottom: 2rem;
  width: 100%;
}

@media (max-width: 768px) {
  .dashboard {
    padding: 1rem;
  }

}
</style>