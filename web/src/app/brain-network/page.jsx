'use client';

/**
 * ====================================================
 *  BRAIN NETWORK V11.5 - COMMAND CENTER PAGE
 * ====================================================
 *  Access the 1007-brain neural supercomputer
 *  With Neon River Performance Stack
 * ====================================================
 */

import React, { useCallback } from 'react';
import BootSequence from '../../components/BootSequence';
import CockpitV11 from '../../components/CockpitV11';

export default function BrainNetworkPage() {
  const handleBootComplete = useCallback(({ river, metrics }) => {
    console.log('[BrainNetwork] Boot complete:', metrics);

    // Send boot telemetry
    river?.sendTelemetry('system.boot', {
      dimensions: { page: 'brain-network' },
      values: {
        init_time_ms: metrics.initTime,
        wasm_ready: metrics.wasmReady,
        sonic_ready: metrics.sonicReady,
        network_ready: metrics.networkReady
      }
    });
  }, []);

  return (
    <BootSequence onComplete={handleBootComplete}>
      <CockpitV11 />
    </BootSequence>
  );
}
