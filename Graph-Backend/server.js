const express = require('express');
const cors = require('./middleware/cors');
const helmet = require('./middleware/helmet');
const compression = require('./middleware/compression');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { MAIN_SERVER } = require('./config/ports');

const app = express();

// Middleware
app.use(helmet);
app.use(compression);
app.use(cors);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// CSV processing service
class CSVService {
  constructor() {
    this.processedData = null;
    this.headers = [];
    this.fileName = null;
    this.xColumn = null;
    this.yColumn = null;
  }

  parseCSVLine(line, delimiter) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  async processCSVUpload(csvContent, options) {
    try {
      const { hasHeader, delimiter, fileName, xColumn, yColumn } = options;
      
      const lines = csvContent.split('\n').filter(line => line.trim());
      if (lines.length === 0) {
        throw new Error('Empty CSV file');
      }

      let startIndex = 0;
      if (hasHeader) {
        this.headers = this.parseCSVLine(lines[0], delimiter);
        startIndex = 1;
      } else {
        // Generate headers if none provided
        const firstRow = this.parseCSVLine(lines[0], delimiter);
        this.headers = firstRow.map((_, index) => `Column_${index + 1}`);
        startIndex = 0;
      }

      this.processedData = [];
      for (let i = startIndex; i < lines.length; i++) {
        const row = this.parseCSVLine(lines[i], delimiter);
        if (row.length === this.headers.length) {
          this.processedData.push(row);
        }
      }

      this.fileName = fileName;
      this.xColumn = xColumn;
      this.yColumn = yColumn;

      // Save the selected columns to a new CSV file
      await this.saveSelectedColumns();

      // Analyze data types
      const analysis = this.analyzeData();

      return {
        fileName: this.fileName,
        totalRows: this.processedData.length,
        totalColumns: this.headers.length,
        headers: this.headers,
        sampleData: this.processedData.slice(0, 5),
        analysis: analysis,
        xColumn: this.xColumn,
        yColumn: this.yColumn,
        savedFileName: this.getSavedFileName()
      };

    } catch (error) {
      console.error('Error processing CSV upload:', error);
      throw new Error(`Failed to process CSV: ${error.message}`);
    }
  }

  analyzeData() {
    if (!this.processedData || this.processedData.length === 0) {
      return {};
    }

    const analysis = {};
    const numColumns = this.headers.length;

    for (let col = 0; col < numColumns; col++) {
      const values = this.processedData.map(row => row[col]).filter(val => val !== '');
      if (values.length === 0) continue;

      const type = this.detectColumnType(values);
      analysis[this.headers[col]] = {
        type: type,
        count: values.length,
        unique: new Set(values).size
      };

      if (type === 'numeric') {
        const nums = values.map(v => parseFloat(v)).filter(n => !isNaN(n));
        if (nums.length > 0) {
          analysis[this.headers[col]].min = Math.min(...nums);
          analysis[this.headers[col]].max = Math.max(...nums);
          analysis[this.headers[col]].avg = nums.reduce((a, b) => a + b, 0) / nums.length;
        }
      }
    }

    return analysis;
  }

  detectColumnType(values) {
    const sample = values.slice(0, Math.min(100, values.length));
    
    // Check if all are dates
    const allDates = sample.every(val => this.isDateString(val));
    if (allDates) return 'date';
    
    // Check if all are numeric
    const allNumeric = sample.every(val => this.isNumericString(val));
    if (allNumeric) return 'numeric';
    
    return 'text';
  }

  isDateString(str) {
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}$/,
      /^\d{2}\/\d{2}\/\d{4}$/,
      /^\d{2}-\d{2}-\d{4}$/,
      /^\d{4}\/\d{2}\/\d{2}$/
    ];
    return datePatterns.some(pattern => pattern.test(str));
  }

  isNumericString(str) {
    return !isNaN(parseFloat(str)) && isFinite(str);
  }

  async saveSelectedColumns() {
    if (!this.processedData || this.xColumn === null || this.yColumn === null) {
      throw new Error('No data or column selection not provided');
    }

    try {
      // Create data directory if it doesn't exist
      const dataDir = path.join(__dirname, 'data', 'processed');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Create CSV content with selected columns
      const csvLines = [];

      // Add header
      const headerLine = `${this.headers[this.xColumn]},${this.headers[this.yColumn]}`;
      csvLines.push(headerLine);

      // Add data rows
      this.processedData.forEach(row => {
        const xValue = row[this.xColumn] || '';
        const yValue = row[this.yColumn] || '';
        const dataLine = `${xValue},${yValue}`;
        csvLines.push(dataLine);
      });

      // Save to file
      const savedFileName = this.getSavedFileName();
      const filePath = path.join(dataDir, savedFileName);

      fs.writeFileSync(filePath, csvLines.join('\n'), 'utf8');

      console.log(`CSV saved successfully: ${filePath}`);
      return filePath;

    } catch (error) {
      console.error('Error saving selected columns:', error);
      throw new Error(`Failed to save CSV: ${error.message}`);
    }
  }

  getSavedFileName() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    
    if (!this.fileName) return `csv_processed_${timestamp}.csv`;

    // Create a more descriptive name based on selected columns
    if (this.xColumn !== null && this.yColumn !== null && this.headers.length > 0) {
      const xColName = this.headers[this.xColumn] || 'X';
      const yColName = this.headers[this.yColumn] || 'Y';
      return `${xColName}_vs_${yColName}_${timestamp}.csv`;
    }

    const baseName = path.basename(this.fileName, '.csv');
    return `${baseName}_processed_${timestamp}.csv`;
  }

  getProcessedData() {
    return {
      headers: this.headers,
      data: this.processedData,
      totalRows: this.processedData ? this.processedData.length : 0,
      totalColumns: this.headers.length
    };
  }
}

const csvService = new CSVService();

const frontendBuildPath = path.join(__dirname, '../Graph-Frontend/dist');
app.use(express.static(frontendBuildPath));

// Main health route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Universal CSV Processor',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      upload: '/api/csv/upload',
      data: '/api/csv/data'
    }
  });
});

// CSV upload route
app.post('/api/csv/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { hasHeader, delimiter, xColumn, yColumn } = req.body;
    const fileBuffer = req.file.buffer;
    const fileName = req.file.originalname;

    // Process the CSV file
    const result = await csvService.processCSVUpload(
      fileBuffer.toString('utf-8'),
      {
        hasHeader: hasHeader === 'true',
        delimiter: delimiter || ',',
        fileName,
        xColumn: parseInt(xColumn),
        yColumn: parseInt(yColumn)
      }
    );

    res.json({
      success: true,
      message: 'CSV file processed and saved successfully',
      data: result
    });

  } catch (error) {
    console.error('Error processing CSV upload:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing CSV file',
      error: error.message
    });
  }
});

// Route to get processed data
app.get('/api/csv/data', async (req, res) => {
  try {
    const data = csvService.getProcessedData();
    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Error getting processed data:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving data',
      error: error.message
    });
  }
});

// Root route with service information
app.get('/api', (req, res) => {
  res.json({
    service: 'Universal CSV Processor',
    version: '1.0.0',
    description: 'Universal server for processing and visualizing any CSV data',
    endpoints: {
      health: '/api/health',
      upload: '/api/csv/upload',
      data: '/api/csv/data'
    }
  });
});

// Route pour servir l'application Vue.js (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendBuildPath, 'index.html'));
});

// Global error handling
app.use((error, req, res, next) => {
  console.error('Main Orchestrator Error:', error);
  res.status(500).json({ 
    error: 'Internal Main Orchestrator Server Error',
    message: error.message 
  });
});

// Start server
app.listen(MAIN_SERVER, () => {
  console.log(`Universal CSV Processor server started on port ${MAIN_SERVER}`);
  console.log(`Server available at http://localhost:${MAIN_SERVER}`);
  console.log(`Health check: http://localhost:${MAIN_SERVER}/api/health`);
  console.log(`Frontend: http://localhost:${MAIN_SERVER}`);
});

module.exports = app; 