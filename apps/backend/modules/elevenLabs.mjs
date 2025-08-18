import axios from "axios";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY;
const voiceID = process.env.ELEVEN_LABS_VOICE_ID;
const modelID = process.env.ELEVEN_LABS_MODEL_ID || "eleven_multilingual_v2";

// Updated API base URL according to latest documentation
const ELEVENLABS_API_BASE = "https://api.elevenlabs.io/v1";

// FIXED: Model compatibility checker for language codes
const MODEL_LANGUAGE_SUPPORT = {
  'eleven_multilingual_v2': {
    supportsLanguageCode: false, // FIXED: This model does NOT support language_code parameter
    supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'pl', 'hi', 'ar', 'zh', 'ja', 'ko']
  },
  'eleven_multilingual_v1': {
    supportsLanguageCode: false,
    supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'pl']
  },
  'eleven_monolingual_v1': {
    supportsLanguageCode: false,
    supportedLanguages: ['en']
  },
  'eleven_english_v1': {
    supportsLanguageCode: false,
    supportedLanguages: ['en']
  }
};

// Function to check if model supports language codes
function modelSupportsLanguageCode(modelId) {
  const modelInfo = MODEL_LANGUAGE_SUPPORT[modelId];
  return modelInfo ? modelInfo.supportsLanguageCode : false;
}

// Function to get available voices and validate voice ID
async function getVoices() {
  if (!elevenLabsApiKey) {
    throw new Error("ElevenLabs API key is not configured");
  }

  try {
    const response = await axios.get(`${ELEVENLABS_API_BASE}/voices`, {
      headers: {
        'xi-api-key': elevenLabsApiKey,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching voices:", error.response?.data || error.message);
    throw error;
  }
}

// Function to validate voice ID
async function validateVoiceId(voiceId) {
  try {
    const voices = await getVoices();
    const voice = voices.voices?.find(v => v.voice_id === voiceId);
    
    if (!voice) {
      console.warn(`Voice ID ${voiceId} not found. Available voices:`, 
        voices.voices?.map(v => ({ name: v.name, id: v.voice_id })));
      
      // Return a default voice if available
      const defaultVoice = voices.voices?.[0];
      if (defaultVoice) {
        console.log(`Using default voice: ${defaultVoice.name} (${defaultVoice.voice_id})`);
        return defaultVoice.voice_id;
      }
    }
    
    return voiceId;
  } catch (error) {
    console.error("Could not validate voice ID:", error.message);
    return voiceId; // Return original if validation fails
  }
}

// FIXED: Updated text-to-speech function with proper language handling
async function convertTextToSpeech({ text, fileName, language = 'en' }) {
  if (!elevenLabsApiKey) {
    throw new Error("ElevenLabs API key is not configured");
  }

  if (!text || text.trim() === '') {
    throw new Error("Text is required for speech conversion");
  }

  try {
    // Validate and potentially correct the voice ID
    const validVoiceId = await validateVoiceId(voiceID);
    
    if (!validVoiceId) {
      throw new Error("No valid voice ID available");
    }

    // Updated API endpoint according to latest documentation
    const url = `${ELEVENLABS_API_BASE}/text-to-speech/${validVoiceId}`;
    
    // FIXED: Check if model supports language_code parameter
    const supportsLanguageCode = modelSupportsLanguageCode(modelID);
    
    // FIXED: Build request payload based on model capabilities
    const requestData = {
      text: text.trim(),
      model_id: modelID,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5,
        style: 1,
        use_speaker_boost: true
      }
      // REMOVED: language_code parameter as eleven_multilingual_v2 doesn't support it
      // The model will auto-detect the language from the text content
    };

    console.log(`Making TTS request to: ${url}`);
    console.log(`Request data:`, JSON.stringify(requestData, null, 2));

    const response = await axios({
      method: 'post',
      url: url,
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': elevenLabsApiKey
      },
      data: requestData,
      responseType: 'arraybuffer', // Changed from 'stream' to 'arraybuffer'
      timeout: 30000 // 30 second timeout
    });

    // Write the audio file
    if (fileName) {
      fs.writeFileSync(fileName, response.data);
      console.log(`Audio saved to: ${fileName}`);
    }

    return response.data;

  } catch (error) {
    console.error("ElevenLabs API Error Details:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method
    });

    // FIXED: Handle the specific language_code error
    if (error.response?.status === 400 && error.response?.data) {
      const errorData = error.response.data;
      let errorMessage = 'Bad request';
      
      try {
        // Parse error data if it's a buffer or string
        let parsedError = errorData;
        if (Buffer.isBuffer(errorData)) {
          parsedError = JSON.parse(errorData.toString());
        } else if (typeof errorData === 'string') {
          parsedError = JSON.parse(errorData);
        }
        
        if (parsedError.detail?.status === 'model_does_not_support_language_code_parameter') {
          console.log('FIXED: Model does not support language_code parameter - this is now handled');
          // This should not happen anymore with our fix, but just in case
          throw new Error('Model configuration error - language code parameter not supported');
        }
        
        errorMessage = parsedError.detail?.message || parsedError.message || errorMessage;
      } catch (parseError) {
        console.warn('Could not parse error response:', parseError.message);
      }
      
      throw new Error(`Bad request: ${errorMessage}`);
    }

    // Provide specific error messages for other cases
    if (error.response?.status === 404) {
      throw new Error(`Voice ID "${voiceID}" not found. Please check your ELEVEN_LABS_VOICE_ID in your .env file.`);
    } else if (error.response?.status === 401) {
      throw new Error("Invalid ElevenLabs API key. Please check your ELEVEN_LABS_API_KEY in your .env file.");
    } else if (error.response?.status === 429) {
      throw new Error("ElevenLabs API rate limit exceeded. Please try again later.");
    }

    throw new Error(`ElevenLabs API error: ${error.message}`);
  }
}

// FIXED: Enhanced text-to-speech with automatic retry without language_code
async function convertTextToSpeechWithRetry({ text, fileName, language = 'en', maxRetries = 3 }) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`TTS attempt ${attempt}/${maxRetries} for: "${text.substring(0, 50)}..."`);
      
      const result = await convertTextToSpeech({ text, fileName, language });
      console.log(`✅ TTS successful on attempt ${attempt}`);
      return result;
      
    } catch (error) {
      lastError = error;
      console.error(`❌ TTS attempt ${attempt} failed:`, error.message);
      
      // Don't retry for certain errors
      if (error.message.includes('API key') || error.message.includes('Voice ID')) {
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('TTS failed after all retries');
}

// Function to get voice settings
async function getVoiceSettings(voiceId) {
  if (!elevenLabsApiKey) {
    throw new Error("ElevenLabs API key is not configured");
  }

  try {
    const response = await axios.get(`${ELEVENLABS_API_BASE}/voices/${voiceId}/settings`, {
      headers: {
        'xi-api-key': elevenLabsApiKey,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching voice settings:", error.response?.data || error.message);
    throw error;
  }
}

// FIXED: Enhanced voice object with retry capability
const voice = {
  textToSpeech: convertTextToSpeech,
  textToSpeechWithRetry: convertTextToSpeechWithRetry,
  getVoices,
  getVoiceSettings
};

export { convertTextToSpeech, convertTextToSpeechWithRetry, voice, getVoices, validateVoiceId, getVoiceSettings };