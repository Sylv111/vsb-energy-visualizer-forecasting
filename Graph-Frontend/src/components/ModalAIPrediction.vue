<template>
  <div v-if="isVisible" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>🤖 AI Prediction Configuration</h2>
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

         <!-- Starting Point -->
         <div class="form-group">
           <label for="start-point">Starting Point (Index):</label>
           <input 
             id="start-point" 
             v-model.number="config.startIndex" 
             type="number" 
             min="-1" 
             class="form-input"
             placeholder="Enter starting index"
           >
          </div>

         <!-- Advanced Parameters -->
         <div class="form-group advanced-section">
           <h3 class="section-title">Advanced Parameters</h3>
           
           <!-- Epochs Slider -->
           <div class="slider-group">
             <div class="slider-header">
               <label for="epochs">Epochs: {{ config.epochs }}</label>
               <div class="info-tooltip">
                 <span class="info-icon">i</span>
                 <div class="tooltip-text">Higher values make training longer but usually more accurate.</div>
               </div>
             </div>
             <input 
               id="epochs" 
               v-model.number="config.epochs" 
               type="range" 
               min="50" 
               max="300" 
               step="10"
               class="slider"
             >
             <div class="slider-labels">
               <span>50</span>
               <span>300</span>
             </div>
           </div>

           <!-- Batch Size Slider -->
           <div class="slider-group">
             <div class="slider-header">
               <label for="batch-size">Batch Size: {{ config.batchSize }}</label>
               <div class="info-tooltip">
                 <span class="info-icon">i</span>
                 <div class="tooltip-text">Higher values train faster but may reduce precision.</div>
               </div>
             </div>
             <input 
               id="batch-size" 
               v-model.number="config.batchSize" 
               type="range" 
               min="16" 
               max="64" 
               step="8"
               class="slider"
             >
             <div class="slider-labels">
               <span>16</span>
               <span>64</span>
             </div>
           </div>

           <!-- Learning Rate Slider -->
           <div class="slider-group">
             <div class="slider-header">
               <label for="learning-rate">Learning Rate: {{ config.learningRate }}</label>
               <div class="info-tooltip">
                 <span class="info-icon">i</span>
                 <div class="tooltip-text">Higher values make learning faster but less stable.</div>
               </div>
             </div>
             <input 
               id="learning-rate" 
               v-model.number="config.learningRate" 
               type="range" 
               min="0.0001" 
               max="0.005" 
               step="0.0001"
               class="slider"
             >
             <div class="slider-labels">
               <span>1e-4</span>
               <span>5e-3</span>
             </div>
           </div>
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
    selectedColumns: {
      type: Object,
      default: () => ({ x: null, y: null })
    },
    chartData: {
      type: Object,
      default: null
    }
  },
  emits: ['close', 'run-prediction'],
   data() {
     return {
       config: {
         aiModel: 'convlstm',
         xColumn: '',
         yColumn: '',
         nPredictions: 100,
         startIndex: -1,
         epochs: 200,
         batchSize: 32,
         learningRate: 0.001,
         seqLength: 48,
         filters: 64,
         kernelSize: 3,
         dropout: 0.2,
         l2Reg: 0.001,
         verbose: 1
       }
     }
   },
  computed: {
    isFormValid() {
      return this.config.xColumn && this.config.yColumn && this.config.nPredictions > 0
    },
    
    availableColumns() {
      return this.chartData?.csvFile?.headers || []
    }
  },
  watch: {
    isVisible(newVal) {
      if (newVal) {
        this.initializeConfig()
      }
    },
    selectedColumns: {
      handler() {
        this.initializeConfig()
      },
      deep: true
    },
    chartData: {
      handler() {
        this.initializeConfig()
      },
      deep: true
    }
  },
  methods: {
    initializeConfig() {
      // Use headers from the specific chart's file
      const chartHeaders = this.chartData?.csvFile?.headers || []
      
      // Auto-fill Y column from chart data
      if (this.chartData?.chartData?.yColumn !== undefined && chartHeaders.length > 0) {
        const yColumnIndex = this.chartData.chartData.yColumn
        const yColumnName = chartHeaders[yColumnIndex]
        if (yColumnName) {
          this.config.yColumn = yColumnName
        }
      }
      
      // Auto-fill X column from chart data ONLY if there's exactly one X column
      if (this.chartData?.chartData?.xColumns?.length === 1 && chartHeaders.length > 0) {
        const xColumnIndex = this.chartData.chartData.xColumns[0]
        const xColumnName = chartHeaders[xColumnIndex]
        if (xColumnName) {
          this.config.xColumn = xColumnName
        }
      }
    },
    closeModal() {
      this.$emit('close')
    },
    runPrediction() {  
      if (this.isFormValid) {
        this.$emit('run-prediction', this.config)
        this.closeModal()
      } else {
        alert('Please select both X and Y columns before running prediction.')
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
  overflow-x: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
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

 /* Advanced Parameters Section */
 .advanced-section {
   border-top: 2px solid #e9ecef;
   padding-top: 1.5rem;
   margin-top: 1.5rem;
 }

 .section-title {
   margin: 0 0 1.5rem 0;
   color: #2c3e50;
   font-size: 1.2rem;
   font-weight: 600;
 }

 .slider-group {
   margin-bottom: 2rem;
 }

 .slider-group label {
   display: block;
   margin-bottom: 0.5rem;
   font-weight: 500;
   color: #495057;
   font-size: 0.95rem;
 }

 .slider {
   width: 100%;
   height: 6px;
   border-radius: 3px;
   background: #e9ecef;
   outline: none;
   -webkit-appearance: none;
   appearance: none;
   margin-bottom: 0.5rem;
 }

 .slider::-webkit-slider-thumb {
   -webkit-appearance: none;
   appearance: none;
   width: 20px;
   height: 20px;
   border-radius: 50%;
   background: #007bff;
   cursor: pointer;
   border: 2px solid white;
   box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
   transition: all 0.2s ease;
 }

 .slider::-webkit-slider-thumb:hover {
   background: #0056b3;
   transform: scale(1.1);
 }

 .slider::-moz-range-thumb {
   width: 20px;
   height: 20px;
   border-radius: 50%;
   background: #007bff;
   cursor: pointer;
   border: 2px solid white;
   box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
   transition: all 0.2s ease;
 }

 .slider::-moz-range-thumb:hover {
   background: #0056b3;
   transform: scale(1.1);
 }

 .slider-labels {
   display: flex;
   justify-content: space-between;
   font-size: 0.8rem;
   color: #6c757d;
   margin-top: 0.25rem;
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

/* Info tooltip styles */
.slider-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.info-tooltip {
  position: relative;
  display: inline-block;
}

.info-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background: transparent;
  color: #6c757d;
  border: 1px solid #6c757d;
  border-radius: 50%;
  font-size: 12px;
  font-weight: bold;
  cursor: help;
  transition: all 0.2s ease;
}

.info-icon:hover {
  color: #495057;
  border-color: #495057;
  transform: scale(1.1);
}

.tooltip-text {
  visibility: hidden;
  opacity: 0;
  position: absolute;
  bottom: 125%;
  right: 18px;
  background: #333;
  color: white;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  min-width: 300px;
  max-width: 400px;
  z-index: 1000;
}


.info-tooltip:hover .tooltip-text {
  visibility: visible;
  opacity: 1;
}
</style>
