const facialExpressions = {
  default: {},
  
  // Happy emotions
  smile: {
    browInnerUp: 0.17,
    eyeSquintLeft: 0.4,
    eyeSquintRight: 0.44,
    noseSneerLeft: 0.17,
    noseSneerRight: 0.14,
    mouthPressLeft: 0.61,
    mouthPressRight: 0.41,
    mouthSmileLeft: 0.8,
    mouthSmileRight: 0.8,
    cheekSquintLeft: 0.3,
    cheekSquintRight: 0.3,
  },
  
  joy: {
    browInnerUp: 0.3,
    eyeSquintLeft: 0.6,
    eyeSquintRight: 0.6,
    mouthSmileLeft: 1.0,
    mouthSmileRight: 1.0,
    cheekSquintLeft: 0.8,
    cheekSquintRight: 0.8,
    mouthDimpleLeft: 0.4,
    mouthDimpleRight: 0.4,
    browOuterUpLeft: 0.2,
    browOuterUpRight: 0.2,
  },
  
  laugh: {
    jawOpen: 0.4,
    mouthSmileLeft: 1.0,
    mouthSmileRight: 1.0,
    eyeSquintLeft: 0.8,
    eyeSquintRight: 0.8,
    cheekSquintLeft: 1.0,
    cheekSquintRight: 1.0,
    browInnerUp: 0.4,
    mouthUpperUpLeft: 0.6,
    mouthUpperUpRight: 0.6,
    noseSneerLeft: 0.5,
    noseSneerRight: 0.5,
  },
  
  // Sad emotions
  sad: {
    mouthFrownLeft: 1,
    mouthFrownRight: 1,
    mouthShrugLower: 0.78,
    browInnerUp: 0.45,
    eyeSquintLeft: 0.72,
    eyeSquintRight: 0.75,
    eyeLookDownLeft: 0.5,
    eyeLookDownRight: 0.5,
    jawForward: 1,
    mouthLowerDownLeft: 0.4,
    mouthLowerDownRight: 0.4,
  },
  
  melancholy: {
    browInnerUp: 0.8,
    browDownLeft: 0.3,
    browDownRight: 0.3,
    eyeLookDownLeft: 0.7,
    eyeLookDownRight: 0.7,
    mouthFrownLeft: 0.6,
    mouthFrownRight: 0.6,
    mouthShrugLower: 0.5,
    eyeSquintLeft: 0.4,
    eyeSquintRight: 0.4,
  },
  
  despair: {
    browInnerUp: 1.0,
    browDownLeft: 0.8,
    browDownRight: 0.8,
    eyeSquintLeft: 1.0,
    eyeSquintRight: 1.0,
    mouthFrownLeft: 1.0,
    mouthFrownRight: 1.0,
    jawOpen: 0.3,
    mouthShrugLower: 1.0,
    eyeLookDownLeft: 0.8,
    eyeLookDownRight: 0.8,
  },
  
  // Angry emotions
  angry: {
    browDownLeft: 1,
    browDownRight: 1,
    eyeSquintLeft: 1,
    eyeSquintRight: 1,
    jawForward: 1,
    jawLeft: 1,
    mouthShrugLower: 1,
    noseSneerLeft: 1,
    noseSneerRight: 0.42,
    eyeLookDownLeft: 0.16,
    eyeLookDownRight: 0.16,
    cheekSquintLeft: 1,
    cheekSquintRight: 1,
    mouthClose: 0.23,
    mouthFunnel: 0.63,
    mouthDimpleRight: 1,
  },
  
  furious: {
    browDownLeft: 1.0,
    browDownRight: 1.0,
    eyeSquintLeft: 1.0,
    eyeSquintRight: 1.0,
    noseSneerLeft: 1.0,
    noseSneerRight: 1.0,
    jawForward: 1.0,
    mouthShrugUpper: 0.8,
    mouthClose: 0.5,
    cheekSquintLeft: 1.0,
    cheekSquintRight: 1.0,
    eyeLookInLeft: 0.3,
    eyeLookInRight: 0.3,
  },
  
  irritated: {
    browDownLeft: 0.6,
    browDownRight: 0.6,
    eyeSquintLeft: 0.5,
    eyeSquintRight: 0.5,
    noseSneerLeft: 0.4,
    noseSneerRight: 0.4,
    mouthLeft: 0.3,
    mouthFrownLeft: 0.3,
    mouthFrownRight: 0.3,
  },
  
  // Fear emotions
  fear: {
    browInnerUp: 1.0,
    browOuterUpLeft: 0.8,
    browOuterUpRight: 0.8,
    eyeWideLeft: 0.8,
    eyeWideRight: 0.8,
    jawOpen: 0.5,
    mouthFunnel: 0.3,
    eyeLookUpLeft: 0.2,
    eyeLookUpRight: 0.2,
  },
  
  terror: {
    browInnerUp: 1.0,
    browOuterUpLeft: 1.0,
    browOuterUpRight: 1.0,
    eyeWideLeft: 1.0,
    eyeWideRight: 1.0,
    jawOpen: 0.8,
    mouthStretchLeft: 0.6,
    mouthStretchRight: 0.6,
    cheekPuff: 0.3,
  },
  
  anxiety: {
    browInnerUp: 0.7,
    eyeSquintLeft: 0.3,
    eyeSquintRight: 0.3,
    mouthShrugLower: 0.4,
    eyeLookDownLeft: 0.3,
    eyeLookDownRight: 0.3,
    jawForward: 0.2,
  },
  
  // Surprise emotions
  surprised: {
    eyeWideLeft: 0.5,
    eyeWideRight: 0.5,
    jawOpen: 0,
    mouthFunnel: 0.2,
    browInnerUp: 1,
  },
  
  amazed: {
    eyeWideLeft: 0.8,
    eyeWideRight: 0.8,
    browInnerUp: 1.0,
    browOuterUpLeft: 0.6,
    browOuterUpRight: 0.6,
    jawOpen: 0.4,
    mouthFunnel: 0.5,
  },
  
  shocked: {
    eyeWideLeft: 1.0,
    eyeWideRight: 1.0,
    browInnerUp: 1.0,
    browOuterUpLeft: 1.0,
    browOuterUpRight: 1.0,
    jawOpen: 0.8,
    mouthStretchLeft: 0.4,
    mouthStretchRight: 0.4,
  },
  
  // Disgust emotions
  disgust: {
    browDownLeft: 0.8,
    browDownRight: 0.8,
    eyeSquintLeft: 0.6,
    eyeSquintRight: 0.6,
    noseSneerLeft: 1.0,
    noseSneerRight: 1.0,
    mouthShrugUpper: 0.8,
    mouthLeft: 0.4,
  },
  
  revulsion: {
    browDownLeft: 1.0,
    browDownRight: 1.0,
    eyeSquintLeft: 1.0,
    eyeSquintRight: 1.0,
    noseSneerLeft: 1.0,
    noseSneerRight: 1.0,
    mouthShrugUpper: 1.0,
    mouthFrownLeft: 0.8,
    mouthFrownRight: 0.8,
    jawLeft: 0.5,
  },
  
  // Contempt
  contempt: {
    browDownLeft: 0.4,
    browDownRight: 0.4,
    eyeSquintLeft: 0.3,
    eyeSquintRight: 0.3,
    noseSneerLeft: 0.6,
    noseSneerRight: 0.6,
    mouthLeft: 0.8,
    mouthSmileLeft: 0.2, // Slight smirk
  },
  
  // Neutral variations
  thoughtful: {
    browInnerUp: 0.2,
    eyeLookUpLeft: 0.3,
    eyeLookUpRight: 0.3,
    mouthPucker: 0.2,
    jawForward: 0.1,
  },
  
  confused: {
    browInnerUp: 0.6,
    browDownLeft: 0.3,
    eyeSquintLeft: 0.2,
    eyeSquintRight: 0.2,
    mouthLeft: 0.2,
    mouthPucker: 0.3,
  },
  
  skeptical: {
    browDownLeft: 0.3,
    browOuterUpRight: 0.4,
    eyeSquintLeft: 0.3,
    mouthLeft: 0.5,
    noseSneerLeft: 0.2,
  },
  
  // Complex emotions
  embarrassed: {
    eyeLookDownLeft: 0.6,
    eyeLookDownRight: 0.6,
    mouthSmileLeft: 0.3,
    mouthSmileRight: 0.3,
    browInnerUp: 0.3,
    cheekPuff: 0.2,
  },
  
  proud: {
    browOuterUpLeft: 0.3,
    browOuterUpRight: 0.3,
    mouthSmileLeft: 0.6,
    mouthSmileRight: 0.6,
    jawForward: 0.2,
    eyeLookUpLeft: 0.1,
    eyeLookUpRight: 0.1,
  },
  
  determined: {
    browDownLeft: 0.5,
    browDownRight: 0.5,
    eyeSquintLeft: 0.3,
    eyeSquintRight: 0.3,
    jawForward: 0.6,
    mouthClose: 0.4,
    noseSneerLeft: 0.2,
    noseSneerRight: 0.2,
  },
  
  // Keep original expressions for compatibility
  funnyFace: {
    jawLeft: 0.63,
    mouthPucker: 0.53,
    noseSneerLeft: 1,
    noseSneerRight: 0.39,
    mouthLeft: 1,
    eyeLookUpLeft: 1,
    eyeLookUpRight: 1,
    cheekPuff: 1,
    mouthDimpleLeft: 0.41,
    mouthRollLower: 0.32,
    mouthSmileLeft: 0.35,
    mouthSmileRight: 0.35,
  },
  
  crazy: {
    browInnerUp: 0.9,
    jawForward: 1,
    noseSneerLeft: 0.57,
    noseSneerRight: 0.51,
    eyeLookDownLeft: 0.39,
    eyeLookUpRight: 0.40,
    eyeLookInLeft: 0.96,
    eyeLookInRight: 0.96,
    jawOpen: 0.96,
    mouthDimpleLeft: 0.96,
    mouthDimpleRight: 0.96,
    mouthStretchLeft: 0.28,
    mouthStretchRight: 0.29,
    mouthSmileLeft: 0.56,
    mouthSmileRight: 0.38,
    tongueOut: 0.96,
  },
};

export default facialExpressions;