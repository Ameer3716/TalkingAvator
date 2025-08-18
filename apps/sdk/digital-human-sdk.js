// digital-human-sdk.js
// Universal SDK for Digital Human Integration
// Supports: MERN, MEAN, Flutter (via WebView/API), React Native, and other frameworks

class DigitalHumanSDK {
    constructor(config = {}) {
      this.config = {
        backendUrl: config.backendUrl || 'http://localhost:3000',
        frontendUrl: config.frontendUrl || 'http://localhost:5173',
        apiKey: config.apiKey || null,
        language: config.language || 'auto',
        voice: config.voice || 'default',
        model: config.model || 'gpt-3.5-turbo',
        debug: config.debug || false,
        timeout: config.timeout || 30000,
        retryAttempts: config.retryAttempts || 3,
        ...config
      };
  
      this.ws = null;
      this.eventListeners = {};
      this.messageQueue = [];
      this.isConnected = false;
      this.recordingState = null;
      this.sessionId = this.generateSessionId();
    }
  
    // ==================== CORE INITIALIZATION ====================
  
    /**
     * Initialize the SDK and establish connections
     * @returns {Promise<boolean>}
     */
    async initialize() {
      try {
        this.log('Initializing Digital Human SDK...');
        
        // Validate backend connection
        const health = await this.checkHealth();
        if (!health.status === 'healthy') {
          throw new Error('Backend service is not healthy');
        }
  
        // Setup WebSocket for real-time communication (optional)
        if (this.config.enableWebSocket) {
          await this.setupWebSocket();
        }
  
        // Initialize audio context if in browser
        if (this.isBrowser()) {
          await this.initializeAudioContext();
        }
  
        this.isConnected = true;
        this.emit('initialized', { sessionId: this.sessionId });
        this.log('SDK initialized successfully');
        return true;
  
      } catch (error) {
        this.handleError('Initialization failed', error);
        return false;
      }
    }
  
    // ==================== TEXT INTERACTION ====================
  
    /**
     * Send text message and receive AI response with lip-sync data
     * @param {string} message - User's text message
     * @param {Object} options - Additional options
     * @returns {Promise<Object>}
     */
    async sendTextMessage(message, options = {}) {
      try {
        this.log(`Sending text message: ${message}`);
        
        const response = await this.apiCall('/tts', {
          method: 'POST',
          body: JSON.stringify({
            message,
            language: options.language || this.config.language,
            emotion: options.emotion,
            voice: options.voice || this.config.voice,
            sessionId: this.sessionId
          })
        });
  
        const result = {
          messages: response.messages,
          language: response.language,
          timestamp: new Date().toISOString(),
          sessionId: this.sessionId
        };
  
        this.emit('textResponse', result);
        return result;
  
      } catch (error) {
        this.handleError('Failed to send text message', error);
        throw error;
      }
    }
  
    // ==================== VOICE INTERACTION ====================
  
    /**
     * Start voice recording
     * @param {Object} options - Recording options
     * @returns {Promise<boolean>}
     */
    async startRecording(options = {}) {
      try {
        if (this.recordingState?.isRecording) {
          this.log('Already recording');
          return false;
        }
  
        this.log('Starting voice recording...');
        
        // Browser-based recording
        if (this.isBrowser()) {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              sampleRate: 16000
            }
          });
  
          const mediaRecorder = new MediaRecorder(stream, {
            mimeType: this.getSupportedMimeType()
          });
  
          const audioChunks = [];
          
          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              audioChunks.push(event.data);
              this.emit('audioChunk', { size: event.data.size });
            }
          };
  
          mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { 
              type: this.getSupportedMimeType() 
            });
            await this.processAudioRecording(audioBlob);
          };
  
          mediaRecorder.start(100); // Collect data every 100ms
          
          this.recordingState = {
            isRecording: true,
            mediaRecorder,
            stream,
            startTime: Date.now()
          };
  
          this.emit('recordingStarted', { timestamp: new Date().toISOString() });
          return true;
        }
  
        // Mobile platform recording (React Native / Flutter)
        if (this.isMobile()) {
          // Emit event for native implementation
          this.emit('startNativeRecording', options);
          this.recordingState = { isRecording: true, startTime: Date.now() };
          return true;
        }
  
        return false;
  
      } catch (error) {
        this.handleError('Failed to start recording', error);
        return false;
      }
    }
  
    /**
     * Stop voice recording
     * @returns {Promise<boolean>}
     */
    async stopRecording() {
      try {
        if (!this.recordingState?.isRecording) {
          this.log('Not currently recording');
          return false;
        }
  
        this.log('Stopping voice recording...');
  
        if (this.isBrowser() && this.recordingState.mediaRecorder) {
          this.recordingState.mediaRecorder.stop();
          this.recordingState.stream.getTracks().forEach(track => track.stop());
        }
  
        if (this.isMobile()) {
          this.emit('stopNativeRecording');
        }
  
        const duration = Date.now() - this.recordingState.startTime;
        this.recordingState = null;
  
        this.emit('recordingStopped', { duration });
        return true;
  
      } catch (error) {
        this.handleError('Failed to stop recording', error);
        return false;
      }
    }
  
    /**
     * Process recorded audio and get transcription + response
     * @param {Blob|Buffer|string} audioData - Audio data
     * @returns {Promise<Object>}
     */
    async processAudioRecording(audioData) {
      try {
        this.log('Processing audio recording...');
        
        let base64Audio;
        
        // Convert audio to base64 based on input type
        if (audioData instanceof Blob) {
          base64Audio = await this.blobToBase64(audioData);
        } else if (Buffer.isBuffer(audioData)) {
          base64Audio = audioData.toString('base64');
        } else if (typeof audioData === 'string') {
          base64Audio = audioData; // Assume already base64
        } else {
          throw new Error('Invalid audio data format');
        }
  
        const response = await this.apiCall('/sts', {
          method: 'POST',
          body: JSON.stringify({
            audio: base64Audio,
            mimeType: this.getSupportedMimeType(),
            language: this.config.language,
            sessionId: this.sessionId
          })
        });
  
        const result = {
          transcription: response.transcription,
          messages: response.messages,
          language: response.language,
          timestamp: new Date().toISOString(),
          sessionId: this.sessionId
        };
  
        this.emit('voiceResponse', result);
        return result;
  
      } catch (error) {
        this.handleError('Failed to process audio', error);
        throw error;
      }
    }
  
    // ==================== AVATAR CONTROL ====================
  
    /**
     * Update avatar animation
     * @param {string} animation - Animation name
     * @returns {Promise<void>}
     */
    async setAnimation(animation) {
      this.emit('setAnimation', { animation });
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ 
          type: 'animation', 
          animation,
          sessionId: this.sessionId 
        }));
      }
    }
  
    /**
     * Update avatar facial expression
     * @param {string} expression - Expression name
     * @param {number} intensity - Expression intensity (0-1)
     * @returns {Promise<void>}
     */
    async setFacialExpression(expression, intensity = 1.0) {
      this.emit('setExpression', { expression, intensity });
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ 
          type: 'expression', 
          expression, 
          intensity,
          sessionId: this.sessionId 
        }));
      }
    }
  
    /**
     * Play lip-sync animation
     * @param {Object} lipsyncData - Lip-sync data from backend
     * @returns {Promise<void>}
     */
    async playLipSync(lipsyncData) {
      this.emit('playLipSync', lipsyncData);
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ 
          type: 'lipsync', 
          data: lipsyncData,
          sessionId: this.sessionId 
        }));
      }
    }
  
    // ==================== CONFIGURATION ====================
  
    /**
     * Update SDK configuration
     * @param {Object} newConfig - New configuration values
     */
    updateConfig(newConfig) {
      this.config = { ...this.config, ...newConfig };
      this.emit('configUpdated', this.config);
    }
  
    /**
     * Get available voices
     * @returns {Promise<Array>}
     */
    async getVoices() {
      try {
        const response = await this.apiCall('/voices');
        return response.voices || [];
      } catch (error) {
        this.handleError('Failed to get voices', error);
        return [];
      }
    }
  
    /**
     * Get supported languages
     * @returns {Promise<Object>}
     */
    async getLanguages() {
      try {
        const response = await this.apiCall('/languages');
        return response.supportedLanguages || {};
      } catch (error) {
        this.handleError('Failed to get languages', error);
        return {};
      }
    }
  
    /**
     * Get available animations
     * @returns {Array}
     */
    getAnimations() {
      return [
        'Idle', 'TalkingOne', 'TalkingTwo', 'TalkingThree',
        'SadIdle', 'Defeated', 'Angry', 'Surprised',
        'DismissingGesture', 'ThoughtfulHeadShake'
      ];
    }
  
    /**
     * Get available facial expressions
     * @returns {Array}
     */
    getFacialExpressions() {
      return [
        'default', 'smile', 'sad', 'angry', 'surprised',
        'funnyFace', 'joy', 'laugh', 'fear', 'disgust',
        'contempt', 'thoughtful', 'confused', 'skeptical'
      ];
    }
  
    // ==================== UTILITY METHODS ====================
  
    /**
     * Check backend health
     * @returns {Promise<Object>}
     */
    async checkHealth() {
      try {
        const response = await this.apiCall('/');
        return response;
      } catch (error) {
        return { status: 'unhealthy', error: error.message };
      }
    }
  
    /**
     * Make API call with retry logic
     * @private
     */
    async apiCall(endpoint, options = {}) {
      const url = `${this.config.backendUrl}${endpoint}`;
      const defaultOptions = {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(this.config.apiKey && { 'X-API-Key': this.config.apiKey })
        },
        timeout: this.config.timeout
      };
  
      const finalOptions = { ...defaultOptions, ...options };
      
      for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
          
          const response = await fetch(url, {
            ...finalOptions,
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
  
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
  
          return await response.json();
  
        } catch (error) {
          if (attempt === this.config.retryAttempts) {
            throw error;
          }
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }
  
    /**
     * Setup WebSocket connection for real-time communication
     * @private
     */
    async setupWebSocket() {
      return new Promise((resolve, reject) => {
        const wsUrl = this.config.backendUrl.replace('http', 'ws') + '/ws';
        this.ws = new WebSocket(wsUrl);
  
        this.ws.onopen = () => {
          this.log('WebSocket connected');
          this.ws.send(JSON.stringify({ 
            type: 'init', 
            sessionId: this.sessionId 
          }));
          resolve();
        };
  
        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.emit('wsMessage', data);
          } catch (error) {
            this.log('Failed to parse WebSocket message', error);
          }
        };
  
        this.ws.onerror = (error) => {
          this.handleError('WebSocket error', error);
          reject(error);
        };
  
        this.ws.onclose = () => {
          this.log('WebSocket disconnected');
          this.emit('wsDisconnected');
        };
      });
    }
  
    /**
     * Initialize audio context for browser
     * @private
     */
    async initializeAudioContext() {
      if (typeof window !== 'undefined' && !this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }
      }
    }
  
    // ==================== EVENT SYSTEM ====================
  
    /**
     * Register event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    on(event, callback) {
      if (!this.eventListeners[event]) {
        this.eventListeners[event] = [];
      }
      this.eventListeners[event].push(callback);
      return () => this.off(event, callback);
    }
  
    /**
     * Remove event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    off(event, callback) {
      if (this.eventListeners[event]) {
        this.eventListeners[event] = this.eventListeners[event].filter(
          cb => cb !== callback
        );
      }
    }
  
    /**
     * Emit event
     * @private
     */
    emit(event, data) {
      if (this.eventListeners[event]) {
        this.eventListeners[event].forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            console.error(`Error in event listener for ${event}:`, error);
          }
        });
      }
    }
  
    // ==================== HELPER METHODS ====================
  
    /**
     * Convert Blob to base64
     * @private
     */
    blobToBase64(blob) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
  
    /**
     * Get supported MIME type for recording
     * @private
     */
    getSupportedMimeType() {
      if (typeof MediaRecorder === 'undefined') {
        return 'audio/webm';
      }
  
      const types = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus'
      ];
  
      for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
          return type;
        }
      }
  
      return 'audio/webm';
    }
  
    /**
     * Check if running in browser
     * @private
     */
    isBrowser() {
      return typeof window !== 'undefined' && typeof document !== 'undefined';
    }
  
    /**
     * Check if running on mobile platform
     * @private
     */
    isMobile() {
      if (typeof navigator !== 'undefined') {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );
      }
      return false;
    }
  
    /**
     * Generate unique session ID
     * @private
     */
    generateSessionId() {
      return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  
    /**
     * Delay helper
     * @private
     */
    delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  
    /**
     * Log helper
     * @private
     */
    log(...args) {
      if (this.config.debug) {
        console.log('[DigitalHumanSDK]', ...args);
      }
    }
  
    /**
     * Error handler
     * @private
     */
    handleError(message, error) {
      const errorData = {
        message,
        error: error?.message || error,
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId
      };
  
      console.error('[DigitalHumanSDK Error]', errorData);
      this.emit('error', errorData);
    }
  
    // ==================== CLEANUP ====================
  
    /**
     * Destroy SDK instance and cleanup resources
     */
    destroy() {
      try {
        // Stop any ongoing recording
        if (this.recordingState?.isRecording) {
          this.stopRecording();
        }
  
        // Close WebSocket
        if (this.ws) {
          this.ws.close();
          this.ws = null;
        }
  
        // Close audio context
        if (this.audioContext) {
          this.audioContext.close();
          this.audioContext = null;
        }
  
        // Clear event listeners
        this.eventListeners = {};
  
        // Clear message queue
        this.messageQueue = [];
  
        this.isConnected = false;
        this.emit('destroyed');
        this.log('SDK destroyed');
  
      } catch (error) {
        this.handleError('Failed to destroy SDK', error);
      }
    }
  }
  
  // ==================== PLATFORM-SPECIFIC ADAPTERS ====================
  
  /**
   * React/MERN Adapter
   */
  class ReactDigitalHuman extends DigitalHumanSDK {
    constructor(config) {
      super(config);
    }
  
    /**
     * React Hook for Digital Human
     */
    static useDigitalHuman(config) {
      const [sdk, setSdk] = React.useState(null);
      const [isReady, setIsReady] = React.useState(false);
  
      React.useEffect(() => {
        const instance = new ReactDigitalHuman(config);
        instance.initialize().then(() => {
          setSdk(instance);
          setIsReady(true);
        });
  
        return () => instance.destroy();
      }, []);
  
      return { sdk, isReady };
    }
  }
  
  /**
   * Angular/MEAN Adapter
   */
  class AngularDigitalHuman extends DigitalHumanSDK {
    constructor(config) {
      super(config);
    }
  
    /**
     * Angular Service wrapper
     */
    toAngularService() {
      return {
        sdk: this,
        initialize: () => this.initialize(),
        sendMessage: (msg, opts) => this.sendTextMessage(msg, opts),
        startRecording: (opts) => this.startRecording(opts),
        stopRecording: () => this.stopRecording(),
        destroy: () => this.destroy()
      };
    }
  }
  
  /**
   * React Native Adapter
   */
  class ReactNativeDigitalHuman extends DigitalHumanSDK {
    constructor(config) {
      super({ ...config, platform: 'react-native' });
    }
  
    /**
     * Bridge to native recording modules
     */
    async startNativeRecording() {
      // This would connect to native modules
      // Example: NativeModules.AudioRecorder.start()
      this.emit('requestNativeRecording');
    }
  
    /**
     * Process native audio data
     */
    async processNativeAudio(audioPath) {
      // Read audio file from native path
      // Convert to base64 and process
      const audioData = await this.readNativeFile(audioPath);
      return this.processAudioRecording(audioData);
    }
  
    async readNativeFile(path) {
      // Implementation depends on React Native file system
      // Example: RNFS.readFile(path, 'base64')
      return '';
    }
  }
  
  /**
   * Flutter Adapter (via JavaScript Channel)
   */
  class FlutterDigitalHuman extends DigitalHumanSDK {
    constructor(config) {
      super({ ...config, platform: 'flutter' });
      this.setupFlutterChannel();
    }
  
    setupFlutterChannel() {
      // Setup JavaScript channel for Flutter WebView
      if (typeof window !== 'undefined' && window.FlutterChannel) {
        window.FlutterChannel.postMessage = (data) => {
          this.handleFlutterMessage(data);
        };
      }
    }
  
    handleFlutterMessage(data) {
      const message = JSON.parse(data);
      switch (message.type) {
        case 'audioData':
          this.processAudioRecording(message.audio);
          break;
        case 'textMessage':
          this.sendTextMessage(message.text);
          break;
        default:
          this.emit('flutterMessage', message);
      }
    }
  
    sendToFlutter(type, data) {
      if (typeof window !== 'undefined' && window.FlutterChannel) {
        window.FlutterChannel.postMessage(JSON.stringify({ type, data }));
      }
    }
  }
  
  // ==================== EXPORTS ====================
  
  // CommonJS export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      DigitalHumanSDK,
      ReactDigitalHuman,
      AngularDigitalHuman,
      ReactNativeDigitalHuman,
      FlutterDigitalHuman
    };
  }
  
  // ES6 export
  export {
    DigitalHumanSDK,
    ReactDigitalHuman,
    AngularDigitalHuman,
    ReactNativeDigitalHuman,
    FlutterDigitalHuman
  };
  
  // UMD export for browser
  if (typeof window !== 'undefined') {
    window.DigitalHumanSDK = DigitalHumanSDK;
    window.ReactDigitalHuman = ReactDigitalHuman;
    window.AngularDigitalHuman = AngularDigitalHuman;
    window.ReactNativeDigitalHuman = ReactNativeDigitalHuman;
    window.FlutterDigitalHuman = FlutterDigitalHuman;
  }
  