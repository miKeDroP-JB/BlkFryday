// ============================================================
//  BRAIN NETWORK V11.5 - GLYPH ENGINE
//  Rust/WASM Zero-Copy Encoder for "Neon River" Performance
// ============================================================

use wasm_bindgen::prelude::*;

// ============================================================
//  ZERO-COPY MEMORY LAYOUT
//  Access SharedArrayBuffer directly via float slice pointer
//  Avoiding JSON serialization overhead completely
// ============================================================

#[wasm_bindgen]
pub fn encode_glyph_buffer(ptr: *const f32, len: usize) -> Vec<u8> {
    let slice = unsafe { std::slice::from_raw_parts(ptr, len) };

    // Deterministic Quantization (Mythic Tier)
    // Compresses 32-bit floats to 8-bit relative vectors for minimal payload
    let mut buffer: Vec<u8> = Vec::with_capacity(len);

    let mut prev_x = 0.0f32;
    let mut prev_y = 0.0f32;

    for chunk in slice.chunks(3) { // [x, y, pressure]
        if chunk.len() < 3 { break; }
        let x = chunk[0];
        let y = chunk[1];
        let p = chunk[2];

        // Delta encoding to save space
        let dx = ((x - prev_x) * 127.0) as i8;
        let dy = ((y - prev_y) * 127.0) as i8;
        let dp = (p * 255.0) as u8;

        buffer.push(dx as u8);
        buffer.push(dy as u8);
        buffer.push(dp);

        prev_x = x;
        prev_y = y;
    }

    buffer
}

#[wasm_bindgen]
pub fn decode_glyph_buffer(data: &[u8]) -> Vec<f32> {
    let mut result: Vec<f32> = Vec::with_capacity(data.len());
    let mut x = 0.0f32;
    let mut y = 0.0f32;

    for chunk in data.chunks(3) {
        if chunk.len() < 3 { break; }

        let dx = chunk[0] as i8;
        let dy = chunk[1] as i8;
        let p = chunk[2];

        x += (dx as f32) / 127.0;
        y += (dy as f32) / 127.0;
        let pressure = (p as f32) / 255.0;

        result.push(x);
        result.push(y);
        result.push(pressure);
    }

    result
}

// ============================================================
//  AUDIO COMPRESSION - Opus-like for voice
// ============================================================

#[wasm_bindgen]
pub fn compress_audio_frame(samples: &[f32]) -> Vec<u8> {
    // Simple mu-law compression for voice
    let mut compressed: Vec<u8> = Vec::with_capacity(samples.len());

    for &sample in samples {
        let sign = if sample < 0.0 { 128u8 } else { 0u8 };
        let magnitude = sample.abs().min(1.0);
        let mu = 255.0;
        let compressed_val = (mu.ln_1p() * magnitude).ln_1p() / mu.ln_1p();
        let quantized = (compressed_val * 127.0) as u8;
        compressed.push(sign | quantized);
    }

    compressed
}

#[wasm_bindgen]
pub fn decompress_audio_frame(data: &[u8]) -> Vec<f32> {
    let mut samples: Vec<f32> = Vec::with_capacity(data.len());

    for &byte in data {
        let sign = if byte & 128 != 0 { -1.0 } else { 1.0 };
        let quantized = (byte & 127) as f32 / 127.0;
        let mu = 255.0;
        let expanded = ((1.0 + mu).powf(quantized) - 1.0) / mu;
        samples.push(sign * expanded);
    }

    samples
}

// ============================================================
//  PRE-WARM - Prevent cold start lag
// ============================================================

#[wasm_bindgen]
pub fn pre_warm() -> bool {
    // Force memory allocation and JIT compilation
    // Prevents the "Cold Start" lag on first cast
    let _ = vec![0u8; 4096];
    let _ = encode_glyph_buffer([0.0f32; 30].as_ptr(), 30);
    let _ = compress_audio_frame(&[0.0f32; 256]);
    true
}

// ============================================================
//  STABILITY SCORE CALCULATOR
// ============================================================

#[wasm_bindgen]
pub fn calculate_stability_score(
    rtt_samples: &[f32],
    jitter_samples: &[f32],
    packet_loss_rate: f32
) -> f32 {
    if rtt_samples.is_empty() || jitter_samples.is_empty() {
        return 1.0;
    }

    // Average RTT score (lower is better, normalize to 0-1)
    let avg_rtt: f32 = rtt_samples.iter().sum::<f32>() / rtt_samples.len() as f32;
    let rtt_score = (1.0 - (avg_rtt / 200.0).min(1.0)).max(0.0);

    // Jitter score (lower is better)
    let avg_jitter: f32 = jitter_samples.iter().sum::<f32>() / jitter_samples.len() as f32;
    let jitter_score = (1.0 - (avg_jitter / 50.0).min(1.0)).max(0.0);

    // Packet loss score
    let loss_score = (1.0 - packet_loss_rate * 10.0).max(0.0);

    // Weighted combination
    (rtt_score * 0.4 + jitter_score * 0.4 + loss_score * 0.2).min(1.0)
}

// ============================================================
//  VERSION INFO
// ============================================================

#[wasm_bindgen]
pub fn version() -> String {
    String::from("BRAIN_NETWORK_V11.5_GLYPH_ENGINE")
}
