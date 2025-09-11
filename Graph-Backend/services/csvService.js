const path = require('path');
const fs = require('fs');

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
      const dataDir = path.join(__dirname, '..', 'data', 'processed');
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

      return filePath;

    } catch (error) {
      console.error('Error saving selected columns:', error);
      throw new Error(`Failed to save CSV: ${error.message}`);
    }
  }

  getSavedFileName() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    
    if (!this.fileName) return `csv_${timestamp}.csv`;

    // Keep original name with accents
    const baseName = path.basename(this.fileName, '.csv');
    // Replace only problematic characters for file names
    const safeName = baseName
      .replace(/[<>:"/\\|?*]/g, '_') // Replace forbidden characters with underscores
      .replace(/\s+/g, '_'); // Replace spaces with underscores
    
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

  async loadCSVFile(filename) {
    try {
      const dataDir = path.join(__dirname, '..', 'data', 'processed');
      const filePath = path.join(dataDir, filename);

      if (!fs.existsSync(filePath)) {
        throw new Error('File not found');
      }

      const fileContent = fs.readFileSync(filePath, 'utf8');
      const lines = fileContent.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        throw new Error('Empty file');
      }
      
      // Parse CSV content with better handling
      const headers = this.parseCSVLine(lines[0], ',');
      
      const data = [];
      for (let i = 1; i < lines.length; i++) {
        const row = this.parseCSVLine(lines[i], ',');
        if (row.length === headers.length) {
          data.push(row);
        }
      }

      return {
        filename: filename,
        headers: headers,
        data: data,
        totalRows: data.length,
        totalColumns: headers.length
      };
    } catch (error) {
      console.error('Error loading CSV file:', error);
      throw error;
    }
  }

  async listCSVFiles() {
    try {
      const dataDir = path.join(__dirname, '..', 'data', 'processed');
      if (!fs.existsSync(dataDir)) {
        return [];
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

      return files;
    } catch (error) {
      console.error('Error listing CSV files:', error);
      throw error;
    }
  }
}

module.exports = CSVService;

