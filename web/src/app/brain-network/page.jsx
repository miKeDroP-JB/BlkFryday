'use client';

/**
 * ====================================================
 *  ORBOS - BRAIN NETWORK V11.5 COMMAND CENTER
 * ====================================================
 *  "To what do I owe the pleasure?"
 *  "The pleasure is all mine."
 * ====================================================
 */

import React, { useCallback, useState } from 'react';
import ORBOSBoot from '../../components/ORBOSBoot';
import BootSequence from '../../components/BootSequence';
import CockpitV11 from '../../components/CockpitV11';

export default function BrainNetworkPage() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isBooted, setIsBooted] = useState(false);

  const handleUnlock = useCallback(() => {
    console.log('[ORBOS] Unlocked. Welcome.');
    setIsUnlocked(true);
  }, []);

  const handleBootComplete = useCallback(({ river, metrics }) => {
    console.log('[ORBOS] Boot complete:', metrics);
    setIsBooted(true);

    // Send boot telemetry
    river?.sendTelemetry('system.boot', {
      dimensions: { page: 'orbos' },
      values: {
        init_time_ms: metrics.initTime,
        wasm_ready: metrics.wasmReady,
        sonic_ready: metrics.sonicReady,
        network_ready: metrics.networkReady
      }
    });
  }, []);

  // Phase 1: Voice Authentication
  if (!isUnlocked) {
    return (
      <ORBOSBoot onUnlock={handleUnlock}>
        <BootSequence onComplete={handleBootComplete}>
          <CockpitV11 />
        </BootSequence>
      </ORBOSBoot>
    );
  }

  // Phase 2: System Boot (after unlock)
  return (
    <BootSequence onComplete={handleBootComplete}>
      <CockpitV11 />
    </BootSequence>
  );
}
