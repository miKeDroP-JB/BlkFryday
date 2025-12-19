import type { AgentLifecycle, AgentInput, AgentEvent } from '@blk/shared';

/**
 * Sample Agent - demonstrates the plugin interface
 */
class SampleAgent implements AgentLifecycle {
  private config: Record<string, unknown> = {};

  async init(config?: Record<string, unknown>): Promise<void> {
    this.config = config || {};
    console.log('[SampleAgent] Initialized with config:', this.config);
  }

  async onStart(
    input: AgentInput,
    emit: (ev: AgentEvent) => Promise<void>
  ): Promise<void> {
    const { runId, payload } = input;

    // Emit start event
    await emit({
      runId,
      status: 'running',
      progress: 0,
      logs: ['Agent started', `Processing payload: ${JSON.stringify(payload)}`],
    });

    // Simulate work with progress updates
    const steps = 20;
    for (let i = 1; i <= steps; i++) {
      await new Promise((resolve) => setTimeout(resolve, 150));

      await emit({
        runId,
        status: 'running',
        progress: Math.round((i / steps) * 100),
        logs: [`Step ${i}/${steps} completed`],
      });
    }

    // Emit completion
    await emit({
      runId,
      status: 'completed',
      progress: 100,
      result: {
        score: 9001,
        message: 'Sample agent completed successfully',
        processedAt: new Date().toISOString(),
      },
      logs: ['Processing complete', 'All steps finished'],
    });
  }

  async onStop(): Promise<void> {
    console.log('[SampleAgent] Stopping...');
  }
}

export default SampleAgent;
