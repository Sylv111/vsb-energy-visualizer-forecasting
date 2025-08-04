module.exports = {
  MAIN_SERVER: process.env.MAIN_PORT || 3000,
  ELECTRICITY_API: process.env.ELECTRICITY_PORT || 3001,
  GAS_API: process.env.GAS_PORT || 3002,
  
  ELECTRICITY_BASE_URL: process.env.ELECTRICITY_BASE_URL || 'http://localhost:3001',
  GAS_BASE_URL: process.env.GAS_BASE_URL || 'http://localhost:3002',
  
  REQUEST_TIMEOUT: 30000,
  CONNECTION_TIMEOUT: 10000
}; 