const pythonExecutor = require('../services/pythonExecutor');
const path = require('path');

class AIController {
  async runPrediction(req, res) {
    try {
      const {
        csvFile,
        aiModel,
        xColumn,
        yColumn,
        nPredictions,
        epochs,
        batchSize,
        learningRate,
        seqLength,
        filters,
        kernelSize,
        dropout,
        l2Reg,
        verbose
      } = req.body;

      if (!csvFile || !xColumn || !yColumn || !nPredictions) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters: csvFile, xColumn, yColumn, nPredictions'
        });
      }

      if (aiModel !== 'convlstm') {
        return res.status(400).json({
          success: false,
          error: 'Only ConvLSTM model is currently supported'
        });
      }

      const csvFilePath = path.join(__dirname, '../uploads', csvFile);

      console.log('🎯 Démarrage de la prédiction IA:', {
        csvFile: csvFilePath,
        xColumn,
        yColumn,
        nPredictions,
        epochs,
        batchSize,
        learningRate
      });

      const result = await pythonExecutor.runConvLSTMPrediction({
        csvFile: csvFilePath,
        xColumn,
        yColumn,
        nPredictions: parseInt(nPredictions),
        epochs: parseInt(epochs) || 200,
        batchSize: parseInt(batchSize) || 32,
        learningRate: parseFloat(learningRate) || 0.001,
        seqLength: parseInt(seqLength) || 48,
        filters: parseInt(filters) || 64,
        kernelSize: parseInt(kernelSize) || 3,
        dropout: parseFloat(dropout) || 0.2,
        l2Reg: parseFloat(l2Reg) || 0.001,
        verbose: parseInt(verbose) || 1
      });

      res.json({
        success: true,
        message: 'Prediction completed successfully',
        data: {
          model: aiModel,
          inputFile: csvFile,
          outputFile: result.result.outputFile,
          predictions: result.result.predictions,
          performance: {
            trainingMAE: result.result.trainingMAE,
            validationMAE: result.result.validationMAE,
            trainingRMSE: result.result.trainingRMSE,
            validationRMSE: result.result.validationRMSE
          },
          parameters: {
            xColumn,
            yColumn,
            nPredictions,
            epochs,
            batchSize,
            learningRate
          }
        }
      });

    } catch (error) {
      console.error('❌ Erreur lors de la prédiction IA:', error);
      
      res.status(500).json({
        success: false,
        error: 'Prediction failed',
        details: error.message || error.error || 'Unknown error',
        type: error.type || 'execution_error'
      });
    }
  }

  async testConnection(req, res) {
    try {
      const isPythonAvailable = await pythonExecutor.testPythonConnection();
      
      if (isPythonAvailable) {
        res.json({
          success: true,
          message: 'Python connection successful',
          pythonAvailable: true
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Python not available or not in PATH',
          pythonAvailable: false
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to test Python connection',
        details: error.message
      });
    }
  }


  async getAvailableModels(req, res) {
    res.json({
      success: true,
      models: [
        {
          id: 'convlstm',
          name: 'ConvLSTM',
          description: 'Convolutional LSTM for time series prediction',
          parameters: {
            epochs: { type: 'number', default: 200, min: 10, max: 1000 },
            batchSize: { type: 'number', default: 32, min: 8, max: 128 },
            learningRate: { type: 'number', default: 0.001, min: 0.0001, max: 0.1 }
          }
        }
      ]
    });
  }
}

module.exports = new AIController();
