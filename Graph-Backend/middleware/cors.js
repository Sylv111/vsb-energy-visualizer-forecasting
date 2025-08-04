const cors = require('cors');

const corsOptions = {
  origin: [
    'http://localhost:8080',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

module.exports = cors(corsOptions); 