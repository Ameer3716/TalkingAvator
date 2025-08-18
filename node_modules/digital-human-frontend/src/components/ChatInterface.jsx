import { useRef, useState, useEffect } from "react";
import { useSpeech } from "../hooks/useSpeech";

export const ChatInterface = ({ hidden, ...props }) => {
  const input = useRef();
  const { 
    tts, 
    loading, 
    message, 
    startRecording, 
    stopRecording, 
    recording,
    transcription,
    isProcessing,
    audioLevel,
    status,
    supported
  } = useSpeech();

  const [showTranscription, setShowTranscription] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  // Recording duration timer
  useEffect(() => {
    let interval;
    if (recording) {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingDuration(0);
    }
    return () => clearInterval(interval);
  }, [recording]);

  // Show transcription when available
  useEffect(() => {
    if (transcription) {
      setShowTranscription(true);
      const timer = setTimeout(() => setShowTranscription(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [transcription]);

  const sendMessage = () => {
    const text = input.current.value;
    if (!loading && !message && text.trim()) {
      tts(text);
      input.current.value = "";
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusMessage = () => {
    if (!supported) {
      return "❌ Microphone not supported in this browser";
    }
    if (recording) {
      return `🎤 Recording... ${formatDuration(recordingDuration)}`;
    }
    if (isProcessing) {
      return "🤖 Processing your speech...";
    }
    if (loading) {
      return "💭 Thinking...";
    }
    return "💬 Type a message or click the microphone to speak";
  };

  const getMicrophoneButtonClass = () => {
    const baseClass = "p-4 font-semibold uppercase rounded-xl transition-all duration-200 flex items-center justify-center min-w-[60px] shadow-lg";
    
    if (!supported) {
      return `${baseClass} bg-gray-600/50 cursor-not-allowed opacity-50 backdrop-blur-md`;
    }
    if (recording) {
      return `${baseClass} bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.5)]`;
    }
    if (loading || message || isProcessing) {
      return `${baseClass} bg-gray-600/50 cursor-not-allowed opacity-50 text-white backdrop-blur-md`;
    }
    return `${baseClass} bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:shadow-[0_0_30px_rgba(0,240,255,0.5)]`;
  };

  const AudioLevelIndicator = () => {
    if (!recording || audioLevel === 0) return null;
    
    const bars = Array.from({ length: 5 }, (_, i) => {
      const isActive = audioLevel > (i + 1) * 0.2;
      return (
        <div
          key={i}
          className={`w-1 mx-px rounded-full transition-all duration-100 ${
            isActive 
              ? 'bg-gradient-to-t from-green-400 to-cyan-400 h-6 shadow-[0_0_4px_rgba(34,197,94,0.8)]' 
              : 'bg-gray-500/50 h-2'
          }`}
        />
      );
    });

    return (
      <div className="flex items-end justify-center space-x-px h-8 px-2">
        {bars}
      </div>
    );
  };

  const TranscriptionDisplay = () => {
    if (!showTranscription || !transcription) return null;

    return (
      <div className="absolute bottom-full mb-4 left-0 right-0 mx-auto max-w-md">
        <div className="bg-gradient-to-r from-cyan-900/90 to-purple-900/90 backdrop-blur-md border border-cyan-400/30 p-4 rounded-2xl shadow-[0_0_20px_rgba(0,240,255,0.3)] animate-fade-in">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-cyan-300 font-medium">I heard you say:</p>
              <p className="text-sm text-white italic">"{transcription}"</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (hidden) {
    return null;
  }

  return (
    <div className="bg-gray-900/50 backdrop-blur-md border-t border-cyan-400/20 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Chat Header */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
            AI Chat Interface
          </h2>
          <p className="text-cyan-300/80">{getStatusMessage()}</p>
          
          {/* Status indicators */}
          <div className="mt-4 flex justify-center space-x-4 text-sm">
            <span
              className={`px-3 py-1 rounded-full border ${
                status.supported
                  ? "bg-green-500/20 text-green-300 border-green-500/30"
                  : "bg-red-500/20 text-red-300 border-red-500/30"
              }`}
            >
              {status.supported ? "✅ Mic Ready" : "❌ No Mic"}
            </span>

            {status.supported && (
              <span
                className={`px-3 py-1 rounded-full border ${
                  status.hasAudio && recording
                    ? "bg-green-500/20 text-green-300 border-green-500/30"
                    : "bg-gray-500/20 text-gray-300 border-gray-500/30"
                }`}
              >
                {status.hasAudio && recording ? "🔊 Audio Detected" : "🔇 Silent"}
              </span>
            )}
            
            <a
              href="/docs"
              className="px-3 py-1 rounded-full border border-purple-400/30 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-all"
            >
              📚 SDK Docs
            </a>
          </div>
        </div>

        {/* Audio level indicator for recording feedback */}
        {recording && (
          <div className="mb-6 flex items-center justify-center space-x-4">
            <span className="text-cyan-400 font-medium">Audio Level:</span>
            <AudioLevelIndicator />
          </div>
        )}

        {/* Input Section */}
        <div className="relative">
        <TranscriptionDisplay />
        
          <div className="flex items-center gap-4 max-w-4xl mx-auto">
          {/* Enhanced Microphone Button */}
          <button
            onClick={recording ? stopRecording : startRecording}
            disabled={!supported || (loading && !recording) || (message && !recording)}
            className={getMicrophoneButtonClass()}
            title={
              !supported 
                ? "Microphone not supported" 
                : recording 
                  ? "Stop recording" 
                  : "Start recording"
            }
          >
            {recording ? (
              <div className="flex flex-col items-center space-y-1">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6h12v12H6z"/>
                </svg>
                <span className="text-xs">{formatDuration(recordingDuration)}</span>
              </div>
            ) : isProcessing ? (
              <div className="flex flex-col items-center">
                <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                <span className="text-xs mt-1">AI</span>
              </div>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z"
                />
              </svg>
            )}
          </button>

          {/* Enhanced Text Input */}
          <div className="flex-1 relative">
            <input
              className="w-full placeholder:text-gray-400 placeholder:italic p-4 pr-12 rounded-xl bg-gray-900/50 backdrop-blur-md shadow-lg border border-purple-400/30 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-200 text-white"
              placeholder={
                recording 
                  ? "🎤 Recording..." 
                  : isProcessing 
                    ? "🤖 Processing..." 
                    : "Type your message or use voice..."
              }
              ref={input}
              disabled={recording || isProcessing}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
            />
            
            {/* Input status indicator */}
            {(loading || isProcessing) && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 animate-spin text-cyan-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
              </div>
            )}
          </div>

          {/* Enhanced Send Button */}
          <button
            disabled={loading || message || recording || isProcessing}
            onClick={sendMessage}
            className={`p-4 px-6 font-semibold uppercase rounded-xl transition-all duration-200 shadow-lg ${
              loading || message || recording || isProcessing
                ? "cursor-not-allowed opacity-50 bg-gray-600/50 text-gray-300 backdrop-blur-md"
                : "bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600 text-white hover:scale-105 shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)]"
            }`}
            title="Send message"
          >
            {loading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.875L5.999 12zm0 0h7.5"
                />
              </svg>
            )}
          </button>
        </div>

          {/* Help text */}
          <div className="text-center mt-4 text-sm text-gray-400">
          {!supported ? (
            <span className="text-red-400">
              ⚠️ Voice recording not supported in this browser
            </span>
          ) : (
            <span>
              💡 Hold microphone to record, or type your message
            </span>
          )}
        </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};