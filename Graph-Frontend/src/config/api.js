// Configuration de l'API
const API_CONFIG = {
  // URL du service
  MAIN_API: process.env.VUE_APP_MAIN_API || 'http://localhost:3000',
  
  // Timeout
  REQUEST_TIMEOUT: 30000,
  
  // Headers par défaut
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// Configuration axios pour l'API principale
export const mainApi = {
  baseURL: API_CONFIG.MAIN_API,
  timeout: API_CONFIG.REQUEST_TIMEOUT,
  headers: API_CONFIG.DEFAULT_HEADERS
};

export default API_CONFIG;