<template>
  <div v-if="show" class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>Import CSV File</h2>
        <button @click="$emit('close')" class="close-btn">×</button>
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
                <input type="checkbox" :checked="hasHeader" @change="updateHasHeader">
                Has header row
              </label>
            </div>

            <!-- Delimiter Selection -->
            <div class="config-item">
              <label>Delimiter:</label>
              <div class="delimiter-options">
                <label class="radio-label">
                  <input type="radio" :checked="delimiter === ','" @change="updateDelimiter(',')">
                  Comma (,)
                </label>
                <label class="radio-label">
                  <input type="radio" :checked="delimiter === ';'" @change="updateDelimiter(';')">
                  Semicolon (;)
                </label>
                <label class="radio-label">
                  <input type="radio" :checked="delimiter === '\t'" @change="updateDelimiter('\t')">
                  Tab
                </label>
                <label class="radio-label">
                  <input type="radio" :checked="delimiter === '|'" @change="updateDelimiter('|')">
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
                  <select id="x-column" :value="selectedXColumn" @change="updateSelectedXColumn" class="select-control">
                    <option value="">Select X column</option>
                    <option v-for="(header, index) in previewHeaders" :key="index" :value="index">
                      {{ header }}
                    </option>
                  </select>
                </div>
                <div class="column-selector">
                  <label for="y-column">Y-Axis Column:</label>
                  <select id="y-column" :value="selectedYColumn" @change="updateSelectedYColumn" class="select-control">
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
          <button @click="$emit('close')" class="btn-secondary">Cancel</button>
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
</template>

<script>
export default {
  name: 'ModalCsvImport',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    selectedFile: {
      type: File,
      default: null
    },
    csvData: {
      type: Array,
      default: () => []
    },
    hasHeader: {
      type: Boolean,
      default: true
    },
    delimiter: {
      type: String,
      default: ','
    },
    selectedXColumn: {
      type: String,
      default: ''
    },
    selectedYColumn: {
      type: String,
      default: ''
    },
    previewHeaders: {
      type: Array,
      default: () => []
    },
    previewRows: {
      type: Array,
      default: () => []
    },
    canImport: {
      type: Boolean,
      default: false
    },
    isLoading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'file-upload', 'update-preview', 'import-data', 'update:hasHeader', 'update:delimiter', 'update:selectedXColumn', 'update:selectedYColumn'],
  methods: {
    handleFileUpload(event) {
      this.$emit('file-upload', event)
    },
    updatePreview() {
      this.$emit('update-preview')
    },
    importData() {
      this.$emit('import-data')
    },
    updateHasHeader(event) {
      this.$emit('update:hasHeader', event.target.checked)
      this.updatePreview()
    },
    updateDelimiter(value) {
      this.$emit('update:delimiter', value)
      this.updatePreview()
    },
    updateSelectedXColumn(event) {
      this.$emit('update:selectedXColumn', event.target.value)
    },
    updateSelectedYColumn(event) {
      this.$emit('update:selectedYColumn', event.target.value)
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 95%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0,0,0,0.3);
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.5rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6c757d;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background-color: #f8f9fa;
  color: #495057;
}

.modal-body {
  padding: 1.5rem;
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
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s, background-color 0.2s;
}

.upload-area:hover {
  border-color: #667eea;
  background-color: #f8f9ff;
}

.upload-area p {
  margin: 0.5rem 0;
  color: #6c757d;
}

.file-name {
  color: #667eea !important;
  font-weight: 500;
}

.config-section {
  margin-bottom: 2rem;
}

.config-section h3 {
  margin-bottom: 1rem;
  color: #2c3e50;
  font-size: 1.2rem;
}

.config-item {
  margin-bottom: 1.5rem;
}

.config-item label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #2c3e50;
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

.delimiter-options {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #2c3e50;
  cursor: pointer;
}

.radio-label input[type="radio"] {
  cursor: pointer;
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

.select-control {
  padding: 0.5rem;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  font-size: 0.9rem;
  background: white;
}

.preview-section {
  margin-top: 2rem;
}

.preview-section h4 {
  margin-bottom: 1rem;
  color: #2c3e50;
}

.preview-table {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #dee2e6;
  border-radius: 4px;
}

.preview-table table {
  width: 100%;
  border-collapse: collapse;
}

.preview-table th,
.preview-table td {
  padding: 0.5rem;
  text-align: left;
  border-bottom: 1px solid #dee2e6;
  font-size: 0.8rem;
}

.preview-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  position: sticky;
  top: 0;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
}

.btn-primary,
.btn-secondary {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    margin: 1rem;
  }
  
  .column-selection {
    grid-template-columns: 1fr;
  }
  
  .delimiter-options {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .modal-actions {
    flex-direction: column;
  }
}
</style>
