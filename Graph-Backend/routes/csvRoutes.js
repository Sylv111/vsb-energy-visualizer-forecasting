const express = require('express');
const multer = require('multer');
const CSVController = require('../controllers/csvController');
const uploadConfig = require('../config/uploadConfig');

const router = express.Router();
const csvController = new CSVController();

// Configure multer for file upload
const upload = multer(uploadConfig);

// CSV upload route
router.post('/upload', upload.single('file'), (req, res) => {
  csvController.uploadCSV(req, res);
});

// Route to get processed data
router.get('/data', (req, res) => {
  csvController.getProcessedData(req, res);
});

// Route to list available CSV files
router.get('/files', (req, res) => {
  csvController.listCSVFiles(req, res);
});

// Route to load a specific CSV file
router.get('/files/:filename', (req, res) => {
  csvController.loadCSVFile(req, res);
});

module.exports = router;

