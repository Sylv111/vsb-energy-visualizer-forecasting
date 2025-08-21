import { createStore } from 'vuex'
import axios from 'axios'

export default createStore({
  state: {
    uploadedData: null,
    loading: false,
    error: null,
    fileName: null,
    savedFileName: null
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
    }
  },
  
  actions: {
    async uploadCSV({ commit }, { file, hasHeader, delimiter, xColumn, yColumn }) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('hasHeader', hasHeader)
        formData.append('delimiter', delimiter)
        formData.append('xColumn', xColumn)
        formData.append('yColumn', yColumn)

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
      savedFileName: state => state.savedFileName
    }
}) 