<template>
  <div v-if="show" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>Chart Options</h2>
        <button @click="closeModal" class="close-btn">&times;</button>
      </div>
      
      <div class="modal-body">
        <!-- Series List -->
        <div class="series-section">
          <h3>Series on Chart</h3>
          <div v-if="chartData?.series?.length" class="series-list">
            <div 
              v-for="(series, index) in chartData.series" 
              :key="index"
              class="series-item"
            >
              <div class="series-info">
                <div class="series-color" :style="{ backgroundColor: series.color }"></div>
                <div class="series-details">
                  <div class="series-name">{{ series.name }}</div>
                  <div class="series-stats">
                    <span>{{ series.data?.length || 0 }} points</span>
                    <span v-if="series.xColumnName">vs {{ series.xColumnName }}</span>
                  </div>
                </div>
              </div>
              
              <div class="series-controls">
                <div class="color-control">
                  <label>Color:</label>
                  <input 
                    type="color" 
                    :value="series.color" 
                    @change="updateSeriesColor(index, $event.target.value)"
                    class="color-picker"
                  >
                </div>
                <div class="style-control">
                  <label>Style:</label>
                  <select 
                    :value="series.strokeDashArray || '0'"
                    @change="updateSeriesStyle(index, $event.target.value)"
                    class="style-select"
                  >
                    <option value="0">—————————————</option>
                    <option value="5,5">— — — — — —</option>
                    <option value="10,5">—— — ——— —</option>
                    <option value="3,3">· · · · · ·</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="no-series">
            <p>No series available on this chart.</p>
          </div>
        </div>

        <!-- Chart Settings -->
        <div class="settings-section">
          <h3>Chart Settings</h3>
          <div class="settings-grid">
            <div class="setting-item">
              <label>
                <input 
                  type="checkbox" 
                  v-model="chartSettings.showMarkers"
                  @change="updateChartSettings"
                >
                Show Markers
              </label>
            </div>
            <div class="setting-item">
              <label>
                <input 
                  type="checkbox" 
                  v-model="chartSettings.smoothCurve"
                  @change="updateChartSettings"
                >
                Smooth Curve
              </label>
            </div>
            <div class="setting-item">
              <label>
                <input 
                  type="checkbox" 
                  v-model="chartSettings.showGrid"
                  @change="updateChartSettings"
                >
                Show Grid
              </label>
            </div>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button @click="closeModal" class="btn btn-secondary">Close</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ModalChartOptions',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    chartData: {
      type: Object,
      default: () => ({})
    },
    chartIndex: {
      type: Number,
      default: 0
    },
    availableColumns: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      chartSettings: {
        showMarkers: true,
        smoothCurve: true,
        showGrid: true
      }
    }
  },
  watch: {
    show(newVal) {
      if (newVal) {
        this.loadChartSettings()
      }
    }
  },
  methods: {
    closeModal() {
      this.$emit('close')
    },
    
    loadChartSettings() {
      // Load chart settings from store
      const settings = this.$store.state.chartSettings[this.chartIndex]
      if (settings) {
        this.chartSettings = { ...settings }
      }
    },
    
    updateChartSettings() {
      this.$store.commit('UPDATE_CHART_SETTINGS', {
        chartIndex: this.chartIndex,
        settings: this.chartSettings
      })
    },
    
    updateSeriesColor(seriesIndex, newColor) {
      this.$emit('update-series-color', {
        chartIndex: this.chartIndex,
        seriesIndex,
        color: newColor
      })
    },
    
    updateSeriesStyle(seriesIndex, newStyle) {
      this.$emit('update-series-style', {
        chartIndex: this.chartIndex,
        seriesIndex,
        strokeDashArray: newStyle
      })
    }
  }
}
</script>

<style scoped>
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
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  max-width: 800px; /* Élargi de 600px à 800px */
  width: 95%; /* Augmenté de 90% à 95% */
  max-height: 85vh; /* Légèrement augmenté */
  overflow-y: auto;
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
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #7f8c8d;
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
  background: #f8f9fa;
  color: #2c3e50;
}

.modal-body {
  padding: 1.5rem;
}

.series-section, .settings-section {
  margin-bottom: 2rem;
}

.series-section h3, .settings-section h3 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1.2rem;
  border-bottom: 2px solid #667eea;
  padding-bottom: 0.5rem;
}

.series-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.series-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: white;
  border-radius: 6px;
  border: 2px solid #e9ecef;
  transition: all 0.2s ease;
}

.series-item:hover {
  border-color: #667eea;
}

.series-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.series-color {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.series-details {
  flex: 1;
}

.series-name {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.series-stats {
  font-size: 0.9rem;
  color: #7f8c8d;
  display: flex;
  gap: 1rem;
}

.series-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.color-control, .style-control {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.color-control label, .style-control label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #6c757d;
}

.color-picker {
  width: 40px;
  height: 30px;
  border: 2px solid #e9ecef;
  border-radius: 4px;
  cursor: pointer;
  padding: 0;
  background: none;
}

.color-picker:hover {
  border-color: #667eea;
}

.style-select {
  padding: 0.25rem 0.5rem;
  border: 2px solid #e9ecef;
  border-radius: 4px;
  background: white;
  font-size: 0.9rem;
  cursor: pointer;
  min-width: 120px;
  font-family: monospace;
  letter-spacing: 0.5px;
}

.style-select:hover {
  border-color: #667eea;
}

.style-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}


.no-series {
  text-align: center;
  padding: 2rem;
  color: #7f8c8d;
  font-style: italic;
}

.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr; /* Changé de 1fr à 1fr 1fr pour plus d'espace */
  gap: 1rem;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.setting-item label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  color: #2c3e50;
}

.setting-item input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #667eea;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
  transform: translateY(-1px);
}

/* Responsive design */
@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    margin: 1rem;
  }
  
  
  .settings-grid {
    grid-template-columns: 1fr; /* Retour à 1 colonne sur mobile */
  }
  
  .series-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}
</style>