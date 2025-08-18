// Fixed rhubarbLipSync.mjs with corrected variable references and error handling
import { execCommand } from "../utils/files.mjs";
import fs from "fs";
import path from "path";

// Language-specific Rhubarb configurations and phoneme mappings
const LANGUAGE_CONFIGS = {
  en: {
    rhubarbArgs: '-r phonetic --threads 4',
    phoneticModel: 'english',
    confidenceThreshold: 0.7,
    smoothingFactor: 0.3
  },
  es: {
    rhubarbArgs: '-r phonetic --threads 4',
    phoneticModel: 'spanish',
    confidenceThreshold: 0.6,
    smoothingFactor: 0.4
  },
  fr: {
    rhubarbArgs: '-r phonetic --threads 4',
    phoneticModel: 'french', 
    confidenceThreshold: 0.6,
    smoothingFactor: 0.4
  },
  de: {
    rhubarbArgs: '-r phonetic --threads 4',
    phoneticModel: 'german',
    confidenceThreshold: 0.6,
    smoothingFactor: 0.35
  },
  it: {
    rhubarbArgs: '-r phonetic --threads 4',
    phoneticModel: 'italian',
    confidenceThreshold: 0.65,
    smoothingFactor: 0.35
  },
  pt: {
    rhubarbArgs: '-r phonetic --threads 4',
    phoneticModel: 'portuguese',
    confidenceThreshold: 0.6,
    smoothingFactor: 0.4
  },
  ru: {
    rhubarbArgs: '-r phonetic --threads 4',
    phoneticModel: 'russian',
    confidenceThreshold: 0.5,
    smoothingFactor: 0.5
  },
  ja: {
    rhubarbArgs: '-r phonetic --threads 4',
    phoneticModel: 'japanese', 
    confidenceThreshold: 0.5,
    smoothingFactor: 0.6
  },
  zh: {
    rhubarbArgs: '-r phonetic --threads 4',
    phoneticModel: 'mandarin',
    confidenceThreshold: 0.5,
    smoothingFactor: 0.5
  },
  ar: {
    rhubarbArgs: '-r phonetic --threads 4',
    phoneticModel: 'arabic',
    confidenceThreshold: 0.4,
    smoothingFactor: 0.6
  },
  hi: {
    rhubarbArgs: '-r phonetic --threads 4',
    phoneticModel: 'hindi',
    confidenceThreshold: 0.5,
    smoothingFactor: 0.5
  }
};

// Advanced phoneme-to-viseme mapping for different languages
const PHONEME_VISEME_MAPPING = {
  // English phonemes
  en: {
    // Consonants
    'p': 'A', 'b': 'A', 'm': 'A',           // Bilabial
    'f': 'G', 'v': 'G',                      // Labiodental
    'th': 'H', 'dh': 'H',                    // Dental
    't': 'C', 'd': 'C', 'n': 'C', 'l': 'C', 'r': 'C', // Alveolar
    's': 'C', 'z': 'C',                      // Sibilants
    'sh': 'C', 'zh': 'C', 'ch': 'C', 'jh': 'C', // Post-alveolar
    'k': 'B', 'g': 'B', 'ng': 'B',          // Velar
    'y': 'C', 'w': 'F', 'h': 'C',           // Approximants
    
    // Vowels
    'aa': 'D', 'ae': 'D', 'ah': 'D',        // Open vowels
    'ao': 'E', 'ow': 'E',                    // Back rounded
    'uw': 'F', 'uh': 'F',                    // Close rounded
    'ih': 'E', 'iy': 'E', 'eh': 'E', 'ey': 'E', // Front vowels
    'ax': 'D', 'er': 'C',                    // Central vowels
    'sil': 'A', 'sp': 'A'                    // Silence
  },

  // Spanish phonemes
  es: {
    // Consonantes
    'p': 'A', 'b': 'A', 'm': 'A',
    'f': 'G', 'v': 'G', 
    't': 'C', 'd': 'C', 'n': 'C', 'l': 'C', 'r': 'C', 'rr': 'C',
    's': 'C', 'z': 'C', 'th': 'H',
    'ch': 'C', 'y': 'C', 'll': 'C', 'ñ': 'C',
    'k': 'B', 'g': 'B', 'j': 'B', 'x': 'B',
    'w': 'F',
    
    // Vocales
    'a': 'D', 'e': 'E', 'i': 'E', 'o': 'E', 'u': 'F',
    'sil': 'A'
  },

  // French phonemes
  fr: {
    // Consonnes
    'p': 'A', 'b': 'A', 'm': 'A',
    'f': 'G', 'v': 'G',
    't': 'C', 'd': 'C', 'n': 'C', 'l': 'C', 'r': 'C',
    's': 'C', 'z': 'C', 'sh': 'C', 'zh': 'C',
    'k': 'B', 'g': 'B',
    'y': 'C', 'w': 'F', 'gn': 'C',
    
    // Voyelles
    'a': 'D', 'e': 'E', 'i': 'E', 'o': 'E', 'u': 'F', 'y': 'F',
    'an': 'D', 'on': 'E', 'in': 'E', 'un': 'F', // Nasales
    'eu': 'F', 'ou': 'F',
    'sil': 'A'
  },

  // Default fallback
  default: {
    'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D', 'E': 'E', 'F': 'F', 'G': 'G', 'H': 'H', 'X': 'A'
  }
};

// Advanced emotion-based phoneme intensity modifiers
const EMOTION_PHONEME_MODIFIERS = {
  happy: {
    vowelIntensity: 1.2,
    consonantSharpness: 1.1,
    smileInfluence: 0.3
  },
  sad: {
    vowelIntensity: 0.8,
    consonantSharpness: 0.9,
    droopInfluence: 0.4
  },
  angry: {
    vowelIntensity: 1.3,
    consonantSharpness: 1.4,
    tensionInfluence: 0.5
  },
  surprised: {
    vowelIntensity: 1.1,
    consonantSharpness: 1.2,
    openingInfluence: 0.4
  },
  fear: {
    vowelIntensity: 0.9,
    consonantSharpness: 1.1,
    tensionInfluence: 0.3
  },
  default: {
    vowelIntensity: 1.0,
    consonantSharpness: 1.0,
    neutralInfluence: 0.0
  }
};

const getPhonemes = async ({ message, language = 'en', emotion = 'default', text = '' }) => {
  // --- VERCEL COMPATIBILITY FIX ---
  // Vercel cannot run the ffmpeg and rhubarb binaries, so we will ALWAYS use the fallback.
  // This ensures the application runs smoothly in a serverless environment.

  try {
    const outputJsonPath = path.join('/tmp', `message_${message}.json`); // Use absolute path
    console.log(`[Vercel Fix] Bypassing binaries and creating advanced fallback directly for message ${message}`);
    await createAdvancedFallback(message, language, emotion, text, outputJsonPath);
  } catch (error) {
    console.error(`[Vercel Fix] Error creating advanced fallback for message ${message}:`, error);
    const outputJsonPath = path.join('/tmp', `message_${message}.json`); // Use absolute path
    await createEmergencyFallback(message, outputJsonPath);
  }
};

// Language-specific FFmpeg command builder
const getLanguageSpecificFFmpegCommand = (language, inputPath, outputPath) => {
  const baseCommand = process.platform === 'win32' 
    ? `ffmpeg -y -i "${inputPath}"` 
    : `ffmpeg -y -i ${inputPath}`;
    
  const langFilters = {
    'en': '-ar 22050 -ac 1 -acodec pcm_s16le',
    'es': '-ar 22050 -ac 1 -acodec pcm_s16le -af "highpass=f=80,lowpass=f=8000"',
    'fr': '-ar 22050 -ac 1 -acodec pcm_s16le -af "highpass=f=85,lowpass=f=7800"',
    'de': '-ar 22050 -ac 1 -acodec pcm_s16le -af "highpass=f=90,lowpass=f=8200"',
    'it': '-ar 22050 -ac 1 -acodec pcm_s16le -af "highpass=f=80,lowpass=f=7600"',
    'pt': '-ar 22050 -ac 1 -acodec pcm_s16le -af "highpass=f=75,lowpass=f=7400"',
    'ru': '-ar 16000 -ac 1 -acodec pcm_s16le -af "highpass=f=95,lowpass=f=8500"',
    'ja': '-ar 16000 -ac 1 -acodec pcm_s16le -af "highpass=f=70,lowpass=f=7000"',
    'zh': '-ar 16000 -ac 1 -acodec pcm_s16le -af "highpass=f=70,lowpass=f=7200"',
    'ar': '-ar 16000 -ac 1 -acodec pcm_s16le -af "highpass=f=85,lowpass=f=7800"',
    'hi': '-ar 16000 -ac 1 -acodec pcm_s16le -af "highpass=f=75,lowpass=f=7600"'
  };
  
  const filters = langFilters[language] || langFilters['en'];
  const outputArg = process.platform === 'win32' ? `"${outputPath}"` : outputPath;
  
  return `${baseCommand} ${filters} ${outputArg}`;
};

// Find Rhubarb executable with multiple fallback paths
const findRhubarbExecutable = () => {
  const possiblePaths = [
    './bin/rhubarb.exe',
    './bin/rhubarb',
    'rhubarb.exe',
    'rhubarb',
    '/usr/local/bin/rhubarb',
    '/opt/rhubarb/bin/rhubarb'
  ];
  
  for (const rhubarbPath of possiblePaths) {
    try {
      if (fs.existsSync(rhubarbPath)) {
        console.log(`Found Rhubarb at: ${rhubarbPath}`);
        return rhubarbPath;
      }
    } catch (error) {
      // Continue checking other paths
    }
  }
  
  console.warn("Rhubarb executable not found in any of the expected locations");
  return null;
};

// Build enhanced Rhubarb command with language support
const buildRhubarbCommand = (rhubarbPath, wavPath, jsonPath, text, langConfig) => {
  const baseCommand = process.platform === 'win32' 
    ? `"${rhubarbPath}"` 
    : rhubarbPath;
  
  // Basic args that work with most Rhubarb versions
  const args = [
    `-f json`,
    `-r phonetic`,
    `--threads 4`,
    `-o "${jsonPath}"`,
    `"${wavPath}"`
  ];
  
  // Add text dialog if provided, but as a separate file for better compatibility
  if (text && text.trim() && text.length < 500) {
    const dialogPath = path.join('/tmp', `dialog_${Date.now()}.txt`);
    try {
      fs.writeFileSync(dialogPath, text.trim());
      args.push(`-d "${dialogPath}"`);
      
      // Clean up dialog file after processing
      setTimeout(() => {
        try {
          if (fs.existsSync(dialogPath)) {
            fs.unlinkSync(dialogPath);
          }
        } catch (cleanupError) {
          console.warn("Could not cleanup dialog file:", cleanupError.message);
        }
      }, 10000); // 10 seconds cleanup delay
      
    } catch (error) {
      console.warn("Could not create dialog file:", error.message);
    }
  }
  
  return `${baseCommand} ${args.join(' ')}`;
};

// Enhanced phoneme result post-processing
const enhancePhonemeResults = async (jsonPath, language, emotion, text) => {
  try {
    if (!fs.existsSync(jsonPath)) {
      throw new Error("Rhubarb output file not found");
    }
    
    const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    if (!rawData || !rawData.mouthCues) {
      throw new Error("Invalid Rhubarb output format");
    }
    
    const enhancedData = processPhonemeData(rawData, language, emotion, text);
    
    fs.writeFileSync(jsonPath, JSON.stringify(enhancedData, null, 2));
    console.log(`Enhanced phoneme data saved for ${language} with ${emotion} emotion`);
    
  } catch (error) {
    console.error("Error enhancing phoneme results:", error);
    throw error;
  }
};

// Advanced phoneme data processing with multilingual and emotion support
const processPhonemeData = (rawData, language, emotion, text) => {
  const phoneMapping = PHONEME_VISEME_MAPPING[language] || PHONEME_VISEME_MAPPING.default;
  const emotionModifier = EMOTION_PHONEME_MODIFIERS[emotion] || EMOTION_PHONEME_MODIFIERS.default;
  
  const enhancedCues = rawData.mouthCues.map((cue, index) => {
    let enhancedCue = { ...cue };
    
    // Map phoneme to appropriate viseme for the language
    const phoneme = cue.value;
    const mappedViseme = phoneMapping[phoneme.toLowerCase()] || phoneMapping[phoneme] || cue.value;
    enhancedCue.value = mappedViseme;
    
    // Apply emotion-based intensity modifications
    const duration = cue.end - cue.start;
    const isVowel = ['D', 'E', 'F'].includes(mappedViseme);
    const isConsonant = ['B', 'C', 'G', 'H'].includes(mappedViseme);
    
    // Emotion-based modifications
    if (isVowel) {
      enhancedCue.intensity = (enhancedCue.intensity || 1.0) * emotionModifier.vowelIntensity;
    }
    
    if (isConsonant) {
      enhancedCue.sharpness = (enhancedCue.sharpness || 1.0) * emotionModifier.consonantSharpness;
    }
    
    // Language-specific timing adjustments
    enhancedCue = applyLanguageTimingAdjustments(enhancedCue, language, duration);
    
    // Smoothing for better transitions
    if (index > 0) {
      enhancedCue = applySmoothingTransitions(enhancedCue, rawData.mouthCues[index - 1], language);
    }
    
    return enhancedCue;
  });
  
  return {
    ...rawData,
    mouthCues: enhancedCues,
    metadata: {
      ...rawData.metadata,
      language: language,
      emotion: emotion,
      enhanced: true,
      originalText: text,
      processingTimestamp: new Date().toISOString()
    }
  };
};

// Language-specific timing adjustments
const applyLanguageTimingAdjustments = (cue, language, duration) => {
  const timingAdjustments = {
    'es': { multiplier: 1.1, minimumDuration: 0.05 },
    'fr': { multiplier: 0.95, minimumDuration: 0.06 },
    'de': { multiplier: 0.9, minimumDuration: 0.07 },
    'it': { multiplier: 1.05, minimumDuration: 0.05 },
    'pt': { multiplier: 1.1, minimumDuration: 0.05 },
    'ru': { multiplier: 0.85, minimumDuration: 0.08 },
    'ja': { multiplier: 1.2, minimumDuration: 0.04 },
    'zh': { multiplier: 1.15, minimumDuration: 0.04 },
    'ar': { multiplier: 0.9, minimumDuration: 0.06 },
    'hi': { multiplier: 1.0, minimumDuration: 0.05 },
    'en': { multiplier: 1.0, minimumDuration: 0.05 }
  };
  
  const adjustment = timingAdjustments[language] || timingAdjustments.en;
  const adjustedDuration = Math.max(duration * adjustment.multiplier, adjustment.minimumDuration);
  
  return {
    ...cue,
    end: cue.start + adjustedDuration,
    languageTiming: adjustment.multiplier
  };
};

// Smoothing transitions between phonemes
const applySmoothingTransitions = (currentCue, previousCue, language) => {
  const langConfig = LANGUAGE_CONFIGS[language] || LANGUAGE_CONFIGS.en;
  const smoothingFactor = langConfig.smoothingFactor;
  
  // Apply smoothing based on viseme similarity
  const similarVisemes = [
    ['D', 'E'], ['E', 'F'], ['B', 'C'], ['G', 'H']
  ];
  
  const areSimilar = similarVisemes.some(group => 
    group.includes(currentCue.value) && group.includes(previousCue.value)
  );
  
  if (areSimilar) {
    const transitionGap = currentCue.start - previousCue.end;
    if (transitionGap < 0.02) { // Very short gap
      currentCue.smoothTransition = smoothingFactor;
      currentCue.blendFromPrevious = true;
    }
  }
  
  return currentCue;
};

// Advanced fallback with language and emotion awareness
const createAdvancedFallback = async (message, language, emotion, text, jsonPath) => {
  console.log(`Creating advanced fallback for ${language} with ${emotion} emotion`);
  
  const duration = estimateTextDuration(text, language);
  const emotionModifier = EMOTION_PHONEME_MODIFIERS[emotion] || EMOTION_PHONEME_MODIFIERS.default;
  
  // Create language-specific fallback pattern
  const fallbackPattern = createLanguageFallbackPattern(language, emotion, duration);
  
  const fallbackData = {
    metadata: {
      soundFile: `audios/message_${message}.wav`,
      duration: duration,
      language: language,
      emotion: emotion,
      fallback: true,
      advanced: true,
      confidence: 0.6
    },
    mouthCues: fallbackPattern.map(cue => ({
      ...cue,
      intensity: (cue.intensity || 1.0) * emotionModifier.vowelIntensity,
      emotionInfluence: emotion
    }))
  };
  
  try {
    fs.writeFileSync(jsonPath, JSON.stringify(fallbackData, null, 2));
    console.log(`Advanced fallback created for message ${message}`);
  } catch (error) {
    console.error("Error creating advanced fallback:", error);
    await createEmergencyFallback(message, jsonPath);
  }
};

// Estimate text duration based on language characteristics
const estimateTextDuration = (text, language) => {
  if (!text) return 1.0;
  
  const langSpeeds = {
    'en': 0.08, 'es': 0.09, 'fr': 0.07, 'de': 0.06, 'it': 0.08,
    'pt': 0.09, 'ru': 0.05, 'ja': 0.12, 'zh': 0.10, 'ar': 0.07, 'hi': 0.08
  };
  
  const speed = langSpeeds[language] || langSpeeds.en;
  return Math.max(text.length * speed, 0.5);
};

// Create sophisticated fallback patterns
const createLanguageFallbackPattern = (language, emotion, duration) => {
  const patterns = {
    en: [
      { start: 0.0, end: duration * 0.3, value: "D" },
      { start: duration * 0.3, end: duration * 0.6, value: "C" },
      { start: duration * 0.6, end: duration, value: "A" }
    ],
    es: [
      { start: 0.0, end: duration * 0.4, value: "D", intensity: 1.1 },
      { start: duration * 0.4, end: duration * 0.7, value: "E", intensity: 1.0 },
      { start: duration * 0.7, end: duration, value: "A", intensity: 0.8 }
    ],
    fr: [
      { start: 0.0, end: duration * 0.35, value: "F", intensity: 0.9 },
      { start: duration * 0.35, end: duration * 0.65, value: "E", intensity: 1.0 },
      { start: duration * 0.65, end: duration, value: "A", intensity: 0.7 }
    ],
    de: [
      { start: 0.0, end: duration * 0.4, value: "C", intensity: 1.2 },
      { start: duration * 0.4, end: duration * 0.7, value: "D", intensity: 1.0 },
      { start: duration * 0.7, end: duration, value: "A", intensity: 0.8 }
    ]
  };
  
  return patterns[language] || patterns.en;
};

// Emergency fallback
const createEmergencyFallback = async (message, jsonPath) => {
  const emergencyData = {
    metadata: {
      soundFile: `audios/message_${message}.wav`,
      duration: 1.0,
      emergency: true
    },
    mouthCues: [
      { start: 0.0, end: 1.0, value: "A", intensity: 0.5 }
    ]
  };
  
  try {
    fs.writeFileSync(jsonPath, JSON.stringify(emergencyData, null, 2));
    console.log(`Emergency fallback created for message ${message}`);
  } catch (error) {
    console.error("Failed to create emergency fallback:", error);
  }
};

export { getPhonemes };
