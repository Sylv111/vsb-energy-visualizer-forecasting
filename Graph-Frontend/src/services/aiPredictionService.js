import axios from 'axios'
import { mainApi } from '@/config/api'

// Service for AI predictions
class AIPredictionService {
  constructor() {
    this.api = axios.create(mainApi)
  }

  /**
   * Send an AI prediction request
   * @param {Object} predictionData - Prediction data
   * @param {string} predictionData.csvFile - CSV file name
   * @param {string} predictionData.aiModel - AI model (convlstm, etc.)
   * @param {string} predictionData.xColumn - X column (increment/time)
   * @param {string} predictionData.yColumn - Y column (value to predict)
   * @param {number} predictionData.nPredictions - Number of predictions
   * @param {number} predictionData.epochs - Number of epochs
   * @param {number} predictionData.batchSize - Batch size
   * @param {number} predictionData.learningRate - Learning rate
   * @returns {Promise} - API response
   */
  async runPrediction(predictionData) {
    try {
      
      const response = await this.api.post('/api/ai/predict', predictionData, {
        timeout: 3000000,
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      return response.data
      
    } catch (error) {
      console.error('Erreur lors de la prédiction IA:', error)
      
      // If backend is not ready yet, simulate a response
      if (error.code === 'ECONNREFUSED' || error.response?.status === 404) {
        console.log('Backend IA non disponible, simulation de la réponse')
        return this.simulateFictiveResponse(predictionData)
      }
      
      throw error
    }
  }

  /**
   * @param {Object} predictionData - Prediction data
   * @returns {Object} - Fictive response
   */
  simulateFictiveResponse(predictionData) {
    return {
      success: true,
      message: 'Prediction request received (fictive response)',
      predictionId: `pred_${Date.now()}`,
      data: {
        ...predictionData,
        timestamp: new Date().toISOString(),
        status: 'processing'
      }
    }
  }
}

// Instance singleton
const aiPredictionService = new AIPredictionService()

export default aiPredictionService
