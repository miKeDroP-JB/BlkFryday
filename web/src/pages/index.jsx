/**
 * 0RB SYSTEM - Main Page
 * THE SIMULATION AWAKENS
 *
 * Now powered by VFlow Voice-First UI
 */

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamic imports for client-side only components
const LoadingScreen = dynamic(
  () => import('@/components/LoadingScreen'),
  { ssr: false }
);

const VoiceCockpit = dynamic(
  () => import('@/components/VoiceCockpit'),
  { ssr: false }
);

const MainConsole = dynamic(
  () => import('@/components/MainConsole'),
  { ssr: false }
);

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [systemReady, setSystemReady] = useState(false);
  const [uiMode, setUiMode] = useState('voice'); // 'voice' or 'classic'

  useEffect(() => {
    // Check for UI preference
    const savedMode = typeof window !== 'undefined'
      ? localStorage.getItem('orb-ui-mode')
      : null;
    if (savedMode) setUiMode(savedMode);

    // Boot sequence
    const bootTimer = setTimeout(() => {
      setIsLoading(false);
      setSystemReady(true);
    }, 3000); // 3 second boot sequence

    return () => clearTimeout(bootTimer);
  }, []);

  const handleLoadComplete = () => {
    setIsLoading(false);
    setSystemReady(true);
  };

  const toggleMode = () => {
    const newMode = uiMode === 'voice' ? 'classic' : 'voice';
    setUiMode(newMode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('orb-ui-mode', newMode);
    }
  };

  return (
    <main className="orb-system">
      {isLoading ? (
        <LoadingScreen onComplete={handleLoadComplete} />
      ) : (
        <>
          {uiMode === 'voice' ? <VoiceCockpit /> : <MainConsole />}
          {/* Mode Toggle Button */}
          <button
            onClick={toggleMode}
            style={{
              position: 'fixed',
              bottom: '40px',
              right: '16px',
              padding: '8px 16px',
              background: 'rgba(0, 255, 255, 0.1)',
              border: '1px solid #00ffff',
              borderRadius: '4px',
              color: '#00ffff',
              fontSize: '0.75rem',
              cursor: 'pointer',
              fontFamily: 'Orbitron, monospace',
              zIndex: 9999
            }}
          >
            {uiMode === 'voice' ? 'CLASSIC UI' : 'VOICE UI'}
          </button>
        </>
      )}
    </main>
  );
}
