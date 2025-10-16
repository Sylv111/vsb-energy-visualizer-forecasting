class SSEService {
  constructor() {
    this.eventSource = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // 1 seconde
    this.isConnected = false;
    this.connectionPromise = null;
    this._heartbeatAttached = false;
  }

  /**
   * Parser les données d'événement SSE de manière sécurisée
   * @param {string} data - Données brutes de l'événement
   * @returns {Object|null} - Données parsées ou null si erreur
   */
  parseEventData(data) {
    if (!data || data === 'undefined' || data.trim() === '') {
      console.warn('SSE: Empty or undefined data received');
      return null;
    }

    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('SSE: Failed to parse event data:', data, error);
      return {
        error: 'Invalid JSON data',
        rawData: data
      };
    }
  }

  /**
   * Se connecter au serveur SSE
   * @param {string} fileName - Nom du fichier pour filtrer les événements (optionnel)
   * @returns {Promise} - Promesse qui se résout quand la connexion est établie
   */
  connect(fileName = null) {
    if (this.eventSource && this.eventSource.readyState !== EventSource.CLOSED) {
      // already connected
      // Attach heartbeat listener if not yet attached
      if (!this._heartbeatAttached) {
        this.eventSource.addEventListener('heartbeat', (event) => {
          try {
            const data = this.parseEventData(event.data);
            console.log('SSE: Heartbeat received:', data);
            this.emit('heartbeat', data);
          } catch (e) {
            console.warn('SSE: Heartbeat parse error:', e);
          }
        });
        this._heartbeatAttached = true;
      }
      return Promise.resolve();
    }

    // Se connecter directement au backend sans passer par le proxy
    // car le proxy webpack-dev-server ne gère pas bien SSE
    const baseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000';
    const url = fileName 
      ? `${baseUrl}/api/sse?fileName=${encodeURIComponent(fileName)}`
      : `${baseUrl}/api/sse`;

    // connecting to SSE
    
    // Utiliser withCredentials pour refléter Access-Control-Allow-Credentials côté serveur
    this.eventSource = new EventSource(url, { withCredentials: true });
    this.isConnected = false;
    
    // Créer une promesse pour la connexion
    this.connectionPromise = new Promise((resolve, reject) => {
      this.connectionResolve = resolve;
      this.connectionReject = reject;
      
      // Auto-resolve after timeout if no connected event
      setTimeout(() => {
        if (this.connectionResolve) {
          console.log('SSE: Connection timeout, resolving anyway');
          this.connectionResolve();
          this.connectionResolve = null;
        }
      }, 2000);
    });

    // Log de l'état de connexion
    this.eventSource.onopen = () => {
      // connection opened
    };

    // Écouter les événements nommés spécifiques
    this.eventSource.addEventListener('connected', (event) => {
      // connected event received
      const data = this.parseEventData(event.data);
      if (data) {
        // connected successfully
        this.reconnectAttempts = 0;
        this.isConnected = true;
        this.emit('connected', data);
        // Résoudre la promesse de connexion
        if (this.connectionResolve) {
          this.connectionResolve();
          this.connectionResolve = null;
        }
      }
    });

    this.eventSource.addEventListener('progress', (event) => {
      const data = this.parseEventData(event.data);
      if (data) {
        this.emit('progress', data);
      }
    });

    this.eventSource.addEventListener('completed', (event) => {
      const data = this.parseEventData(event.data);
      if (data) {
        this.emit('completed', data);
      }
    });

    // Événement heartbeat de test (hello world toutes les 2s)
    this.eventSource.addEventListener('heartbeat', (event) => {
      try {
        const data = this.parseEventData(event.data);
        // heartbeat received
        this.emit('heartbeat', data);
      } catch (e) {
        // heartbeat parse error
      }
    });
    this._heartbeatAttached = true;

    this.eventSource.addEventListener('training_error', (event) => {
      const data = this.parseEventData(event.data);
      if (data) {
        this.emit('error', data);
      }
    });

    this.eventSource.addEventListener('stats', (event) => {
      const data = this.parseEventData(event.data);
      if (data) {
        this.emit('stats', data);
      }
    });

    // Listener général pour les événements sans nom
    this.eventSource.onmessage = () => {
    };

    // Gestion des erreurs de connexion
    this.eventSource.onerror = (error) => {
      console.error('SSE: Connection error');
      
      if (this.eventSource.readyState === EventSource.CLOSED) {
        return;
      }
      
      this.emit('connection_error', { type: 'connection', error });
      
      // Tentative de reconnexion automatique
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        
        setTimeout(() => {
          this.disconnect();
          this.connect(fileName);
        }, this.reconnectDelay);
      } else {
        console.error('❌ SSE: Max reconnection attempts reached');
        this.emit('maxReconnectAttemptsReached');
      }
    };
    
    return this.connectionPromise;
  }

  /**
   * Se déconnecter du serveur SSE
   */
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  /**
   * Ajouter un écouteur d'événement
   * @param {string} event - Nom de l'événement
   * @param {Function} callback - Fonction de callback
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Supprimer un écouteur d'événement
   * @param {string} event - Nom de l'événement
   * @param {Function} callback - Fonction de callback
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Émettre un événement
   * @param {string} event - Nom de l'événement
   * @param {*} data - Données à émettre
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ SSE: Error in event listener for '${event}':`, error);
        }
      });
    }
  }

  /**
   * Vérifier si la connexion est active
   * @returns {boolean}
   */
  isConnected() {
    return this.eventSource && this.eventSource.readyState === EventSource.OPEN;
  }

  /**
   * Obtenir l'état de la connexion
   * @returns {string}
   */
  getConnectionState() {
    if (!this.eventSource) return 'CLOSED';
    
    switch (this.eventSource.readyState) {
      case EventSource.CONNECTING: return 'CONNECTING';
      case EventSource.OPEN: return 'OPEN';
      case EventSource.CLOSED: return 'CLOSED';
      default: return 'UNKNOWN';
    }
  }
}

// Instance singleton
const sseService = new SSEService();

export default sseService;
