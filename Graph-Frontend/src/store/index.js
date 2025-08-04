import { createStore } from 'vuex'
import axios from 'axios'
import { electricityApi } from '@/config/api'

export default createStore({
  state: {
    electricityData: [],
    aggregatedData: {},
    stats: null,
    loading: false,
    error: null,
    selectedPeriod: 'month',
    selectedYear: null,
    selectedPrecision: 2,
    ifaFlowData: []
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
    SET_AGGREGATED_DATA(state, { period, data }) {
      state.aggregatedData[period] = data
    },
    SET_STATS(state, stats) {
      state.stats = stats
    },
    SET_SELECTED_PERIOD(state, period) {
      state.selectedPeriod = period
    },
    SET_SELECTED_YEAR(state, year) {
      state.selectedYear = year
    },
    
    SET_SELECTED_PRECISION(state, precision) {
      state.selectedPrecision = precision
    },
    
    SET_IFA_FLOW_DATA(state, data) {
      state.ifaFlowData = data
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
    
    async fetchAggregatedData({ commit }, period) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      
      try {
        const response = await axios.get(`/api/electricity/data/aggregated/${period}`, electricityApi)
        commit('SET_AGGREGATED_DATA', { period, data: response.data.data })
      } catch (error) {
        commit('SET_ERROR', `Error loading ${period} data`)
        console.error('API Error:', error)
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    async fetchYearData({ commit }, year) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      
      try {
        const response = await axios.get(`/api/electricity/data/year/${year}`, electricityApi)
        commit('SET_ELECTRICITY_DATA', response.data.data)
      } catch (error) {
        commit('SET_ERROR', `Error loading ${year} data`)
        console.error('API Error:', error)
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    async fetchStats({ commit }) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      
      try {
        const response = await axios.get('/api/electricity/stats', electricityApi)
        commit('SET_STATS', response.data)
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
    
    setSelectedPeriod({ commit }, period) {
      commit('SET_SELECTED_PERIOD', period)
    },
    
    setSelectedYear({ commit }, year) {
      commit('SET_SELECTED_YEAR', year)
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
    aggregatedData: state => period => state.aggregatedData[period] || [],
    stats: state => state.stats,
    selectedPeriod: state => state.selectedPeriod,
    selectedYear: state => state.selectedYear,
    selectedPrecision: state => state.selectedPrecision,
    
    // Getters for data formatted for charts
    chartData: (state) => {
      const data = state.electricityData
      if (!Array.isArray(data) || !data.length) return []
      
      return data.map(item => ({
        x: new Date(item.date).getTime(),
        y: Number((parseFloat(item.demand) || 0).toFixed(state.selectedPrecision))
      })).filter(item => !isNaN(item.y))
    },
    
    aggregatedChartData: (state) => {
      const data = state.aggregatedData[state.selectedPeriod] || []
      if (!Array.isArray(data) || !data.length) return []
      
      return data.map(item => ({
        x: new Date(item.date).getTime(),
        y: Number((parseFloat(item.avgDemand) || 0).toFixed(state.selectedPrecision))
      })).filter(item => !isNaN(item.y))
    },
    
    windSolarData: (state) => {
      const data = state.electricityData
      if (!Array.isArray(data) || !data.length) return { wind: [], solar: [] }
      
      // Agrégation mensuelle pour les énergies renouvelables
      const monthlyData = {}
      
      data.forEach(item => {
        const date = new Date(item.date)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            wind: { total: 0, count: 0 },
            solar: { total: 0, count: 0 }
          }
        }
        
        monthlyData[monthKey].wind.total += parseFloat(item.windGeneration) || 0
        monthlyData[monthKey].wind.count++
        monthlyData[monthKey].solar.total += parseFloat(item.solarGeneration) || 0
        monthlyData[monthKey].solar.count++
      })
      
      // Convertir en format pour les graphiques avec formatage des nombres
      const windData = Object.keys(monthlyData).sort().map(month => ({
        x: new Date(month + '-01').getTime(),
        y: monthlyData[month].wind.count > 0 ? 
           Number((monthlyData[month].wind.total / monthlyData[month].wind.count).toFixed(state.selectedPrecision)) : 0
      }))
      
      const solarData = Object.keys(monthlyData).sort().map(month => ({
        x: new Date(month + '-01').getTime(),
        y: monthlyData[month].solar.count > 0 ? 
           Number((monthlyData[month].solar.total / monthlyData[month].solar.count).toFixed(state.selectedPrecision)) : 0
      }))
      
      return { wind: windData, solar: solarData }
    },

    // Renewable energy percentages and totals for the selected month
    renewablePercentages: (state) => (selectedMonth = null) => {
      const data = state.electricityData
      if (!Array.isArray(data) || data.length === 0) return { 
        solar: 0, 
        wind: 0, 
        total: 0,
        totalSolarMW: 0,
        totalWindMW: 0,
        totalDemandMW: 0
      }

      // Use selected month or find the last month that has data
      let targetMonth, targetMonthEnd
      
      if (selectedMonth) {
        // Parse selected month (format: "YYYY-MM")
        const [year, month] = selectedMonth.split('-')
        targetMonth = new Date(parseInt(year), parseInt(month) - 1, 1)
        targetMonthEnd = new Date(parseInt(year), parseInt(month), 0)
      } else {
        // Find the last month that has data
        const dates = data.map(item => new Date(item.date)).sort((a, b) => b - a)
        if (dates.length === 0) return { 
          solar: 0, 
          wind: 0, 
          total: 0,
          totalSolarMW: 0,
          totalWindMW: 0,
          totalDemandMW: 0
        }
        const lastDate = dates[0]
        targetMonth = new Date(lastDate.getFullYear(), lastDate.getMonth(), 1)
        targetMonthEnd = new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 0)
      }

      const monthData = data.filter(item => {
        const itemDate = new Date(item.date)
        return itemDate >= targetMonth && itemDate <= targetMonthEnd
      })

      if (monthData.length === 0) return { 
        solar: 0, 
        wind: 0, 
        total: 0,
        totalSolarMW: 0,
        totalWindMW: 0,
        totalDemandMW: 0
      }

      // Calculate totals for the selected month
      const totalDemand = monthData.reduce((sum, item) => sum + (parseFloat(item.demand) || 0), 0)
      const totalSolar = monthData.reduce((sum, item) => sum + (parseFloat(item.solarGeneration) || 0), 0)
      const totalWind = monthData.reduce((sum, item) => sum + (parseFloat(item.windGeneration) || 0), 0)

      // Calculate percentages relative to total renewable generation (solar + wind only)
      const totalRenewableGeneration = totalSolar + totalWind
      const solarPercentage = totalRenewableGeneration > 0 ? (totalSolar / totalRenewableGeneration) * 100 : 0
      const windPercentage = totalRenewableGeneration > 0 ? (totalWind / totalRenewableGeneration) * 100 : 0

      return {
        solar: Math.round(solarPercentage * 100) / 100,
        wind: Math.round(windPercentage * 100) / 100,
        total: Math.round((solarPercentage + windPercentage) * 100) / 100,
        totalSolarMW: Math.round(totalSolar),
        totalWindMW: Math.round(totalWind),
        totalDemandMW: Math.round(totalDemand)
      }
    },

    // IFA Flow data getter
    ifaFlowData: (state) => {
      return state.ifaFlowData
    }
  }
}) 