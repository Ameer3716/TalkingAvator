import { createContext, useContext, useEffect, useState, useRef } from "react";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

const SpeechContext = createContext();

export const SpeechProvider = ({ children }) => {
  const [recording, setRecording] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState();
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(true);
  const [transcription, setTranscription] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  // Enhanced recording refs
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimeoutRef = useRef(null);
  const analyzerRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Audio quality settings based on successful Whisper implementations
  const AUDIO_CONFIG = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 16000, // Whisper's preferred sample rate
    channelCount: 1,    // Mono audio for better transcription
    sampleSize: 16      // 16-bit depth
  };

  // Initialize microphone with enhanced error handling
  useEffect(() => {
    const setupMicrophone = async () => {
      try {
        // Check comprehensive browser support
        if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
          throw new Error('MediaRecorder API not supported in this browser');
        }

        // Test supported MIME types
        const supportedTypes = [
          'audio/webm;codecs=opus',
          'audio/webm',
          'audio/mp4',
          'audio/ogg;codecs=opus',
          'audio/wav'
        ];

        const mimeType = supportedTypes.find(type => MediaRecorder.isTypeSupported(type));
        if (!mimeType) {
          throw new Error('No supported audio format found');
        }

        console.log('✅ Browser supports audio recording with:', mimeType);

        // Get microphone access with optimal settings
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: AUDIO_CONFIG,
          video: false
        });

        streamRef.current = stream;
        
        // Set up audio level monitoring (visual feedback)
        setupAudioLevelMonitoring(stream);
        
        console.log('✅ Microphone access granted with enhanced settings');
        setSupported(true);

      } catch (error) {
        console.error('❌ Microphone setup failed:', error);
        setSupported(false);
        
        // Provide specific error guidance
        if (error.name === 'NotAllowedError') {
          console.warn('Microphone permission denied. Please allow microphone access and refresh.');
        } else if (error.name === 'NotFoundError') {
          console.warn('No microphone found. Please connect a microphone and try again.');
        } else if (error.name === 'NotReadableError') {
          console.warn('Microphone is being used by another application.');
        }
      }
    };

    setupMicrophone();

    return () => {
      cleanup();
    };
  }, []);

  // Set up audio level monitoring for visual feedback
  const setupAudioLevelMonitoring = (stream) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.smoothingTimeConstant = 0.8;
      analyser.fftSize = 1024;
      
      microphone.connect(analyser);
      analyzerRef.current = { analyser, audioContext };
      
      monitorAudioLevel();
    } catch (error) {
      console.warn('Audio level monitoring not available:', error);
    }
  };

  // Monitor audio levels for visual feedback
  const monitorAudioLevel = () => {
    if (!analyzerRef.current?.analyser) return;
    
    const { analyser } = analyzerRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const updateLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;
      setAudioLevel(average / 255); // Normalize to 0-1
      
      if (recording) {
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      }
    };
    
    updateLevel();
  };

  // Enhanced recording start with chunked recording for better reliability
  const startRecording = async () => {
    if (!streamRef.current || !supported || recording || loading) {
      console.log('❌ Cannot start recording:', { 
        stream: !!streamRef.current, 
        supported, 
        recording, 
        loading 
      });
      return;
    }

    try {
      // Clear any previous state
      audioChunksRef.current = [];
      setTranscription("");
      setIsProcessing(false);
      
      // Determine best MIME type
      const supportedTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus'
      ];
      
      const mimeType = supportedTypes.find(type => MediaRecorder.isTypeSupported(type));
      if (!mimeType) {
        throw new Error('No supported audio format available');
      }

      console.log('🎤 Starting recording with format:', mimeType);

      // Create MediaRecorder with optimized settings for Whisper
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType,
        bitsPerSecond: 128000, // Good quality for speech
        audioBitsPerSecond: 128000
      });

      mediaRecorderRef.current = mediaRecorder;

      // Enhanced event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          console.log('📊 Audio chunk received:', event.data.size, 'bytes');
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('⏹️ Recording stopped, processing audio...');
        processRecordingForWhisper(mimeType);
      };

      mediaRecorder.onerror = (event) => {
        console.error('❌ MediaRecorder error:', event.error);
        handleRecordingError(event.error);
      };

      // Start recording with time slicing for chunked data
      mediaRecorder.start(100); // Collect data every 100ms
      setRecording(true);
      
      // Start audio level monitoring
      if (analyzerRef.current) {
        monitorAudioLevel();
      }

      // Auto-stop after 30 seconds (prevent infinite recording)
      recordingTimeoutRef.current = setTimeout(() => {
        if (recording) {
          console.log('⏰ Auto-stopping recording after 30 seconds');
          stopRecording();
        }
      }, 30000);

    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      handleRecordingError(error);
    }
  };

  // Enhanced stop recording with immediate feedback
  const stopRecording = () => {
    if (!mediaRecorderRef.current || !recording) {
      console.log('❌ Cannot stop recording:', { 
        recorder: !!mediaRecorderRef.current, 
        recording 
      });
      return;
    }

    try {
      console.log('🛑 Stopping recording...');
      
      // Clear timeout and stop monitoring
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
        recordingTimeoutRef.current = null;
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Stop the MediaRecorder
      mediaRecorderRef.current.stop();
      setRecording(false);
      setIsProcessing(true);
      setAudioLevel(0);

    } catch (error) {
      console.error('❌ Failed to stop recording:', error);
      handleRecordingError(error);
    }
  };

  // Enhanced audio processing for Whisper API
  const processRecordingForWhisper = async (mimeType) => {
    try {
      console.log('🔄 Processing', audioChunksRef.current.length, 'audio chunks for Whisper...');

      // Validate we have audio data
      if (audioChunksRef.current.length === 0) {
        throw new Error('No audio data recorded. Please check microphone permissions.');
      }

      // Create audio blob with proper MIME type
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      
      console.log('📦 Audio blob created:', {
        size: audioBlob.size,
        type: audioBlob.type,
        sizeKB: Math.round(audioBlob.size / 1024)
      });

      // Validate blob size (Whisper quality requirements)
      if (audioBlob.size === 0) {
        throw new Error('Empty audio recording. Microphone may not be working.');
      }

      if (audioBlob.size < 2000) { // Less than 2KB suggests very short recording
        throw new Error('Recording too short. Please speak for at least 2 seconds.');
      }

      if (audioBlob.size > 26214400) { // 25MB OpenAI limit
        throw new Error('Recording too long. Please keep recordings under 25MB.');
      }

      // Convert blob to optimized format for Whisper
      const optimizedAudio = await optimizeAudioForWhisper(audioBlob, mimeType);
      
      // Send to enhanced backend
      await sendToWhisperAPI(optimizedAudio, mimeType);

    } catch (error) {
      console.error('❌ Audio processing failed:', error);
      handleProcessingError(error);
    }
  };

  // Optimize audio for Whisper API (based on successful implementations)
  const optimizeAudioForWhisper = async (audioBlob, mimeType) => {
    try {
      // For WebM/Opus, convert to base64 directly (Whisper handles well)
      if (mimeType.includes('webm') || mimeType.includes('opus')) {
        const base64Audio = await blobToBase64(audioBlob);
        console.log('✅ Audio optimized for Whisper (WebM/Opus)');
        return base64Audio;
      }

      // For other formats, we might want to convert (backend will handle)
      const base64Audio = await blobToBase64(audioBlob);
      console.log('✅ Audio prepared for Whisper conversion');
      return base64Audio;

    } catch (error) {
      console.error('❌ Audio optimization failed:', error);
      throw new Error(`Audio optimization failed: ${error.message}`);
    }
  };

  // Enhanced Whisper API call with better error handling
  const sendToWhisperAPI = async (base64Audio, mimeType) => {
    try {
      console.log('🤖 Sending audio to Whisper API...');
      setLoading(true);

      const response = await fetch(`${backendUrl}/sts`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          audio: base64Audio,
          mimeType: mimeType,
          language: 'auto', // Let Whisper auto-detect language
          // Enhanced options for better transcription
          whisperOptions: {
            model: 'whisper-1',
            response_format: 'json',
            temperature: 0.1, // Lower temperature for more consistent results
            prompt: '' // Can be used for context/style guidance
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Whisper API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log('✅ Whisper API response received:', {
        transcription: data.transcription?.substring(0, 100) + '...',
        language: data.language,
        messageCount: data.messages?.length
      });

      // Update transcription state
      if (data.transcription) {
        setTranscription(data.transcription);
      }

      // Handle response messages
      if (data.messages?.length > 0) {
        setMessages(prev => [...prev, ...data.messages]);
        console.log('✅ Added', data.messages.length, 'response messages');
      } else if (data.transcription) {
        // If we got transcription but no response, create a confirmation message
        setMessages(prev => [...prev, {
          text: `I heard: "${data.transcription}". How can I help you with that?`,
          facialExpression: "smile",
          animation: "TalkingOne"
        }]);
      } else {
        throw new Error('No transcription or response received from Whisper');
      }

    } catch (error) {
      console.error('❌ Whisper API call failed:', error);
      throw error;
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  };

  // Enhanced error handling with user-friendly messages
  const handleRecordingError = (error) => {
    console.error('❌ Recording error:', error);
    setRecording(false);
    setIsProcessing(false);
    setLoading(false);
    
    let userMessage = "Sorry, I had trouble with the recording. ";
    
    if (error.name === 'NotAllowedError') {
      userMessage += "Please allow microphone access and try again.";
    } else if (error.name === 'NotFoundError') {
      userMessage += "No microphone detected. Please check your device.";
    } else if (error.message?.includes('not supported')) {
      userMessage += "Your browser doesn't support audio recording.";
    } else {
      userMessage += "Please try again.";
    }

    setMessages(prev => [...prev, {
      text: userMessage,
      facialExpression: "sad",
      animation: "Idle"
    }]);
  };

  const handleProcessingError = (error) => {
    console.error('❌ Processing error:', error);
    setIsProcessing(false);
    setLoading(false);
    
    let userMessage = "I had trouble understanding that. ";
    
    if (error.message?.includes('short')) {
      userMessage += "Please speak a bit longer next time.";
    } else if (error.message?.includes('empty') || error.message?.includes('microphone')) {
      userMessage += "Please check your microphone and try again.";
    } else if (error.message?.includes('too long')) {
      userMessage += "Please keep your message shorter.";
    } else {
      userMessage += "Please try speaking again.";
    }

    setMessages(prev => [...prev, {
      text: userMessage,
      facialExpression: "surprised",
      animation: "Idle"
    }]);
  };

  // Helper: Convert Blob to Base64 (optimized)
  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          // Remove data URL prefix for clean base64
          const base64 = reader.result.split(',')[1];
          if (!base64) {
            throw new Error('Failed to convert audio to base64');
          }
          resolve(base64);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('FileReader failed'));
      reader.readAsDataURL(blob);
    });
  };

  // Enhanced text-to-speech with better error handling
  const tts = async (message) => {
    if (!message?.trim()) {
      console.log('❌ TTS: Empty message provided');
      return;
    }
    
    console.log('🔊 TTS: Processing message:', message.substring(0, 50) + '...');
    setLoading(true);
    
    try {
      const response = await fetch(`${backendUrl}/tts`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          message: message.trim(),
          language: 'auto' // Auto-detect language
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `TTS failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.messages?.length > 0) {
        setMessages(prev => [...prev, ...data.messages]);
        console.log('✅ TTS successful, added', data.messages.length, 'messages');
      } else {
        throw new Error('No messages returned from TTS');
      }
    } catch (error) {
      console.error('❌ TTS Error:', error);
      setMessages(prev => [...prev, {
        text: `Sorry, I couldn't process your message: ${error.message}`,
        facialExpression: "sad",
        animation: "Idle"
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Clean up resources
  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (analyzerRef.current?.audioContext) {
      analyzerRef.current.audioContext.close();
    }
  };

  const onMessagePlayed = () => {
    setMessages(prev => prev.slice(1));
  };

  useEffect(() => {
    setMessage(messages.length > 0 ? messages[0] : null);
  }, [messages]);

  return (
    <SpeechContext.Provider
      value={{
        // Core functionality
        startRecording,
        stopRecording,
        recording,
        tts,
        message,
        onMessagePlayed,
        loading,
        supported,
        
        // Enhanced features
        transcription,
        isProcessing,
        audioLevel,
        
        // Status information
        status: {
          recording,
          processing: isProcessing,
          loading,
          supported,
          hasAudio: audioLevel > 0
        }
      }}
    >
      {children}
    </SpeechContext.Provider>
  );
};

export const useSpeech = () => {
  const context = useContext(SpeechContext);
  if (!context) {
    throw new Error("useSpeech must be used within a SpeechProvider");
  }
  return context;
};