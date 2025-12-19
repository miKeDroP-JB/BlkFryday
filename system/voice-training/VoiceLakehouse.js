// ============================================================
//  ORBOS V11.5 - VOICE DATA LAKEHOUSE
//  Audio Aggregation & Training Pipeline
// ============================================================
//
//  Aggregate voice from: Videos, MP3s, Recordings
//  Extract: Transcripts, Features, Embeddings
//  Train: Custom voice models, intent recognition
//
// ============================================================

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const crypto = require('crypto');

class VoiceLakehouse {
  constructor(config = {}) {
    this.dataDir = config.dataDir || path.join(__dirname, '../../data/voice');
    this.rawDir = path.join(this.dataDir, 'raw');
    this.processedDir = path.join(this.dataDir, 'processed');
    this.transcriptsDir = path.join(this.dataDir, 'transcripts');
    this.featuresDir = path.join(this.dataDir, 'features');
    this.embeddingsDir = path.join(this.dataDir, 'embeddings');

    // Supported formats
    this.videoFormats = ['.mp4', '.mkv', '.avi', '.mov', '.webm', '.flv'];
    this.audioFormats = ['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac'];

    // Processing queue
    this.queue = [];
    this.isProcessing = false;

    // Stats
    this.stats = {
      totalFiles: 0,
      totalDuration: 0,
      totalTranscripts: 0,
      totalSamples: 0
    };

    this.ensureDirectories();
  }

  // ============================================================
  //  SETUP
  // ============================================================

  ensureDirectories() {
    [
      this.dataDir,
      this.rawDir,
      this.processedDir,
      this.transcriptsDir,
      this.featuresDir,
      this.embeddingsDir
    ].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  // ============================================================
  //  INGEST - Add files to processing queue
  // ============================================================

  async ingest(sourcePath, options = {}) {
    const stats = fs.statSync(sourcePath);

    if (stats.isDirectory()) {
      return this.ingestDirectory(sourcePath, options);
    } else {
      return this.ingestFile(sourcePath, options);
    }
  }

  async ingestDirectory(dirPath, options = {}) {
    const files = fs.readdirSync(dirPath);
    const results = [];

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory() && options.recursive) {
        results.push(...await this.ingestDirectory(filePath, options));
      } else if (stat.isFile()) {
        const result = await this.ingestFile(filePath, options);
        if (result) results.push(result);
      }
    }

    return results;
  }

  async ingestFile(filePath, options = {}) {
    const ext = path.extname(filePath).toLowerCase();
    const isVideo = this.videoFormats.includes(ext);
    const isAudio = this.audioFormats.includes(ext);

    if (!isVideo && !isAudio) {
      console.log(`[Lakehouse] Skipping unsupported format: ${ext}`);
      return null;
    }

    const fileHash = this.hashFile(filePath);
    const metadata = {
      id: fileHash,
      originalPath: filePath,
      originalName: path.basename(filePath),
      format: ext,
      type: isVideo ? 'video' : 'audio',
      ingestedAt: Date.now(),
      tags: options.tags || [],
      speaker: options.speaker || 'unknown',
      ...options.metadata
    };

    // Add to queue
    this.queue.push({
      filePath,
      metadata,
      options
    });

    console.log(`[Lakehouse] Queued: ${metadata.originalName} (${metadata.type})`);
    this.stats.totalFiles++;

    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }

    return metadata;
  }

  hashFile(filePath) {
    const buffer = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(buffer).digest('hex').slice(0, 12);
  }

  // ============================================================
  //  PROCESSING QUEUE
  // ============================================================

  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift();
      try {
        await this.processFile(item);
      } catch (error) {
        console.error(`[Lakehouse] Error processing ${item.metadata.originalName}:`, error);
      }
    }

    this.isProcessing = false;
  }

  async processFile(item) {
    const { filePath, metadata, options } = item;
    console.log(`[Lakehouse] Processing: ${metadata.originalName}`);

    // Step 1: Extract audio (if video)
    let audioPath = filePath;
    if (metadata.type === 'video') {
      audioPath = await this.extractAudio(filePath, metadata.id);
    } else {
      // Copy audio to processed dir
      audioPath = path.join(this.processedDir, `${metadata.id}.wav`);
      await this.convertToWav(filePath, audioPath);
    }

    // Step 2: Get audio duration
    const duration = await this.getAudioDuration(audioPath);
    metadata.duration = duration;
    this.stats.totalDuration += duration;

    // Step 3: Transcribe (if enabled)
    if (options.transcribe !== false) {
      const transcript = await this.transcribe(audioPath, metadata.id);
      metadata.transcriptPath = transcript.path;
      metadata.transcriptLength = transcript.length;
      this.stats.totalTranscripts++;
    }

    // Step 4: Extract features
    if (options.extractFeatures !== false) {
      const features = await this.extractFeatures(audioPath, metadata.id);
      metadata.featuresPath = features.path;
    }

    // Step 5: Segment into training samples
    if (options.segment !== false) {
      const samples = await this.segmentAudio(audioPath, metadata);
      metadata.samples = samples.length;
      this.stats.totalSamples += samples.length;
    }

    // Save metadata
    const metadataPath = path.join(this.processedDir, `${metadata.id}.json`);
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    console.log(`[Lakehouse] Completed: ${metadata.originalName} (${duration.toFixed(1)}s, ${metadata.samples || 0} samples)`);

    return metadata;
  }

  // ============================================================
  //  AUDIO EXTRACTION (from video)
  // ============================================================

  async extractAudio(videoPath, id) {
    const outputPath = path.join(this.processedDir, `${id}.wav`);

    return new Promise((resolve, reject) => {
      // Use ffmpeg to extract audio
      const ffmpeg = spawn('ffmpeg', [
        '-i', videoPath,
        '-vn',                    // No video
        '-acodec', 'pcm_s16le',   // PCM 16-bit
        '-ar', '16000',           // 16kHz sample rate
        '-ac', '1',               // Mono
        '-y',                     // Overwrite
        outputPath
      ]);

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve(outputPath);
        } else {
          // Fallback: try without ffmpeg (just copy if already audio)
          console.warn(`[Lakehouse] ffmpeg not available, using fallback`);
          resolve(videoPath);
        }
      });

      ffmpeg.on('error', () => {
        console.warn(`[Lakehouse] ffmpeg not found, using original file`);
        resolve(videoPath);
      });
    });
  }

  async convertToWav(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-i', inputPath,
        '-acodec', 'pcm_s16le',
        '-ar', '16000',
        '-ac', '1',
        '-y',
        outputPath
      ]);

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve(outputPath);
        } else {
          // Copy as-is if conversion fails
          fs.copyFileSync(inputPath, outputPath);
          resolve(outputPath);
        }
      });

      ffmpeg.on('error', () => {
        fs.copyFileSync(inputPath, outputPath);
        resolve(outputPath);
      });
    });
  }

  async getAudioDuration(audioPath) {
    return new Promise((resolve) => {
      const ffprobe = spawn('ffprobe', [
        '-v', 'error',
        '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        audioPath
      ]);

      let output = '';
      ffprobe.stdout.on('data', (data) => {
        output += data.toString();
      });

      ffprobe.on('close', () => {
        const duration = parseFloat(output) || 0;
        resolve(duration);
      });

      ffprobe.on('error', () => {
        resolve(0);
      });
    });
  }

  // ============================================================
  //  TRANSCRIPTION
  // ============================================================

  async transcribe(audioPath, id) {
    const transcriptPath = path.join(this.transcriptsDir, `${id}.json`);

    // Try using Web Speech API simulation or external service
    // For now, create placeholder that can be filled by:
    // - Whisper API
    // - Google Speech-to-Text
    // - Azure Speech
    // - Local Whisper model

    const transcript = {
      id,
      audioPath,
      segments: [],
      fullText: '',
      language: 'en',
      confidence: 0,
      processedAt: Date.now()
    };

    // Check for Whisper
    const whisperResult = await this.tryWhisper(audioPath);
    if (whisperResult) {
      transcript.segments = whisperResult.segments;
      transcript.fullText = whisperResult.text;
      transcript.confidence = whisperResult.confidence || 0.9;
    } else {
      transcript.fullText = '[PENDING_TRANSCRIPTION]';
      transcript.confidence = 0;
    }

    fs.writeFileSync(transcriptPath, JSON.stringify(transcript, null, 2));

    return {
      path: transcriptPath,
      length: transcript.fullText.length
    };
  }

  async tryWhisper(audioPath) {
    return new Promise((resolve) => {
      // Try local whisper command
      const whisper = spawn('whisper', [
        audioPath,
        '--model', 'base',
        '--output_format', 'json',
        '--output_dir', this.transcriptsDir
      ]);

      let output = '';
      whisper.stdout.on('data', (data) => {
        output += data.toString();
      });

      whisper.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output);
            resolve(result);
          } catch {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      });

      whisper.on('error', () => {
        resolve(null);
      });

      // Timeout after 60 seconds
      setTimeout(() => {
        whisper.kill();
        resolve(null);
      }, 60000);
    });
  }

  // ============================================================
  //  FEATURE EXTRACTION
  // ============================================================

  async extractFeatures(audioPath, id) {
    const featuresPath = path.join(this.featuresDir, `${id}.json`);

    // Extract audio features for voice training:
    // - Pitch (F0)
    // - Energy
    // - MFCCs
    // - Spectral features
    // - Speaking rate

    const features = {
      id,
      audioPath,
      extractedAt: Date.now(),

      // Placeholder features - would be computed by audio analysis library
      pitch: {
        mean: 0,
        std: 0,
        min: 0,
        max: 0,
        contour: []
      },
      energy: {
        mean: 0,
        std: 0,
        contour: []
      },
      mfcc: [], // 13 MFCC coefficients
      spectral: {
        centroid: 0,
        bandwidth: 0,
        rolloff: 0
      },
      rhythm: {
        tempo: 0,
        speakingRate: 0
      },
      voice: {
        isVoiced: true,
        voicedRatio: 0,
        silenceRatio: 0
      }
    };

    // Try librosa-based extraction (Python)
    const pythonFeatures = await this.tryPythonFeatureExtraction(audioPath);
    if (pythonFeatures) {
      Object.assign(features, pythonFeatures);
    }

    fs.writeFileSync(featuresPath, JSON.stringify(features, null, 2));

    return {
      path: featuresPath
    };
  }

  async tryPythonFeatureExtraction(audioPath) {
    return new Promise((resolve) => {
      const python = spawn('python3', [
        '-c',
        `
import json
try:
    import librosa
    import numpy as np

    y, sr = librosa.load("${audioPath}", sr=16000)

    features = {
        "pitch": {"mean": float(np.mean(librosa.yin(y, fmin=50, fmax=500)))},
        "energy": {"mean": float(np.mean(librosa.feature.rms(y=y)))},
        "mfcc": librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13).mean(axis=1).tolist(),
        "spectral": {
            "centroid": float(np.mean(librosa.feature.spectral_centroid(y=y, sr=sr))),
            "bandwidth": float(np.mean(librosa.feature.spectral_bandwidth(y=y, sr=sr)))
        }
    }
    print(json.dumps(features))
except Exception as e:
    print(json.dumps({"error": str(e)}))
        `
      ]);

      let output = '';
      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.on('close', () => {
        try {
          const result = JSON.parse(output);
          if (!result.error) {
            resolve(result);
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      });

      python.on('error', () => resolve(null));
    });
  }

  // ============================================================
  //  SEGMENTATION - Split into training samples
  // ============================================================

  async segmentAudio(audioPath, metadata) {
    const samplesDir = path.join(this.processedDir, 'samples', metadata.id);
    if (!fs.existsSync(samplesDir)) {
      fs.mkdirSync(samplesDir, { recursive: true });
    }

    const samples = [];

    // If we have transcript with timestamps, use those
    const transcriptPath = metadata.transcriptPath;
    if (transcriptPath && fs.existsSync(transcriptPath)) {
      const transcript = JSON.parse(fs.readFileSync(transcriptPath, 'utf8'));

      if (transcript.segments && transcript.segments.length > 0) {
        for (let i = 0; i < transcript.segments.length; i++) {
          const segment = transcript.segments[i];
          const samplePath = path.join(samplesDir, `${i.toString().padStart(4, '0')}.wav`);

          await this.extractSegment(audioPath, samplePath, segment.start, segment.end);

          samples.push({
            index: i,
            path: samplePath,
            start: segment.start,
            end: segment.end,
            text: segment.text,
            duration: segment.end - segment.start
          });
        }
      }
    }

    // If no transcript segments, split by fixed duration
    if (samples.length === 0 && metadata.duration > 0) {
      const segmentDuration = 5; // 5-second segments
      const numSegments = Math.ceil(metadata.duration / segmentDuration);

      for (let i = 0; i < numSegments; i++) {
        const start = i * segmentDuration;
        const end = Math.min((i + 1) * segmentDuration, metadata.duration);
        const samplePath = path.join(samplesDir, `${i.toString().padStart(4, '0')}.wav`);

        await this.extractSegment(audioPath, samplePath, start, end);

        samples.push({
          index: i,
          path: samplePath,
          start,
          end,
          text: null,
          duration: end - start
        });
      }
    }

    // Save samples manifest
    const manifestPath = path.join(samplesDir, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(samples, null, 2));

    return samples;
  }

  async extractSegment(inputPath, outputPath, start, end) {
    return new Promise((resolve) => {
      const ffmpeg = spawn('ffmpeg', [
        '-i', inputPath,
        '-ss', start.toString(),
        '-t', (end - start).toString(),
        '-acodec', 'pcm_s16le',
        '-ar', '16000',
        '-ac', '1',
        '-y',
        outputPath
      ]);

      ffmpeg.on('close', () => resolve(outputPath));
      ffmpeg.on('error', () => resolve(null));
    });
  }

  // ============================================================
  //  TRAINING DATA EXPORT
  // ============================================================

  async exportTrainingData(outputPath, options = {}) {
    const manifest = {
      version: '1.0',
      exportedAt: Date.now(),
      stats: this.stats,
      samples: []
    };

    const processedFiles = fs.readdirSync(this.processedDir)
      .filter(f => f.endsWith('.json') && !f.includes('manifest'));

    for (const file of processedFiles) {
      const metadata = JSON.parse(
        fs.readFileSync(path.join(this.processedDir, file), 'utf8')
      );

      // Get samples
      const samplesDir = path.join(this.processedDir, 'samples', metadata.id);
      const samplesManifest = path.join(samplesDir, 'manifest.json');

      if (fs.existsSync(samplesManifest)) {
        const samples = JSON.parse(fs.readFileSync(samplesManifest, 'utf8'));

        for (const sample of samples) {
          if (sample.text || options.includeUnlabeled) {
            manifest.samples.push({
              audio: sample.path,
              text: sample.text || '',
              duration: sample.duration,
              speaker: metadata.speaker,
              tags: metadata.tags
            });
          }
        }
      }
    }

    // Export formats
    if (options.format === 'jsonl') {
      // JSONL format (one sample per line)
      const lines = manifest.samples.map(s => JSON.stringify(s)).join('\n');
      fs.writeFileSync(outputPath, lines);
    } else if (options.format === 'csv') {
      // CSV format
      const header = 'audio,text,duration,speaker,tags\n';
      const rows = manifest.samples.map(s =>
        `"${s.audio}","${s.text}",${s.duration},"${s.speaker}","${s.tags.join(';')}"`
      ).join('\n');
      fs.writeFileSync(outputPath, header + rows);
    } else {
      // JSON format
      fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
    }

    console.log(`[Lakehouse] Exported ${manifest.samples.length} samples to ${outputPath}`);
    return manifest;
  }

  // ============================================================
  //  STATS & QUERY
  // ============================================================

  getStats() {
    return {
      ...this.stats,
      queueLength: this.queue.length,
      isProcessing: this.isProcessing
    };
  }

  async query(filter = {}) {
    const results = [];

    const processedFiles = fs.readdirSync(this.processedDir)
      .filter(f => f.endsWith('.json') && !f.includes('manifest'));

    for (const file of processedFiles) {
      const metadata = JSON.parse(
        fs.readFileSync(path.join(this.processedDir, file), 'utf8')
      );

      let match = true;

      if (filter.speaker && metadata.speaker !== filter.speaker) match = false;
      if (filter.tags && !filter.tags.every(t => metadata.tags.includes(t))) match = false;
      if (filter.minDuration && metadata.duration < filter.minDuration) match = false;
      if (filter.maxDuration && metadata.duration > filter.maxDuration) match = false;

      if (match) {
        results.push(metadata);
      }
    }

    return results;
  }
}

// ============================================================
//  EXPORT
// ============================================================

module.exports = { VoiceLakehouse };

// CLI
if (require.main === module) {
  const lakehouse = new VoiceLakehouse();

  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'ingest':
      if (args[1]) {
        lakehouse.ingest(args[1], {
          recursive: true,
          speaker: args[2] || 'unknown',
          tags: args.slice(3)
        }).then(() => console.log('Ingestion complete'));
      } else {
        console.log('Usage: node VoiceLakehouse.js ingest <path> [speaker] [tags...]');
      }
      break;

    case 'export':
      lakehouse.exportTrainingData(args[1] || './training_data.json', {
        format: args[2] || 'json'
      });
      break;

    case 'stats':
      console.log(lakehouse.getStats());
      break;

    default:
      console.log(`
ORBOS Voice Lakehouse - Training Data Pipeline

Commands:
  ingest <path> [speaker] [tags...]  - Add audio/video files
  export <output> [format]           - Export training data (json/jsonl/csv)
  stats                              - Show statistics

Examples:
  node VoiceLakehouse.js ingest ./videos speaker1 training
  node VoiceLakehouse.js export ./training.jsonl jsonl
      `);
  }
}
