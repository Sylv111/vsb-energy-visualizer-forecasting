<template>
  <div class="dashboard">
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

    <!-- Error Message -->
    <div v-if="hasError" class="error-message">
      ❌ {{ errorMessage }}
      <div v-if="error.response?.data?.error" class="error-details">
        <strong>Details:</strong> {{ error.response.data.error }}
      </div>
    </div>

    <!-- Chart Section -->
    <div class="chart-section">
      <h2>Data Visualization</h2>
      <div class="chart-container">
        <div v-if="!hasData" class="empty-chart">
          <p>No data loaded. Please import a CSV file to start visualizing.</p>
        </div>
        <div v-else class="chart-content">
          <!-- Date Range Selector -->
          <div class="date-selector">
            <label for="start-date">Start Date:</label>
            <input 
              id="start-date" 
              type="date" 
              v-model="startDate" 
              @change="updateChart"
            />
            <label for="end-date">End Date:</label>
            <input 
              id="end-date" 
              type="date" 
              v-model="endDate" 
              @change="updateChart"
            />
          </div>
          
          <!-- Chart will be added here -->
          <div class="chart-placeholder">
            <p>Chart will be displayed here with data from {{ startDate }} to {{ endDate }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- CSV Import Modal -->
    <div v-if="showImportModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Import CSV File</h2>
          <button @click="closeModal" class="close-btn">×</button>
        </div>

        <div class="modal-body">
          <!-- File Upload -->
          <div class="upload-section">
            <input 
              type="file" 
              ref="fileInput" 
              @change="handleFileUpload" 
              accept=".csv"
              class="file-input"
            />
            <div class="upload-area" @click="$refs.fileInput.click()">
              <p>📁 Click to select CSV file or drag and drop</p>
              <p v-if="selectedFile" class="file-name">{{ selectedFile.name }}</p>
            </div>
          </div>

          <!-- CSV Configuration -->
          <div v-if="csvData.length > 0" class="config-section">
            <h3>CSV Configuration</h3>
            
            <!-- Header Row -->
            <div class="config-item">
              <label class="checkbox-label">
                <input type="checkbox" v-model="hasHeader" @change="updatePreview">
                Has header row
              </label>
            </div>

            <!-- Delimiter Selection -->
            <div class="config-item">
              <label>Delimiter:</label>
              <div class="delimiter-options">
                <label class="radio-label">
                  <input type="radio" v-model="delimiter" value="," @change="updatePreview">
                  Comma (,)
                </label>
                <label class="radio-label">
                  <input type="radio" v-model="delimiter" value=";" @change="updatePreview">
                  Semicolon (;)
                </label>
                <label class="radio-label">
                  <input type="radio" v-model="delimiter" value="\t" @change="updatePreview">
                  Tab
                </label>
                <label class="radio-label">
                  <input type="radio" v-model="delimiter" value="|" @change="updatePreview">
                  Pipe (|)
                </label>
              </div>
            </div>

            <!-- Column Selection -->
            <div class="config-item">
              <label>Column Selection:</label>
              <div class="column-selection">
                <div class="column-selector">
                  <label for="x-column">X-Axis Column:</label>
                  <select id="x-column" v-model="selectedXColumn" class="select-control">
                    <option value="">Select X column</option>
                    <option v-for="(header, index) in previewHeaders" :key="index" :value="index">
                      {{ header }}
                    </option>
                  </select>
                </div>
                <div class="column-selector">
                  <label for="y-column">Y-Axis Column:</label>
                  <select id="y-column" v-model="selectedYColumn" class="select-control">
                    <option value="">Select Y column</option>
                    <option v-for="(header, index) in previewHeaders" :key="index" :value="index">
                      {{ header }}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Data Preview -->
            <div class="preview-section">
              <h4>Data Preview</h4>
              <div class="preview-table">
                <table>
                  <thead v-if="hasHeader">
                    <tr>
                      <th v-for="(header, index) in previewHeaders" :key="index">
                        {{ header }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, rowIndex) in previewRows" :key="rowIndex">
                      <td v-for="(cell, cellIndex) in row" :key="cellIndex">
                        {{ cell }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="modal-actions">
            <button @click="closeModal" class="btn-secondary">Cancel</button>
            <button 
              @click="importData" 
              :disabled="!canImport || isLoading"
              class="btn-primary"
            >
              <span v-if="isLoading">⏳ Uploading...</span>
              <span v-else>Import Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex'

export default {
  name: 'DashboardView',
  
  data() {
    return {
      showImportModal: false,
      selectedFile: null,
      csvData: [],
      hasHeader: true,
      delimiter: ',',
      selectedXColumn: '',
      selectedYColumn: '',
      startDate: '',
      endDate: ''
    }
  },

  computed: {
    ...mapState(['loading', 'error']),
    ...mapGetters(['isLoading', 'hasError', 'errorMessage', 'hasData', 'dataHeaders', 'dataRows', 'totalRows', 'totalColumns', 'fileName', 'savedFileName']),
    
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
    }
  },

  methods: {
    ...mapActions(['uploadCSV']),
    
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
      
      // Try different delimiters to auto-detect
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
      // This method will be called when configuration changes
      // For now, we'll just re-parse with current settings
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
        
        // Set default date range if we have data
        if (this.dataRows.length > 0) {
          const firstRow = this.dataRows[0]
          const lastRow = this.dataRows[this.dataRows.length - 1]
          
          // Try to find date columns
          const dateColumns = this.findDateColumns()
          if (dateColumns.length > 0) {
            const dateCol = dateColumns[0]
            this.startDate = this.parseDate(firstRow[dateCol])
            this.endDate = this.parseDate(lastRow[dateCol])
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

    findDateColumns() {
      // Simple heuristic to find date columns
      const dateColumns = []
      const sampleRow = this.dataRows[0] || []
      
      sampleRow.forEach((cell, index) => {
        if (this.isDateString(cell)) {
          dateColumns.push(index)
        }
      })
      
      return dateColumns
    },

    isDateString(str) {
      if (!str) return false
      const datePatterns = [
        /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
        /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
        /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
        /^\d{1,2}\/\d{1,2}\/\d{2,4}$/ // Various date formats
      ]
      return datePatterns.some(pattern => pattern.test(str.trim()))
    },

    parseDate(dateStr) {
      if (!dateStr) return ''
      const date = new Date(dateStr)
      return date.toISOString().split('T')[0]
    },

    updateChart() {
      // TODO: Update chart with filtered data
      console.log('Updating chart with date range:', this.startDate, 'to', this.endDate)
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

.chart-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.chart-section h2 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
}

.chart-container {
  min-height: 400px;
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

.date-selector {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  align-items: center;
}

.date-selector label {
  font-weight: 600;
  color: #2c3e50;
}

.date-selector input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.chart-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  color: #6c757d;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0,0,0,0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h2 {
  margin: 0;
  color: #2c3e50;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #6c757d;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #2c3e50;
}

.modal-body {
  padding: 2rem;
}

.upload-section {
  margin-bottom: 2rem;
}

.file-input {
  display: none;
}

.upload-area {
  border: 2px dashed #dee2e6;
  border-radius: 8px;
  padding: 3rem;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.upload-area:hover {
  border-color: #667eea;
}

.upload-area p {
  margin: 0.5rem 0;
  color: #6c757d;
}

.file-name {
  color: #667eea !important;
  font-weight: 600;
}

.config-section {
  margin-bottom: 2rem;
}

.config-section h3 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.config-item {
  margin-bottom: 1.5rem;
}

.config-item label {
  display: block;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.checkbox-label, .radio-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: normal;
  cursor: pointer;
}

.checkbox-label input, .radio-label input {
  margin: 0;
}

.delimiter-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}

.column-selection {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.column-selector {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.column-selector label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;
}

.select-control {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  font-size: 0.9rem;
  min-width: 150px;
}

.preview-section {
  margin-bottom: 2rem;
}

.preview-section h4 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.preview-table {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #dee2e6;
  border-radius: 8px;
}

.preview-table table {
  width: 100%;
  border-collapse: collapse;
}

.preview-table th,
.preview-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #dee2e6;
}

.preview-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #2c3e50;
  position: sticky;
  top: 0;
}

.preview-table tr:hover {
  background: #f8f9fa;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
}

.btn-primary, .btn-secondary {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #5a6fd8;
}

.btn-primary:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

@media (max-width: 768px) {
  .dashboard {
    padding: 1rem;
  }
  
  .modal-content {
    width: 95%;
    margin: 1rem;
  }
  
  .date-selector {
    flex-direction: column;
    align-items: stretch;
  }
  
  .delimiter-options {
    grid-template-columns: 1fr;
  }
  
  .modal-actions {
    flex-direction: column;
  }
}
</style> 