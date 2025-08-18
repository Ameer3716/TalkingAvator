import fs from "fs";
import path from "path";
import { execCommand } from "./files.mjs";
import ffmpeg from 'fluent-ffmpeg';

// Simplified audio conversion function - removes complex filters that might corrupt audio
async function convertAudioToMp3({ inputPath, outputPath, audioData, mimeType, language = 'en' }) {
  // Handle both file path and direct audio data approaches
  let actualInputPath = inputPath;
  let tempFileCreated = false;
  
  if (!inputPath && audioData) {
    // If audioData is provided directly, write it to a temp file first
    const dir = path.resolve('tmp');
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const getExtension = (mimeType) => {
      if (!mimeType) return '.webm';
      const lower = mimeType.toLowerCase();
      if (lower.includes('webm')) return '.webm';
      if (lower.includes('mp4')) return '.mp4';
      if (lower.includes('ogg')) return '.ogg';
      if (lower.includes('wav')) return '.wav';
      if (lower.includes('m4a')) return '.m4a';
      if (lower.includes('aac')) return '.aac';
      return '.webm';
    };

    const extension = getExtension(mimeType);
    const timestamp = Date.now();
    actualInputPath = path.join(dir, `temp_input_${timestamp}${extension}`);
    tempFileCreated = true;
    
    console.log(`[AUDIO] Writing audioData to temporary file: ${actualInputPath}`);
    try {
      fs.writeFileSync(actualInputPath, audioData);
    } catch (writeError) {
      throw new Error(`Failed to write temporary input file: ${writeError.message}`);
    }
    
    // Verify the temp file was written correctly
    const tempStats = fs.statSync(actualInputPath);
    if (tempStats.size === 0) {
      throw new Error("Failed to write temporary input file - file is empty");
    }
    console.log(`[AUDIO] Temporary file written successfully: ${tempStats.size} bytes`);
  }

  // Verify input file exists and is not empty
  if (!fs.existsSync(actualInputPath)) {
    throw new Error(`Input file does not exist: ${actualInputPath}`);
  }
  
  const inputStats = fs.statSync(actualInputPath);
  if (inputStats.size === 0) {
    throw new Error(`Input file is empty: ${actualInputPath}`);
  }
  
  console.log(`[AUDIO] Input file validated: ${actualInputPath}, size: ${inputStats.size} bytes`);

  return new Promise((resolve, reject) => {
    try {
      console.log(`[AUDIO] Starting simplified conversion for language: ${language}`);
      console.log(`[AUDIO] Input format: ${mimeType || 'unknown'}`);

      const ffmpegCommand = ffmpeg(actualInputPath)
        // Simplified settings - no complex filters that might corrupt audio
        .audioCodec('libmp3lame')
        .audioBitrate('128k')
        .audioFrequency(22050) // Standard frequency for speech recognition
        .audioChannels(1)      // Mono
        // Remove all complex audio filters - keep it simple
        .output(outputPath)
        .on('start', (commandLine) => {
          console.log('[AUDIO] FFmpeg command:', commandLine);
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            console.log(`[AUDIO] FFmpeg progress: ${Math.round(progress.percent)}%`);
          }
        })
        .on('stderr', (stderrLine) => {
          // Only log important stderr messages
          if (stderrLine.includes('Error') || stderrLine.includes('Warning')) {
            console.log('[AUDIO] FFmpeg stderr:', stderrLine);
          }
        })
        .on('end', () => {
          console.log('[AUDIO] FFmpeg conversion finished successfully.');
          
          // Verify output file
          if (!fs.existsSync(outputPath)) {
            return reject(new Error("FFmpeg conversion failed - no output file generated"));
          }
          
          const outputStats = fs.statSync(outputPath);
          if (outputStats.size === 0) {
            return reject(new Error("FFmpeg conversion failed - output file is empty"));
          }
          
          console.log(`[AUDIO] Output file created successfully: ${outputPath}, size: ${outputStats.size} bytes`);
          
          // Clean up temporary input file if we created it
          if (tempFileCreated && fs.existsSync(actualInputPath)) {
            try {
              fs.unlinkSync(actualInputPath);
              console.log(`[AUDIO] Cleaned up temporary input file: ${actualInputPath}`);
            } catch (cleanupError) {
              console.warn(`[AUDIO] Could not clean up temporary file: ${cleanupError.message}`);
            }
          }
          
          resolve(outputPath);
        })
        .on('error', (err) => {
          console.error('[AUDIO] FFmpeg error:', err.message);
          if (err.stderr) {
            console.error('[AUDIO] FFmpeg stderr:', err.stderr);
          }
          
          // Clean up temporary input file on error
          if (tempFileCreated && fs.existsSync(actualInputPath)) {
            try {
              fs.unlinkSync(actualInputPath);
            } catch (cleanupError) {
              console.warn(`[AUDIO] Could not clean up temporary file: ${cleanupError.message}`);
            }
          }
          
          // Provide specific error messages
          if (err.message.includes("Cannot find ffmpeg") || err.message.includes("spawn ffmpeg ENOENT")) {
            return reject(new Error("FFmpeg is not installed or not in PATH. Please install FFmpeg from https://ffmpeg.org/download.html"));
          } else if (err.message.includes("Invalid data found when processing input")) {
            return reject(new Error("Invalid audio format or corrupted audio file"));
          } else if (err.message.includes("No such file or directory")) {
            return reject(new Error("Input audio file not found or not readable"));
          } else if (err.message.includes("Permission denied")) {
            return reject(new Error("Permission denied accessing audio files"));
          }
          
          reject(new Error(`Audio conversion failed: ${err.message}`));
        });

      // Add timeout for conversion (30 seconds max)
      setTimeout(() => {
        ffmpegCommand.kill();
        reject(new Error("Audio conversion timed out after 30 seconds"));
      }, 30000);

      ffmpegCommand.run();
      
    } catch (error) {
      // Clean up temporary input file on error
      if (tempFileCreated && fs.existsSync(actualInputPath)) {
        try {
          fs.unlinkSync(actualInputPath);
        } catch (cleanupError) {
          console.warn(`[AUDIO] Could not clean up temporary file: ${cleanupError.message}`);
        }
      }
      reject(error);
    }
  });
}

// Alternative: Direct WAV conversion without complex processing
async function convertAudioToWav({ inputPath, outputPath, audioData, mimeType }) {
  let actualInputPath = inputPath;
  let tempFileCreated = false;
  
  if (!inputPath && audioData) {
    const dir = path.resolve('tmp');
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const timestamp = Date.now();
    actualInputPath = path.join(dir, `temp_input_${timestamp}.webm`);
    tempFileCreated = true;
    
    console.log(`[WAV] Writing audioData to temporary file: ${actualInputPath}`);
    fs.writeFileSync(actualInputPath, audioData);
  }

  return new Promise((resolve, reject) => {
    console.log(`[WAV] Converting to WAV format (no processing)`);
    
    const ffmpegCommand = ffmpeg(actualInputPath)
      .audioCodec('pcm_s16le')  // Uncompressed PCM
      .audioFrequency(16000)    // Standard for Whisper
      .audioChannels(1)         // Mono
      .output(outputPath)
      .on('start', (commandLine) => {
        console.log('[WAV] FFmpeg command:', commandLine);
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          console.log(`[WAV] Progress: ${Math.round(progress.percent)}%`);
        }
      })
      .on('end', () => {
        console.log('[WAV] Conversion to WAV completed');
        
        if (tempFileCreated && fs.existsSync(actualInputPath)) {
          try {
            fs.unlinkSync(actualInputPath);
          } catch (cleanupError) {
            console.warn(`[WAV] Could not clean up temporary file: ${cleanupError.message}`);
          }
        }
        
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('[WAV] Conversion error:', err.message);
        
        if (tempFileCreated && fs.existsSync(actualInputPath)) {
          try {
            fs.unlinkSync(actualInputPath);
          } catch (cleanupError) {
            console.warn(`[WAV] Could not clean up temporary file: ${cleanupError.message}`);
          }
        }
        
        reject(new Error(`WAV conversion failed: ${err.message}`));
      });

    ffmpegCommand.run();
  });
}

// Simplified emotion detection
function detectEmotionFromText(text, language = 'en') {
  const emotionKeywords = {
    'en': {
      happy: ['happy', 'joyful', 'excited', 'delighted', 'cheerful', 'great', 'awesome', 'wonderful'],
      sad: ['sad', 'unhappy', 'depressed', 'disappointed', 'sorry', 'terrible', 'awful'],
      angry: ['angry', 'mad', 'furious', 'irritated', 'annoyed', 'frustrated'],
      surprised: ['surprised', 'shocked', 'amazed', 'wow', 'incredible', 'unbelievable'],
      confused: ['confused', 'puzzled', 'unclear', 'what', 'how', 'why', 'huh']
    }
  };

  const keywords = emotionKeywords[language] || emotionKeywords['en'];
  const lowerText = text.toLowerCase();
  
  for (const [emotion, words] of Object.entries(keywords)) {
    for (const word of words) {
      if (lowerText.includes(word)) {
        return emotion;
      }
    }
  }
  
  // Default emotion based on punctuation
  if (text.includes('!')) return 'excited';
  if (text.includes('?')) return 'confused';
  
  return 'default';
}

// Simplified animation selection
function selectAnimationForEmotion(emotion, textLength) {
  const animationMap = {
    happy: 'TalkingOne',
    excited: 'TalkingThree',
    sad: 'SadIdle',
    angry: 'Angry',
    surprised: 'Surprised',
    confused: 'ThoughtfulHeadShake',
    default: textLength > 30 ? 'TalkingThree' : 'TalkingOne'
  };
  
  return animationMap[emotion] || 'Idle';
}

export { 
  convertAudioToMp3, 
  convertAudioToWav,
  detectEmotionFromText, 
  selectAnimationForEmotion 
};