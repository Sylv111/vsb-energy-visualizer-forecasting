<template>
  <div v-if="show" class="modal-overlay" @click="$emit('close')">
    <div class="data-preview-modal" @click.stop>
      <div class="modal-header">
        <h2>📊 Data Preview {{ fileName }}</h2>
        <button @click="$emit('close')" class="close-btn">×</button>
      </div>
      
      <div class="modal-body">
        <div class="data-info-fixed">
          <p><strong>Total Rows:</strong> {{ totalRows }} | <strong>Columns:</strong> {{ totalColumns }}</p>
        </div>
        
        <div class="data-table-container" ref="dataTableContainer" @scroll="handleScroll">
          <table class="data-table">
            <thead>
              <tr>
                <th v-for="header in headers" :key="header">{{ header }}</th>
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
</template>

<script>
export default {
  name: 'ModalDataPreview',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    fileName: {
      type: String,
      default: ''
    },
    totalRows: {
      type: Number,
      default: 0
    },
    totalColumns: {
      type: Number,
      default: 0
    },
    headers: {
      type: Array,
      default: () => []
    },
    displayedData: {
      type: Array,
      default: () => []
    },
    isLoadingMore: {
      type: Boolean,
      default: false
    },
    hasReachedEnd: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'scroll'],
  watch: {
    show: {
      immediate: true,
      handler(newVal) {
        if (newVal) {
          document.body.style.overflow = 'hidden'
        } else {
          document.body.style.overflow = ''
        }
      }
    }
  },
  beforeUnmount() {
    document.body.style.overflow = ''
  },
  methods: {
    handleScroll(event) {
      this.$emit('scroll', event)
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
  font-weight: 500;
}

.data-table-container {
  flex: 1;
  overflow-y: auto;
  min-height: 400px;
  max-height: 60vh;
  padding: 0 1.5rem;
}

.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.9rem;
  margin: 1rem 0;
}

.data-table th {
  background: #f8f9fa;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 2px solid #dee2e6;
  position: sticky;
  top: 0;
  z-index: 10;
  white-space: nowrap;
}

.data-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e9ecef;
  color: #2c3e50;
  background: white;
}

.data-table tr:hover td {
  background-color: #f8f9fa;
}

.data-table tr:first-child td {
  border-top: none;
}

.data-table th:first-child,
.data-table td:first-child {
  padding-left: 1.5rem;
}

.data-table th:last-child,
.data-table td:last-child {
  padding-right: 1.5rem;
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
  font-weight: 500;
  border-top: 1px solid #e9ecef;
}

@media (max-width: 768px) {
  .data-preview-modal {
    width: 95%;
    margin: 1rem;
  }
  
  .data-table {
    font-size: 0.75rem;
  }
  
  .data-table th,
  .data-table td {
    padding: 0.25rem 0.25rem;
  }
}
</style>
