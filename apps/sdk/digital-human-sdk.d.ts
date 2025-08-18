// digital-human-sdk.d.ts
export interface DigitalHumanConfig {
    backendUrl?: string;
    frontendUrl?: string;
    apiKey?: string;
    language?: string;
    voice?: string;
    model?: string;
    debug?: boolean;
    timeout?: number;
    retryAttempts?: number;
    enableWebSocket?: boolean;
  }
  
  export interface MessageResponse {
    messages: Array<{
      text: string;
      facialExpression: string;
      animation: string;
      audio?: string;
      lipsync?: any;
    }>;
    language: string;
    timestamp: string;
    sessionId: string;
  }
  
  export interface VoiceResponse extends MessageResponse {
    transcription: string;
  }
  
  export declare class DigitalHumanSDK {
    constructor(config?: DigitalHumanConfig);
    initialize(): Promise<boolean>;
    sendTextMessage(message: string, options?: any): Promise<MessageResponse>;
    startRecording(options?: any): Promise<boolean>;
    stopRecording(): Promise<boolean>;
    processAudioRecording(audioData: Blob | Buffer | string): Promise<VoiceResponse>;
    setAnimation(animation: string): Promise<void>;
    setFacialExpression(expression: string, intensity?: number): Promise<void>;
    getVoices(): Promise<Array<any>>;
    getLanguages(): Promise<object>;
    on(event: string, callback: Function): Function;
    off(event: string, callback: Function): void;
    destroy(): void;
  }
  