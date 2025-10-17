class SSEService {
  constructor() {
    this.eventSource = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // 1 seconde
    this.isConnected = false;
    this.connectionPromise = null;
  }

  /**
   * Parse SSE event data securely
   * @param {string} data - Raw event data
   * @returns {Object|null} - Parsed data or null if error
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
   * Connect to SSE server
   * @param {string} fileName - File name to filter events (optional)
   * @returns {Promise} - Promise that resolves when connection is established
   */
  connect(fileName = null) {
    if (this.eventSource && this.eventSource.readyState !== EventSource.CLOSED) {
      // already connected
      return Promise.resolve();
    }

    // Connect directly to backend without going through proxy
    // because webpack-dev-server proxy doesn't handle SSE well
    const baseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000';
    const url = fileName 
      ? `${baseUrl}/api/sse?fileName=${encodeURIComponent(fileName)}`
      : `${baseUrl}/api/sse`;

    // connecting to SSE
    
    // Use withCredentials to reflect Access-Control-Allow-Credentials on server side
    this.eventSource = new EventSource(url, { withCredentials: true });
    this.isConnected = false;
    
    // Create promise for connection
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

    // Log connection state
    this.eventSource.onopen = () => {
      // connection opened
    };

    // Listen for specific named events
    this.eventSource.addEventListener('connected', (event) => {
      // connected event received
      const data = this.parseEventData(event.data);
      if (data) {
        // connected successfully
        this.reconnectAttempts = 0;
        this.isConnected = true;
        this.emit('connected', data);
        // Resolve connection promise
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

    // General listener for unnamed events
    this.eventSource.onmessage = () => {
    };

    // Connection error handling
    this.eventSource.onerror = (error) => {
      console.error('SSE: Connection error');
      
      if (this.eventSource.readyState === EventSource.CLOSED) {
        return;
      }
      
      this.emit('connection_error', { type: 'connection', error });
      
      // Automatic reconnection attempt
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
   * Disconnect from SSE server
   */
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
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
   * Emit an event
   * @param {string} event - Event name
   * @param {*} data - Data to emit
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
   * Check if connection is active
   * @returns {boolean}
   */
  isConnected() {
    return this.eventSource && this.eventSource.readyState === EventSource.OPEN;
  }

  /**
   * Get connection state
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
