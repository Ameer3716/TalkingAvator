// Enhanced multilingual viseme mapping for Rhubarb lip sync
// Supports English, Spanish, French, German, Italian, Portuguese, Russian, Japanese, Chinese, Arabic, Hindi

const multilingualVisemesMapping = {
  // Standard Rhubarb visemes (compatible with your current system)
  A: "viseme_PP",  // Rest position, silence
  B: "viseme_kk",  // Consonants like K, G
  C: "viseme_I",   // Consonants like S, Z
  D: "viseme_aa",  // Vowels like AA, AH
  E: "viseme_O",   // Vowels like O
  F: "viseme_U",   // Vowels like U
  G: "viseme_FF",  // Consonants like F, V
  H: "viseme_TH",  // Consonants like TH
  X: "viseme_PP",  // Unknown/rest
  
  // Extended visemes for better multilingual support
  
  // English specific
  en_A: "viseme_PP",   // silence, rest position
  en_B: "viseme_kk",   // consonants: k, g, ng
  en_C: "viseme_I",    // consonants: s, z, sh, zh, ch, jh, t, d, n, l, r, y
  en_D: "viseme_aa",   // vowels: aa, ae, ah, ao, aw, ax, ay
  en_E: "viseme_O",    // vowels: ao, ow
  en_F: "viseme_U",    // vowels: uw, uh, ux
  en_G: "viseme_FF",   // consonants: f, v
  en_H: "viseme_TH",   // consonants: th, dh
  
  // Spanish specific phonemes
  es_A: "viseme_PP",   // silencio, pausa
  es_B: "viseme_kk",   // consonantes: k, g, j, x
  es_C: "viseme_I",    // consonantes: s, z, ch, ñ, t, d, n, l, r, rr, y
  es_D: "viseme_aa",   // vocales: a, e abierta
  es_E: "viseme_O",    // vocales: o abierta, o cerrada
  es_F: "viseme_U",    // vocales: u, i cerrada
  es_G: "viseme_FF",   // consonantes: f, b, p, m, w
  es_H: "viseme_TH",   // consonantes: th (en algunos dialectos)
  es_I: "viseme_E",    // vocal: e cerrada, i
  
  // French specific phonemes
  fr_A: "viseme_PP",   // silence
  fr_B: "viseme_kk",   // consonnes: k, g, q
  fr_C: "viseme_I",    // consonnes: s, z, ch, j, t, d, n, l, r, y
  fr_D: "viseme_aa",   // voyelles: a, à, â
  fr_E: "viseme_O",    // voyelles: o, ô, au, eau
  fr_F: "viseme_U",    // voyelles: u, ou, ou
  fr_G: "viseme_FF",   // consonnes: f, v, b, p, m, w
  fr_H: "viseme_TH",   // rare, some borrowed words
  fr_I: "viseme_E",    // voyelles: e, é, è, ê, i, y
  fr_J: "viseme_O",    // voyelles nasales: on, an, en, in, un
  
  // German specific phonemes
  de_A: "viseme_PP",   // Stille
  de_B: "viseme_kk",   // Konsonanten: k, g, ch (ach-Laut)
  de_C: "viseme_I",    // Konsonanten: s, z, sch, t, d, n, l, r, j
  de_D: "viseme_aa",   // Vokale: a, ä
  de_E: "viseme_O",    // Vokale: o, ö, au
  de_F: "viseme_U",    // Vokale: u, ü
  de_G: "viseme_FF",   // Konsonanten: f, v, b, p, m, w
  de_H: "viseme_TH",   // selten, mainly in borrowed words
  de_I: "viseme_E",    // Vokale: e, i, ei, eu, ie
  
  // Italian specific phonemes
  it_A: "viseme_PP",   // silenzio
  it_B: "viseme_kk",   // consonanti: c, g, ch, gh
  it_C: "viseme_I",    // consonanti: s, z, sc, t, d, n, l, r, gl, gn
  it_D: "viseme_aa",   // vocale: a
  it_E: "viseme_E",    // vocali: e aperta, e chiusa, i
  it_F: "viseme_U",    // vocale: u
  it_G: "viseme_FF",   // consonanti: f, v, b, p, m
  it_H: "viseme_O",    // vocale: o aperta, o chiusa
  
  // Portuguese specific phonemes
  pt_A: "viseme_PP",   // silêncio
  pt_B: "viseme_kk",   // consoantes: c, g, qu, gu
  pt_C: "viseme_I",    // consoantes: s, z, x, ch, t, d, n, l, r, rr, nh, lh
  pt_D: "viseme_aa",   // vogais: a, â, à
  pt_E: "viseme_E",    // vogais: e, ê, é, i
  pt_F: "viseme_U",    // vogais: u, ú
  pt_G: "viseme_FF",   // consoantes: f, v, b, p, m
  pt_H: "viseme_O",    // vogais: o, ô, ó
  pt_I: "viseme_aa",   // vogais nasais: ã, õ
  
  // Russian specific phonemes (Cyrillic transliterated)
  ru_A: "viseme_PP",   // тишина
  ru_B: "viseme_kk",   // согласные: к, г, х
  ru_C: "viseme_I",    // согласные: с, з, ш, ж, ч, щ, т, д, н, л, р, й
  ru_D: "viseme_aa",   // гласные: а, я
  ru_E: "viseme_E",    // гласные: э, е, и, ы
  ru_F: "viseme_U",    // гласные: у, ю
  ru_G: "viseme_FF",   // согласные: ф, в, б, п, м
  ru_H: "viseme_O",    // гласная: о, ё
  
  // Japanese specific phonemes (Romanized)
  ja_A: "viseme_PP",   // 無音 (muon - silence)
  ja_B: "viseme_kk",   // か行 (ka-gyou): k, g sounds
  ja_C: "viseme_I",    // さ行、た行、な行、ら行 (sa, ta, na, ra-gyou): s, t, n, r sounds
  ja_D: "viseme_aa",   // あ (a) vowel
  ja_E: "viseme_E",    // え、い (e, i) vowels
  ja_F: "viseme_U",    // う (u) vowel
  ja_G: "viseme_FF",   // は行、ま行 (ha, ma-gyou): h, m, f sounds
  ja_H: "viseme_O",    // お (o) vowel
  ja_I: "viseme_I",    // や行、わ行 (ya, wa-gyou): y, w sounds
  
  // Chinese (Mandarin) specific phonemes (Pinyin)
  zh_A: "viseme_PP",   // 静音 (jìngyīn - silence)
  zh_B: "viseme_kk",   // 声母: k, g, h
  zh_C: "viseme_I",    // 声母: s, z, c, zh, ch, sh, t, d, n, l, r
  zh_D: "viseme_aa",   // 韵母: a, ia, ua
  zh_E: "viseme_E",    // 韵母: e, i, ie, üe
  zh_F: "viseme_U",    // 韵母: u, ü, iu
  zh_G: "viseme_FF",   // 声母: f, b, p, m
  zh_H: "viseme_O",    // 韵母: o, uo
  
  // Arabic specific phonemes (transliterated)
  ar_A: "viseme_PP",   // صمت (samt - silence)
  ar_B: "viseme_kk",   // حروف: ك، ق، غ، خ (k, q, gh, kh sounds)
  ar_C: "viseme_I",    // حروف: س، ز، ش، ت، د، ن، ل، ر (s, z, sh, t, d, n, l, r sounds)
  ar_D: "viseme_aa",   // حركات: فتحة، ألف (a, aa vowels)
  ar_E: "viseme_E",    // حركات: كسرة، ياء (i, ii vowels)
  ar_F: "viseme_U",    // حركات: ضمة، واو (u, uu vowels)
  ar_G: "viseme_FF",   // حروف: ف، ب، م (f, b, m sounds)
  ar_H: "viseme_O",    // حركات: فتحة مدورة (rounded vowels)
  
  // Hindi specific phonemes (transliterated)
  hi_A: "viseme_PP",   // मौनता (maunata - silence)
  hi_B: "viseme_kk",   // व्यंजन: क، ग، ख، घ (k, g, kh, gh sounds)
  hi_C: "viseme_I",    // व्यंजन: स، श، ष، त، द، न، ल، र (s, sh, t, d, n, l, r sounds)
  hi_D: "viseme_aa",   // स्वर: अ، आ (a, aa vowels)
  hi_E: "viseme_E",    // स्वर: इ، ई، ए، ऐ (i, ii, e, ai vowels)
  hi_F: "viseme_U",    // स्वर: उ، ऊ (u, uu vowels)
  hi_G: "viseme_FF",   // व्यंजन: फ، ब، म، व (f, b, m, v sounds)
  hi_H: "viseme_O",    // स्वर: ओ، औ (o, au vowels)
};

// Language detection helper with improved accuracy
export const detectLanguage = (text) => {
  // Remove punctuation and normalize text
  const cleanText = text.toLowerCase().replace(/[^\p{L}\s]/gu, '');
  
  // Character-based detection for non-Latin scripts
  if (/[\u4e00-\u9fff]/.test(text)) return 'zh'; // Chinese characters
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja'; // Hiragana/Katakana
  if (/[\u0600-\u06ff]/.test(text)) return 'ar'; // Arabic
  if (/[\u0900-\u097f]/.test(text)) return 'hi'; // Devanagari (Hindi)
  if (/[\u0400-\u04ff]/.test(text)) return 'ru'; // Cyrillic (Russian)
  
  // Enhanced European language detection
  const languagePatterns = {
    es: {
      words: ['el', 'la', 'de', 'que', 'y', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para', 'una', 'del', 'las', 'los', 'está', 'también', 'como', 'pero', 'más'],
      patterns: [/ñ/, /ción$/, /dad$/, /mente$/, /¿/, /¡/],
      negativePatterns: [/ç/, /ã/, /õ/, /ü/, /ß/]
    },
    fr: {
      words: ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'avoir', 'que', 'pour', 'dans', 'ce', 'son', 'une', 'sur', 'avec', 'ne', 'se', 'pas', 'tout', 'plus', 'par', 'grand', 'en', 'si', 'me', 'même'],
      patterns: [/ç/, /è/, /é/, /ê/, /ë/, /à/, /â/, /ù/, /û/, /î/, /ï/, /ô/, /œ/],
      negativePatterns: [/ñ/, /ã/, /õ/, /ß/]
    },
    de: {
      words: ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich', 'des', 'auf', 'für', 'ist', 'im', 'dem', 'nicht', 'ein', 'eine', 'als', 'auch', 'nach', 'wird', 'an', 'werden', 'aus', 'er', 'hat', 'dass'],
      patterns: [/ß/, /ä/, /ö/, /ü/, /sch/, /tsch/, /ung$/, /heit$/, /keit$/],
      negativePatterns: [/ñ/, /ç/, /ã/, /õ/]
    },
    it: {
      words: ['il', 'di', 'che', 'e', 'la', 'per', 'un', 'in', 'con', 'del', 'da', 'a', 'al', 'le', 'si', 'dei', 'su', 'come', 'anche', 'nel', 'della', 'gli', 'una', 'delle', 'alla', 'più', 'sono'],
      patterns: [/gli/, /gn/, /sc[ehi]/, /zione$/, /mente$/, /ità$/],
      negativePatterns: [/ñ/, /ç/, /ã/, /õ/, /ß/]
    },
    pt: {
      words: ['o', 'de', 'a', 'e', 'do', 'da', 'em', 'um', 'para', 'com', 'não', 'uma', 'os', 'no', 'se', 'na', 'por', 'mais', 'as', 'dos', 'como', 'mas', 'foi', 'ao', 'ele', 'das', 'tem', 'seu'],
      patterns: [/ã/, /õ/, /ç/, /lh/, /nh/, /ção$/, /mente$/],
      negativePatterns: [/ñ/, /ß/, /ü/]
    }
  };
  
  const words = cleanText.split(/\s+/).filter(word => word.length > 1);
  const scores = {};
  
  Object.entries(languagePatterns).forEach(([lang, config]) => {
    let score = 0;
    
    // Word-based scoring
    const wordMatches = words.filter(word => config.words.includes(word)).length;
    score += wordMatches * 3;
    
    // Pattern-based scoring
    config.patterns.forEach(pattern => {
      const matches = (cleanText.match(pattern) || []).length;
      score += matches * 2;
    });
    
    // Negative pattern penalties
    config.negativePatterns.forEach(pattern => {
      const matches = (cleanText.match(pattern) || []).length;
      score -= matches * 3;
    });
    
    scores[lang] = Math.max(0, score);
  });
  
  const maxScore = Math.max(...Object.values(scores));
  const detectedLang = Object.entries(scores).find(([lang, score]) => score === maxScore)?.[0];
  
  // Require minimum confidence
  if (maxScore < 2) {
    return 'en'; // Default to English if confidence is too low
  }
  
  return detectedLang || 'en';
};

// Get visemes for detected language with fallback support
export const getLanguageVisemes = (language) => {
  const langPrefix = language + '_';
  const languageVisemes = {};
  
  // Get language-specific visemes
  Object.entries(multilingualVisemesMapping).forEach(([key, value]) => {
    if (key.startsWith(langPrefix)) {
      const visemeKey = key.substring(langPrefix.length);
      languageVisemes[visemeKey] = value;
    }
  });
  
  // If no language-specific visemes found, fall back to standard
  if (Object.keys(languageVisemes).length === 0) {
    return {
      A: "viseme_PP",
      B: "viseme_kk", 
      C: "viseme_I",
      D: "viseme_aa",
      E: "viseme_O",
      F: "viseme_U",
      G: "viseme_FF",
      H: "viseme_TH",
      X: "viseme_PP"
    };
  }
  
  // Merge with standard visemes for completeness
  const standardVisemes = {
    A: "viseme_PP",
    B: "viseme_kk", 
    C: "viseme_I",
    D: "viseme_aa",
    E: "viseme_O",
    F: "viseme_U",
    G: "viseme_FF",
    H: "viseme_TH",
    X: "viseme_PP"
  };
  
  return { ...standardVisemes, ...languageVisemes };
};

// Enhanced viseme mapping with language detection and caching
let languageCache = {};
export const getVisemeMapping = (text = '') => {
  if (!text || text.trim() === '') {
    return getLanguageVisemes('en');
  }
  
  // Use cache to avoid repeated detection for same text
  if (languageCache[text]) {
    return languageCache[text];
  }
  
  const language = detectLanguage(text);
  const mapping = getLanguageVisemes(language);
  
  // Cache the result
  languageCache[text] = mapping;
  
  // Clean cache if it gets too large
  if (Object.keys(languageCache).length > 100) {
    languageCache = {};
  }
  
  console.log(`Detected language: ${language} for text: "${text.substring(0, 50)}..."`);
  
  return mapping;
};

// Helper to get supported languages
export const getSupportedLanguages = () => {
  const languages = new Set();
  Object.keys(multilingualVisemesMapping).forEach(key => {
    if (key.includes('_')) {
      languages.add(key.split('_')[0]);
    }
  });
  return Array.from(languages).sort();
};

// Helper to validate viseme mapping
export const validateVisemeMapping = (mapping) => {
  const requiredVisemes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'X'];
  const missingVisemes = requiredVisemes.filter(viseme => !mapping[viseme]);
  
  if (missingVisemes.length > 0) {
    console.warn(`Missing visemes in mapping: ${missingVisemes.join(', ')}`);
    return false;
  }
  
  return true;
};

// Default export for backward compatibility
export default multilingualVisemesMapping;