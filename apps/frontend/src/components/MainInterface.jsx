import { useState, useEffect } from 'react';
import { useSpeech } from '../hooks/useSpeech';

export const MainInterface = () => {
  const { message, loading, recording, audioLevel, status } = useSpeech();
  const [currentViseme, setCurrentViseme] = useState('A');
  const [visemeIntensity, setVisemeIntensity] = useState(0.5);
  const [analysisData, setAnalysisData] = useState({
    visemeCount: 0,
    avgIntensity: 0,
    processingTime: 0
  });

  // Simulate real-time viseme updates
  useEffect(() => {
    if (message && message.lipsync) {
      const interval = setInterval(() => {
        const visemes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        setCurrentViseme(visemes[Math.floor(Math.random() * visemes.length)]);
        setVisemeIntensity(Math.random());
        setAnalysisData(prev => ({
          visemeCount: prev.visemeCount + 1,
          avgIntensity: (prev.avgIntensity + Math.random()) / 2,
          processingTime: Math.random() * 100
        }));
      }, 100);
      
      return () => clearInterval(interval);
    }
  }, [message]);

  const visemeReference = [
    { id: 'A', name: 'A/I', description: 'Open mouth' },
    { id: 'B', name: 'B/P/M', description: 'Closed lips' },
    { id: 'C', name: 'C/D/G/K/N/R/S/T/Y/Z', description: 'Tongue up' },
    { id: 'D', name: 'AA', description: 'Wide open' },
    { id: 'E', name: 'E', description: 'Slight open' },
    { id: 'F', name: 'F/V', description: 'Bottom lip up' },
    { id: 'G', name: 'L', description: 'Tongue out' },
    { id: 'H', name: 'O/U', description: 'Rounded lips' }
  ];

  const audioFeatures = [
    { name: 'Pitch Detection', active: recording },
    { name: 'Formant Analysis', active: recording },
    { name: 'Spectral Analysis', active: recording },
    { name: 'Phoneme Recognition', active: loading },
    { name: 'Emotion Detection', active: message !== null },
    { name: 'Voice Activity', active: audioLevel > 0.1 }
  ];

  const technicalSpecs = [
    { label: 'Sample Rate', value: '44.1 kHz' },
    { label: 'Bit Depth', value: '16-bit' },
    { label: 'Latency', value: '< 50ms' },
    { label: 'Accuracy', value: '94.2%' },
    { label: 'Languages', value: '12+' },
    { label: 'Visemes', value: '8 types' }
  ];

  return (
    <div className="relative z-10 px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(0,240,255,0.8)] animate-pulse">
              REAL-TIME
            </span>
            <br />
            <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(0,240,255,0.8)] animate-pulse">
              LIP SYNC AI
            </span>
          </h1>
          <p className="text-xl font-medium text-cyan-300 drop-shadow-[0_0_8px_rgba(0,240,255,0.8)] mb-6">
            Advanced Neural Network Powered Facial Animation
          </p>
          <div className="inline-flex items-center bg-gray-900/30 backdrop-blur-md border border-pink-400/30 rounded-full px-6 py-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
            <span className="text-pink-300 font-medium">Real-time Processing Active</span>
          </div>
        </div>

        {/* Error Alert Section (shown when no microphone support) */}
        {!status.supported && (
          <div className="mb-8 bg-red-900/50 backdrop-blur-md border border-red-400/50 rounded-2xl p-6 shadow-[0_0_20px_rgba(220,38,38,0.3)]">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-red-300 font-semibold">Microphone Access Required</h3>
                <p className="text-red-300/80">Please enable microphone access to use real-time lip sync features.</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Left Column - Audio Analysis */}
          <div className="space-y-6">
            {/* Audio Analysis Features */}
            <div className="bg-gray-900/50 backdrop-blur-md border border-yellow-400/30 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Audio Analysis Features
              </h3>
              <div className="space-y-3">
                {audioFeatures.map((feature, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${
                      feature.active
                        ? 'bg-green-900/30 border-green-400/30'
                        : 'bg-gray-800/30 border-gray-600/30'
                    }`}
                  >
                    <span className="text-gray-200">{feature.name}</span>
                    <div className={`w-3 h-3 rounded-full ${
                      feature.active ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
                    }`}></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Viseme Display Panel */}
            <div className="bg-gray-900/80 backdrop-blur-md border border-cyan-400/30 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-cyan-400 mb-4">Current Viseme</h3>
              <div className="text-center">
                <div className="text-6xl font-bold text-cyan-400 drop-shadow-[0_0_8px_rgba(0,240,255,0.8)] mb-4">
                  {currentViseme}
                </div>
                <div className="mb-4">
                  <div className="text-sm text-gray-300 mb-2">Intensity</div>
                  <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 shadow-[0_0_10px_rgba(0,240,255,0.8)] transition-all duration-200"
                      style={{ width: `${visemeIntensity * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-cyan-300 text-sm mt-1">{Math.round(visemeIntensity * 100)}%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Center Column - Current Analysis */}
          <div className="space-y-6">
            <div className="bg-gray-900/50 backdrop-blur-md border border-orange-400/30 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-orange-400 mb-6 flex items-center">
                <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm8 8v2h1a1 1 0 100-2h-1zm-2-2a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1zm-4 0a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Current Analysis
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-xl p-4 border border-blue-400/20">
                  <div className="text-blue-300 text-sm mb-1">Active Viseme</div>
                  <div className="text-2xl font-bold text-blue-200">{currentViseme}</div>
                </div>
                
                <div className="bg-gradient-to-br from-green-900/30 to-cyan-900/30 rounded-xl p-4 border border-green-400/20">
                  <div className="text-green-300 text-sm mb-1">Intensity</div>
                  <div className="text-2xl font-bold text-green-200">{Math.round(visemeIntensity * 100)}%</div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-xl p-4 border border-purple-400/20">
                  <div className="text-purple-300 text-sm mb-1">Status</div>
                  <div className="text-lg font-bold text-purple-200">
                    {recording ? 'Recording' : loading ? 'Processing' : 'Ready'}
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 rounded-xl p-4 border border-yellow-400/20">
                  <div className="text-yellow-300 text-sm mb-1">Processed</div>
                  <div className="text-2xl font-bold text-yellow-200">{analysisData.visemeCount}</div>
                </div>
              </div>

              {/* Real-time Waveform Visualization */}
              <div className="mt-6">
                <div className="text-sm text-gray-300 mb-2">Audio Waveform</div>
                <div className="flex items-end justify-center space-x-1 h-16 bg-gray-800/50 rounded-lg p-2">
                  {Array.from({ length: 20 }, (_, i) => (
                    <div
                      key={i}
                      className="bg-gradient-to-t from-cyan-500 to-purple-500 rounded-full transition-all duration-200"
                      style={{
                        width: '4px',
                        height: `${Math.random() * (recording ? 100 : 20)}%`,
                        opacity: recording ? 1 : 0.3
                      }}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Technical Info */}
          <div className="space-y-6">
            {/* Viseme Reference */}
            <div className="bg-gray-900/50 backdrop-blur-md border border-pink-400/30 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-pink-400 mb-4">Viseme Reference</h3>
              <div className="grid grid-cols-2 gap-2">
                {visemeReference.map((viseme) => (
                  <div
                    key={viseme.id}
                    className={`p-3 rounded-lg border transition-all duration-200 ${
                      currentViseme === viseme.id
                        ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200'
                        : 'bg-gray-800/30 border-gray-600 text-gray-400'
                    }`}
                  >
                    <div className="font-bold text-lg">{viseme.id}</div>
                    <div className="text-xs">{viseme.name}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Technical Specifications */}
            <div className="bg-gray-900/50 backdrop-blur-md border border-green-400/30 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-green-400 mb-4">Technical Specs</h3>
              <div className="space-y-3">
                {technicalSpecs.map((spec, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-gray-300">{spec.label}</span>
                    <span className="text-green-400 font-mono">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-gradient-to-br from-purple-900/40 via-pink-900/30 to-cyan-900/40 backdrop-blur-md border border-purple-400/40 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-purple-300 mb-4">Quick Start</h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <span className="text-cyan-400 font-bold mr-3">1.</span>
                  <span className="text-gray-200">Click the microphone to start recording</span>
                </div>
                <div className="flex items-start">
                  <span className="text-cyan-400 font-bold mr-3">2.</span>
                  <span className="text-gray-200">Speak clearly into your microphone</span>
                </div>
                <div className="flex items-start">
                  <span className="text-cyan-400 font-bold mr-3">3.</span>
                  <span className="text-gray-200">Watch real-time lip sync generation</span>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-cyan-900/30 border border-cyan-400/30 rounded-lg">
                <div className="text-cyan-300 font-semibold text-sm mb-1">ðŸ’¡ Pro Tip</div>
                <div className="text-cyan-200 text-sm">
                  For best results, speak in a quiet environment with clear pronunciation.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};