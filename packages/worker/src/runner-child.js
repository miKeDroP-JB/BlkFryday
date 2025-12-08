/**
 * Runner Child Process - executes agent plugins in isolation
 */
const path = require('path');

process.on('message', async (msg) => {
  if (msg.type !== 'start') return;

  const { input } = msg;
  const { agentName, runId, config, payload } = input;

  // Resolve plugin path
  const pluginDir = path.resolve(__dirname, '../../agents/plugins', agentName);
  const manifestPath = path.join(pluginDir, 'manifest.json');

  let manifest;
  try {
    manifest = require(manifestPath);
  } catch (e) {
    process.send({ type: 'error', error: `Plugin manifest not found: ${agentName} - ${e.message}` });
    process.exit(1);
  }

  const entryPath = path.resolve(pluginDir, manifest.entry);

  try {
    // Load the agent module
    const AgentModule = require(entryPath);
    const AgentClass = AgentModule.default || AgentModule;

    // Instantiate and run the agent
    const agent = new AgentClass();

    // Emit function sends events back to parent
    const emit = async (ev) => {
      ev.timestamp = new Date().toISOString();
      process.send({ type: 'event', payload: ev });
    };

    // Initialize
    await agent.init(config);

    // Run
    await agent.onStart({ runId, config, payload }, emit);

    // Done
    process.send({ type: 'done' });
    process.exit(0);
  } catch (err) {
    process.send({ type: 'error', error: err.message || String(err) });
    process.exit(1);
  }
});

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  process.send({ type: 'error', error: `Uncaught: ${err.message}` });
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  process.send({ type: 'error', error: `Unhandled rejection: ${err}` });
  process.exit(1);
});
