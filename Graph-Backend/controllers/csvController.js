const CSVService = require('../services/csvService');

class CSVController {
  constructor() {
    this.csvService = new CSVService();
  }

  async uploadCSV(req, res) {
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

      // Fix filename encoding if necessary
      try {
        // Try to decode filename in UTF-8
        fileName = Buffer.from(fileName, 'latin1').toString('utf8');
      } catch (error) {
        // Could not decode filename, using original
      }

      // Process the CSV file
      const result = await this.csvService.processCSVUpload(
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
  }

  async getProcessedData(req, res) {
    try {
      const data = this.csvService.getProcessedData();
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
  }

  async listCSVFiles(req, res) {
    try {
      const files = await this.csvService.listCSVFiles();
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
  }

  async loadCSVFile(req, res) {
    try {
      const filename = req.params.filename;
      const data = await this.csvService.loadCSVFile(filename);
      
      res.json({
        success: true,
        data: data
      });
    } catch (error) {
      console.error('Error loading CSV file:', error);
      if (error.message === 'File not found') {
        res.status(404).json({
          success: false,
          message: 'File not found'
        });
      } else if (error.message === 'Empty file') {
        res.status(400).json({
          success: false,
          message: 'Empty file'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error loading CSV file',
          error: error.message
        });
      }
    }
  }
}

module.exports = CSVController;

