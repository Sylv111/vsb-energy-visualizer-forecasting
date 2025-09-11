<template>
  <div v-if="isVisible" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>AI Prediction Configuration</h2>
        <button @click="closeModal" class="close-btn">&times;</button>
      </div>
      
      <div class="modal-body">
        <!-- AI Model Selection -->
        <div class="form-group">
          <label for="ai-model">AI Model:</label>
          <select id="ai-model" v-model="config.aiModel" class="form-select">
            <option value="convlstm">ConvLSTM</option>
          </select>
        </div>

         <!-- Column Selection -->
         <div class="form-group columns-row">
           <div class="column-select">
             <label for="x-column">X Column</label>
             <select id="x-column" v-model="config.xColumn" class="form-select">
               <option value="">Select X Column</option>
               <option v-for="column in availableColumns" :key="column" :value="column">
                 {{ column }}
               </option>
             </select>
           </div>
           
           <div class="column-select">
             <label for="y-column">Y Column</label>
             <select id="y-column" v-model="config.yColumn" class="form-select">
               <option value="">Select Y Column</option>
               <option v-for="column in availableColumns" :key="column" :value="column">
                 {{ column }}
               </option>
             </select>
           </div>
         </div>

        <!-- Number of Predictions -->
        <div class="form-group">
          <label for="n-predictions">Number of Predictions:</label>
          <input 
            id="n-predictions" 
            v-model.number="config.nPredictions" 
            type="number" 
            min="1" 
            max="1000" 
            class="form-input"
            placeholder="Enter number of predictions"
          >
        </div>
      </div>

       <div class="modal-footer">
         <button @click="closeModal" class="btn btn-secondary">Cancel</button>
         <button @click="runPrediction" class="btn btn-primary" :disabled="!isFormValid">
           Run Prediction
         </button>
       </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ModalAIPrediction',
  props: {
    isVisible: {
      type: Boolean,
      default: false
    },
    availableColumns: {
      type: Array,
      default: () => []
    },
    selectedColumns: {
      type: Object,
      default: () => ({ x: null, y: null })
    }
  },
  emits: ['close', 'run-prediction'],
  data() {
    return {
      config: {
        aiModel: 'convlstm',
        xColumn: '',
        yColumn: '',
        nPredictions: 100
      }
    }
  },
  computed: {
    isFormValid() {
      return this.config.xColumn && this.config.yColumn && this.config.nPredictions > 0
    }
  },
  watch: {
    isVisible(newVal) {
      if (newVal) {
        this.$nextTick(() => {
          this.initializeConfig()
        })
      }
    },
    selectedColumns: {
      handler() {
        this.$nextTick(() => {
          this.initializeConfig()
        })
      },
      deep: true
    }
  },
  methods: {
    initializeConfig() {
      // Auto-fill Y column if one is selected
      if (this.selectedColumns.y && this.availableColumns.includes(this.selectedColumns.y)) {
        this.config.yColumn = this.selectedColumns.y
      }
      
      // Auto-fill X column if one is selected
      if (this.selectedColumns.x && this.availableColumns.includes(this.selectedColumns.x)) {
        this.config.xColumn = this.selectedColumns.x
      }
    },
    closeModal() {
      this.$emit('close')
    },
    runPrediction() {
      if (this.isFormValid) {
        this.$emit('run-prediction', { ...this.config })
        this.closeModal()
      }
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
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.5rem;
  font-weight: 600;
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
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background-color: #f8f9fa;
  color: #dc3545;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.columns-row {
  display: flex;
  gap: 1rem;
}

.column-select {
  flex: 1;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #495057;
}

.form-select,
.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
  background-color: white;
}

.form-select:focus,
.form-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.form-input[type="number"] {
  -moz-appearance: textfield;
}

.form-input[type="number"]::-webkit-outer-spin-button,
.form-input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e9ecef;
  background-color: #f8f9fa;
  border-radius: 0 0 12px 12px;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 100px;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #5a6268;
  transform: translateY(-1px);
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
  transform: translateY(-1px);
}

.btn-primary:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
  opacity: 0.6;
}

/* Responsive design */
@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    margin: 1rem;
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 1rem;
  }
  
  .modal-footer {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
  
  .columns-row {
    flex-direction: column;
    gap: 0;
  }
  
  .column-select {
    margin-bottom: 1.5rem;
  }
}
</style>
