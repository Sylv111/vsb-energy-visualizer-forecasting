// Configuration des APIs
const API_CONFIG = {
  // URLs des services
  ELECTRICITY_API: process.env.VUE_APP_ELECTRICITY_API || 'http://localhost:3001',
  GAS_API: process.env.VUE_APP_GAS_API || 'http://localhost:3002',
  MAIN_API: process.env.VUE_APP_MAIN_API || 'http://localhost:3000',
  
  // Timeouts
  REQUEST_TIMEOUT: 30000,
  
  // Headers par défaut
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// Configuration axios pour l'API électricité
export const electricityApi = {
  baseURL: API_CONFIG.ELECTRICITY_API,
  timeout: API_CONFIG.REQUEST_TIMEOUT,
  headers: API_CONFIG.DEFAULT_HEADERS
};

// Configuration axios pour l'API gaz
export const gasApi = {
  baseURL: API_CONFIG.GAS_API,
  timeout: API_CONFIG.REQUEST_TIMEOUT,
  headers: API_CONFIG.DEFAULT_HEADERS
};

// Configuration axios pour l'API principale
export const mainApi = {
  baseURL: API_CONFIG.MAIN_API,
  timeout: API_CONFIG.REQUEST_TIMEOUT,
  headers: API_CONFIG.DEFAULT_HEADERS
};

export default API_CONFIG; 