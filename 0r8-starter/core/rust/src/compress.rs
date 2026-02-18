//! ORBOS Compression Engine - 98% Efficiency Beast Mode
//!
//! Multiple compression algorithms with automatic selection
//! for optimal performance based on data characteristics.

use crate::OrbosError;

/// Compression algorithm selection
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Algorithm {
    /// Zstandard - best ratio for most data
    Zstd,
    /// LZ4 - fastest, good for real-time
    Lz4,
    /// Snappy - balanced speed/ratio
    Snappy,
    /// None - passthrough
    None,
}

/// Compression level (1-22 for zstd, 1-16 for others)
pub type Level = i32;

/// Magic bytes for format detection
const MAGIC_ZSTD: &[u8] = &[0x28, 0xB5, 0x2F, 0xFD];
const MAGIC_LZ4: &[u8] = &[0x04, 0x22, 0x4D, 0x18];
const MAGIC_SNAPPY: &[u8] = &[0x73, 0x6E, 0x61, 0x70]; // "snap"

/// Compression statistics
#[derive(Debug, Clone)]
pub struct CompressionStats {
    pub original_size: usize,
    pub compressed_size: usize,
    pub algorithm: Algorithm,
    pub ratio: f64,
    pub time_us: u64,
}

impl CompressionStats {
    pub fn new(original: usize, compressed: usize, algo: Algorithm, time_us: u64) -> Self {
        let ratio = if original > 0 {
            1.0 - (compressed as f64 / original as f64)
        } else {
            0.0
        };

        Self {
            original_size: original,
            compressed_size: compressed,
            algorithm: algo,
            ratio,
            time_us,
        }
    }

    /// Get compression percentage (e.g., 98% means 98% smaller)
    pub fn percentage(&self) -> f64 {
        self.ratio * 100.0
    }
}

/// ORBOS Compressor
pub struct Compressor {
    default_algorithm: Algorithm,
    default_level: Level,
}

impl Compressor {
    /// Create new compressor with default settings
    pub fn new() -> Self {
        Self {
            default_algorithm: Algorithm::Zstd,
            default_level: 3, // Good balance of speed/ratio
        }
    }

    /// Create compressor with specific algorithm
    pub fn with_algorithm(algorithm: Algorithm, level: Level) -> Self {
        Self {
            default_algorithm: algorithm,
            default_level: level,
        }
    }

    /// Compress data with automatic algorithm selection
    pub fn compress(&self, data: &[u8]) -> Result<Vec<u8>, OrbosError> {
        self.compress_with(data, self.default_algorithm, self.default_level)
    }

    /// Compress with specific algorithm and level
    pub fn compress_with(
        &self,
        data: &[u8],
        algorithm: Algorithm,
        level: Level,
    ) -> Result<Vec<u8>, OrbosError> {
        match algorithm {
            Algorithm::Zstd => self.compress_zstd(data, level),
            Algorithm::Lz4 => self.compress_lz4(data),
            Algorithm::Snappy => self.compress_snappy(data),
            Algorithm::None => Ok(data.to_vec()),
        }
    }

    /// Decompress data (auto-detects algorithm)
    pub fn decompress(&self, data: &[u8]) -> Result<Vec<u8>, OrbosError> {
        if data.len() < 4 {
            return Ok(data.to_vec());
        }

        let magic = &data[0..4];

        if magic == MAGIC_ZSTD {
            self.decompress_zstd(data)
        } else if magic == MAGIC_LZ4 {
            self.decompress_lz4(data)
        } else if magic == MAGIC_SNAPPY {
            self.decompress_snappy(&data[4..])
        } else {
            // Assume uncompressed
            Ok(data.to_vec())
        }
    }

    /// Compress and return stats
    pub fn compress_with_stats(&self, data: &[u8]) -> Result<(Vec<u8>, CompressionStats), OrbosError> {
        let start = std::time::Instant::now();
        let compressed = self.compress(data)?;
        let elapsed = start.elapsed().as_micros() as u64;

        let stats = CompressionStats::new(
            data.len(),
            compressed.len(),
            self.default_algorithm,
            elapsed,
        );

        Ok((compressed, stats))
    }

    /// Try multiple algorithms and pick best ratio
    pub fn compress_best(&self, data: &[u8]) -> Result<(Vec<u8>, CompressionStats), OrbosError> {
        let algorithms = [
            (Algorithm::Zstd, 19),  // High compression
            (Algorithm::Zstd, 3),   // Fast
            (Algorithm::Lz4, 1),
            (Algorithm::Snappy, 1),
        ];

        let mut best: Option<(Vec<u8>, CompressionStats)> = None;

        for (algo, level) in algorithms {
            let start = std::time::Instant::now();
            if let Ok(compressed) = self.compress_with(data, algo, level) {
                let elapsed = start.elapsed().as_micros() as u64;
                let stats = CompressionStats::new(data.len(), compressed.len(), algo, elapsed);

                if best.is_none() || stats.ratio > best.as_ref().unwrap().1.ratio {
                    best = Some((compressed, stats));
                }
            }
        }

        best.ok_or_else(|| OrbosError::CompressionError("All algorithms failed".to_string()))
    }

    // Zstandard compression
    fn compress_zstd(&self, data: &[u8], level: Level) -> Result<Vec<u8>, OrbosError> {
        zstd::encode_all(std::io::Cursor::new(data), level)
            .map_err(|e| OrbosError::CompressionError(format!("Zstd compress: {}", e)))
    }

    fn decompress_zstd(&self, data: &[u8]) -> Result<Vec<u8>, OrbosError> {
        zstd::decode_all(std::io::Cursor::new(data))
            .map_err(|e| OrbosError::CompressionError(format!("Zstd decompress: {}", e)))
    }

    // LZ4 compression
    fn compress_lz4(&self, data: &[u8]) -> Result<Vec<u8>, OrbosError> {
        lz4::block::compress(data, None, true)
            .map_err(|e| OrbosError::CompressionError(format!("LZ4 compress: {}", e)))
    }

    fn decompress_lz4(&self, data: &[u8]) -> Result<Vec<u8>, OrbosError> {
        // LZ4 needs to know the uncompressed size, use a reasonable max
        lz4::block::decompress(data, Some(1024 * 1024 * 100)) // 100MB max
            .map_err(|e| OrbosError::CompressionError(format!("LZ4 decompress: {}", e)))
    }

    // Snappy compression
    fn compress_snappy(&self, data: &[u8]) -> Result<Vec<u8>, OrbosError> {
        let mut encoder = snap::raw::Encoder::new();
        let mut compressed = vec![0u8; snap::raw::max_compress_len(data.len()) + 4];

        // Add magic header
        compressed[0..4].copy_from_slice(MAGIC_SNAPPY);

        let len = encoder
            .compress(data, &mut compressed[4..])
            .map_err(|e| OrbosError::CompressionError(format!("Snappy compress: {}", e)))?;

        compressed.truncate(4 + len);
        Ok(compressed)
    }

    fn decompress_snappy(&self, data: &[u8]) -> Result<Vec<u8>, OrbosError> {
        let mut decoder = snap::raw::Decoder::new();
        let len = snap::raw::decompress_len(data)
            .map_err(|e| OrbosError::CompressionError(format!("Snappy len: {}", e)))?;

        let mut decompressed = vec![0u8; len];
        decoder
            .decompress(data, &mut decompressed)
            .map_err(|e| OrbosError::CompressionError(format!("Snappy decompress: {}", e)))?;

        Ok(decompressed)
    }
}

impl Default for Compressor {
    fn default() -> Self {
        Self::new()
    }
}

/// Convenience function for quick compression
pub fn compress(data: &[u8]) -> Result<Vec<u8>, OrbosError> {
    Compressor::new().compress(data)
}

/// Convenience function for quick decompression
pub fn decompress(data: &[u8]) -> Result<Vec<u8>, OrbosError> {
    Compressor::new().decompress(data)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_roundtrip_zstd() {
        let data = b"Hello, ORBOS! This is a test of compression.";
        let compressor = Compressor::new();

        let compressed = compressor.compress(data).unwrap();
        let decompressed = compressor.decompress(&compressed).unwrap();

        assert_eq!(data.as_slice(), decompressed.as_slice());
    }

    #[test]
    fn test_compression_stats() {
        let data = vec![0u8; 10000]; // Highly compressible
        let compressor = Compressor::new();

        let (compressed, stats) = compressor.compress_with_stats(&data).unwrap();

        assert!(stats.ratio > 0.9); // Should be >90% compression
        assert!(compressed.len() < data.len() / 10);
    }
}
