import { Loader } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Leva } from "leva";
import { Scenario } from "./components/Scenario";
import { ChatInterface } from "./components/ChatInterface";
import { SDKDocumentation } from "./components/SDKDocumentation";
import { MainInterface } from "./components/MainInterface";
import { useEffect, useState } from "react";

function App() {
  const [route, setRoute] = useState(window.location.pathname);

  useEffect(() => {
    // FORCE SCROLLING - Override any global CSS that might be blocking scroll
    document.documentElement.style.overflow = 'auto';
    document.documentElement.style.height = 'auto';
    document.documentElement.style.maxHeight = 'none';
    document.body.style.overflow = 'auto';
    document.body.style.height = 'auto';
    document.body.style.maxHeight = 'none';
    document.body.style.position = 'static';
    
    // Force root container to be scrollable
    const root = document.getElementById('root');
    if (root) {
      root.style.overflow = 'auto';
      root.style.height = 'auto';
      root.style.maxHeight = 'none';
      root.style.position = 'static';
    }

    // Remove any CSS that might block scrolling
    const style = document.createElement('style');
    style.textContent = `
      *, *::before, *::after {
        max-height: none !important;
      }
      html, body, #root {
        overflow: auto !important;
        height: auto !important;
        position: static !important;
        max-height: none !important;
      }
    `;
    document.head.appendChild(style);

    const handlePopState = () => {
      setRoute(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    document.body.addEventListener('click', (e) => {
        const anchor = e.target.closest('a');
        if (anchor && anchor.href && anchor.origin === window.location.origin) {
            e.preventDefault();
            window.history.pushState({}, '', anchor.pathname);
            setRoute(anchor.pathname);
        }
    });

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (style.parentNode) {
        document.head.removeChild(style);
      }
    };
  }, []);
  
  // Basic routing
  if (route === "/docs") {
    return <SDKDocumentation />;
  }

  return (
    <div style={{ 
      minHeight: '300vh', // Force document to be 3x viewport height
      overflow: 'auto',
      position: 'static'
    }}>
      {/* Fixed Background */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #4a148c 50%, #000000 100%)',
        zIndex: -1
      }}>
        {/* Animated Background Particles */}
        <div style={{
          position: 'absolute',
          top: '-10rem',
          right: '-10rem',
          width: '20rem',
          height: '20rem',
          background: 'rgba(34, 211, 238, 0.1)',
          borderRadius: '50%',
          filter: 'blur(3rem)',
          animation: 'pulse 2s infinite'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '-10rem',
          left: '-10rem',
          width: '20rem',
          height: '20rem',
          background: 'rgba(168, 85, 247, 0.1)',
          borderRadius: '50%',
          filter: 'blur(3rem)',
          animation: 'pulse 2s infinite'
        }}></div>
      </div>

      {/* Section 1: Avatar Canvas + Chat Interface Side by Side */}
      <div style={{
        minHeight: '100vh',
        position: 'relative',
        zIndex: 1,
        padding: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2rem'
      }}>
        {/* Left Side - Avatar Canvas */}
        <div style={{
          flex: '1',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          maxWidth: '800px'
        }}>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            textAlign: 'center',
            marginLeft:'25rem',
            marginBottom: '2rem',
            background: 'linear-gradient(to right, #22d3ee, #a855f7, #ec4899)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            filter: 'drop-shadow(0 0 15px rgba(0,240,255,0.8))',
            animation: 'pulse 2s infinite'
          }}>
            🤖 AI AVATAR
          </h2>
          
          <div style={{
            width: '100%',
            height: '500px',
            border: '2px solid rgba(156, 163, 175, 0.5)',
            borderRadius: '0.75rem',
            background: 'white',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <Canvas shadows camera={{ position: [0, 0, 0], fov: 10 }}>
              <Scenario />
            </Canvas>
            
            {/* Live Indicator */}
            <div style={{
              position: 'absolute',
              top: '0.75rem',
              left: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(10px)',
              borderRadius: '9999px',
              padding: '0.5rem 1rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{
                width: '0.75rem',
                height: '0.75rem',
                background: '#ef4444',
                borderRadius: '50%',
                animation: 'pulse 2s infinite',
                boxShadow: '0 0 8px rgba(239, 68, 68, 0.8)'
              }}></div>
              <span style={{
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>LIVE</span>
            </div>
            
            {/* Avatar Info Panel */}
            <div style={{
              position: 'absolute',
              bottom: '0.75rem',
              left: '0.75rem',
              right: '0.75rem',
              background: 'rgba(17, 24, 39, 0.8)',
              backdropFilter: 'blur(10px)',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              border: '1px solid rgba(34, 211, 238, 0.3)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{
                    color: '#22d3ee',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}>AI Avatar</div>
                  <div style={{
                    color: '#d1d5db',
                    fontSize: '0.75rem'
                  }}>Real-time Animation</div>
                </div>
                <div style={{
                  display: 'flex',
                  gap: '0.5rem'
                }}>
                  <div style={{
                    width: '0.5rem',
                    height: '0.5rem',
                    background: '#4ade80',
                    borderRadius: '50%',
                    animation: 'pulse 2s infinite'
                  }}></div>
                  <div style={{
                    width: '0.5rem',
                    height: '0.5rem',
                    background: '#22d3ee',
                    borderRadius: '50%',
                    animation: 'pulse 2s infinite'
                  }}></div>
                  <div style={{
                    width: '0.5rem',
                    height: '0.5rem',
                    background: '#a855f7',
                    borderRadius: '50%',
                    animation: 'pulse 2s infinite'
                  }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Chat Interface */}
        <div style={{
          flex: '1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          maxWidth: '400px',
          height: '100%'
        }}>
          <div style={{
            width: '100%',
            height: '600px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ChatInterface />
          </div>
        </div>
      </div>
      
      {/* Section 3: Main Interface */}
      <div style={{
        minHeight: '100vh',
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <MainInterface />
      </div>

      <Loader />
      <Leva collapsed hidden/>
    </div>
  );
}

export default App;