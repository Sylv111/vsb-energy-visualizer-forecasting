import axios from 'axios'
import { mainApi } from '@/config/api'

// Service pour les prédictions IA
class AIPredictionService {
  constructor() {
    this.api = axios.create(mainApi)
  }

  /**
   * Envoie une requête de prédiction IA
   * @param {Object} predictionData - Données de prédiction
   * @param {string} predictionData.csvFile - Nom du fichier CSV
   * @param {string} predictionData.aiModel - Modèle IA (convlstm, etc.)
   * @param {string} predictionData.xColumn - Colonne X (incrément/temps)
   * @param {string} predictionData.yColumn - Colonne Y (valeur à prédire)
   * @param {number} predictionData.nPredictions - Nombre de prédictions
   * @param {number} predictionData.epochs - Nombre d'époques
   * @param {number} predictionData.batchSize - Taille du batch
   * @param {number} predictionData.learningRate - Taux d'apprentissage
   * @returns {Promise} - Réponse de l'API
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
      
      // Si le backend n'est pas encore prêt, on simule une réponse
      if (error.code === 'ECONNREFUSED' || error.response?.status === 404) {
        console.log('Backend IA non disponible, simulation de la réponse')
        return this.simulateFictiveResponse(predictionData)
      }
      
      throw error
    }
  }

  /**
   * @param {Object} predictionData - Données de prédiction
   * @returns {Object} - Réponse fictive
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
