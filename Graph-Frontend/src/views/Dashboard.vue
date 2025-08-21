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
      <div class="chart-container">
        <!-- File Selection -->
        <div v-if="!selectedFileForChart" class="file-selection">
          <div class="file-selector">
            <label for="file-select">Choose a processed CSV file:</label>
            <select 
              id="file-select" 
              v-model="selectedFileForChart" 
              @change="loadFileForChart"
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
          
          <div v-if="selectedFileForChart && !hasSelectedFile" class="loading-file">
            <p>Loading file data...</p>
          </div>
        </div>

        <div v-if="!hasSelectedFile" class="empty-chart">
          <p>No file selected. Please choose a CSV file from the list above to start visualizing.</p>
        </div>
        <div v-else class="chart-content">
          <!-- Chart -->
          <div class="chart-container-main">
            <div class="chart-wrapper">
              <!-- Action Buttons -->
              <div class="action-buttons">
                <!-- Chart Options Button -->
                <button @click="toggleChartOptions" class="action-btn chart-options-btn">
                  <img src="@/assets/icons/chart-options.svg" alt="Chart Options" class="action-icon">
                  <span>Chart Options</span>
                </button>

                <!-- Data Preview Button -->
                <button @click="showDataPreview = true" class="action-btn data-preview-btn">
                  <img src="@/assets/icons/data-preview.svg" alt="Data Preview" class="action-icon">
                  <span>Data Preview</span>
                </button>

                <!-- Change File Button -->
                <button @click="showFileSelector = true" class="action-btn change-file-btn">
                  <img src="@/assets/icons/file-search.svg" alt="Change File" class="action-icon">
                  <span>Change File</span>
                </button>
              </div>

              <!-- Chart Options Panel -->
              <div v-show="showChartOptions" class="chart-options-panel">
                <div class="chart-options">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="chartSettings.showMarkers">
                    Show Markers
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="chartSettings.smoothCurve">
                    Smooth Curve
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="chartSettings.showGrid">
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

    <!-- Data Preview Modal -->
    <div v-if="showDataPreview" class="modal-overlay" @click="showDataPreview = false">
      <div class="data-preview-modal" @click.stop>
        <div class="modal-header">
          <h2>📊 Data Preview - {{ selectedFile }}</h2>
          <button @click="showDataPreview = false" class="close-btn">×</button>
        </div>
        
        <div class="modal-body">
          <div class="data-info-fixed">
            <p><strong>Total Rows:</strong> {{ selectedFileData.totalRows }} | <strong>Columns:</strong> {{ selectedFileData.totalColumns }}</p>
          </div>
          
          <div class="data-table-container" ref="dataTableContainer" @scroll="handleDataTableScroll">
            <table class="data-table">
              <thead>
                <tr>
                  <th v-for="header in selectedFileData.headers" :key="header">{{ header }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in displayedData" :key="index">
                  <td v-for="(cell, cellIndex) in row" :key="cellIndex">{{ cell }}</td>
                </tr>
              </tbody>
            </table>
            
            <!-- Loading indicator for infinite scroll -->
            <div v-if="isLoadingMore" class="loading-more">
              <p>Loading more data...</p>
            </div>
            
            <!-- End of data indicator -->
            <div v-if="hasReachedEnd" class="end-of-data">
              <p>End of data</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- File Selection Modal -->
    <div v-if="showFileSelector" class="modal-overlay" @click="showFileSelector = false">
      <div class="file-selector-modal" @click.stop>
        <div class="modal-header">
          <h2>📁 Select CSV File</h2>
          <button @click="showFileSelector = false" class="close-btn">×</button>
        </div>
        
        <div class="modal-body">
          <div class="file-list">
            <div class="file-items">
              <div 
                v-for="file in availableFiles" 
                :key="file.name"
                @click="selectFile(file.name)"
                class="file-item"
                :class="{ 'selected': file.name === selectedFileForChart }"
              >
                <div class="file-item-info">
                  <span class="file-item-name">{{ file.name }}</span>
                  <span class="file-item-size">{{ formatFileSize(file.size) }}</span>
                </div>
                <div v-if="file.name === selectedFileForChart" class="selected-indicator">
                  ✓
                </div>
              </div>
              
              <div v-if="availableFiles.length === 0" class="no-files">
                <p>No CSV files available. Please import a file first.</p>
              </div>
            </div>
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
      selectedFileForChart: '',
      chartSettings: {
        showMarkers: true,
        smoothCurve: true,
        showGrid: true
      },
      showDataPreview: false,
      displayedDataCount: 10,
      isLoadingMore: false,
      showChartOptions: false,
      showFileSelector: false
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

    chartOptions() {
      if (!this.selectedFileData || !this.selectedFileData.headers || !this.selectedFileData.data) {
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
            animateGradually: {
              enabled: true,
              delay: 150
            },
            dynamicAnimation: {
              enabled: true,
              speed: 350
            }
          },
          zoom: {
            enabled: true,
            type: 'x',
            autoScaleYaxis: true
          },
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
        title: {
          text: `Data Visualization: ${this.selectedFile}`,
          align: 'left',
          margin: 20,
          style: {
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#2c3e50'
          }
        },
        subtitle: {
          text: `${this.selectedFileData.totalRows} data points`,
          align: 'left',
          style: {
            fontSize: '12px',
            color: '#7f8c8d'
          }
        },
        xaxis: {
          title: {
            text: this.selectedFileData.headers[0] || 'X Axis',
            style: {
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#2c3e50'
            }
          },
          type: 'category',
          categories: this.selectedFileData.data.map(row => row[0] || ''),
          labels: {
            style: {
              colors: '#7f8c8d',
              fontSize: '12px'
            },
            rotate: -45,
            rotateAlways: false
          },
          tickAmount: 10
        },
        yaxis: {
          title: {
            text: this.selectedFileData.headers[1] || 'Y Axis',
            style: {
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#2c3e50'
            }
          },
          labels: {
            style: {
              colors: '#7f8c8d',
              fontSize: '12px'
            },
            formatter: function (val) {
              return val.toFixed(2)
            }
          }
        },
        stroke: {
          curve: this.chartSettings.smoothCurve ? 'smooth' : 'straight',
          width: 3,
          lineCap: 'round'
        },
        markers: {
          size: this.chartSettings.showMarkers ? 5 : 0,
          hover: {
            size: this.chartSettings.showMarkers ? 8 : 0
          },
          colors: ['#667eea'],
          strokeColors: '#ffffff',
          strokeWidth: 2
        },
        colors: ['#667eea', '#764ba2', '#f093fb'],
        grid: {
          show: this.chartSettings.showGrid,
          borderColor: '#e7e7e7',
          strokeDashArray: 5,
          row: {
            colors: this.chartSettings.showGrid ? ['#f8f9fa', 'transparent'] : ['transparent'],
            opacity: 0.5
          },
          column: {
            colors: this.chartSettings.showGrid ? ['#f8f9fa', 'transparent'] : ['transparent'],
            opacity: 0.5
          }
        },
        tooltip: {
          enabled: true,
          shared: true,
          intersect: false,
          theme: 'light',
          style: {
            fontSize: '12px'
          },
          y: {
            formatter: function (val) {
              return val.toFixed(2)
            }
          },
          x: {
            formatter: function (val) {
              return val
            }
          }
        },
        legend: {
          show: true,
          position: 'top',
          horizontalAlign: 'left',
          fontSize: '14px',
          fontFamily: 'Helvetica, Arial',
          fontWeight: 400,
          markers: {
            width: 12,
            height: 12,
            strokeWidth: 0,
            strokeColor: '#fff',
            radius: 12
          },
          itemMargin: {
            horizontal: 10,
            vertical: 5
          }
        },
        dataLabels: {
          enabled: false
        },
        theme: {
          mode: 'light',
          palette: 'palette1'
        },
        responsive: [{
          breakpoint: 768,
          options: {
            chart: {
              height: 300
            },
            xaxis: {
              labels: {
                rotate: -90
              }
            }
          }
        }]
      }
    },

    chartSeries() {
      if (!this.selectedFileData || !this.selectedFileData.data) {
        return []
      }

      // Prepare series data with better data handling
      const seriesData = this.selectedFileData.data.map((row) => {
        const xValue = row[0] || ''
        const yValue = row[1] || 0
        
        // Try to parse as number, fallback to 0 if not numeric
        const numericValue = parseFloat(yValue)
        const finalValue = isNaN(numericValue) ? 0 : numericValue
        
        return {
          x: xValue,
          y: finalValue
        }
      })

      return [{
        name: this.selectedFileData.headers[1] || 'Value',
        data: seriesData,
        type: 'line'
      }]
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
    // Load available files on component mount
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
      
      // Check if we're near the bottom (within 100px)
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
      
      // Simulate loading delay for better UX
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Load next 10 rows
      const newCount = this.displayedDataCount + 10
      const totalRows = this.selectedFileData?.data?.length || 0
      
      this.displayedDataCount = Math.min(newCount, totalRows)
      
      this.isLoadingMore = false
    },

    resetDataPreview() {
      this.displayedDataCount = 10
      this.isLoadingMore = false
    },

    toggleChartOptions() {
      this.showChartOptions = !this.showChartOptions
    },

    selectFile(fileName) {
      this.selectedFileForChart = fileName
      this.showFileSelector = false
      this.loadFileForChart()
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



.data-preview {
  margin-top: 2rem;
}

.data-preview h5 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.preview-table th,
.preview-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e9ecef;
}

.preview-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #2c3e50;
}

.preview-table tr:hover {
  background: #f8f9fa;
}

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

.chart-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #6c757d;
  font-style: italic;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  justify-content: flex-end;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e9ecef;
}

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
  color: #2c3e50;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.chart-options-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.data-preview-btn:hover {
  border-color: #28a745;
  color: #28a745;
}

.change-file-btn:hover {
  border-color: #ff6b35;
  color: #ff6b35;
}

.action-icon {
  width: 18px;
  height: 18px;
  transition: transform 0.2s ease;
  filter: brightness(0) saturate(100%) invert(30%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(0.3) contrast(1);
}

.chart-options-btn:hover .action-icon {
  filter: brightness(0) saturate(100%) invert(40%) sepia(100%) saturate(1000%) hue-rotate(220deg) brightness(0.8) contrast(1);
}

.data-preview-btn:hover .action-icon {
  filter: brightness(0) saturate(100%) invert(40%) sepia(100%) saturate(1000%) hue-rotate(90deg) brightness(0.8) contrast(1);
}

.change-file-btn:hover .action-icon {
  filter: brightness(0) saturate(100%) invert(40%) sepia(100%) saturate(1000%) hue-rotate(15deg) brightness(0.8) contrast(1);
}

.action-btn:hover .action-icon {
  transform: scale(1.1);
}

.chart-options-panel {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}



.data-preview-modal {
  background: white;
  border-radius: 12px;
  width: 95%;
  max-width: 1200px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0,0,0,0.3);
  display: flex;
  flex-direction: column;
}

.data-preview-modal .modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
}

.data-preview-modal .modal-header h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.3rem;
}

.data-preview-modal .modal-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.data-info-fixed {
  position: sticky;
  top: 0;
  z-index: 20;
  padding: 1rem 1.5rem;
  background: #e3f2fd;
  border-bottom: 1px solid #e9ecef;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.data-info-fixed p {
  margin: 0;
  color: #1976d2;
  font-size: 0.9rem;
  font-weight: 500;
}

.data-table-container {
  flex: 1;
  overflow-y: auto;
  padding: 0 1.5rem 1.5rem;
  max-height: 60vh;
  min-height: 300px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.data-table th,
.data-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e9ecef;
  font-size: 0.9rem;
}

.data-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #2c3e50;
  position: sticky;
  top: 0;
  z-index: 5;
}

.data-table tr:hover {
  background: #f8f9fa;
}

.loading-more {
  text-align: center;
  padding: 1rem;
  color: #6c757d;
  font-style: italic;
}

.end-of-data {
  text-align: center;
  padding: 1rem;
  color: #28a745;
  font-weight: 600;
  border-top: 1px solid #e9ecef;
  background: #f8fff9;
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





/* File Selector Modal Styles */
.file-selector-modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0,0,0,0.3);
}

.file-list {
  padding: 1rem;
}





.file-items {
  max-height: 400px;
  overflow-y: auto;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  margin-bottom: 0.5rem;
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.file-item:hover {
  background: #e9ecef;
  border-color: #667eea;
  transform: translateY(-1px);
}

.file-item.selected {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
  color: white;
}

.file-item-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.file-item-name {
  font-weight: 600;
  font-size: 1rem;
}

.file-item-size {
  font-size: 0.8rem;
  opacity: 0.8;
}

.selected-indicator {
  font-size: 1.2rem;
  font-weight: bold;
  color: white;
}

.no-files {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
  font-style: italic;
}
</style> 