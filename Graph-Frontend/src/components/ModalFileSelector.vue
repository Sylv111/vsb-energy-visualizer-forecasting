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
              @click="selectFile(file.name)"
              class="file-item"
              :class="{ 'selected': file.name === selectedFile }"
            >
              <div class="file-item-info">
                <span class="file-item-name">{{ file.name }}</span>
                <span class="file-item-size">{{ formatFileSize(file.size) }}</span>
              </div>
              <div v-if="file.name === selectedFile" class="selected-indicator">
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
    selectedFile: {
      type: String,
      default: ''
    }
  },
  emits: ['close', 'select-file'],
  methods: {
    selectFile(fileName) {
      this.$emit('select-file', fileName)
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
}

.file-item:hover {
  border-color: #667eea;
  background-color: #f8f9ff;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
}

.file-item.selected {
  border-color: #667eea;
  background-color: #e3f2fd;
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

.selected-indicator {
  color: #667eea;
  font-weight: bold;
  font-size: 1.2rem;
  background: #667eea;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
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
