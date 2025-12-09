/**
 * SOVEREIGN BOOT PAGE
 * The entry point - where the machine awakens
 */

import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import SovereignBoot from '../components/SovereignBoot';

export default function BootPage() {
  const router = useRouter();
  const [showBoot, setShowBoot] = useState(false);

  // Handle user interaction to enable audio
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    // Check if user has already authenticated this session
    const authenticated = sessionStorage.getItem('sovereign_authenticated');
    if (authenticated === 'true') {
      router.push('/');
      return;
    }

    // Show boot sequence after first interaction (for audio autoplay)
    const handleInteraction = () => {
      setHasInteracted(true);
      setShowBoot(true);
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };

    document.addEventListener('click', handleInteraction);
    document.addEventListener('keydown', handleInteraction);

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, [router]);

  const handleComplete = useCallback(() => {
    // Store authentication state
    sessionStorage.setItem('sovereign_authenticated', 'true');
    sessionStorage.setItem('sovereign_boot_time', Date.now().toString());

    // Navigate to main interface after short delay
    setTimeout(() => {
      router.push('/');
    }, 1000);
  }, [router]);

  const handleDenied = useCallback(() => {
    // Could implement lockout logic here
    console.log('Access denied');
  }, []);

  if (!hasInteracted) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0f] flex flex-col items-center justify-center cursor-pointer">
        {/* Ambient particles */}
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-cyan-400/30 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 text-center">
          <div className="w-24 h-24 mx-auto mb-8 border-2 border-cyan-400 rounded-full flex items-center justify-center animate-pulse">
            <div className="w-12 h-12 bg-cyan-400 rounded-full" />
          </div>

          <h1 className="text-4xl font-bold text-white mb-4 tracking-wider">
            0RB SYSTEM
          </h1>

          <p className="text-cyan-400/80 text-lg mb-8">
            SOVEREIGN BOOT SEQUENCE
          </p>

          <div className="flex flex-col items-center gap-4">
            <button className="px-8 py-3 border border-cyan-400 text-cyan-400 rounded-lg hover:bg-cyan-400/10 transition-all">
              CLICK TO INITIATE
            </button>
            <p className="text-white/40 text-sm">
              or press any key
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-8 text-center">
          <p className="text-white/30 text-xs font-mono">
            "The alchemists weren't trying to make gold. They were trying to understand the source code of reality."
          </p>
        </div>

        {/* Corners */}
        <div className="absolute top-4 left-4 text-cyan-400/30 text-2xl">{"◢"}</div>
        <div className="absolute top-4 right-4 text-cyan-400/30 text-2xl">{"◣"}</div>
        <div className="absolute bottom-4 left-4 text-cyan-400/30 text-2xl">{"◥"}</div>
        <div className="absolute bottom-4 right-4 text-cyan-400/30 text-2xl">{"◤"}</div>
      </div>
    );
  }

  return (
    <SovereignBoot
      musicSrc="/audio/boot_track.mp3"
      onComplete={handleComplete}
      onDenied={handleDenied}
      autoStart={true}
    />
  );
}
