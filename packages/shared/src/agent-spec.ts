/**
 * Agent Input - passed to agent on start
 */
export type AgentInput = {
  id?: string;
  runId: string;
  config?: Record<string, unknown>;
  payload?: unknown;
};

/**
 * Agent Event - emitted during execution
 */
export type AgentEvent = {
  runId: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  progress?: number;
  result?: unknown;
  logs?: string[];
  timestamp?: string;
};

/**
 * Agent Lifecycle Interface - implement this in plugins
 */
export interface AgentLifecycle {
  init(config?: Record<string, unknown>): Promise<void>;
  onStart(input: AgentInput, emit: (ev: AgentEvent) => Promise<void>): Promise<void>;
  onStop?(): Promise<void>;
}

/**
 * Agent Manifest - describes a plugin
 */
export type AgentManifest = {
  name: string;
  version: string;
  entry: string; // path to main file inside plugin bundle
  permissions?: string[];
  sandbox?: boolean;
};

/**
 * Job data for queue
 */
export type AgentJobData = {
  agentName: string;
  runId: string;
  config?: Record<string, unknown>;
  payload?: unknown;
};
