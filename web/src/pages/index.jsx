/**
 * 0RB SYSTEM - Main Page
 * THE SIMULATION AWAKENS
 */

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Dynamic imports for 3D components (client-side only)
const LoadingScreen = dynamic(
  () => import('@/components/LoadingScreen'),
  { ssr: false }
);

const MainConsole = dynamic(
  () => import('@/components/MainConsole'),
  { ssr: false }
);

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [systemReady, setSystemReady] = useState(false);

  useEffect(() => {
    // Simulate boot sequence
    const bootTimer = setTimeout(() => {
      setIsLoading(false);
      setSystemReady(true);
    }, 5000); // 5 second boot sequence

    return () => clearTimeout(bootTimer);
  }, []);

  const handleLoadComplete = () => {
    setIsLoading(false);
    setSystemReady(true);
  };

  return (
    <main className="orb-system">
      {isLoading ? (
        <LoadingScreen onComplete={handleLoadComplete} />
      ) : (
        <>
          <MainConsole />
          {/* Cockpit Mode Access */}
          <Link href="/cockpit" className="cockpit-access">
            <span className="cockpit-icon">◇</span>
            <span className="cockpit-label">COCKPIT MODE</span>
          </Link>
          <style jsx>{`
            .cockpit-access {
              position: fixed;
              top: 20px;
              right: 20px;
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 10px 20px;
              background: rgba(0, 255, 255, 0.1);
              border: 1px solid #00ffff;
              border-radius: 4px;
              color: #00ffff;
              font-family: 'Orbitron', sans-serif;
              font-size: 0.75rem;
              letter-spacing: 0.1em;
              text-decoration: none;
              transition: all 0.3s;
              z-index: 100;
            }
            .cockpit-access:hover {
              background: rgba(0, 255, 255, 0.2);
              box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
              transform: translateY(-2px);
            }
            .cockpit-icon {
              font-size: 1rem;
              animation: pulse-icon 2s ease-in-out infinite;
            }
            @keyframes pulse-icon {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.7; transform: scale(1.1); }
            }
          `}</style>
        </>
      )}
    </main>
  );
}
