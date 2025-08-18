import React, { useState } from "react";

// Fade-in animation keyframes (Tailwind via custom class)
const fadeInClass =
  "animate-[fadeIn_0.5s_ease-in-out] @keyframes fadeIn {0%{opacity:0;transform:translateY(10px);}100%{opacity:1;transform:translateY(0);}}";

const CodeBlock = ({ children }) => (
  <pre className="backdrop-blur-md bg-white/10 border border-white/20 text-white p-4 rounded-xl mt-2 overflow-x-auto text-sm shadow-lg">
    <code>{children.trim()}</code>
  </pre>
);

const Tab = ({ label, activeTab, setActiveTab }) => (
  <button
    onClick={() => setActiveTab(label)}
    className={`px-4 py-2 text-sm font-medium rounded-t-xl transition-all duration-300 
      ${
        activeTab === label
          ? "backdrop-blur-md bg-white/20 text-white border-b-2 border-cyan-400 shadow-inner"
          : "text-gray-200 hover:text-white hover:bg-white/10"
      }`}
  >
    {label}
  </button>
);

const Heading = ({ children }) => (
  <h3 className="text-3xl font-extrabold bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg">
    {children}
  </h3>
);

const WebDocumentation = () => (
  <div className={`space-y-6 text-white ${fadeInClass}`}>
    <Heading>Web / Plain JavaScript</Heading>
    
    <div>
      <h4 className="text-xl font-semibold">1. Installation</h4>
      <p>
        Include the SDK script in your HTML file. Download the{" "}
        <code className="text-cyan-300">digital-human-sdk.umd.js</code> file from
        the SDK's <code className="text-cyan-300">dist</code> folder and host it
        with your project.
      </p>
      <CodeBlock>
        {`
<script src="/path/to/digital-human-sdk.umd.js"></script>
        `}
      </CodeBlock>
    </div>

    <div>
      <h4 className="text-xl font-semibold">2. Initialization</h4>
      <p>Create a new instance of the SDK and initialize it.</p>
      <CodeBlock>
        {`
const config = {
  backendUrl: 'http://localhost:3000',
  debug: true,
};

const sdk = new DigitalHumanSDK.DigitalHumanSDK(config);

sdk.initialize().then(isReady => {
  if (isReady) {
    console.log("Digital Human SDK is ready!");
  }
});
        `}
      </CodeBlock>
    </div>

    <div>
      <h4 className="text-xl font-semibold">3. Usage Examples</h4>
      <p className="font-medium mt-2">Sending a Text Message:</p>
      <CodeBlock>
        {`
sdk.sendTextMessage("Hello, how are you?")
  .then(response => {
    console.log("Received response:", response.messages);
    // Use the response to play audio and lip-sync
  })
  .catch(error => console.error(error));
        `}
      </CodeBlock>
      <p className="font-medium mt-4">Using Voice Recording:</p>
      <CodeBlock>
        {`
// Add event listeners for UI updates
sdk.on('recordingStarted', () => console.log('Recording...'));
sdk.on('voiceResponse', (response) => {
  console.log('Transcription:', response.transcription);
  console.log('AI Response:', response.messages);
});
sdk.on('error', (error) => console.error('SDK Error:', error));

// Start and stop recording
document.getElementById('start-btn').onclick = () => sdk.startRecording();
document.getElementById('stop-btn').onclick = () => sdk.stopRecording();
        `}
      </CodeBlock>
    </div>
  </div>
);

const ReactDocumentation = () => (
  <div className={`space-y-6 text-white ${fadeInClass}`}>
    <Heading>React / MERN</Heading>
    <div>
      <h4 className="text-xl font-semibold">1. Installation</h4>
      <p>This SDK does not have a public NPM package yet. You can include it as a local module.</p>
    </div>
    <div>
      <h4 className="text-xl font-semibold">2. Using the `ReactDigitalHuman` Adapter</h4>
      <p>The SDK includes a `ReactDigitalHuman` class with a static `useDigitalHuman` hook for easy integration.</p>
      <CodeBlock>
        {`
import { ReactDigitalHuman } from './path/to/digital-human-sdk.js';
import React, { useEffect } from 'react';

const MyAvatarComponent = () => {
  const { sdk, isReady } = ReactDigitalHuman.useDigitalHuman({
    backendUrl: 'http://localhost:3000',
  });

  useEffect(() => {
    if (isReady) {
      console.log('SDK is ready to use in React!');
      sdk.sendTextMessage("Hello from React!");
    }
  }, [isReady, sdk]);

  return <div>My Digital Human</div>;
};
        `}
      </CodeBlock>
    </div>
  </div>
);

const ReactNativeDocumentation = () => (
  <div className={`space-y-6 text-white ${fadeInClass}`}>
    <Heading>React Native</Heading>
    <div>
      <h4 className="text-xl font-semibold">1. Overview</h4>
      <p>The `ReactNativeDigitalHuman` adapter bridges JavaScript with native audio recording modules.</p>
    </div>
    <div>
      <h4 className="text-xl font-semibold">2. Initialization</h4>
      <CodeBlock>
        {`
import { ReactNativeDigitalHuman } from './path/to/digital-human-sdk.js';

const sdk = new ReactNativeDigitalHuman({
    backendUrl: 'YOUR_BACKEND_URL'
});
sdk.initialize();
        `}
      </CodeBlock>
    </div>
    <div>
      <h4 className="text-xl font-semibold">3. Bridging with Native Code</h4>
      <CodeBlock>
        {`
sdk.on('requestNativeRecording', async () => {
    const audioPath = "path/to/audio.wav";
    const response = await sdk.processNativeAudio(audioPath);
    console.log(response);
});

const handleStartRecording = () => {
    sdk.startNativeRecording();
};
        `}
      </CodeBlock>
    </div>
  </div>
);

const FlutterDocumentation = () => (
  <div className={`space-y-6 text-white ${fadeInClass}`}>
    <Heading>Flutter</Heading>
    <div>
      <h4 className="text-xl font-semibold">1. Overview</h4>
      <p>For Flutter, the SDK runs inside a WebView with communication via a JavaScript Channel.</p>
    </div>
    <div>
      <h4 className="text-xl font-semibold">2. Webview Setup</h4>
      <CodeBlock>
        {`
const sdk = new FlutterDigitalHuman({
    backendUrl: 'YOUR_BACKEND_URL'
});
sdk.initialize();

sdk.on('flutterMessage', (message) => {
    console.log('Message from Flutter:', message);
});

sdk.on('textResponse', (response) => {
    sdk.sendToFlutter('aiResponse', response.messages);
});
        `}
      </CodeBlock>
    </div>
  </div>
);

export const SDKDocumentation = () => {
  const [activeTab, setActiveTab] = useState("Web");

  const renderContent = () => {
    switch (activeTab) {
      case "Web": return <WebDocumentation />;
      case "React": return <ReactDocumentation />;
      case "React Native": return <ReactNativeDocumentation />;
      case "Flutter": return <FlutterDocumentation />;
      default: return <WebDocumentation />;
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white overflow-y-auto z-20">
      <div className="container mx-auto p-8">
        <header className="mb-8 text-center">
          <a href="/" className="text-cyan-300 hover:underline block mb-4">&larr; Back to Avatar</a>
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg">
            Digital Human SDK Documentation
          </h1>
          <p className="mt-2 text-lg text-gray-300">A universal SDK for integrating and interacting with a digital human avatar across multiple platforms.</p>
        </header>

        <main className="backdrop-blur-md bg-white/10 border border-white/20 p-8 rounded-2xl shadow-2xl transition-all duration-500">
          <div className="border-b border-white/20 mb-6">
            <nav className="-mb-px flex space-x-4" aria-label="Tabs">
              <Tab label="Web" activeTab={activeTab} setActiveTab={setActiveTab} />
              <Tab label="React" activeTab={activeTab} setActiveTab={setActiveTab} />
              <Tab label="React Native" activeTab={activeTab} setActiveTab={setActiveTab} />
              <Tab label="Flutter" activeTab={activeTab} setActiveTab={setActiveTab} />
            </nav>
          </div>
          <div className="prose prose-invert prose-lg max-w-none">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};
