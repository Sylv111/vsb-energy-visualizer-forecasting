import { createStore } from 'vuex'
import axios from 'axios'

export default createStore({
  state: {
    uploadedData: null,
    loading: false,
    error: null,
    fileName: null,
    savedFileName: null,
    availableFiles: [],
    selectedFile: null,
    selectedFileData: null,
    chartSettings: {}  // Stockage des options par graphique
  },
  
  mutations: {
    SET_LOADING(state, loading) {
      state.loading = loading
    },
    SET_ERROR(state, error) {
      state.error = error
    },
    SET_UPLOADED_DATA(state, data) {
      state.uploadedData = data
    },
    SET_FILE_NAME(state, fileName) {
      state.fileName = fileName
    },
    SET_SAVED_FILE_NAME(state, savedFileName) {
      state.savedFileName = savedFileName
    },
    SET_AVAILABLE_FILES(state, files) {
      state.availableFiles = files
    },
    SET_SELECTED_FILE(state, file) {
      state.selectedFile = file
    },
    SET_SELECTED_FILE_DATA(state, data) {
      state.selectedFileData = data
    },
    
    INIT_CHART_SETTINGS(state, chartIndex) {
      if (!state.chartSettings[chartIndex]) {
        state.chartSettings[chartIndex] = {
          showMarkers: true,
          smoothCurve: true,
          showGrid: true
        }
      }
    },

    UPDATE_CHART_SETTINGS(state, { chartIndex, settings }) {
      state.chartSettings[chartIndex] = { ...state.chartSettings[chartIndex], ...settings }
    },

    REMOVE_CHART_SETTINGS(state, chartIndex) {
      const newSettings = { ...state.chartSettings }
      delete newSettings[chartIndex]
      
      // Réindexer les paramètres des graphiques restants
      const finalSettings = {}
      Object.keys(newSettings)
        .filter(key => key > chartIndex)
        .forEach(key => {
          finalSettings[key - 1] = newSettings[key]
        })
      Object.keys(newSettings)
        .filter(key => key < chartIndex)
        .forEach(key => {
          finalSettings[key] = newSettings[key]
        })
      
      state.chartSettings = finalSettings
    }
  },
  
  actions: {
    async uploadCSV({ commit }, { file, hasHeader, delimiter, selectedColumns }) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('hasHeader', hasHeader)
        formData.append('delimiter', delimiter)
        formData.append('selectedColumns', selectedColumns)

        const response = await axios.post(`http://localhost:3000/api/csv/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })

        commit('SET_UPLOADED_DATA', response.data.data)
        commit('SET_FILE_NAME', response.data.data.fileName)
        commit('SET_SAVED_FILE_NAME', response.data.data.savedFileName)
        
        return response.data
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Error uploading CSV file'
        commit('SET_ERROR', errorMessage)
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },

    async fetchData({ commit }) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      
      try {
        const response = await axios.get(`http://localhost:3000/api/csv/data`)
        commit('SET_UPLOADED_DATA', response.data.data)
        return response.data
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Error fetching data'
        commit('SET_ERROR', errorMessage)
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },

    async fetchAvailableFiles({ commit }) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      
      try {
        const response = await axios.get(`http://localhost:3000/api/csv/files`)
        commit('SET_AVAILABLE_FILES', response.data.files)
        return response.data
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Error fetching available files'
        commit('SET_ERROR', errorMessage)
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },

    async loadSelectedFile({ commit }, filename) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      
      try {
        const response = await axios.get(`http://localhost:3000/api/csv/files/${filename}`)
        commit('SET_SELECTED_FILE', filename)
        commit('SET_SELECTED_FILE_DATA', response.data.data)
        return response.data
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Error loading selected file'
        commit('SET_ERROR', errorMessage)
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    }
  },
  
      getters: {
      isLoading: state => state.loading,
      hasError: state => !!state.error,
      errorMessage: state => state.error,
      hasData: state => !!state.uploadedData,
      dataHeaders: state => state.uploadedData?.headers || [],
      dataRows: state => state.uploadedData?.data || [],
      totalRows: state => state.uploadedData?.totalRows || 0,
      totalColumns: state => state.uploadedData?.totalColumns || 0,
      fileName: state => state.fileName,
      savedFileName: state => state.savedFileName,
      availableFiles: state => state.availableFiles,
      selectedFile: state => state.selectedFile,
      selectedFileData: state => state.selectedFileData,
      hasSelectedFile: state => !!state.selectedFileData
    }
}) 