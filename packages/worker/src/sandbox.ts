import { fork, ChildProcess } from 'child_process';
import path from 'path';
import type { AgentEvent, AgentJobData } from '@blk/shared';

/**
 * Spawn an agent in a sandboxed child process
 */
export function spawnAgentSandbox(
  input: AgentJobData,
  onEvent: (ev: AgentEvent) => Promise<void>
): Promise<void> {
  return new Promise((resolve, reject) => {
    const runnerPath = path.resolve(__dirname, './runner-child.js');

    // Fork a new Node.js process with resource limits
    const child: ChildProcess = fork(runnerPath, [], {
      env: {
        ...process.env,
        NODE_ENV: process.env.NODE_ENV || 'production',
      },
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
      execArgv: [
        '--max-old-space-size=256', // Memory cap at 256MB
      ],
    });

    let hasResolved = false;

    // Handle messages from child
    child.on('message', async (msg: { type: string; payload?: AgentEvent; error?: string }) => {
      if (msg.type === 'event' && msg.payload) {
        await onEvent(msg.payload);
      } else if (msg.type === 'done') {
        hasResolved = true;
        resolve();
      } else if (msg.type === 'error') {
        hasResolved = true;
        reject(new Error(msg.error || 'Unknown error in child process'));
      }
    });

    // Handle child errors
    child.on('error', (err) => {
      if (!hasResolved) {
        hasResolved = true;
        reject(err);
      }
    });

    // Handle child exit
    child.on('exit', (code) => {
      if (!hasResolved) {
        hasResolved = true;
        if (code !== 0) {
          reject(new Error(`Child process exited with code ${code}`));
        } else {
          resolve();
        }
      }
    });

    // Set timeout for runaway processes (5 minutes)
    const timeout = setTimeout(() => {
      if (!hasResolved) {
        hasResolved = true;
        child.kill('SIGKILL');
        reject(new Error('Agent execution timed out'));
      }
    }, 5 * 60 * 1000);

    child.on('exit', () => clearTimeout(timeout));

    // Send start message to child
    child.send({ type: 'start', input });
  });
}
