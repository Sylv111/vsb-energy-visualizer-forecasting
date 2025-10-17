const EventEmitter = require('events');

class SSEService extends EventEmitter {
  constructor() {
    super();
    this.clients = new Map(); // Map to store SSE connections
    this.nextClientId = 1;
  }

  /**
   * Add a new SSE client
   * @param {Object} res - Response object Express
   * @param {string} fileName - File name to filter events
   * @returns {number} - Client ID
   */
  addClient(req, res, fileName = null) {
    const clientId = this.nextClientId++;
    
    // SSE headers configuration
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

    // Store the connection first
    this.clients.set(clientId, {
      response: res,
      fileName: fileName,
      connected: true
    });


    // Send a connection message after a small delay to ensure the connection is established
    setTimeout(() => {
      this.sendToClient(clientId, 'connected', { 
        message: 'SSE connection established',
        clientId: clientId,
        timestamp: new Date().toISOString()
      });
    }, 100);

    // Handle disconnection
    res.on('close', () => {
      this.removeClient(clientId);
    });

    return clientId;
  }

  /**
   * Remove a client
   * @param {number} clientId - Client ID
   */
  removeClient(clientId) {
    const client = this.clients.get(clientId);
    if (client) {
      client.connected = false;
      this.clients.delete(clientId);
    }
  }

  /**
   * Send a message to a specific client
   * @param {number} clientId - Client ID
   * @param {string} event - Event type
   * @param {Object} data - Data to send
   */
  sendToClient(clientId, event, data) {
    const client = this.clients.get(clientId);
    if (client && client.connected) {
      try {
        // Ensure data is not undefined
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
   * Send a message to all clients
   * @param {string} event - Event type
   * @param {Object} data - Data to send
   * @param {string} fileName - Filter by file name (optional)
   */
  broadcast(event, data, fileName = null) {
    
    const safeData = data || {};
    
    this.clients.forEach((client, clientId) => {
      // If a fileName is specified for the event, filter:
      // - Send to clients that have the same fileName
      // - Send to clients that don't have a fileName (they receive everything)
      if (fileName && client.fileName && client.fileName !== fileName && client.fileName !== 'all') {
        return;
      }
      
      this.sendToClient(clientId, event, safeData);
    });
  }

  /**
   * Send training progress
   * @param {Object} progressData - Progress data
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
   * Send completion notification
   * @param {Object} completionData - Completion data
   */
  sendCompleted(completionData) {
    this.broadcast('completed', {
      fileName: completionData.fileName,
      message: 'Training completed successfully',
      timestamp: new Date().toISOString()
    }, completionData.fileName);
  }

  /**
   * Send error notification
   * @param {Object} errorData - Error data
   */
  sendError(errorData) {
    this.broadcast('error', {
      fileName: errorData.fileName,
      error: errorData.error,
      timestamp: new Date().toISOString()
    }, errorData.fileName);
  }

  /**
   * Get number of connected clients
   * @returns {number}
   */
  getClientCount() {
    return this.clients.size;
  }

  /**
   * Get connection statistics
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
