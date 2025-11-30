// ============================================================
//  ORBOS V11.5 - VOICE TRAINING API
//  Ingest, process, and train on voice data
// ============================================================

import { NextResponse } from 'next/server';

// In-memory state (would use database in production)
const trainingState = {
  jobs: [],
  samples: [],
  models: []
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'status';

  switch (action) {
    case 'status':
      return NextResponse.json({
        success: true,
        data: {
          totalSamples: trainingState.samples.length,
          totalModels: trainingState.models.length,
          activeJobs: trainingState.jobs.filter(j => j.status === 'running').length,
          queuedJobs: trainingState.jobs.filter(j => j.status === 'queued').length
        }
      });

    case 'samples':
      return NextResponse.json({
        success: true,
        data: trainingState.samples.slice(-100) // Last 100
      });

    case 'models':
      return NextResponse.json({
        success: true,
        data: trainingState.models
      });

    case 'jobs':
      return NextResponse.json({
        success: true,
        data: trainingState.jobs.slice(-50)
      });

    default:
      return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {

      // ============================================================
      //  INGEST AUDIO URL
      // ============================================================
      case 'ingest-url': {
        const { url, speaker, tags } = data;

        const sample = {
          id: `sample_${Date.now()}`,
          type: 'url',
          source: url,
          speaker: speaker || 'unknown',
          tags: tags || [],
          status: 'pending',
          createdAt: Date.now()
        };

        trainingState.samples.push(sample);

        // Queue processing job
        const job = {
          id: `job_${Date.now()}`,
          type: 'ingest',
          sampleId: sample.id,
          status: 'queued',
          createdAt: Date.now()
        };
        trainingState.jobs.push(job);

        return NextResponse.json({
          success: true,
          data: { sample, job }
        });
      }

      // ============================================================
      //  INGEST AUDIO BLOB (Base64)
      // ============================================================
      case 'ingest-blob': {
        const { blob, filename, speaker, tags, transcript } = data;

        const sample = {
          id: `sample_${Date.now()}`,
          type: 'blob',
          filename: filename || 'recording.wav',
          speaker: speaker || 'unknown',
          tags: tags || [],
          transcript: transcript || null,
          blobSize: blob?.length || 0,
          status: 'received',
          createdAt: Date.now()
        };

        trainingState.samples.push(sample);

        return NextResponse.json({
          success: true,
          data: { sample }
        });
      }

      // ============================================================
      //  START TRAINING JOB
      // ============================================================
      case 'train': {
        const { modelType, config } = data;

        const relevantSamples = trainingState.samples.filter(s =>
          s.status === 'processed' || s.status === 'received'
        );

        if (relevantSamples.length < 10) {
          return NextResponse.json({
            success: false,
            error: `Need at least 10 samples, have ${relevantSamples.length}`
          }, { status: 400 });
        }

        const job = {
          id: `train_${Date.now()}`,
          type: 'train',
          modelType: modelType || 'command',
          config: config || {},
          samplesCount: relevantSamples.length,
          status: 'running',
          progress: 0,
          createdAt: Date.now()
        };

        trainingState.jobs.push(job);

        // Simulate training progress
        simulateTraining(job);

        return NextResponse.json({
          success: true,
          data: { job }
        });
      }

      // ============================================================
      //  RECORD TRAINING PHRASE
      // ============================================================
      case 'record-phrase': {
        const { phrase, audioBlob, speaker } = data;

        const sample = {
          id: `phrase_${Date.now()}`,
          type: 'phrase',
          phrase,
          speaker: speaker || 'user',
          tags: ['command', phrase.toLowerCase().replace(/\s+/g, '-')],
          transcript: phrase,
          status: 'received',
          createdAt: Date.now()
        };

        trainingState.samples.push(sample);

        return NextResponse.json({
          success: true,
          data: { sample }
        });
      }

      // ============================================================
      //  CREATE WAKE WORD
      // ============================================================
      case 'create-wake-word': {
        const { wakePhrase, samples } = data;

        if (!samples || samples.length < 3) {
          return NextResponse.json({
            success: false,
            error: 'Need at least 3 recordings of the wake word'
          }, { status: 400 });
        }

        const model = {
          id: `wake_${Date.now()}`,
          type: 'wake-word',
          wakePhrase,
          samplesCount: samples.length,
          status: 'training',
          createdAt: Date.now()
        };

        trainingState.models.push(model);

        // Simulate wake word training
        setTimeout(() => {
          model.status = 'ready';
          model.completedAt = Date.now();
        }, 5000);

        return NextResponse.json({
          success: true,
          data: { model }
        });
      }

      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// Simulate training progress
function simulateTraining(job) {
  const interval = setInterval(() => {
    job.progress += 10;

    if (job.progress >= 100) {
      clearInterval(interval);
      job.status = 'complete';
      job.completedAt = Date.now();

      // Create model entry
      const model = {
        id: `model_${Date.now()}`,
        type: job.modelType,
        jobId: job.id,
        samplesCount: job.samplesCount,
        status: 'ready',
        createdAt: Date.now()
      };
      trainingState.models.push(model);
    }
  }, 1000);
}
