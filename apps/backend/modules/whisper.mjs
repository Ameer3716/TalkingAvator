import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import ffmpeg from 'fluent-ffmpeg';
import dotenv from "dotenv";

dotenv.config();

const execAsync = promisify(exec);
const openAIApiKey = process.env.OPENAI_API_KEY;

// Initialize OpenAI client with better error handling
let openaiClient;
try {
  openaiClient = new OpenAI({
    apiKey: openAIApiKey,
    timeout: 60000, // 60 second timeout
    maxRetries: 3,  // Retry failed requests
  });
} catch (error) {
  console.error('❌ OpenAI client initialization failed:', error);
}

// FIXED: Language mapping to ISO-639-1 format
const LANGUAGE_MAPPINGS = {
  'english': 'en',
  'spanish': 'es', 
  'french': 'fr',
  'german': 'de',
  'italian': 'it',
  'portuguese': 'pt',
  'russian': 'ru',
  'japanese': 'ja',
  'chinese': 'zh',
  'arabic': 'ar',
  'hindi': 'hi',
  // Add more mappings as needed
  'auto': undefined, // Let Whisper auto-detect
  'en': 'en',
  'es': 'es',
  'fr': 'fr', 
  'de': 'de',
  'it': 'it',
  'pt': 'pt',
  'ru': 'ru',
  'ja': 'ja',
  'zh': 'zh',
  'ar': 'ar',
  'hi': 'hi'
};

// Enhanced audio processing configurations based on successful implementations
const WHISPER_CONFIG = {
  // Optimal audio settings for Whisper
  OPTIMAL_SAMPLE_RATE: 16000,
  OPTIMAL_CHANNELS: 1,
  OPTIMAL_BITRATE: '128k',
  
  // File size limits (OpenAI Whisper API limits)
  MAX_FILE_SIZE: 26214400, // 25MB
  MIN_FILE_SIZE: 1000,     // 1KB minimum
  
  // Supported formats in order of preference
  SUPPORTED_FORMATS: [
    'webm', 'mp4', 'mp3', 'wav', 'ogg', 'm4a', 'aac'
  ],
  
  // Language detection confidence threshold
  LANGUAGE_CONFIDENCE_THRESHOLD: 0.7,
  
  // Whisper API parameters for best results
  API_PARAMS: {
    model: 'whisper-1',
    response_format: 'json',
    temperature: 0.1, // Lower for more consistent results
    language: null,   // Let Whisper auto-detect by default
  }
};

// Helper function to normalize language codes
function normalizeLanguageCode(language) {
  if (!language || language === 'auto') {
    return undefined; // Let Whisper auto-detect
  }
  
  const normalized = language.toLowerCase();
  const mappedLanguage = LANGUAGE_MAPPINGS[normalized];
  
  if (mappedLanguage !== undefined) {
    return mappedLanguage;
  }
  
  // If already a valid 2-letter code, return it
  if (/^[a-z]{2}$/.test(normalized)) {
    return normalized;
  }
  
  console.warn(`Unknown language code: ${language}, falling back to auto-detect`);
  return undefined;
}

// Helper function to normalize paths for Windows
function normalizePath(inputPath) {
  return path.resolve(inputPath).replace(/\\/g, '/');
}

/**
 * Enhanced audio conversion specifically optimized for Whisper API
 * Fixed for Windows path issues
 */
async function convertAudioForWhisper({ inputPath, outputPath, targetFormat = 'mp3' }) {
  return new Promise((resolve, reject) => {
    try {
      console.log(`🔄 Converting audio for Whisper: ${inputPath} -> ${outputPath}`);
      
      // Normalize paths for Windows compatibility
      const normalizedInputPath = normalizePath(inputPath);
      const normalizedOutputPath = normalizePath(outputPath);
      
      console.log(`📁 Normalized paths: ${normalizedInputPath} -> ${normalizedOutputPath}`);
      
      const ffmpegCommand = ffmpeg(normalizedInputPath)
        // Whisper-optimized audio settings - simplified to avoid filter issues
        .audioCodec(targetFormat === 'wav' ? 'pcm_s16le' : 'libmp3lame')
        .audioFrequency(WHISPER_CONFIG.OPTIMAL_SAMPLE_RATE)
        .audioChannels(WHISPER_CONFIG.OPTIMAL_CHANNELS)
        .audioBitrate(WHISPER_CONFIG.OPTIMAL_BITRATE)
        
        // Simplified audio filtering to avoid Windows issues
        .audioFilters([
          'highpass=f=80',      // Remove low-frequency noise
          'lowpass=f=8000',     // Remove high-frequency noise
          'volume=1.5'          // Boost volume slightly
        ])
        
        .output(normalizedOutputPath)
        
        // Enhanced event handling
        .on('start', (commandLine) => {
          console.log('🎵 FFmpeg started:', commandLine);
        })
        
        .on('progress', (progress) => {
          if (progress.percent) {
            console.log(`📊 Conversion progress: ${Math.round(progress.percent)}%`);
          }
        })
        
        .on('end', () => {
          try {
            // Validate output file
            if (!fs.existsSync(outputPath)) {
              throw new Error('Conversion completed but output file not found');
            }
            
            const stats = fs.statSync(outputPath);
            if (stats.size === 0) {
              throw new Error('Conversion produced empty file');
            }
            
            console.log(`✅ Whisper audio conversion completed: ${stats.size} bytes`);
            resolve(outputPath);
          } catch (error) {
            reject(error);
          }
        })
        
        .on('error', (error) => {
          console.error('❌ FFmpeg conversion error:', error);
          
          // Provide specific error guidance
          if (error.message.includes('No such file')) {
            reject(new Error('Input audio file not found or inaccessible'));
          } else if (error.message.includes('Permission denied')) {
            reject(new Error('Permission denied - check file permissions'));
          } else if (error.message.includes('Invalid data')) {
            reject(new Error('Invalid or corrupted audio file'));
          } else if (error.message.includes('Invalid argument') || error.message.includes('Error opening output')) {
            reject(new Error('File path error - Windows path issue detected'));
          } else {
            reject(new Error(`Audio conversion failed: ${error.message}`));
          }
        });

      // Set conversion timeout
      setTimeout(() => {
        ffmpegCommand.kill('SIGKILL');
        reject(new Error('Audio conversion timed out after 30 seconds'));
      }, 30000);

      ffmpegCommand.run();
      
    } catch (error) {
      reject(new Error(`Failed to start audio conversion: ${error.message}`));
    }
  });
}

/**
 * FIXED: Advanced language detection using Whisper's built-in capabilities
 * Now properly handles language code conversion
 */
async function detectLanguageWithWhisper({ audioPath, audioBuffer }) {
  try {
    console.log('🌐 Detecting language with Whisper...');
    
    let transcription;
    if (audioPath) {
      // Use file path
      transcription = await openaiClient.audio.transcriptions.create({
        file: fs.createReadStream(audioPath),
        model: 'whisper-1',
        response_format: 'verbose_json', // Get language detection info
        temperature: 0.0 // Most consistent results for detection
      });
    } else if (audioBuffer) {
      // Use buffer directly
      const tempFile = path.join('tmp', `lang_detect_${Date.now()}.webm`);
      fs.writeFileSync(tempFile, audioBuffer);
      
      try {
        transcription = await openaiClient.audio.transcriptions.create({
          file: fs.createReadStream(tempFile),
          model: 'whisper-1',
          response_format: 'verbose_json'
        });
      } finally {
        // Cleanup temp file
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    } else {
      throw new Error('No audio source provided for language detection');
    }
    
    // FIXED: Convert detected language to proper ISO-639-1 format
    const rawLanguage = transcription.language || 'en';
    const detectedLanguage = normalizeLanguageCode(rawLanguage) || 'en';
    const confidence = transcription.segments?.length > 0 ? 
      transcription.segments[0].no_speech_prob : 0;
    
    console.log(`✅ Language detected: ${detectedLanguage} (confidence: ${1 - confidence})`);
    
    return {
      language: detectedLanguage,
      confidence: 1 - confidence,
      text: transcription.text
    };
    
  } catch (error) {
    console.error('❌ Language detection failed:', error);
    return {
      language: 'en', // Fallback to English
      confidence: 0.5,
      text: null
    };
  }
}

/**
 * FIXED: Enhanced audio-to-text conversion using OpenAI Whisper API
 * Now properly handles language code formatting
 */
async function convertAudioToText({ audioData, mimeType, language = 'auto', options = {} }) {
  if (!openaiClient) {
    throw new Error("OpenAI client not initialized. Please check your API key.");
  }

  // Ensure tmp directory exists
const tmpDir = "/tmp"; // Use the absolute path for Vercel
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

  const timestamp = Date.now();
  const originalPath = path.join(tmpDir, `whisper_input_${timestamp}.webm`);
  const processedPath = path.join(tmpDir, `whisper_processed_${timestamp}.mp3`);

  try {
    console.log(`🎤 Processing audio for Whisper: ${audioData.length} bytes`);

    // Step 1: Validate audio data
    if (!audioData || audioData.length === 0) {
      throw new Error('Empty audio data provided');
    }

    if (audioData.length < WHISPER_CONFIG.MIN_FILE_SIZE) {
      throw new Error('Audio data too small - recording may be empty');
    }

    if (audioData.length > WHISPER_CONFIG.MAX_FILE_SIZE) {
      throw new Error('Audio data too large - please keep recordings under 25MB');
    }

    // Step 2: Write original audio to file
    fs.writeFileSync(originalPath, audioData);
    console.log(`💾 Original audio saved: ${originalPath} (${audioData.length} bytes)`);

    // Step 3: Convert audio to Whisper-optimized format
    try {
      await convertAudioForWhisper({
        inputPath: originalPath,
        outputPath: processedPath,
        targetFormat: 'mp3'
      });
    } catch (conversionError) {
      console.warn('⚠️ Audio conversion failed, trying direct approach:', conversionError.message);
      // Fallback: try using original file directly
      fs.copyFileSync(originalPath, processedPath);
    }

    // Step 4: Detect and normalize language
    let detectedLanguage = normalizeLanguageCode(language);
    if (language === 'auto' || !detectedLanguage) {
      try {
        const langResult = await detectLanguageWithWhisper({ audioPath: processedPath });
        detectedLanguage = langResult.confidence > WHISPER_CONFIG.LANGUAGE_CONFIDENCE_THRESHOLD ? 
          langResult.language : 'en';
        console.log(`🌐 Language auto-detected: ${detectedLanguage}`);
      } catch (langError) {
        console.warn('⚠️ Language detection failed, using English:', langError.message);
        detectedLanguage = 'en';
      }
    }

    // Step 5: Prepare Whisper API request with FIXED language parameter
    const whisperParams = {
      ...WHISPER_CONFIG.API_PARAMS,
      ...options,
      // FIXED: Only include language if it's a valid ISO-639-1 code
      ...(detectedLanguage && detectedLanguage !== 'auto' ? { language: detectedLanguage } : {}),
      prompt: options.prompt || generateContextualPrompt(detectedLanguage || 'en')
    };

    console.log('🤖 Sending to Whisper API with params:', {
      ...whisperParams,
      fileSize: fs.statSync(processedPath).size
    });

    // Step 6: Call Whisper API with retries and error handling
    let transcription;
    const maxRetries = 3;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Whisper API attempt ${attempt}/${maxRetries}`);
        
        transcription = await openaiClient.audio.transcriptions.create({
          file: fs.createReadStream(processedPath),
          ...whisperParams
        });

        console.log(`✅ Whisper API successful on attempt ${attempt}`);
        break;

      } catch (apiError) {
        lastError = apiError;
        console.error(`❌ Whisper API attempt ${attempt} failed:`, apiError.message);

        // Don't retry for certain errors
        if (apiError.status === 400 || apiError.status === 413) {
          throw apiError;
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    if (!transcription) {
      throw lastError || new Error('Whisper API failed after all retries');
    }

    // Step 7: Process transcription result
    const result = await enhanceTranscriptionResult(transcription, detectedLanguage || 'en', options);

    console.log(`✅ Transcription completed:`, {
      language: result.language,
      confidence: result.confidence,
      textLength: result.text.length,
      duration: result.duration
    });

    // FIXED: Return just the text string for backward compatibility with server.js
    return result.text;

  } catch (error) {
    console.error('❌ Whisper transcription failed:', error);
    throw enhanceErrorMessage(error);

  } finally {
    // Cleanup temporary files
    try {
      if (fs.existsSync(originalPath)) fs.unlinkSync(originalPath);
      if (fs.existsSync(processedPath)) fs.unlinkSync(processedPath);
      console.log('🧹 Cleaned up temporary files');
    } catch (cleanupError) {
      console.warn('⚠️ Cleanup warning:', cleanupError.message);
    }
  }
}

/**
 * Generate contextual prompts to improve Whisper accuracy
 * Based on language and common speech patterns
 */
function generateContextualPrompt(language) {
  const prompts = {
    'en': 'This is a conversational voice message. Please transcribe accurately with proper punctuation.',
    'es': 'Este es un mensaje de voz conversacional. Por favor transcribe con precisión.',
    'fr': 'Ceci est un message vocal conversationnel. Veuillez transcrire avec précision.',
    'de': 'Dies ist eine Unterhaltungs-Sprachnachricht. Bitte genau transkribieren.',
    'it': 'Questo è un messaggio vocale di conversazione. Si prega di trascrivere con precisione.',
    'pt': 'Esta é uma mensagem de voz conversacional. Por favor, transcreva com precisão.',
    'ru': 'Это разговорное голосовое сообщение. Пожалуйста, расшифруйте точно.',
    'ja': 'これは会話形式の音声メッセージです。正確に文字起こしをしてください。',
    'zh': '这是一条对话语音消息。请准确转录。',
    'ar': 'هذه رسالة صوتية محادثة. يرجى النسخ بدقة.',
    'hi': 'यह एक वार्तालाप ध्वनि संदेश है। कृपया सटीक रूप से लिखिए।'
  };

  return prompts[language] || prompts['en'];
}

/**
 * Enhance transcription result with additional metadata and validation
 */
async function enhanceTranscriptionResult(transcription, detectedLanguage, options = {}) {
  try {
    const text = transcription.text?.trim() || '';
    
    // Validate transcription quality
    if (!text) {
      throw new Error('Whisper returned empty transcription - no speech detected');
    }

    if (text.length < 2) {
      console.warn('⚠️ Very short transcription, may indicate audio quality issues');
    }

    // Extract additional metadata if available
    const result = {
      text: text,
      language: detectedLanguage,
      confidence: calculateConfidence(transcription, text),
      duration: transcription.duration || null,
      segments: transcription.segments || [],
      
      // Enhanced metadata
      metadata: {
        originalLanguage: transcription.language || detectedLanguage,
        processingTime: Date.now(),
        wordCount: text.split(/\s+/).length,
        hasMultipleSentences: text.includes('.') || text.includes('!') || text.includes('?'),
        detectedSpeech: text.length > 0,
        qualityScore: assessTranscriptionQuality(text, transcription)
      }
    };

    // Post-process text based on language
    result.text = postProcessTranscription(result.text, detectedLanguage);

    return result;

  } catch (error) {
    throw new Error(`Transcription enhancement failed: ${error.message}`);
  }
}

/**
 * Calculate confidence score from Whisper response
 */
function calculateConfidence(transcription, text) {
  try {
    if (transcription.segments && transcription.segments.length > 0) {
      // Average confidence from all segments
      const totalConfidence = transcription.segments.reduce((sum, segment) => {
        return sum + (1 - (segment.no_speech_prob || 0));
      }, 0);
      return totalConfidence / transcription.segments.length;
    }

    // Fallback confidence based on text characteristics
    if (text.length === 0) return 0;
    if (text.length < 5) return 0.3;
    if (text.length < 20) return 0.6;
    return 0.8;

  } catch (error) {
    return 0.5; // Default confidence
  }
}

/**
 * Assess transcription quality based on various factors
 */
function assessTranscriptionQuality(text, transcription) {
  try {
    let score = 0.5; // Base score

    // Length factor
    if (text.length > 10) score += 0.1;
    if (text.length > 50) score += 0.1;

    // Structure factor
    if (text.includes(' ')) score += 0.1; // Has spaces (multiple words)
    if (/[.!?]/.test(text)) score += 0.1;  // Has punctuation

    // Segment quality (if available)
    if (transcription.segments && transcription.segments.length > 0) {
      const avgNoSpeechProb = transcription.segments.reduce((sum, seg) => 
        sum + (seg.no_speech_prob || 0), 0) / transcription.segments.length;
      score += (1 - avgNoSpeechProb) * 0.2;
    }

    // Repetition penalty
    const words = text.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    if (words.length > 0) {
      const uniqueness = uniqueWords.size / words.length;
      score += uniqueness * 0.1;
    }

    return Math.min(Math.max(score, 0), 1);

  } catch (error) {
    return 0.5;
  }
}

/**
 * Post-process transcription based on language-specific rules
 */
function postProcessTranscription(text, language) {
  let processed = text.trim();

  // Common post-processing for all languages
  processed = processed.replace(/\s+/g, ' '); // Normalize whitespace
  processed = processed.replace(/^\w/, c => c.toUpperCase()); // Capitalize first letter

  // Language-specific post-processing
  switch (language) {
    case 'en':
      // Fix common English transcription issues
      processed = processed.replace(/\bi\b/g, 'I'); // Capitalize "I"
      processed = processed.replace(/\bim\b/gi, "I'm"); // Fix "im" to "I'm"
      break;

    case 'es':
      // Fix Spanish-specific issues
      processed = processed.replace(/\bq\b/g, 'que'); // Common transcription error
      break;

    case 'fr':
      // Fix French-specific issues
      processed = processed.replace(/\bje\b/g, 'Je'); // Capitalize "Je" at start
      break;

    // Add more language-specific rules as needed
  }

  // Ensure proper sentence ending
  if (processed.length > 0 && !/[.!?]$/.test(processed)) {
    processed += '.';
  }

  return processed;
}

/**
 * Enhance error messages with specific guidance
 */
function enhanceErrorMessage(error) {
  const message = error.message || 'Unknown error';
  
  if (error.status === 400) {
    return new Error('Invalid audio format or corrupted file. Please try recording again.');
  }
  
  if (error.status === 413) {
    return new Error('Audio file too large (max 25MB). Please record a shorter message.');
  }
  
  if (error.status === 429) {
    return new Error('Too many requests. Please wait a moment and try again.');
  }
  
  if (error.status === 401 || error.status === 403) {
    return new Error('OpenAI API authentication failed. Please check your API key.');
  }
  
  if (message.includes('ENOENT') || message.includes('no such file')) {
    return new Error('Audio file processing failed. Please try recording again.');
  }
  
  if (message.includes('timeout')) {
    return new Error('Audio processing timed out. Please try a shorter recording.');
  }
  
  if (message.includes('empty')) {
    return new Error('No speech detected in audio. Please speak clearly into your microphone.');
  }
  
  if (message.includes('File path error') || message.includes('Windows path issue')) {
    return new Error('File system error. Please try again or check permissions.');
  }
  
  return new Error(`Speech recognition failed: ${message}`);
}

/**
 * FIXED: Simplified fallback method for basic audio-to-text conversion
 * Returns string instead of object and uses proper language codes
 */
async function convertAudioToTextWithFallback({ audioData, mimeType, language = 'auto' }) {
  try {
    // Try enhanced method first
    const result = await convertAudioToText({ audioData, mimeType, language });
    return result; // Already a string now
  } catch (error) {
    console.error('❌ Enhanced method failed, trying basic approach:', error);
    
    // Fallback to basic conversion
    return await basicAudioToText({ audioData, mimeType });
  }
}

/**
 * FIXED: Basic audio-to-text conversion (fallback method)
 * Returns string directly and doesn't use language parameter to avoid errors
 */
async function basicAudioToText({ audioData, mimeType }) {
  if (!openaiClient) {
    throw new Error("OpenAI client not initialized");
  }

 // Ensure tmp directory exists
const tmpDir = "/tmp"; // Use the absolute path for Vercel
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

  const timestamp = Date.now();
  const inputPath = path.join(tmpDir, `basic_input_${timestamp}.webm`);

  try {
    // Write audio data
    fs.writeFileSync(inputPath, audioData);
    
    // Simple Whisper API call WITHOUT language parameter to avoid errors
    const transcription = await openaiClient.audio.transcriptions.create({
      file: fs.createReadStream(inputPath),
      model: 'whisper-1',
      response_format: 'text' // This returns a string directly
    });

    return transcription.trim();

  } finally {
    // Cleanup
    if (fs.existsSync(inputPath)) {
      fs.unlinkSync(inputPath);
    }
  }
}

export { 
  convertAudioToText, 
  convertAudioToTextWithFallback,
  detectLanguageWithWhisper,
  convertAudioForWhisper,
  WHISPER_CONFIG 
};
