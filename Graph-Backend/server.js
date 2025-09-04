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
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 30 * 1024 * 1024 // 30MB limit
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
      const { hasHeader, delimiter, fileName, selectedColumns } = options;
      
      const lines = csvContent.split('\n').filter(line => line.trim());
      if (lines.length === 0) {
        throw new Error('Empty CSV file');
      }

      let startIndex = 0;
      let allHeaders = [];
      if (hasHeader) {
        allHeaders = this.parseCSVLine(lines[0], delimiter);
        startIndex = 1;
      } else {
        // Generate headers if none provided
        const firstRow = this.parseCSVLine(lines[0], delimiter);
        allHeaders = firstRow.map((_, index) => `Column_${index + 1}`);
        startIndex = 0;
      }

      // Filter headers and data based on selected columns
      const selectedCols = JSON.parse(selectedColumns || '[]');
      if (!selectedCols || selectedCols.length === 0) {
        throw new Error('No columns selected. Please select at least one column to import.');
      }

      // Set headers for selected columns
      this.headers = selectedCols.map(index => allHeaders[index]);

      // Process data in chunks to avoid stack overflow with large files
      this.processedData = [];
      const chunkSize = 1000; // Process 1000 rows at a time
      
      for (let i = startIndex; i < lines.length; i += chunkSize) {
        const chunk = lines.slice(i, i + chunkSize);
        const chunkData = [];
        
        for (const line of chunk) {
          const row = this.parseCSVLine(line, delimiter);
          if (row.length === allHeaders.length) {
            // Extract only selected columns
            const selectedRow = [];
            for (const colIndex of selectedCols) {
              selectedRow.push(row[colIndex]);
            }
            chunkData.push(selectedRow);
          }
        }
        
        this.processedData.push(...chunkData);
      }

      this.fileName = fileName;

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
      // Extract values without using map to avoid stack overflow
      const values = [];
      const uniqueValues = new Set();
      
      for (let i = 0; i < this.processedData.length; i++) {
        const val = this.processedData[i][col];
        if (val !== '') {
          values.push(val);
          uniqueValues.add(val);
        }
      }
      
      if (values.length === 0) continue;

      // Sample only first 1000 values for type detection to avoid performance issues
      const sampleValues = values.slice(0, 1000);
      const type = this.detectColumnType(sampleValues);
      
      analysis[this.headers[col]] = {
        type: type,
        count: values.length,
        unique: uniqueValues.size
      };

      if (type === 'numeric') {
        // Calculate min/max/avg without using spread operator
        let min = Infinity;
        let max = -Infinity;
        let sum = 0;
        let validCount = 0;
        
        for (const val of values) {
          const num = parseFloat(val);
          if (!isNaN(num)) {
            min = Math.min(min, num);
            max = Math.max(max, num);
            sum += num;
            validCount++;
          }
        }
        
        if (validCount > 0) {
          analysis[this.headers[col]].min = min;
          analysis[this.headers[col]].max = max;
          analysis[this.headers[col]].avg = sum / validCount;
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
    if (!this.processedData || !this.headers || this.headers.length === 0) {
      throw new Error('No data or headers available');
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
      const headerLine = this.headers.join(',');
      csvLines.push(headerLine);

      // Add data rows
      this.processedData.forEach(row => {
        const dataLine = row.join(',');
        csvLines.push(dataLine);
      });

      // Save selected columns to file
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
    
    if (!this.fileName) return `csv_${timestamp}.csv`;

    // Garder le nom original avec les accents
    const baseName = path.basename(this.fileName, '.csv');
    // Remplacer seulement les caractères vraiment problématiques pour les noms de fichiers
    const safeName = baseName
      .replace(/[<>:"/\\|?*]/g, '_') // Remplacer les caractères interdits par des underscores
      .replace(/\s+/g, '_'); // Remplacer les espaces par des underscores
    
    return `${safeName}_${timestamp}.csv`;
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

    const { hasHeader, delimiter, selectedColumns } = req.body;
    const fileBuffer = req.file.buffer;
    let fileName = req.file.originalname;

    // Corriger l'encodage du nom de fichier si nécessaire
    try {
      // Essayer de décoder le nom de fichier en UTF-8
      fileName = Buffer.from(fileName, 'latin1').toString('utf8');
    } catch (error) {
      console.log('Could not decode filename, using original:', fileName);
    }

    console.log('Upload request:', { hasHeader, delimiter, selectedColumns, fileName });
    console.log('Original filename buffer:', req.file.originalname);
    console.log('Decoded filename:', fileName);

    // Process the CSV file
    const result = await csvService.processCSVUpload(
      fileBuffer.toString('utf-8'),
      {
        hasHeader: hasHeader === 'true',
        delimiter: delimiter || ',',
        fileName,
        selectedColumns: selectedColumns
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

// Route to list available CSV files
app.get('/api/csv/files', async (req, res) => {
  try {
    const dataDir = path.join(__dirname, 'data', 'processed');
    if (!fs.existsSync(dataDir)) {
      return res.json({
        success: true,
        files: []
      });
    }

    const files = fs.readdirSync(dataDir)
      .filter(file => file.endsWith('.csv'))
      .map(file => {
        const filePath = path.join(dataDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: stats.size,
          modified: stats.mtime,
          path: filePath
        };
      })
      .sort((a, b) => b.modified - a.modified); // Most recent first

    res.json({
      success: true,
      files: files
    });
  } catch (error) {
    console.error('Error listing CSV files:', error);
    res.status(500).json({
      success: false,
      message: 'Error listing CSV files',
      error: error.message
    });
  }
});

// Route to load a specific CSV file
app.get('/api/csv/files/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const dataDir = path.join(__dirname, 'data', 'processed');
    const filePath = path.join(dataDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    console.log('Reading file:', filePath)
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      console.log('Empty file detected')
      return res.status(400).json({
        success: false,
        message: 'Empty file'
      });
    }

    console.log('Parsing CSV content, total lines:', lines.length)
    
    // Parse CSV content with better handling
    const csvService = new CSVService();
    const headers = csvService.parseCSVLine(lines[0], ',');
    console.log('Headers parsed:', headers)
    
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const row = csvService.parseCSVLine(lines[i], ',');
      if (row.length === headers.length) {
        data.push(row);
      }
    }
    
    console.log('Data parsed successfully, rows:', data.length)

    res.json({
      success: true,
      data: {
        filename: filename,
        headers: headers,
        data: data,
        totalRows: data.length,
        totalColumns: headers.length
      }
    });
  } catch (error) {
    console.error('Error loading CSV file:', error);
    res.status(500).json({
      success: false,
      message: 'Error loading CSV file',
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
module.exports = app; 