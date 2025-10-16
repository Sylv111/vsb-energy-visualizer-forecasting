const EventEmitter = require('events');

class SSEService extends EventEmitter {
  constructor() {
    super();
    this.clients = new Map(); // Map pour stocker les connexions SSE
    this.nextClientId = 1;
  }

  /**
   * Ajouter un nouveau client SSE
   * @param {Object} res - Response object Express
   * @param {string} fileName - Nom du fichier pour filtrer les événements
   * @returns {number} - ID du client
   */
  addClient(req, res, fileName = null) {
    const clientId = this.nextClientId++;
    
    // Configuration des headers SSE
    const origin = req.headers.origin || '*';
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true'
    });

    // Flush headers immediately to start the stream
    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders();
    }

    // Send an initial comment to ensure the connection stays open
    try {
      res.write(`: connected\n\n`);
    } catch (e) {
      console.error('SSE: Failed to write initial keep-alive comment:', e);
    }

    // Stocker la connexion d'abord
    this.clients.set(clientId, {
      response: res,
      fileName: fileName,
      connected: true
    });


    // Envoyer un message de connexion après un petit délai pour s'assurer que la connexion est établie
    setTimeout(() => {
      this.sendToClient(clientId, 'connected', { 
        message: 'SSE connection established',
        clientId: clientId,
        timestamp: new Date().toISOString()
      });
    }, 100);

    // Gérer la déconnexion
    res.on('close', () => {
      this.removeClient(clientId);
    });

    return clientId;
  }

  /**
   * Supprimer un client
   * @param {number} clientId - ID du client
   */
  removeClient(clientId) {
    const client = this.clients.get(clientId);
    if (client) {
      client.connected = false;
      this.clients.delete(clientId);
    }
  }

  /**
   * Envoyer un message à un client spécifique
   * @param {number} clientId - ID du client
   * @param {string} event - Type d'événement
   * @param {Object} data - Données à envoyer
   */
  sendToClient(clientId, event, data) {
    const client = this.clients.get(clientId);
    if (client && client.connected) {
      try {
        // S'assurer que data n'est pas undefined
    const safeData = data || {};
    const message = `event: ${event}\ndata: ${JSON.stringify(safeData)}\n\n`;
        client.response.write(message);
      } catch (error) {
        console.error(`Error sending SSE to client ${clientId}:`, error);
        this.removeClient(clientId);
      }
    }
  }

  /**
   * Envoyer un message à tous les clients
   * @param {string} event - Type d'événement
   * @param {Object} data - Données à envoyer
   * @param {string} fileName - Filtrer par nom de fichier (optionnel)
   */
  broadcast(event, data, fileName = null) {
    
    // S'assurer que data n'est pas undefined
    const safeData = data || {};
    
    this.clients.forEach((client, clientId) => {
      // Si un fileName est spécifié pour l'événement, filtrer:
      // - Envoyer aux clients qui ont le même fileName
      // - Envoyer aux clients qui n'ont pas de fileName (ils reçoivent tout)
      if (fileName && client.fileName && client.fileName !== fileName && client.fileName !== 'all') {
        return;
      }
      
      this.sendToClient(clientId, event, safeData);
    });
  }

  /**
   * Envoyer une progression de training
   * @param {Object} progressData - Données de progression
   */
  sendProgress(progressData) {
    this.broadcast('progress', {
      fileName: progressData.fileName,
      progress: progressData.progress,
      currentEpoch: progressData.currentEpoch,
      totalEpochs: progressData.totalEpochs,
      timestamp: new Date().toISOString()
    }, progressData.fileName);
  }

  /**
   * Envoyer une notification de completion
   * @param {Object} completionData - Données de completion
   */
  sendCompleted(completionData) {
    this.broadcast('completed', {
      fileName: completionData.fileName,
      message: 'Training completed successfully',
      timestamp: new Date().toISOString()
    }, completionData.fileName);
  }

  /**
   * Envoyer une notification d'erreur
   * @param {Object} errorData - Données d'erreur
   */
  sendError(errorData) {
    this.broadcast('error', {
      fileName: errorData.fileName,
      error: errorData.error,
      timestamp: new Date().toISOString()
    }, errorData.fileName);
  }

  /**
   * Obtenir le nombre de clients connectés
   * @returns {number}
   */
  getClientCount() {
    return this.clients.size;
  }

  /**
   * Obtenir les statistiques des connexions
   * @returns {Object}
   */
  getStats() {
    const stats = {
      totalClients: this.clients.size,
      clientsByFile: {}
    };

    this.clients.forEach((client, clientId) => {
      const fileName = client.fileName || 'all';
      if (!stats.clientsByFile[fileName]) {
        stats.clientsByFile[fileName] = 0;
      }
      stats.clientsByFile[fileName]++;
    });

    return stats;
  }
}

// Instance singleton
const sseService = new SSEService();

module.exports = sseService;
