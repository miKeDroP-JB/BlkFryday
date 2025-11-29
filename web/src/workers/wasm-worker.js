// ============================================================
//  BRAIN NETWORK V11.5 - WASM WORKER
//  Pre-warmed Zero-Copy Glyph Engine Thread
// ============================================================

let wasmModule = null;
let isReady = false;

// ============================================================
//  BOOT SEQUENCE - Immediate initialization
// ============================================================

const WASM_BINARY_PATH = '/wasm/glyph_engine_bg.wasm';

async function initWasm() {
  try {
    // Dynamic import for WASM module
    const response = await fetch(WASM_BINARY_PATH);
    const bytes = await response.arrayBuffer();

    const importObject = {
      env: {
        memory: new WebAssembly.Memory({ initial: 256, maximum: 512, shared: true })
      }
    };

    const { instance } = await WebAssembly.instantiate(bytes, importObject);
    wasmModule = instance.exports;

    // Pre-warm the engine
    if (wasmModule.pre_warm) {
      wasmModule.pre_warm();
    }

    isReady = true;
    postMessage({ type: 'WASM_READY', version: 'V11.5' });

  } catch (error) {
    // Fallback: Use JavaScript implementation
    console.warn('[WASM] Falling back to JS implementation:', error.message);
    wasmModule = createJSFallback();
    isReady = true;
    postMessage({ type: 'WASM_READY', version: 'V11.5-JS-FALLBACK' });
  }
}

// ============================================================
//  JS FALLBACK - When WASM isn't available
// ============================================================

function createJSFallback() {
  return {
    encode_glyph_buffer: (data) => {
      const result = [];
      let prevX = 0, prevY = 0;

      for (let i = 0; i < data.length; i += 3) {
        const x = data[i] || 0;
        const y = data[i + 1] || 0;
        const p = data[i + 2] || 0;

        const dx = Math.round((x - prevX) * 127);
        const dy = Math.round((y - prevY) * 127);
        const dp = Math.round(p * 255);

        result.push((dx + 256) % 256);
        result.push((dy + 256) % 256);
        result.push(dp);

        prevX = x;
        prevY = y;
      }

      return new Uint8Array(result);
    },

    compress_audio_frame: (samples) => {
      const result = new Uint8Array(samples.length);
      const mu = 255;

      for (let i = 0; i < samples.length; i++) {
        const sample = samples[i];
        const sign = sample < 0 ? 128 : 0;
        const magnitude = Math.min(Math.abs(sample), 1);
        const compressed = Math.log1p(mu * magnitude) / Math.log1p(mu);
        const quantized = Math.round(compressed * 127);
        result[i] = sign | quantized;
      }

      return result;
    },

    calculate_stability_score: (rtt, jitter, loss) => {
      const avgRtt = rtt.reduce((a, b) => a + b, 0) / rtt.length;
      const avgJitter = jitter.reduce((a, b) => a + b, 0) / jitter.length;

      const rttScore = Math.max(0, 1 - avgRtt / 200);
      const jitterScore = Math.max(0, 1 - avgJitter / 50);
      const lossScore = Math.max(0, 1 - loss * 10);

      return Math.min(1, rttScore * 0.4 + jitterScore * 0.4 + lossScore * 0.2);
    },

    pre_warm: () => true
  };
}

// ============================================================
//  MESSAGE HANDLER
// ============================================================

self.onmessage = async (e) => {
  const { type, payload, id } = e.data;

  if (!isReady && type !== 'INIT') {
    postMessage({ type: 'ERROR', id, error: 'WASM not ready' });
    return;
  }

  switch (type) {
    case 'INIT':
      await initWasm();
      break;

    case 'ENCODE_GLYPH': {
      const result = wasmModule.encode_glyph_buffer(payload);
      postMessage({ type: 'GLYPH_ENCODED', id, payload: result }, [result.buffer]);
      break;
    }

    case 'COMPRESS_AUDIO': {
      const result = wasmModule.compress_audio_frame(payload);
      postMessage({ type: 'AUDIO_COMPRESSED', id, payload: result }, [result.buffer]);
      break;
    }

    case 'CALC_STABILITY': {
      const { rtt, jitter, loss } = payload;
      const score = wasmModule.calculate_stability_score(rtt, jitter, loss);
      postMessage({ type: 'STABILITY_SCORE', id, payload: score });
      break;
    }

    case 'PING':
      postMessage({ type: 'PONG', id, timestamp: Date.now() });
      break;

    default:
      postMessage({ type: 'ERROR', id, error: `Unknown message type: ${type}` });
  }
};

// Auto-initialize
initWasm();
