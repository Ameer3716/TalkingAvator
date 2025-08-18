import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { button, useControls } from "leva";
import React, { useEffect, useRef, useState, useMemo } from "react";

import * as THREE from "three";
import { useSpeech } from "../hooks/useSpeech";
import facialExpressions from "../constants/facialExpressions";
import { getVisemeMapping, detectLanguage } from "../constants/visemesMapping";
import morphTargets from "../constants/morphTargets";

export function Avatar(props) {
  const { nodes, materials, scene } = useGLTF("/models/avatar.glb");
  const { animations } = useGLTF("/models/animations.glb");
  const { message, onMessagePlayed } = useSpeech();
  
  // Enhanced state management
  const [lipsync, setLipsync] = useState();
  const [setupMode, setSetupMode] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [emotionIntensity, setEmotionIntensity] = useState(1.0);
  const [transitionSpeed, setTransitionSpeed] = useState(0.1);
  const [smoothingEnabled, setSmoothingEnabled] = useState(true);
  
  // Animation and facial expression state
  const [animation, setAnimation] = useState(animations.find((a) => a.name === "Idle") ? "Idle" : animations[0].name);
  const [facialExpression, setFacialExpression] = useState("");
  const [previousExpression, setPreviousExpression] = useState("");
  const [blink, setBlink] = useState(false);
  const [audio, setAudio] = useState();

  // Enhanced viseme mapping with language support
  const visemesMapping = useMemo(() => {
    return getVisemeMapping(message?.text || '');
  }, [message?.text, currentLanguage]);

  // Emotion transition state
  const [emotionTransition, setEmotionTransition] = useState({
    from: {},
    to: {},
    progress: 1.0,
    duration: 1.0
  });

  // Enhanced message processing with multilingual support
  useEffect(() => {
    if (!message) {
      setAnimation("Idle");
      setFacialExpression("default");
      setCurrentLanguage('en');
      setEmotionIntensity(1.0);
      return;
    }

    console.log("Processing message:", {
      text: message.text?.substring(0, 50) + "...",
      animation: message.animation,
      facialExpression: message.facialExpression,
      detectedLanguage: message.detectedLanguage,
      emotionIntensity: message.emotionIntensity,
      lipSyncLanguage: message.lipSyncLanguage
    });

    // Update language and emotion settings
    if (message.detectedLanguage) {
      setCurrentLanguage(message.detectedLanguage);
    }
    
    if (message.emotionIntensity) {
      setEmotionIntensity(message.emotionIntensity);
    }

    // Enhanced animation selection with emotion context
    const newAnimation = message.animation || selectAnimationFromEmotion(message.facialExpression, message.text);
    setAnimation(newAnimation);

    // Enhanced facial expression transition
    if (message.facialExpression && message.facialExpression !== facialExpression) {
      initiateFacialExpressionTransition(facialExpression, message.facialExpression);
      setFacialExpression(message.facialExpression);
    }

    // Enhanced lip sync processing
    setLipsync(message.lipsync);

    // Audio processing with enhanced error handling
    if (message.audio) {
      try {
        const audioElement = new Audio("data:audio/mp3;base64," + message.audio);
        audioElement.volume = 0.8; // Slightly reduce volume for better experience
        
        audioElement.onloadeddata = () => {
          console.log("Audio loaded successfully");
        };
        
        audioElement.onerror = (error) => {
          console.error("Audio playback error:", error);
        };
        
        audioElement.play().catch(error => {
          console.error("Audio play error:", error);
        });
        
        setAudio(audioElement);
        audioElement.onended = onMessagePlayed;
      } catch (error) {
        console.error("Error creating audio element:", error);
        // Continue without audio
        onMessagePlayed();
      }
    } else {
      // No audio available, just handle the message completion
      setTimeout(onMessagePlayed, estimateTextDuration(message.text || ''));
    }
  }, [message]);

  // Animation system
  const group = useRef();
  const { actions, mixer } = useAnimations(animations, group);

  useEffect(() => {
    if (actions[animation]) {
      actions[animation]
        .reset()
        .fadeIn(mixer.stats.actions.inUse === 0 ? 0 : 0.5)
        .play();
      return () => {
        if (actions[animation]) {
          actions[animation].fadeOut(0.5);
        }
      };
    }
  }, [animation]);

  // Enhanced facial expression transition system
  const initiateFacialExpressionTransition = (fromExpression, toExpression) => {
    const fromMapping = facialExpressions[fromExpression] || {};
    const toMapping = facialExpressions[toExpression] || {};
    
    setEmotionTransition({
      from: fromMapping,
      to: toMapping,
      progress: 0.0,
      duration: 1.0
    });
    
    setPreviousExpression(fromExpression);
  };

  // Enhanced morph target lerping with emotion blending
  const lerpMorphTarget = (target, value, speed = transitionSpeed, emotionMultiplier = 1.0) => {
    scene.traverse((child) => {
      if (child.isSkinnedMesh && child.morphTargetDictionary) {
        const index = child.morphTargetDictionary[target];
        if (index === undefined || child.morphTargetInfluences[index] === undefined) {
          return;
        }
        
        // Apply emotion intensity and language-specific adjustments
        const adjustedValue = value * emotionMultiplier * emotionIntensity;
        const finalValue = Math.max(0, Math.min(1, adjustedValue));
        
        // Enhanced smoothing for better transitions
        const currentValue = child.morphTargetInfluences[index];
        const smoothingFactor = smoothingEnabled ? speed : 1.0;
        
        child.morphTargetInfluences[index] = THREE.MathUtils.lerp(
          currentValue, 
          finalValue, 
          smoothingFactor
        );
      }
    });
  };

  // Enhanced frame processing with multilingual lip sync
  useFrame((state, delta) => {
    // Update emotion transition
    if (emotionTransition.progress < 1.0) {
      setEmotionTransition(prev => ({
        ...prev,
        progress: Math.min(1.0, prev.progress + delta / prev.duration)
      }));
    }

    // Process facial expressions with enhanced blending
    if (!setupMode) {
      morphTargets.forEach((key) => {
        if (key === "eyeBlinkLeft" || key === "eyeBlinkRight") {
          return; // Handle blinking separately
        }

        let targetValue = 0;
        let emotionMultiplier = 1.0;

        // Enhanced emotion blending during transitions
        if (emotionTransition.progress < 1.0) {
          const fromValue = emotionTransition.from[key] || 0;
          const toValue = emotionTransition.to[key] || 0;
          targetValue = THREE.MathUtils.lerp(fromValue, toValue, emotionTransition.progress);
        } else {
          const mapping = facialExpressions[facialExpression];
          targetValue = (mapping && mapping[key]) ? mapping[key] : 0;
        }

        // Language-specific emotion adjustments
        emotionMultiplier = getLanguageEmotionMultiplier(currentLanguage, key, facialExpression);

        lerpMorphTarget(key, targetValue, transitionSpeed, emotionMultiplier);
      });
    }

    // Enhanced blinking system
    lerpMorphTarget("eyeBlinkLeft", blink ? 1 : 0, 0.5);
    lerpMorphTarget("eyeBlinkRight", blink ? 1 : 0, 0.5);

    if (setupMode) {
      return;
    }

    // Enhanced multilingual lip sync processing
    const appliedMorphTargets = [];
    if (message && lipsync && audio) {
      const currentAudioTime = audio.currentTime;
      
      for (let i = 0; i < lipsync.mouthCues.length; i++) {
        const mouthCue = lipsync.mouthCues[i];
        
        if (currentAudioTime >= mouthCue.start && currentAudioTime <= mouthCue.end) {
          const visemeKey = mouthCue.value;
          const morphTarget = visemesMapping[visemeKey];
          
          if (morphTarget) {
            appliedMorphTargets.push(morphTarget);
            
            // Enhanced viseme intensity with language and emotion adjustments
            let intensity = 1.0;
            
            // Apply language-specific intensity
            intensity *= getLanguageVisemeIntensity(currentLanguage, visemeKey);
            
            // Apply emotion-based intensity
            intensity *= getEmotionVisemeIntensity(facialExpression, visemeKey);
            
            // Apply custom intensity from lipsync data
            if (mouthCue.intensity) {
              intensity *= mouthCue.intensity;
            }
            
            // Apply smoothing if enabled
            if (mouthCue.smoothTransition && smoothingEnabled) {
              intensity *= (1.0 - mouthCue.smoothTransition * 0.3);
            }
            
            lerpMorphTarget(morphTarget, intensity, 0.2);
          }
          break;
        }
      }
    }

    // Reset unused viseme morph targets
    Object.values(visemesMapping).forEach((morphTarget) => {
      if (appliedMorphTargets.includes(morphTarget)) {
        return;
      }
      lerpMorphTarget(morphTarget, 0, 0.1);
    });
  });

  // Enhanced controls for debugging and setup
  useControls("Enhanced Avatar", {
    animation: {
      value: animation,
      options: animations.map((a) => a.name),
      onChange: (value) => setAnimation(value),
    },
    facialExpression: {
      value: facialExpression,
      options: Object.keys(facialExpressions),
      onChange: (value) => {
        initiateFacialExpressionTransition(facialExpression, value);
        setFacialExpression(value);
      },
    },
    currentLanguage: {
      value: currentLanguage,
      options: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'zh', 'ar', 'hi'],
      onChange: (value) => setCurrentLanguage(value),
    },
    emotionIntensity: {
      value: emotionIntensity,
      min: 0.0,
      max: 2.0,
      step: 0.1,
      onChange: (value) => setEmotionIntensity(value),
    },
    transitionSpeed: {
      value: transitionSpeed,
      min: 0.01,
      max: 1.0,
      step: 0.01,
      onChange: (value) => setTransitionSpeed(value),
    },
    smoothingEnabled: {
      value: smoothingEnabled,
      onChange: (value) => setSmoothingEnabled(value),
    },
    setupMode: button(() => {
      setSetupMode(!setupMode);
    }),
    testEmotionTransition: button(() => {
      const emotions = Object.keys(facialExpressions);
      const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
      initiateFacialExpressionTransition(facialExpression, randomEmotion);
      setFacialExpression(randomEmotion);
    }),
    logMorphTargetValues: button(() => {
      const emotionValues = {};
      Object.values(nodes).forEach((node) => {
        if (node.morphTargetInfluences && node.morphTargetDictionary) {
          morphTargets.forEach((key) => {
            if (key === "eyeBlinkLeft" || key === "eyeBlinkRight") {
              return;
            }
            const value = node.morphTargetInfluences[node.morphTargetDictionary[key]];
            if (value > 0.01) {
              emotionValues[key] = value;
            }
          });
        }
      });
      console.log("Current morph target values:", JSON.stringify(emotionValues, null, 2));
      console.log("Current language:", currentLanguage);
      console.log("Current visemes mapping:", visemesMapping);
    }),
  });

  // Morph target controls for setup mode
  useControls("MorphTarget", () =>
    Object.assign(
      {},
      ...morphTargets.map((key) => {
        return {
          [key]: {
            label: key,
            value: 0,
            min: 0,
            max: 1,
            onChange: (val) => {
              lerpMorphTarget(key, val, 1.0);
            },
          },
        };
      })
    )
  );

  // Enhanced blinking system
  useEffect(() => {
    let blinkTimeout;
    const nextBlink = () => {
      blinkTimeout = setTimeout(() => {
        setBlink(true);
        setTimeout(() => {
          setBlink(false);
          nextBlink();
        }, getBlinkDuration(facialExpression));
      }, getBlinkInterval(facialExpression));
    };
    nextBlink();
    return () => clearTimeout(blinkTimeout);
  }, [facialExpression]);

  return (
    <group {...props} dispose={null} ref={group} position={[0, -0.5, 0]}>
      <primitive object={nodes.Hips} />
      <skinnedMesh
        name="EyeLeft"
        geometry={nodes.EyeLeft.geometry}
        material={materials.Wolf3D_Eye}
        skeleton={nodes.EyeLeft.skeleton}
        morphTargetDictionary={nodes.EyeLeft.morphTargetDictionary}
        morphTargetInfluences={nodes.EyeLeft.morphTargetInfluences}
      />
      <skinnedMesh
        name="EyeRight"
        geometry={nodes.EyeRight.geometry}
        material={materials.Wolf3D_Eye}
        skeleton={nodes.EyeRight.skeleton}
        morphTargetDictionary={nodes.EyeRight.morphTargetDictionary}
        morphTargetInfluences={nodes.EyeRight.morphTargetInfluences}
      />
      <skinnedMesh
        name="Wolf3D_Head"
        geometry={nodes.Wolf3D_Head.geometry}
        material={materials.Wolf3D_Skin}
        skeleton={nodes.Wolf3D_Head.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Head.morphTargetDictionary}
        morphTargetInfluences={nodes.Wolf3D_Head.morphTargetInfluences}
      />
      <skinnedMesh
        name="Wolf3D_Teeth"
        geometry={nodes.Wolf3D_Teeth.geometry}
        material={materials.Wolf3D_Teeth}
        skeleton={nodes.Wolf3D_Teeth.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Teeth.morphTargetDictionary}
        morphTargetInfluences={nodes.Wolf3D_Teeth.morphTargetInfluences}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Glasses.geometry}
        material={materials.Wolf3D_Glasses}
        skeleton={nodes.Wolf3D_Glasses.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Headwear.geometry}
        material={materials.Wolf3D_Headwear}
        skeleton={nodes.Wolf3D_Headwear.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Body.geometry}
        material={materials.Wolf3D_Body}
        skeleton={nodes.Wolf3D_Body.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Outfit_Bottom.geometry}
        material={materials.Wolf3D_Outfit_Bottom}
        skeleton={nodes.Wolf3D_Outfit_Bottom.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Outfit_Footwear.geometry}
        material={materials.Wolf3D_Outfit_Footwear}
        skeleton={nodes.Wolf3D_Outfit_Footwear.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Outfit_Top.geometry}
        material={materials.Wolf3D_Outfit_Top}
        skeleton={nodes.Wolf3D_Outfit_Top.skeleton}
      />
    </group>
  );
}

// Helper functions for enhanced emotion and language processing

const selectAnimationFromEmotion = (emotion, text = '') => {
  const textLength = text.length;
  const animationMap = {
    joy: textLength > 50 ? 'TalkingThree' : 'TalkingOne',
    laugh: 'TalkingThree',
    smile: 'TalkingOne',
    happy: 'TalkingOne',
    sad: 'SadIdle',
    melancholy: 'SadIdle',
    despair: 'Defeated',
    angry: 'Angry',
    furious: 'Angry',
    irritated: 'DismissingGesture',
    fear: 'Surprised',
    terror: 'Surprised',
    anxiety: 'ThoughtfulHeadShake',
    surprised: 'Surprised',
    amazed: 'Surprised',
    shocked: 'Surprised',
    thoughtful: 'ThoughtfulHeadShake',
    confused: 'ThoughtfulHeadShake',
    skeptical: 'DismissingGesture',
    default: 'Idle'
  };
  
  return animationMap[emotion] || 'Idle';
};

const getLanguageEmotionMultiplier = (language, morphTarget, emotion) => {
  const languageEmotionAdjustments = {
    'es': { // Spanish - more expressive
      mouthSmileLeft: 1.2,
      mouthSmileRight: 1.2,
      browInnerUp: 1.1,
      cheekSquintLeft: 1.1,
      cheekSquintRight: 1.1
    },
    'fr': { // French - more subtle, refined
      mouthSmileLeft: 0.9,
      mouthSmileRight: 0.9,
      mouthPucker: 1.2,
      browInnerUp: 0.9
    },
    'de': { // German - more controlled
      browDownLeft: 1.1,
      browDownRight: 1.1,
      jawForward: 1.1
    },
    'it': { // Italian - very expressive
      mouthSmileLeft: 1.3,
      mouthSmileRight: 1.3,
      browInnerUp: 1.2,
      eyeSquintLeft: 1.1,
      eyeSquintRight: 1.1
    },
    'ja': { // Japanese - more reserved
      mouthSmileLeft: 0.8,
      mouthSmileRight: 0.8,
      browInnerUp: 0.7,
      eyeSquintLeft: 0.8,
      eyeSquintRight: 0.8
    },
    'zh': { // Chinese - moderate expression
      mouthSmileLeft: 0.9,
      mouthSmileRight: 0.9,
      browInnerUp: 0.8
    }
  };
  
  const adjustments = languageEmotionAdjustments[language];
  return adjustments && adjustments[morphTarget] ? adjustments[morphTarget] : 1.0;
};

const getLanguageVisemeIntensity = (language, visemeKey) => {
  const languageVisemeAdjustments = {
    'es': { A: 1.0, B: 1.1, C: 1.0, D: 1.2, E: 1.1, F: 1.0, G: 1.0, H: 0.8 },
    'fr': { A: 1.0, B: 1.0, C: 1.0, D: 1.0, E: 1.1, F: 1.2, G: 1.0, H: 0.9 },
    'de': { A: 1.0, B: 1.2, C: 1.1, D: 1.0, E: 1.0, F: 1.0, G: 1.0, H: 1.0 },
    'it': { A: 1.0, B: 1.0, C: 1.0, D: 1.1, E: 1.1, F: 1.0, G: 1.0, H: 1.0 },
    'pt': { A: 1.0, B: 1.0, C: 1.0, D: 1.2, E: 1.1, F: 1.0, G: 1.0, H: 1.0 },
    'ru': { A: 1.0, B: 1.1, C: 1.2, D: 1.0, E: 1.0, F: 1.0, G: 1.0, H: 1.0 },
    'ja': { A: 1.0, B: 0.9, C: 0.9, D: 0.9, E: 0.9, F: 0.9, G: 0.9, H: 0.9 },
    'zh': { A: 1.0, B: 1.0, C: 1.0, D: 1.0, E: 1.0, F: 1.0, G: 1.0, H: 1.0 },
    'ar': { A: 1.0, B: 1.1, C: 1.1, D: 1.1, E: 1.0, F: 1.0, G: 1.0, H: 1.0 },
    'hi': { A: 1.0, B: 1.0, C: 1.0, D: 1.0, E: 1.0, F: 1.0, G: 1.0, H: 1.0 }
  };
  
  const adjustments = languageVisemeAdjustments[language];
  return adjustments && adjustments[visemeKey] ? adjustments[visemeKey] : 1.0;
};

const getEmotionVisemeIntensity = (emotion, visemeKey) => {
  const emotionVisemeAdjustments = {
    joy: { A: 1.0, B: 1.0, C: 1.0, D: 1.2, E: 1.1, F: 1.0, G: 1.0, H: 1.0 },
    angry: { A: 1.0, B: 1.3, C: 1.2, D: 1.1, E: 1.0, F: 1.0, G: 1.1, H: 1.0 },
    sad: { A: 1.0, B: 0.8, C: 0.9, D: 0.9, E: 0.8, F: 0.8, G: 0.9, H: 1.0 },
    surprised: { A: 1.0, B: 1.0, C: 1.0, D: 1.3, E: 1.2, F: 1.1, G: 1.0, H: 1.0 },
    fear: { A: 1.0, B: 0.9, C: 1.0, D: 1.1, E: 1.0, F: 1.2, G: 1.0, H: 1.0 }
  };
  
  const adjustments = emotionVisemeAdjustments[emotion];
  return adjustments && adjustments[visemeKey] ? adjustments[visemeKey] : 1.0;
};

const getBlinkDuration = (emotion) => {
  const emotionBlinkDurations = {
    sad: 300,
    tired: 400,
    surprised: 100,
    angry: 150,
    default: 200
  };
  
  return emotionBlinkDurations[emotion] || emotionBlinkDurations.default;
};

const getBlinkInterval = (emotion) => {
  const emotionBlinkIntervals = {
    sad: [2000, 4000],
    tired: [1000, 2000],
    surprised: [4000, 8000],
    angry: [3000, 6000],
    thoughtful: [2000, 5000],
    default: [1000, 5000]
  };
  
  const intervals = emotionBlinkIntervals[emotion] || emotionBlinkIntervals.default;
  return THREE.MathUtils.randInt(intervals[0], intervals[1]);
};

const estimateTextDuration = (text) => {
  if (!text) return 1000;
  // Estimate 150 words per minute average speaking rate
  const wordsPerMinute = 150;
  const words = text.split(' ').length;
  const durationInMinutes = words / wordsPerMinute;
  return Math.max(durationInMinutes * 60 * 1000, 1000); // Convert to milliseconds, minimum 1 second
};

useGLTF.preload("/models/avatar.glb");