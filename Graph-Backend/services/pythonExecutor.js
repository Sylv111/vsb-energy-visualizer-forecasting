const { spawn } = require('child_process');
const path = require('path');

class PythonExecutor {
  constructor() {
    this.pythonPath = 'python'; 
    this.scriptPath = path.join(__dirname, '../../ai-prediction/forecast_convlstm.py');
    this.emitProgress = null;
  }
  
  /**
   * Set progress callback function
   * @param {Function} callback - Function to call with progress updates
   */
  setProgressCallback(callback) {
    this.emitProgress = callback;
  }

  /**
   * @param {Object} params - Paramètres de prédiction
   * @param {string} params.csvFile - Chemin vers le fichier CSV
   * @param {string} params.xColumn - Nom de la colonne X
   * @param {string} params.yColumn - Nom de la colonne Y
   * @param {number} params.nPredictions - Nombre de prédictions
   * @param {number} params.epochs - Nombre d'époques (optionnel)
   * @param {number} params.batchSize - Taille du batch (optionnel)
   * @param {number} params.learningRate - Taux d'apprentissage (optionnel)
   * @param {number} params.seqLength - Longueur de séquence (optionnel)
   * @param {number} params.filters - Nombre de filtres (optionnel)
   * @param {number} params.kernelSize - Taille du kernel (optionnel)
   * @param {number} params.dropout - Taux de dropout (optionnel)
   * @param {number} params.l2Reg - Régularisation L2 (optionnel)
   * @param {number} params.verbose - Niveau de verbosité (optionnel)
   * @returns {Promise<Object>} - Résultat de la prédiction
   */
  async runConvLSTMPrediction(params) {
    return new Promise((resolve, reject) => {
      const {
        csvFile,
        xColumn,
        yColumn,
        nPredictions,
        epochs = 200,
        batchSize = 32,
        learningRate = 0.001,
        seqLength = 48,
        filters = 64,
        kernelSize = 3,
        dropout = 0.2,
        l2Reg = 0.001,
        verbose = 1,
        startIndex = -1
      } = params;

      const args = [
        this.scriptPath,
        '--file', csvFile,
        '--x', xColumn,
        '--y', yColumn,
        '--n', nPredictions.toString(),
        '--start_index', startIndex.toString(),
        '--epochs', epochs.toString(),
        '--batch_size', batchSize.toString(),
        '--learning_rate', learningRate.toString(),
        '--seq_length', seqLength.toString(),
        '--filters', filters.toString(),
        '--kernel_size', kernelSize.toString(),
        '--dropout', dropout.toString(),
        '--l2_reg', l2Reg.toString(),
        '--verbose', verbose.toString()
      ];

      console.log('Exécution du script Python avec les paramètres:', {
        script: this.scriptPath,
        args: args
      });

      const pythonProcess = spawn(this.pythonPath, args, {
        cwd: path.join(__dirname, '../../ai-prediction'),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        console.log('Python stdout:', output.trim());
      });

      pythonProcess.stderr.on('data', (data) => {
        const error = data.toString();
        stderr += error;
        
        // Parse progress messages
        const progressMatch = error.match(/PROGRESS: (\d+)% \(Epoch (\d+)\/(\d+)\)/);
        if (progressMatch) {
          const progress = parseInt(progressMatch[1]);
          const currentEpoch = parseInt(progressMatch[2]);
          const totalEpochs = parseInt(progressMatch[3]);
          
          console.log(`📊 Training Progress: ${progress}% (Epoch ${currentEpoch}/${totalEpochs})`);
          
          // Emit progress event via callback
          if (this.emitProgress) {
            console.log('📡 Emitting progress via callback');
            this.emitProgress({
              progress,
              currentEpoch,
              totalEpochs,
              fileName: csvFile
            });
          } else {
            console.warn('⚠️ No progress callback set!');
          }
        } else {
          console.log('Python stderr:', error.trim());
        }
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          // Succès
          const result = this.parsePythonOutput(stdout);
          resolve({
            success: true,
            code: code,
            output: stdout,
            result: result
          });
        } else {
          // Erreur
          reject({
            success: false,
            code: code,
            error: stderr,
            output: stdout
          });
        }
      });

      pythonProcess.on('error', (error) => {
        reject({
          success: false,
          error: error.message,
          type: 'process_error'
        });
      });

      setTimeout(() => {
        pythonProcess.kill();
        reject({
          success: false,
          error: 'Process timeout after 5 minutes',
          type: 'timeout'
        });
      }, 1000000);
    });
  }

  /**
   * @param {string} output
   * @returns {Object}
   */
  parsePythonOutput(output) {
    const result = {
      trainingMAE: null,
      validationMAE: null,
      trainingRMSE: null,
      validationRMSE: null,
      outputFile: null,
      predictions: null
    };

    const maeMatch = output.match(/Training MAE: ([\d.]+)%/);
    if (maeMatch) result.trainingMAE = parseFloat(maeMatch[1]);

    const valMaeMatch = output.match(/Validation MAE: ([\d.]+)%/);
    if (valMaeMatch) result.validationMAE = parseFloat(valMaeMatch[1]);

    const rmseMatch = output.match(/Training RMSE: ([\d.]+)%/);
    if (rmseMatch) result.trainingRMSE = parseFloat(rmseMatch[1]);

    const valRmseMatch = output.match(/Validation RMSE: ([\d.]+)%/);
    if (valRmseMatch) result.validationRMSE = parseFloat(valRmseMatch[1]);

    const fileMatch = output.match(/Saved predictions to: (.+)/);
    if (fileMatch) result.outputFile = fileMatch[1];

    const predMatch = output.match(/Generated (\d+) predictions/);
    if (predMatch) result.predictions = parseInt(predMatch[1]);

    return result;
  }

  /**
   * @returns {Promise<boolean>}
   */
  async testPythonConnection() {
    return new Promise((resolve) => {
      const testProcess = spawn(this.pythonPath, ['--version']);
      
      testProcess.on('close', (code) => {
        resolve(code === 0);
      });
      
      testProcess.on('error', () => {
        resolve(false);
      });
    });
  }
}

module.exports = new PythonExecutor();
