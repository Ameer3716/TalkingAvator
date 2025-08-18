// Enhanced server.js with better audio debugging and download capabilities
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { convertAudioToText, convertAudioToTextWithFallback } from "./modules/whisper.mjs";
import { detectEmotionFromText, selectAnimationForEmotion } from "./utils/audios.mjs";
import { processUserInput } from "./modules/openAI.mjs";
import { lipSync } from "./modules/lip-sync.mjs";
import { defaultResponse } from "./modules/defaultMessages.mjs";
import { voice } from "./modules/elevenLabs.mjs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const openAIApiKey = process.env.OPENAI_API_KEY;
const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY;

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  methods: ['GET', 'POST'],
  credentials: true
}));

const port = process.env.PORT || 3000;

const requiredDirs = ['audios', 'bin', 'tmp'];
requiredDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

app.use('/tmp', express.static(path.join(__dirname, 'tmp')));

// ENHANCED DEBUG ENDPOINT WITH BETTER FILE ORGANIZATION
app.get("/debug-audio", (req, res) => {
  const tmpDir = path.join(__dirname, 'tmp');
  fs.readdir(tmpDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: "Failed to list debug audio files." });
    }
    
    // Categorize files by type and sort by timestamp
    const fileCategories = {
      original: [],
      converted: [],
      whisper: [],
      other: []
    };
    
    files.forEach(fileName => {
      const filePath = path.join(tmpDir, fileName);
      try {
        const stats = fs.statSync(filePath);
        const fileInfo = {
          name: fileName,
          size: stats.size,
          time: stats.mtime.getTime(),
          sizeKB: Math.round(stats.size / 1024),
          timeStr: stats.mtime.toLocaleString()
        };
        
        if (fileName.includes('original_recording')) {
          fileCategories.original.push(fileInfo);
        } else if (fileName.includes('converted_') || fileName.includes('input_')) {
          fileCategories.converted.push(fileInfo);
        } else if (fileName.includes('whisper_') || fileName.includes('temp_input')) {
          fileCategories.whisper.push(fileInfo);
        } else {
          fileCategories.other.push(fileInfo);
        }
      } catch (statError) {
        console.warn(`Could not get stats for ${fileName}:`, statError.message);
      }
    });
    
    // Sort each category by time (newest first)
    Object.keys(fileCategories).forEach(category => {
      fileCategories[category].sort((a, b) => b.time - a.time);
    });
    
    const debugInfo = {
      summary: {
        originalRecordings: fileCategories.original.length,
        convertedFiles: fileCategories.converted.length,
        whisperProcessing: fileCategories.whisper.length,
        otherFiles: fileCategories.other.length,
        totalFiles: files.length
      },
      categories: fileCategories,
      status: fileCategories.original.length === 0 ? 
        "No original recordings found - audio might not be reaching server properly" :
        "Original recordings found - audio is reaching the server successfully"
    };
    
    res.json(debugInfo);
  });
});

// Enhanced language detection function
const detectLanguage = (text) => {
  const cleanText = text.toLowerCase().replace(/[^\p{L}\s]/gu, '');
  
  // Character-based detection for non-Latin scripts
  if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja';
  if (/[\u0600-\u06ff]/.test(text)) return 'ar';
  if (/[\u0900-\u097f]/.test(text)) return 'hi';
  if (/[\u0400-\u04ff]/.test(text)) return 'ru';
  
  const languagePatterns = {
    es: {
      words: ['el', 'la', 'de', 'que', 'y', 'en', 'un', 'es', 'se', 'no', 'te', 'lo'],
      patterns: [/ñ/, /ción$/, /¿/, /¡/]
    },
    fr: {
      words: ['le', 'de', 'et', 'à', 'un', 'il', 'que', 'pour', 'dans', 'ce'],
      patterns: [/ç/, /è/, /é/, /ê/, /à/, /â/]
    },
    de: {
      words: ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich'],
      patterns: [/ß/, /ä/, /ö/, /ü/, /sch/]
    },
    it: {
      words: ['il', 'di', 'che', 'e', 'la', 'per', 'un', 'in', 'con', 'del'],
      patterns: [/gli/, /gn/, /zione$/]
    },
    pt: {
      words: ['o', 'de', 'a', 'e', 'do', 'da', 'em', 'um', 'para', 'com'],
      patterns: [/ã/, /õ/, /ç/, /lh/, /nh/]
    }
  };
  
  const words = cleanText.split(/\s+/);
  const scores = {};
  
  Object.entries(languagePatterns).forEach(([lang, config]) => {
    let score = 0;
    score += words.filter(word => config.words.includes(word)).length * 3;
    config.patterns.forEach(pattern => {
      score += (cleanText.match(pattern) || []).length * 2;
    });
    scores[lang] = score;
  });
  
  const maxScore = Math.max(...Object.values(scores));
  if (maxScore < 2) return 'en';
  
  return Object.entries(scores).find(([lang, score]) => score === maxScore)?.[0] || 'en';
};

// Enhanced emotion and animation processing
const enhanceMessageWithEmotion = (messages, language = 'en') => {
  return messages.map(message => {
    // Detect emotion from text
    const detectedEmotion = detectEmotionFromText(message.text, language);
    
    // Select appropriate animation
    const suggestedAnimation = selectAnimationForEmotion(detectedEmotion, message.text.length);
    
    // Enhanced emotion mapping
    const emotionMapping = {
      joy: { expression: 'smile', intensity: 0.8 },
      happy: { expression: 'smile', intensity: 0.7 },
      laugh: { expression: 'smile', intensity: 1.0 },
      sad: { expression: 'sad', intensity: 0.8 },
      melancholy: { expression: 'sad', intensity: 0.6 },
      angry: { expression: 'angry', intensity: 0.9 },
      furious: { expression: 'angry', intensity: 1.0 },
      fear: { expression: 'surprised', intensity: 0.8 },
      surprised: { expression: 'surprised', intensity: 0.9 },
      thoughtful: { expression: 'default', intensity: 0.5 },
      confused: { expression: 'default', intensity: 0.6 },
      default: { expression: 'default', intensity: 0.5 }
    };
    
    const emotionInfo = emotionMapping[detectedEmotion] || emotionMapping.default;
    
    return {
      ...message,
      detectedEmotion,
      emotionIntensity: emotionInfo.intensity,
      suggestedAnimation,
      language,
      // Override facial expression if more specific emotion detected
      facialExpression: message.facialExpression || emotionInfo.expression,
      // Override animation if better match found
      animation: message.animation || suggestedAnimation
    };
  });
};

// Health check endpoint with enhanced info
app.get("/", (req, res) => {
  res.json({ 
    message: "Enhanced Digital Human Backend is running!",
    status: "healthy",
    timestamp: new Date().toISOString(),
    endpoints: ["/tts", "/sts", "/voices", "/languages", "/emotions", "/debug-audio"],
    config: {
      openAI: openAIApiKey ? "configured" : "missing",
      elevenLabs: elevenLabsApiKey ? "configured" : "missing",
      model: process.env.OPENAI_MODEL || "not set",
      voice: process.env.ELEVEN_LABS_VOICE_ID || "not set"
    },
    features: {
      multilingualSupport: true,
      enhancedEmotions: true,
      languageDetection: true,
      emotionDetection: true,
      audioDebugging: true,
      supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'zh', 'ar', 'hi']
    }
  });
});

// New endpoint to get supported languages
app.get("/languages", (req, res) => {
  const supportedLanguages = {
    'en': { name: 'English', native: 'English' },
    'es': { name: 'Spanish', native: 'Español' },
    'fr': { name: 'French', native: 'Français' },
    'de': { name: 'German', native: 'Deutsch' },
    'it': { name: 'Italian', native: 'Italiano' },
    'pt': { name: 'Portuguese', native: 'Português' },
    'ru': { name: 'Russian', native: 'Русский' },
    'ja': { name: 'Japanese', native: '日本語' },
    'zh': { name: 'Chinese', native: '中文' },
    'ar': { name: 'Arabic', native: 'العربية' },
    'hi': { name: 'Hindi', native: 'हिन्दी' }
  };
  
  res.json({ supportedLanguages });
});

// Add logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get("/voices", async (req, res) => {
  try {
    if (!elevenLabsApiKey) {
      return res.status(400).json({ error: "ElevenLabs API key not configured" });
    }
    const voices = await voice.getVoices(elevenLabsApiKey);
    res.json(voices);
  } catch (error) {
    console.error("Error fetching voices:", error);
    res.status(500).json({ 
      error: "Failed to fetch voices", 
      details: error.message 
    });
  }
});

// Helper function for contextual fallbacks
const createContextualFallback = (userMessage, language = 'en') => {
  const lowerMessage = userMessage.toLowerCase().trim();
  
  // Simple keyword-based responses for common inputs
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return {
      messages: [{
        text: "Hello there! It's great to meet you. What's on your mind today?",
        facialExpression: "smile",
        animation: "TalkingOne"
      }]
    };
  }
  
  if (lowerMessage.includes('how are you')) {
    return {
      messages: [{
        text: "I'm doing wonderfully, thank you for asking! How are you doing today?",
        facialExpression: "smile", 
        animation: "TalkingOne"
      }]
    };
  }
  
  if (lowerMessage.includes('weather')) {
    return {
      messages: [{
        text: "I don't have access to current weather data, but I'd love to chat about weather patterns or travel destinations with great climates!",
        facialExpression: "smile",
        animation: "TalkingOne"
      }]
    };
  }
  
  if (lowerMessage.includes('travel') || lowerMessage.includes('trip')) {
    return {
      messages: [{
        text: "Ah, travel! One of my favorite topics. I've been fortunate to explore many places around the world.",
        facialExpression: "smile",
        animation: "TalkingOne"
      }, {
        text: "Where are you thinking of going, or would you like some travel recommendations?",
        facialExpression: "smile",
        animation: "TalkingThree"
      }]
    };
  }
  
  // Generic fallback - but make it more engaging
  return {
    messages: [{
      text: `That's interesting! You mentioned "${userMessage}". I'd love to learn more about that.`,
      facialExpression: "smile",
      animation: "TalkingOne"
    }, {
      text: "Tell me more about what you're thinking, and I'll do my best to help!",
      facialExpression: "smile", 
      animation: "TalkingThree"
    }]
  };
};

// IMPROVED TTS ENDPOINT WITH BETTER CONTEXT PROCESSING
app.post("/tts", async (req, res) => {
  try {
    const userMessage = req.body.message;
    const requestedLanguage = req.body.language || 'auto';
    
    console.log("TTS request received:", { 
      message: userMessage?.substring(0, 100) + "...",
      requestedLanguage 
    });
    
    if (!userMessage || userMessage.trim() === '') {
      console.warn("TTS: User message is empty or whitespace.");
      return res.status(400).json({ error: "Message is required" });
    }

    // Detect language if not specified
    const detectedLanguage = requestedLanguage === 'auto' ? 
      detectLanguage(userMessage) : requestedLanguage;
    
    console.log(`TTS Language detection: requested=${requestedLanguage}, detected=${detectedLanguage}`);

    // Check for very generic inputs and handle them specially
    const genericInputs = ['hi', 'hello', 'hey'];
    if (genericInputs.includes(userMessage.toLowerCase().trim())) {
      console.log("TTS: Generic input detected, using enhanced default response");
      const enhancedDefault = {
        messages: [{
          text: `Hello! Nice to meet you. I'm Jack, your digital human assistant.`,
          facialExpression: "smile",
          animation: "TalkingOne"
        }, {
          text: "I love to chat about travel, culture, or anything else on your mind. What would you like to talk about?",
          facialExpression: "smile", 
          animation: "TalkingThree"
        }]
      };
      
      const processedMessages = await lipSync({ 
        messages: enhancedDefault.messages,
        language: detectedLanguage 
      });
      
      return res.json({ 
        messages: processedMessages,
        language: detectedLanguage,
        contextualResponse: true
      });
    }

    // Check if we have API keys
    if (!openAIApiKey) {
      console.log("TTS: OpenAI API key missing, using contextual fallback");
      const fallbackResponse = createContextualFallback(userMessage, detectedLanguage);
      
      const processedMessages = await lipSync({ 
        messages: fallbackResponse.messages,
        language: detectedLanguage 
      });
      
      return res.json({ 
        messages: processedMessages,
        language: detectedLanguage,
        fallbackResponse: true
      });
    }

    let openAImessages;
    try {
      console.log("TTS: Processing with enhanced OpenAI...");
      
      // Use the improved processUserInput function
      openAImessages = await processUserInput(userMessage, detectedLanguage);
      
      console.log("TTS: OpenAI response received:", {
        messageCount: openAImessages.messages?.length,
        firstMessage: openAImessages.messages?.[0]?.text?.substring(0, 50) + "..."
      });
    } catch (error) {
      console.error("TTS: OpenAI API error:", error.message);
      openAImessages = createContextualFallback(userMessage, detectedLanguage);
    }

    try {
      console.log("TTS: Enhancing messages with emotion and language context...");
      const enhancedMessages = enhanceMessageWithEmotion(openAImessages.messages, detectedLanguage);
      
      console.log("TTS: Processing lip sync with multilingual support...");
      const processedMessages = await lipSync({ 
        messages: enhancedMessages,
        language: detectedLanguage 
      });
      
      console.log("TTS: Lip sync completed, sending response");
      res.json({ 
        messages: processedMessages,
        language: detectedLanguage,
        emotionEnhanced: true
      });
    } catch (lipSyncError) {
      console.error("TTS: Lip sync error:", lipSyncError.message);
      // Send messages without audio/lipsync as fallback
      const enhancedMessages = enhanceMessageWithEmotion(openAImessages.messages, detectedLanguage);
      const fallbackMessages = enhancedMessages.map(msg => ({
        ...msg,
        audio: null,
        lipsync: null
      }));
      res.json({ 
        messages: fallbackMessages,
        language: detectedLanguage,
        emotionEnhanced: true,
        audioFallback: true
      });
    }
  } catch (error) {
    console.error("TTS endpoint error (Unhandled):", error);
    res.status(500).json({ 
      error: "Internal server error",
      details: error.message,
      messages: defaultResponse 
    });
  }
});

// ENHANCED STS ENDPOINT WITH COMPREHENSIVE AUDIO DEBUGGING
app.post("/sts", async (req, res) => {
  try {
    const { audio, mimeType, language: requestedLanguage } = req.body;
    const timestamp = Date.now();

    console.log(`[STS] Processing audio: type=${typeof audio}, length=${audio?.length}, mime=${mimeType}`);
    
    // Basic validation
    if (!audio) {
      return res.status(400).json({ error: "Audio data required" });
    }

    if (!openAIApiKey) {
      return res.status(500).json({ error: "OpenAI API not configured" });
    }

    // SAVE ORIGINAL RECORDING FOR DEBUGGING
    let audioBuffer;
    try {
      // Handle base64 data (remove data URL prefix if present)
      let cleanBase64 = audio;
      if (audio.includes('data:') && audio.includes('base64,')) {
        cleanBase64 = audio.split('base64,')[1];
      }
      
      // Convert to buffer
      audioBuffer = Buffer.from(cleanBase64, 'base64');
      console.log(`[STS] Audio buffer created: ${audioBuffer.length} bytes`);

      if (audioBuffer.length === 0) {
        throw new Error("Empty audio data");
      }

      // SAVE ORIGINAL RECORDING TO DEBUG FOLDER
      const originalPath = path.join('tmp', `original_recording_${timestamp}.webm`);
      try {
        fs.writeFileSync(originalPath, audioBuffer);
        console.log(`[STS] 📥 Original recording saved: ${originalPath} (${audioBuffer.length} bytes)`);
      } catch (saveError) {
        console.warn(`[STS] Could not save original recording: ${saveError.message}`);
      }

    } catch (error) {
      console.error('[STS] Audio processing failed:', error);
      return res.status(400).json({ error: "Invalid audio data" });
    }

    // Convert audio to text using Whisper with enhanced debugging
    let transcription;
    try {
      console.log("[STS] Attempting primary audio conversion...");
      transcription = await convertAudioToText({ 
        audioData: audioBuffer, 
        mimeType: mimeType || 'audio/webm' 
      });
      
      console.log(`[STS] ✅ Primary transcription successful: "${transcription}"`);

    } catch (primaryError) {
      console.error('[STS] Primary conversion failed, trying fallback approach:', primaryError.message);
      
      try {
        // Fallback: Try with conversion approach
        transcription = await convertAudioToTextWithFallback({ 
          audioData: audioBuffer, 
          mimeType: mimeType || 'audio/webm' 
        });
        
        console.log(`[STS] ✅ Fallback transcription successful: "${transcription}"`);
      } catch (fallbackError) {
        console.error('[STS] ❌ Both approaches failed:', fallbackError.message);
        
        // SAVE FAILED AUDIO FOR MANUAL INSPECTION
        const failedPath = path.join('tmp', `failed_audio_${timestamp}.webm`);
        try {
          fs.writeFileSync(failedPath, audioBuffer);
          console.log(`[STS] 💾 Failed audio saved for inspection: ${failedPath}`);
        } catch (saveError) {
          console.warn(`[STS] Could not save failed audio: ${saveError.message}`);
        }
        
        // Final fallback response
        return res.json({
          messages: [{
            text: "I'm having trouble understanding the audio. Please check the debug files to see if your recording contains voice data.",
            facialExpression: "surprised",
            animation: "Idle"
          }],
          transcription: "",
          error: "Audio processing failed",
          debugInfo: {
            audioSize: audioBuffer.length,
            mimeType: mimeType,
            failedFile: `failed_audio_${timestamp}.webm`,
            message: "Check /debug-audio to download and inspect your recordings"
          }
        });
      }
    }

    // Only reject truly empty transcriptions
    if (!transcription || transcription.trim().length === 0) {
      // SAVE EMPTY TRANSCRIPTION AUDIO FOR DEBUGGING
      const emptyPath = path.join('tmp', `empty_transcription_${timestamp}.webm`);
      try {
        fs.writeFileSync(emptyPath, audioBuffer);
        console.log(`[STS] 💾 Empty transcription audio saved: ${emptyPath}`);
      } catch (saveError) {
        console.warn(`[STS] Could not save empty transcription audio: ${saveError.message}`);
      }

      return res.json({
        messages: [{
          text: "I didn't catch that clearly. Could you please repeat? Check the debug files to verify your audio has voice content.",
          facialExpression: "surprised",
          animation: "Idle"
        }],
        transcription: transcription || "",
        debugInfo: {
          audioSize: audioBuffer.length,
          emptyFile: `empty_transcription_${timestamp}.webm`,
          message: "Audio processed but no speech detected. Check /debug-audio to verify your recording."
        }
      });
    }

    try {
      const detectedLanguage = requestedLanguage || detectLanguage(transcription);
      console.log(`[STS] Language: ${detectedLanguage}, processing transcription: "${transcription}"`);
      
      // SAVE SUCCESSFUL TRANSCRIPTION INFO
      const successPath = path.join('tmp', `success_${timestamp}.txt`);
      try {
        const successInfo = {
          timestamp: new Date().toISOString(),
          transcription: transcription,
          language: detectedLanguage,
          audioSize: audioBuffer.length,
          mimeType: mimeType
        };
        fs.writeFileSync(successPath, JSON.stringify(successInfo, null, 2));
        console.log(`[STS] 📄 Success info saved: ${successPath}`);
      } catch (saveError) {
        console.warn(`[STS] Could not save success info: ${saveError.message}`);
      }
      
      // Generate AI response
      const openAImessages = await processUserInput(transcription, detectedLanguage);
      const enhancedMessages = enhanceMessageWithEmotion(openAImessages.messages, detectedLanguage);
      
      // Generate lip sync and audio
      const processedMessages = await lipSync({ 
        messages: enhancedMessages, 
        language: detectedLanguage 
      });
      
      res.json({
        messages: processedMessages,
        transcription: transcription,
        language: detectedLanguage,
        debugInfo: {
          audioSize: audioBuffer.length,
          originalFile: `original_recording_${timestamp}.webm`,
          successFile: `success_${timestamp}.txt`,
          message: "Check /debug-audio to download your recordings"
        }
      });

    } catch (processingError) {
      console.error('[STS] Processing failed:', processingError);
      
      // SAVE PROCESSING ERROR INFO
      const errorPath = path.join('tmp', `processing_error_${timestamp}.txt`);
      try {
        const errorInfo = {
          timestamp: new Date().toISOString(),
          transcription: transcription,
          error: processingError.message,
          stack: processingError.stack,
          audioSize: audioBuffer.length,
          mimeType: mimeType
        };
        fs.writeFileSync(errorPath, JSON.stringify(errorInfo, null, 2));
        console.log(`[STS] 📄 Error info saved: ${errorPath}`);
      } catch (saveError) {
        console.warn(`[STS] Could not save error info: ${saveError.message}`);
      }
      
      // Fallback response that acknowledges what was heard
      res.json({
        messages: [{
          text: `I heard you say "${transcription}". Let me think about that for a moment.`,
          facialExpression: "default",
          animation: "ThoughtfulHeadShake"
        }, {
          text: "Could you give me a bit more context about what you'd like to know?",
          facialExpression: "smile",
          animation: "TalkingOne"
        }],
        transcription: transcription,
        fallback: true,
        debugInfo: {
          audioSize: audioBuffer.length,
          originalFile: `original_recording_${timestamp}.webm`,
          errorFile: `processing_error_${timestamp}.txt`,
          message: "Transcription successful but processing failed. Check /debug-audio for details."
        }
      });
    }

  } catch (error) {
    console.error('[STS] Unexpected error:', error);
    const timestamp = Date.now();
    
    // SAVE UNEXPECTED ERROR INFO
    const unexpectedErrorPath = path.join('tmp', `unexpected_error_${timestamp}.txt`);
    try {
      const errorInfo = {
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack,
        requestBody: req.body ? {
          hasAudio: !!req.body.audio,
          audioLength: req.body.audio?.length,
          mimeType: req.body.mimeType
        } : null
      };
      fs.writeFileSync(unexpectedErrorPath, JSON.stringify(errorInfo, null, 2));
      console.log(`[STS] 📄 Unexpected error info saved: ${unexpectedErrorPath}`);
    } catch (saveError) {
      console.warn(`[STS] Could not save unexpected error info: ${saveError.message}`);
    }
    
    res.status(500).json({
      error: "Internal server error",
      messages: [{
        text: "I'm experiencing technical difficulties. Please try again.",
        facialExpression: "sad",
        animation: "Idle"
      }],
      debugInfo: {
        errorFile: `unexpected_error_${timestamp}.txt`,
        message: "Check /debug-audio for error details"
      }
    });
  }
});

// ENHANCED TEST ENDPOINT WITH BETTER DEBUGGING
app.post("/test-audio", async (req, res) => {
  try {
    const { audio, mimeType } = req.body;
    const timestamp = Date.now();
    
    if (!audio) {
      return res.status(400).json({ error: "Audio data required" });
    }

    let audioBuffer;
    try {
      let cleanBase64 = audio;
      if (audio.includes('data:') && audio.includes('base64,')) {
        cleanBase64 = audio.split('base64,')[1];
      }
      audioBuffer = Buffer.from(cleanBase64, 'base64');
    } catch (error) {
      return res.status(400).json({ error: "Invalid audio data" });
    }

    // Save the audio file for inspection with detailed info
    const testPath = path.join('tmp', `test_audio_${timestamp}.webm`);
    const infoPath = path.join('tmp', `test_info_${timestamp}.json`);
    
    try {
      // Save audio file
      fs.writeFileSync(testPath, audioBuffer);
      
      // Save detailed info
      const testInfo = {
        timestamp: new Date().toISOString(),
        originalMimeType: mimeType,
        audioSize: audioBuffer.length,
        audioSizeKB: Math.round(audioBuffer.length / 1024),
        base64Length: audio.length,
        hasDataPrefix: audio.includes('data:'),
        bufferFirst10Bytes: Array.from(audioBuffer.slice(0, 10)),
        testFiles: {
          audio: `test_audio_${timestamp}.webm`,
          info: `test_info_${timestamp}.json`
        },
        debugUrl: `/debug-audio`,
        instructions: [
          "1. Visit /debug-audio to see all your recordings",
          "2. Download and play the test_audio file to verify it contains voice",
          "3. If file is silent, check microphone permissions and recording setup",
          "4. Compare file sizes - very small files (< 1KB) usually indicate no audio data"
        ]
      };
      
      fs.writeFileSync(infoPath, JSON.stringify(testInfo, null, 2));
      
      res.json({
        message: "Audio test files saved successfully",
        testInfo: testInfo,
        quickTest: {
          audioSizeOK: audioBuffer.length > 1000,
          sizeStatus: audioBuffer.length > 1000 ? "✅ Good size" : "⚠️ Very small - might be empty",
          nextSteps: audioBuffer.length > 1000 ? 
            "Download the file from /debug-audio and check if it plays with sound" :
            "Audio file is very small. Check your microphone setup and recording permissions."
        }
      });
    } catch (saveError) {
      res.status(500).json({ 
        error: "Failed to save test audio",
        details: saveError.message 
      });
    }

  } catch (error) {
    console.error('[TEST-AUDIO] Error:', error);
    res.status(500).json({ error: "Test audio endpoint failed" });
  }
});

// NEW ENDPOINT: Clear debug files (useful for testing)
app.post("/clear-debug", (req, res) => {
  const tmpDir = path.join(__dirname, 'tmp');
  
  try {
    const files = fs.readdirSync(tmpDir);
    let deletedCount = 0;
    let errors = [];
    
    files.forEach(file => {
      const filePath = path.join(tmpDir, file);
      try {
        fs.unlinkSync(filePath);
        deletedCount++;
      } catch (error) {
        errors.push({ file, error: error.message });
      }
    });
    
    res.json({
      message: `Debug cleanup completed`,
      deletedFiles: deletedCount,
      errors: errors.length > 0 ? errors : null,
      status: errors.length === 0 ? "success" : "partial_success"
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to clear debug files",
      details: error.message
    });
  }
});

// Handle 404s
app.use((req, res) => {
  res.status(404).json({ 
    error: "Endpoint not found",
    availableEndpoints: ["/", "/tts", "/sts", "/voices", "/languages", "/debug-audio", "/test-audio", "/clear-debug"]
  });
});

app.listen(port, () => {
  console.log(`🚀 Enhanced Digital Human Backend is running on port ${port}`);
  console.log(`📡 CORS enabled for: ${process.env.FRONTEND_URL || "http://localhost:5173"}`);
  console.log(`🔑 OpenAI API: ${openAIApiKey ? '✅ Configured' : '❌ Missing'}`);
  console.log(`🔑 ElevenLabs API: ${elevenLabsApiKey ? '✅ Configured' : '❌ Missing'}`);
  console.log(`🎯 Access health check at: http://localhost:${port}/`);
  console.log(`🌐 Multilingual support: ✅ Enabled`);
  console.log(`😊 Enhanced emotions: ✅ Enabled`);
  console.log(`🔍 Audio debugging: ✅ Enabled at http://localhost:${port}/debug-audio`);
  console.log(`📋 Supported languages: en, es, fr, de, it, pt, ru, ja, zh, ar, hi`);
  console.log(`\n📱 DEBUGGING TIPS:`);
  console.log(`  - Visit http://localhost:${port}/debug-audio to download your recordings`);
  console.log(`  - Use POST /test-audio to test audio data without processing`);
  console.log(`  - Use POST /clear-debug to clean up test files`);
  console.log(`  - All original recordings are automatically saved for inspection`);
});