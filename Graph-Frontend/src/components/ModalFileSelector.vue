<template>
  <div v-if="show" class="modal-overlay" @click="$emit('close')">
    <div class="file-selector-modal" @click.stop>
      <div class="modal-header">
        <h2>📁 Select CSV File</h2>
        <button @click="$emit('close')" class="close-btn">×</button>
      </div>
      
      <div class="modal-body">
        <div class="file-list">
          <div class="file-items">
            <div 
              v-for="file in availableFiles" 
              :key="file.name"
              class="file-item"
              :class="{ 'expanded': expandedFile === file.name }"
            >
              <div class="file-header" @click="selectFile(file.name)">
                <div class="file-item-info">
                  <span class="file-item-name">{{ file.name }}</span>
                  <span class="file-item-size">{{ formatFileSize(file.size) }}</span>
                </div>
                <div class="expand-indicator">
                  {{ expandedFile === file.name ? '▼' : '▶' }}
                </div>
              </div>

              <!-- Colonnes du fichier -->
              <div v-if="expandedFile === file.name" class="file-columns">
                <div v-if="loading" class="loading-indicator">
                  Loading file data...
                </div>
                <div v-else-if="fileData" class="columns-container">
                  <div class="columns-header">
                    <h3>Select Columns:</h3>
                    <div class="columns-info">
                      <p>Select one Y column and one or more X columns</p>
                      <p class="columns-count">
                        Selected: {{ selectedXColumns.length }} X column(s), 
                        {{ selectedYColumn !== null ? '1' : '0' }} Y column
                      </p>
                    </div>
                  </div>

                  <div class="columns-grid">
                    <div 
                      v-for="(header, index) in fileData.headers" 
                      :key="index"
                      class="column-item"
                      :class="{
                        'selected-y': selectedYColumn === index,
                        'selected-x': selectedXColumns.includes(index)
                      }"
                    >
                      <div class="column-header">
                        <span class="column-name">{{ header }}</span>
                        <div class="column-actions">
                          <button 
                            class="btn-y"
                            :class="{ active: selectedYColumn === index }"
                            @click="setYColumn(index)"
                          >
                            Y
                          </button>
                          <button 
                            class="btn-x"
                            :class="{ active: selectedXColumns.includes(index) }"
                            @click="toggleXColumn(index)"
                          >
                            X
                          </button>
                        </div>
                      </div>
                      <div class="column-preview">
                        {{ fileData.data[0][index] }},
                        {{ fileData.data[1][index] }},
                        {{ fileData.data[2][index] }}...
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div v-if="availableFiles.length === 0" class="no-files">
              <p>No CSV files available. Please import a file first.</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Modal Footer -->
      <div class="modal-footer">
        <button 
          class="btn-apply"
          :disabled="!expandedFile || selectedYColumn === null || selectedXColumns.length === 0"
          @click="applySelection"
        >
          Apply Selection
        </button>
        <button @click="$emit('close')" class="btn-cancel">Close</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ModalFileSelector',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    availableFiles: {
      type: Array,
      default: () => []
    },
    selectedFiles: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      expandedFile: null,
      fileData: null,
      selectedYColumn: null,
      selectedXColumns: [],
      loading: false
    }
  },
  emits: ['close', 'select-columns'],
  methods: {
    async loadFileData(fileName) {
      try {
        this.loading = true
        const response = await fetch(`/api/csv/files/${fileName}`)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        
        if (data.success) {
          this.fileData = data.data
          this.expandedFile = fileName
          this.selectedYColumn = null
          this.selectedXColumns = []
        } else {
          throw new Error(data.message || 'Failed to load file data')
        }
      } catch (error) {
        console.error('Error loading file data:', error)
        this.fileData = null
        this.expandedFile = null
      } finally {
        this.loading = false
      }
    },
    selectFile(fileName) {
      if (this.expandedFile === fileName) {
        // Si le fichier est déjà développé, on le ferme
        this.expandedFile = null
        this.fileData = null
      } else {
        // Sinon on charge ses données
        this.loadFileData(fileName)
      }
    },
    toggleXColumn(columnIndex) {
      const idx = this.selectedXColumns.indexOf(columnIndex)
      if (idx === -1) {
        this.selectedXColumns.push(columnIndex)
      } else {
        this.selectedXColumns.splice(idx, 1)
      }
    },
    setYColumn(columnIndex) {
      if (this.selectedYColumn === columnIndex) {
        this.selectedYColumn = null
      } else {
        this.selectedYColumn = columnIndex
      }
    },
    applySelection() {
      if (this.expandedFile && this.selectedYColumn !== null && this.selectedXColumns.length > 0) {
        // Émettre l'événement avec les colonnes sélectionnées
        this.$emit('select-columns', {
          fileName: this.expandedFile,
          yColumn: this.selectedYColumn,
          xColumns: this.selectedXColumns
        })
        this.$emit('close')
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

.file-selector-modal {
  background: white;
  border-radius: 12px;
  width: 95%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0,0,0,0.3);
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
}

.modal-header h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.3rem;
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
  background-color: #e9ecef;
  color: #495057;
}

.modal-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.file-list {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.file-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.file-item {
  border: 2px solid #e9ecef;
  border-radius: 8px;
  background: white;
  margin-bottom: 0.5rem;
  overflow: hidden;
}

.file-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.file-header:hover {
  background-color: #f8f9ff;
}

.file-item.expanded {
  border-color: #667eea;
}

.file-item-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.file-item-name {
  font-weight: 500;
  color: #2c3e50;
  font-size: 0.95rem;
}

.file-item-size {
  font-size: 0.8rem;
  color: #6c757d;
}

.expand-indicator {
  color: #667eea;
  font-weight: bold;
}

.file-columns {
  border-top: 1px solid #e9ecef;
  padding: 1rem;
  background: #f8f9fa;
}

.loading-indicator {
  text-align: center;
  padding: 1rem;
  color: #6c757d;
  font-style: italic;
}

.columns-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.columns-header {
  margin-bottom: 1rem;
}

.columns-header h3 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.columns-info {
  color: #6c757d;
  font-size: 0.9rem;
}

.columns-count {
  margin-top: 0.5rem;
  font-weight: 500;
  color: #2c3e50;
}

.columns-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.column-item {
  border: 2px solid #e9ecef;
  border-radius: 6px;
  padding: 1rem;
  background: white;
  transition: all 0.2s ease;
}

.column-item.selected-y {
  border-color: #38b2ac;
  background-color: #e6fffa;
}

.column-item.selected-x {
  border-color: #667eea;
  background-color: #ebf4ff;
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
  gap: 1rem;
}

.column-name {
  font-weight: 500;
  color: #2c3e50;
  flex: 1;
  word-break: break-word;
  overflow-wrap: break-word;
  min-width: 0;
}

.column-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
  min-width: fit-content;
}

.btn-y, .btn-x {
  padding: 0.25rem 0.5rem;
  border: 2px solid #e9ecef;
  border-radius: 4px;
  background: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-y {
  color: #38b2ac;
}

.btn-x {
  color: #667eea;
}

.btn-y.active {
  background: #38b2ac;
  color: white;
  border-color: #38b2ac;
}

.btn-x.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.column-preview {
  font-size: 0.85rem;
  color: #6c757d;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.btn-apply {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  background: #667eea;
  color: white;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-right: 1rem;
}

.btn-apply:hover:not(:disabled) {
  background: #5a67d8;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
}

.btn-apply:disabled {
  background: #cbd5e0;
  cursor: not-allowed;
}

.no-files {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
  font-style: italic;
}

.no-files p {
  margin: 0;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: flex-end;
  background: #f8f9fa;
}

.btn-cancel {
  padding: 0.5rem 1rem;
  border: 2px solid #e9ecef;
  border-radius: 6px;
  background: white;
  color: #6c757d;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel:hover {
  border-color: #6c757d;
  color: #495057;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

@media (max-width: 768px) {
  .file-selector-modal {
    width: 95%;
    margin: 1rem;
  }
  
  .file-item {
    padding: 0.75rem;
  }
  
  .file-item-name {
    font-size: 0.9rem;
  }
  
  .file-item-size {
    font-size: 0.75rem;
  }
}
</style>
