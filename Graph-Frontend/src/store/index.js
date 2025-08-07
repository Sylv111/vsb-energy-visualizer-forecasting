import { createStore } from 'vuex'
import axios from 'axios'
import { electricityApi } from '@/config/api'

export default createStore({
  state: {
    electricityData: [],
    stats: null,
    loading: false,
    error: null,
    selectedPrecision: 2,
    ifaFlowData: [],
    ndData: [],
    windData: [],
    solarData: [],
    renewablePercentages: []
  },
  
  mutations: {
    SET_LOADING(state, loading) {
      state.loading = loading
    },
    SET_ERROR(state, error) {
      state.error = error
    },
    SET_ELECTRICITY_DATA(state, data) {
      state.electricityData = data
    },
    SET_STATS(state, stats) {
      state.stats = stats
    },
    SET_SELECTED_PRECISION(state, precision) {
      state.selectedPrecision = precision
    },
    SET_IFA_FLOW_DATA(state, data) {
      state.ifaFlowData = data
    },
    SET_ND_DATA(state, data) {
      state.ndData = data
    },
    SET_WIND_DATA(state, data) {
      state.windData = data
    },
    SET_SOLAR_DATA(state, data) {
      state.solarData = data
    },
    SET_RENEWABLE_PERCENTAGES(state, data) {
      state.renewablePercentages = data
    }
  },
  
  actions: {
    async fetchElectricityData({ commit }) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      
      try {
        const response = await axios.get('/api/electricity/data', electricityApi)
        commit('SET_ELECTRICITY_DATA', response.data.data)
        commit('SET_STATS', response.data.stats)
      } catch (error) {
        commit('SET_ERROR', 'Error loading data')
        console.error('API Error:', error)
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    async fetchWindData({ commit }) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      
      try {
        const response = await axios.get('/api/electricity/wind', electricityApi)
        commit('SET_WIND_DATA', response.data.data)
      } catch (error) {
        commit('SET_ERROR', 'Error loading wind data')
        console.error('API Error:', error)
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    async fetchSolarData({ commit }) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      
      try {
        const response = await axios.get('/api/electricity/solar', electricityApi)
        commit('SET_SOLAR_DATA', response.data.data)
      } catch (error) {
        commit('SET_ERROR', 'Error loading solar data')
        console.error('API Error:', error)
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    async fetchRenewablePercentages({ commit }) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      
      try {
        const response = await axios.get('/api/electricity/renewable-percentages', electricityApi)
        commit('SET_RENEWABLE_PERCENTAGES', response.data.data)
      } catch (error) {
        commit('SET_ERROR', 'Error loading renewable percentages')
        console.error('API Error:', error)
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    async fetchNDData({ commit }) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      
      try {
        const response = await axios.get('/api/electricity/nd', electricityApi)
        commit('SET_ND_DATA', response.data.data)
      } catch (error) {
        commit('SET_ERROR', 'Error loading ND data')
        console.error('API Error:', error)
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    async fetchStats({ commit }) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      
      try {
        const response = await axios.get('/api/electricity/stats-optimized', electricityApi)
        commit('SET_STATS', response.data.data)
      } catch (error) {
        commit('SET_ERROR', 'Error loading statistics')
        console.error('API Error:', error)
      } finally {
        commit('SET_LOADING', false)
      }
    },

    async fetchFlowData({ commit }, { date, flowType }) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      
      try {
        const response = await axios.get(`/api/electricity/flow/${date}/${flowType}`, electricityApi)
        commit('SET_IFA_FLOW_DATA', response.data.data)
      } catch (error) {
        commit('SET_ERROR', 'Error loading Flow data')
        console.error('API Error:', error)
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    setSelectedPrecision({ commit }, precision) {
      commit('SET_SELECTED_PRECISION', precision)
    }
  },
  
  getters: {
    isLoading: state => state.loading,
    hasError: state => !!state.error,
    errorMessage: state => state.error,
    electricityData: state => state.electricityData,
    stats: state => state.stats,
    selectedPrecision: state => state.selectedPrecision,

    // Renewable energy percentages and totals for the selected month
    renewablePercentages: (state) => (selectedMonth = null) => {
      const data = state.renewablePercentages
      if (!Array.isArray(data) || data.length === 0) return { 
        solar: 0, 
        wind: 0, 
        total: 0,
        totalSolarMW: 0,
        totalWindMW: 0,
        totalDemandMW: 0
      }

      if (selectedMonth) {
        // Find the selected month in the data
        const monthData = data.find(item => item.month === selectedMonth)
        if (monthData) {
          return {
            solar: monthData.solar,
            wind: monthData.wind,
            total: monthData.total,
            totalSolarMW: monthData.totalSolarMW,
            totalWindMW: monthData.totalWindMW,
            totalDemandMW: monthData.totalDemandMW
          }
        }
      } else {
        // Use the last month that has data
        if (data.length > 0) {
          const lastMonth = data[data.length - 1]
          return {
            solar: lastMonth.solar,
            wind: lastMonth.wind,
            total: lastMonth.total,
            totalSolarMW: lastMonth.totalSolarMW,
            totalWindMW: lastMonth.totalWindMW,
            totalDemandMW: lastMonth.totalDemandMW
          }
        }
      }

      return { 
        solar: 0, 
        wind: 0, 
        total: 0,
        totalSolarMW: 0,
        totalWindMW: 0,
        totalDemandMW: 0
      }
    },

    // IFA Flow data getter
    ifaFlowData: (state) => {
      return state.ifaFlowData
    },

    // ND Data getter
    ndData: (state) => {
      return state.ndData
    },

    // ND Chart data getter
    ndChartData: (state) => {
      const data = state.ndData
      if (!Array.isArray(data) || !data.length) return []

      return data.map(item => ({
        x: new Date(item.weekStart || item.date).getTime(),
        y: Number((parseFloat(item.averageND) || 0).toFixed(state.selectedPrecision))
      })).filter(item => !isNaN(item.y))
    },

    // Wind Data getter
    windData: (state) => {
      const data = state.windData
      if (!Array.isArray(data) || !data.length) return []
      
      // Convert to chart format (x: timestamp, y: value)
      return data.map(item => ({
        x: new Date(item.weekStart).getTime(),
        y: Number((parseFloat(item.windAverage) || 0).toFixed(state.selectedPrecision))
      })).filter(item => !isNaN(item.y))
    },

    // Solar Data getter
    solarData: (state) => {
      const data = state.solarData
      if (!Array.isArray(data) || !data.length) return []
      
      // Convert to chart format (x: timestamp, y: value)
      return data.map(item => ({
        x: new Date(item.weekStart).getTime(),
        y: Number((parseFloat(item.solarAverage) || 0).toFixed(state.selectedPrecision))
      })).filter(item => !isNaN(item.y))
    }
  }
}) 