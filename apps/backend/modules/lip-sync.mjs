import { convertTextToSpeech } from "./elevenLabs.mjs";
import { getPhonemes } from "./rhubarbLipSync.mjs";
import { readJsonTranscript, audioFileToBase64 } from "../utils/files.mjs";
<<<<<<< HEAD
import path from "path";
=======

>>>>>>> fdb21236b05179a4ebd4c38ae730d678a534f851
const MAX_RETRIES = 10;
const RETRY_DELAY = 100; // Increased delay for better rate limiting

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Enhanced language detection for lip sync optimization
const detectLanguageFromText = (text) => {
  const cleanText = text.toLowerCase().replace(/[^\p{L}\s]/gu, '');
  
  // Character-based detection for non-Latin scripts
  if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja';
  if (/[\u0600-\u06ff]/.test(text)) return 'ar';
  if (/[\u0900-\u097f]/.test(text)) return 'hi';
  if (/[\u0400-\u04ff]/.test(text)) return 'ru';
  
  // European languages pattern matching
  const languagePatterns = {
    es: {
      words: ['el', 'la', 'de', 'que', 'y', 'en', 'un', 'es', 'se', 'no'],
      patterns: [/ñ/, /ción$/, /¿/, /¡/]
    },
    fr: {
      words: ['le', 'de', 'et', 'à', 'un', 'il', 'que', 'pour', 'dans'],
      patterns: [/ç/, /è/, /é/, /ê/, /à/, /â/]
    },
    de: {
      words: ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das'],
      patterns: [/ß/, /ä/, /ö/, /ü/, /sch/]
    },
    it: {
      words: ['il', 'di', 'che', 'e', 'la', 'per', 'un', 'in'],
      patterns: [/gli/, /gn/, /zione$/]
    },
    pt: {
      words: ['o', 'de', 'a', 'e', 'do', 'da', 'em', 'um'],
      patterns: [/ã/, /õ/, /ç/, /lh/, /nh/]
    }
  };
  
  const words = cleanText.split(/\s+/);
  let maxScore = 0;
  let detectedLang = 'en';
  
  Object.entries(languagePatterns).forEach(([lang, config]) => {
    let score = 0;
    score += words.filter(word => config.words.includes(word)).length * 3;
    config.patterns.forEach(pattern => {
      score += (cleanText.match(pattern) || []).length * 2;
    });
    
    if (score > maxScore) {
      maxScore = score;
      detectedLang = lang;
    }
  });
  
  return maxScore >= 2 ? detectedLang : 'en';
};

// Enhanced text preprocessing for different languages
const preprocessTextForLanguage = (text, language) => {
  let processedText = text.trim();
  
  // Language-specific text preprocessing
  switch (language) {
    case 'es':
      // Spanish preprocessing: handle special characters and pronunciation
      processedText = processedText
        .replace(/ñ/g, 'ny')
        .replace(/ll/g, 'y')
        .replace(/rr/g, 'r')
        .replace(/ü/g, 'u');
      break;
      
    case 'fr':
      // French preprocessing: handle silent letters and liaisons
      processedText = processedText
        .replace(/ph/g, 'f')
        .replace(/th/g, 't')
        .replace(/ch/g, 'sh')
        .replace(/gn/g, 'ny')
        .replace(/ç/g, 's');
      break;
      
    case 'de':
      // German preprocessing: handle compound words and special sounds
      processedText = processedText
        .replace(/ß/g, 'ss')
        .replace(/sch/g, 'sh')
        .replace(/tsch/g, 'ch')
        .replace(/pf/g, 'pf')
        .replace(/ü/g, 'ue')
        .replace(/ö/g, 'oe')
        .replace(/ä/g, 'ae');
      break;
      
    case 'it':
      // Italian preprocessing: handle double consonants and special combinations
      processedText = processedText
        .replace(/gl/g, 'ly')
        .replace(/gn/g, 'ny')
        .replace(/sc([ei])/g, 'sh$1')
        .replace(/ch/g, 'k')
        .replace(/gh/g, 'g');
      break;
      
    case 'pt':
      // Portuguese preprocessing: handle nasal sounds and special characters
      processedText = processedText
        .replace(/nh/g, 'ny')
        .replace(/lh/g, 'ly')
        .replace(/ç/g, 's')
        .replace(/ã/g, 'an')
        .replace(/õ/g, 'on');
      break;
      
    case 'ru':
      // Russian preprocessing: basic transliteration helpers
      processedText = processedText
        .replace(/щ/g, 'shch')
        .replace(/ш/g, 'sh')
        .replace(/ж/g, 'zh')
        .replace(/ч/g, 'ch')
        .replace(/ц/g, 'ts');
      break;
      
    case 'ja':
      // Japanese preprocessing: basic romanization adjustments
      processedText = processedText
        .replace(/っ/g, '')  // Remove small tsu
        .replace(/ー/g, '')  // Remove long vowel mark
        .replace(/を/g, 'wo')
        .replace(/へ/g, 'he');
      break;
      
    case 'zh':
      // Chinese preprocessing: tone number removal and pinyin cleanup
      processedText = processedText
        .replace(/[1-4]/g, '')  // Remove tone numbers
        .replace(/ü/g, 'u');
      break;
      
    case 'ar':
      // Arabic preprocessing: basic transliteration
      processedText = processedText
        .replace(/خ/g, 'kh')
        .replace(/ش/g, 'sh')
        .replace(/ث/g, 'th')
        .replace(/ذ/g, 'th');
      break;
      
    case 'hi':
      // Hindi preprocessing: basic devanagari handling
      processedText = processedText
        .replace(/क्ष/g, 'ksh')
        .replace(/ज्ञ/g, 'gya')
        .replace(/त्र/g, 'tra');
      break;
  }
  
  return processedText;
};

// Enhanced lip sync processing with language-aware settings
const lipSync = async ({ messages, language = 'auto' }) => {
  console.log(`Starting enhanced lip sync processing for ${messages.length} messages`);
  
  // Process text-to-speech with language-specific settings
  await Promise.all(
    messages.map(async (message, index) => {
<<<<<<< HEAD
      const fileName = path.join('/tmp', `message_${index}.mp3`);
=======
      const fileName = `audios/message_${index}.mp3`;
>>>>>>> fdb21236b05179a4ebd4c38ae730d678a534f851
      
      // Detect language if not provided
      const detectedLanguage = language === 'auto' ? 
        detectLanguageFromText(message.text) : language;
      
      // Preprocess text for language-specific pronunciation
      const processedText = preprocessTextForLanguage(message.text, detectedLanguage);
      
      console.log(`Message ${index}: Language=${detectedLanguage}, Original="${message.text.substring(0, 50)}...", Processed="${processedText.substring(0, 50)}..."`);

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          await convertTextToSpeech({ 
            text: processedText, 
            fileName,
            language: detectedLanguage 
          });
          
          // Add language-specific delay to avoid rate limiting
          const languageDelay = ['zh', 'ja', 'ar', 'hi'].includes(detectedLanguage) ? 
            RETRY_DELAY * 2 : RETRY_DELAY;
          await delay(languageDelay);
          
          break;
        } catch (error) {
          console.error(`TTS attempt ${attempt + 1} failed for message ${index}:`, error.message);
          
          if (error.response && error.response.status === 429 && attempt < MAX_RETRIES - 1) {
            const backoffDelay = RETRY_DELAY * Math.pow(2, attempt); // Exponential backoff
            console.log(`Rate limited, waiting ${backoffDelay}ms before retry...`);
            await delay(backoffDelay);
          } else if (attempt === MAX_RETRIES - 1) {
            console.error(`Failed to convert message ${index} to speech after ${MAX_RETRIES} attempts`);
            throw error;
          }
        }
      }
      console.log(`Message ${index} converted to speech successfully`);
    })
  );

  // Process phonemes with language-aware Rhubarb settings
  await Promise.all(
    messages.map(async (message, index) => {
      const fileName = `audios/message_${index}.mp3`;
      const detectedLanguage = language === 'auto' ? 
        detectLanguageFromText(message.text) : language;

      try {
        console.log(`Generating phonemes for message ${index} in ${detectedLanguage}`);
        
        // Enhanced phoneme generation with language support
        await getPhonemes({ 
          message: index, 
          language: detectedLanguage,
          text: message.text 
        });
        
        message.audio = await audioFileToBase64({ fileName });
        message.lipsync = await readJsonTranscript({ 
<<<<<<< HEAD
          fileName: path.join('/tmp', `message_${index}.json`) 
=======
          fileName: `audios/message_${index}.json` 
>>>>>>> fdb21236b05179a4ebd4c38ae730d678a534f851
        });
        
        // Add language metadata to message
        message.detectedLanguage = detectedLanguage;
        message.lipSyncLanguage = detectedLanguage;
        
        // Enhance lipsync with language-specific adjustments
        if (message.lipsync && message.lipsync.mouthCues) {
          message.lipsync.mouthCues = enhanceMouthCuesForLanguage(
            message.lipsync.mouthCues, 
            detectedLanguage
          );
        }
        
        console.log(`Phonemes generated successfully for message ${index}`);
      } catch (error) {
        console.error(`Error while getting phonemes for message ${index}:`, error);
        
        // Create language-aware fallback
        const fallbackLipSync = createLanguageFallback(detectedLanguage, message.text);
        
        try {
          message.audio = await audioFileToBase64({ fileName });
          message.lipsync = fallbackLipSync;
          message.detectedLanguage = detectedLanguage;
          message.lipSyncFallback = true;
          console.log(`Created fallback lip sync for message ${index}`);
        } catch (fallbackError) {
          console.error(`Fallback also failed for message ${index}:`, fallbackError);
          message.audio = null;
          message.lipsync = null;
          message.lipSyncError = true;
        }
      }
    })
  );

  console.log('Enhanced lip sync processing completed');
  return messages;
};

// Language-specific mouth cue enhancements
const enhanceMouthCuesForLanguage = (mouthCues, language) => {
  return mouthCues.map(cue => {
    let enhancedCue = { ...cue };
    
    // Language-specific viseme adjustments
    switch (language) {
      case 'es':
        // Spanish: More pronounced vowels
        if (['A', 'E', 'I', 'O', 'U'].includes(cue.value)) {
          enhancedCue.intensity = (enhancedCue.intensity || 1) * 1.1;
        }
        break;
        
      case 'fr':
        // French: Rounded vowels and nasal sounds
        if (['O', 'U'].includes(cue.value)) {
          enhancedCue.rounded = true;
          enhancedCue.intensity = (enhancedCue.intensity || 1) * 1.05;
        }
        break;
        
      case 'de':
        // German: Sharp consonants
        if (['B', 'C', 'G'].includes(cue.value)) {
          enhancedCue.sharpness = 1.2;
        }
        break;
        
      case 'ja':
        // Japanese: Softer articulation
        enhancedCue.intensity = (enhancedCue.intensity || 1) * 0.9;
        enhancedCue.softness = 1.1;
        break;
        
      case 'zh':
        // Chinese: Tonal variations
        enhancedCue.tonal = true;
        enhancedCue.variation = Math.sin((cue.start || 0) * Math.PI) * 0.1 + 1;
        break;
        
      case 'ar':
        // Arabic: Emphatic consonants
        if (['B', 'C', 'G'].includes(cue.value)) {
          enhancedCue.emphatic = true;
          enhancedCue.intensity = (enhancedCue.intensity || 1) * 1.15;
        }
        break;
    }
    
    return enhancedCue;
  });
};

// Create language-aware fallback lip sync
const createLanguageFallback = (language, text) => {
  const duration = Math.max(text.length * 0.08, 1.0); // Estimate duration
  
  // Language-specific fallback patterns
  const languageFallbacks = {
    en: [
      { start: 0.0, end: duration * 0.3, value: "D" },
      { start: duration * 0.3, end: duration * 0.6, value: "C" },
      { start: duration * 0.6, end: duration, value: "A" }
    ],
    es: [
      { start: 0.0, end: duration * 0.4, value: "D" },
      { start: duration * 0.4, end: duration * 0.7, value: "E" },
      { start: duration * 0.7, end: duration, value: "A" }
    ],
    fr: [
      { start: 0.0, end: duration * 0.3, value: "F" },
      { start: duration * 0.3, end: duration * 0.6, value: "E" },
      { start: duration * 0.6, end: duration, value: "A" }
    ],
    de: [
      { start: 0.0, end: duration * 0.4, value: "C" },
      { start: duration * 0.4, end: duration * 0.7, value: "D" },
      { start: duration * 0.7, end: duration, value: "A" }
    ],
    ja: [
      { start: 0.0, end: duration * 0.5, value: "D" },
      { start: duration * 0.5, end: duration, value: "A" }
    ],
    zh: [
      { start: 0.0, end: duration * 0.6, value: "D" },
      { start: duration * 0.6, end: duration, value: "A" }
    ]
  };
  
  const pattern = languageFallbacks[language] || languageFallbacks.en;
  
  return {
    metadata: {
      soundFile: `message_audio.wav`,
      duration: duration,
      language: language,
      fallback: true
    },
    mouthCues: pattern
  };
};

export { lipSync };