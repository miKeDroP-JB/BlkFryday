/**
 * VOICE-FIRST COCKPIT - Command Bridge + Sensor Array
 * ═══════════════════════════════════════════════════════════════════
 * Full HUD with:
 * - Bottom-center AI copilot
 * - Feed panels left/right
 * - Real-time problem state
 * - 3iAtlas position (Insight / Intelligence / Imagination)
 * - Strategy execution display
 * - Verification results
 * - Voice commands that trigger state machine directly
 *
 * "System never moves forward without verified gate"
 * ═══════════════════════════════════════════════════════════════════
 */

const EventEmitter = require('events');

// ═══════════════════════════════════════════════════════════════════
// VOICE COMMAND PARSER
// ═══════════════════════════════════════════════════════════════════

class VoiceCommandParser {
  constructor() {
    this.commands = new Map([
      // Navigation commands
      ['solve', { action: 'SOLVE', description: 'Start solving current problem' }],
      ['next', { action: 'NEXT', description: 'Move to next problem' }],
      ['back', { action: 'BACK', description: 'Go back to previous state' }],
      ['reset', { action: 'RESET', description: 'Reset current problem' }],

      // Control commands
      ['slow down', { action: 'SLOW_DOWN', description: 'Reduce processing speed' }],
      ['speed up', { action: 'SPEED_UP', description: 'Increase processing speed' }],
      ['pause', { action: 'PAUSE', description: 'Pause execution' }],
      ['resume', { action: 'RESUME', description: 'Resume execution' }],
      ['stop', { action: 'STOP', description: 'Stop current operation' }],

      // Observation commands
      ['repeat', { action: 'REPEAT', description: 'Repeat last explanation' }],
      ['explain', { action: 'EXPLAIN', description: 'Explain current state' }],
      ['explain path', { action: 'EXPLAIN_PATH', description: 'Explain reasoning path' }],
      ['show strategy', { action: 'SHOW_STRATEGY', description: 'Display current strategy' }],
      ['show position', { action: 'SHOW_POSITION', description: 'Show 3iAtlas position' }],

      // Verification commands
      ['verify', { action: 'VERIFY', description: 'Run verification' }],
      ['force verify', { action: 'FORCE_VERIFY', description: 'Force re-verification' }],
      ['override', { action: 'OVERRIDE', description: 'Override verification (requires confirmation)' }],

      // Strategy commands
      ['try different', { action: 'SWITCH_STRATEGY', description: 'Try different strategy' }],
      ['expand imagination', { action: 'EXPAND_IMAGINATION', description: 'Increase imagination axis' }],
      ['focus insight', { action: 'FOCUS_INSIGHT', description: 'Focus on insight axis' }],
      ['boost intelligence', { action: 'BOOST_INTELLIGENCE', description: 'Boost intelligence axis' }],

      // System commands
      ['status', { action: 'STATUS', description: 'Report system status' }],
      ['help', { action: 'HELP', description: 'List available commands' }],
      ['save', { action: 'SAVE', description: 'Save current state' }],
      ['load', { action: 'LOAD', description: 'Load saved state' }],
    ]);
  }

  parse(voiceInput) {
    const normalized = voiceInput.toLowerCase().trim();

    // Direct command match
    if (this.commands.has(normalized)) {
      return this.commands.get(normalized);
    }

    // Partial match
    for (const [phrase, cmd] of this.commands) {
      if (normalized.includes(phrase)) {
        return cmd;
      }
    }

    // Natural language parsing
    return this.parseNaturalLanguage(normalized);
  }

  parseNaturalLanguage(input) {
    // Intent detection patterns
    if (/what.*(doing|happening|state)/i.test(input)) {
      return { action: 'STATUS', description: 'Inferred status request' };
    }
    if (/why.*(that|this|did)/i.test(input)) {
      return { action: 'EXPLAIN_PATH', description: 'Inferred explanation request' };
    }
    if (/try.*(again|different|another)/i.test(input)) {
      return { action: 'SWITCH_STRATEGY', description: 'Inferred strategy switch' };
    }
    if (/is.*(correct|right|verified)/i.test(input)) {
      return { action: 'VERIFY', description: 'Inferred verification request' };
    }

    return { action: 'UNKNOWN', description: input };
  }

  getHelp() {
    const help = [];
    for (const [phrase, cmd] of this.commands) {
      help.push({ phrase, ...cmd });
    }
    return help;
  }
}

// ═══════════════════════════════════════════════════════════════════
// 3iATLAS POSITION TRACKER
// ═══════════════════════════════════════════════════════════════════

class AtlasPosition {
  constructor() {
    // Three axes of cognitive space
    this.insight = 0.5;      // Pattern recognition, understanding
    this.intelligence = 0.5; // Logical reasoning, computation
    this.imagination = 0.5;  // Creative exploration, hypothesis generation

    this.history = [];
    this.maxHistory = 1000;
  }

  getPosition() {
    return {
      insight: this.insight,
      intelligence: this.intelligence,
      imagination: this.imagination,
      magnitude: Math.sqrt(
        this.insight ** 2 +
        this.intelligence ** 2 +
        this.imagination ** 2
      )
    };
  }

  move(delta) {
    const prev = this.getPosition();

    this.insight = Math.max(0, Math.min(1, this.insight + (delta.insight || 0)));
    this.intelligence = Math.max(0, Math.min(1, this.intelligence + (delta.intelligence || 0)));
    this.imagination = Math.max(0, Math.min(1, this.imagination + (delta.imagination || 0)));

    this.history.push({
      timestamp: Date.now(),
      from: prev,
      to: this.getPosition(),
      delta
    });

    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    return this.getPosition();
  }

  setPosition(pos) {
    this.insight = pos.insight ?? this.insight;
    this.intelligence = pos.intelligence ?? this.intelligence;
    this.imagination = pos.imagination ?? this.imagination;
    return this.getPosition();
  }

  // Strategy-based position adjustments
  adjustForStrategy(strategy) {
    const adjustments = {
      'pattern_match': { insight: 0.1, intelligence: 0, imagination: -0.05 },
      'logical_deduction': { insight: 0, intelligence: 0.1, imagination: -0.05 },
      'creative_synthesis': { insight: 0.05, intelligence: -0.05, imagination: 0.1 },
      'exhaustive_search': { insight: -0.05, intelligence: 0.15, imagination: -0.1 },
      'analogical_transfer': { insight: 0.1, intelligence: 0.05, imagination: 0.1 },
      'decomposition': { insight: 0.05, intelligence: 0.1, imagination: 0 },
      'abstraction': { insight: 0.15, intelligence: 0, imagination: 0.05 },
    };

    const delta = adjustments[strategy] || { insight: 0, intelligence: 0, imagination: 0 };
    return this.move(delta);
  }

  getTrajectory(steps = 10) {
    return this.history.slice(-steps);
  }

  toVisualization() {
    // Return data suitable for 3D or 2D visualization
    return {
      current: this.getPosition(),
      trajectory: this.getTrajectory(50),
      bounds: { min: 0, max: 1 },
      labels: {
        x: 'Insight',
        y: 'Intelligence',
        z: 'Imagination'
      }
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// HUD STATE
// ═══════════════════════════════════════════════════════════════════

class HUDState {
  constructor() {
    this.problemState = {
      id: null,
      description: '',
      input: null,
      expectedOutput: null,
      currentOutput: null,
      phase: 'IDLE'
    };

    this.cognitivePosition = new AtlasPosition();

    this.strategyState = {
      current: null,
      queue: [],
      history: [],
      confidence: 0
    };

    this.verificationState = {
      status: 'PENDING',
      lastResult: null,
      attempts: 0,
      gates: []
    };

    this.systemState = {
      speed: 1.0,
      paused: false,
      mode: 'NORMAL'
    };

    this.feeds = {
      left: [],  // Observations / inputs
      right: [], // Outputs / results
      center: [] // AI copilot messages
    };
  }

  updateProblem(update) {
    Object.assign(this.problemState, update);
    return this.problemState;
  }

  updateStrategy(update) {
    Object.assign(this.strategyState, update);
    return this.strategyState;
  }

  updateVerification(update) {
    Object.assign(this.verificationState, update);
    return this.verificationState;
  }

  addFeed(panel, message) {
    const entry = {
      timestamp: Date.now(),
      message,
      id: `feed_${Date.now()}_${Math.random().toString(36).slice(2)}`
    };

    this.feeds[panel].unshift(entry);

    // Keep last 100 messages per panel
    if (this.feeds[panel].length > 100) {
      this.feeds[panel].pop();
    }

    return entry;
  }

  getSnapshot() {
    return {
      problem: { ...this.problemState },
      position: this.cognitivePosition.getPosition(),
      strategy: { ...this.strategyState },
      verification: { ...this.verificationState },
      system: { ...this.systemState },
      feeds: {
        left: this.feeds.left.slice(0, 20),
        right: this.feeds.right.slice(0, 20),
        center: this.feeds.center.slice(0, 10)
      }
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// VOICE COCKPIT CONTROLLER
// ═══════════════════════════════════════════════════════════════════

class VoiceCockpit extends EventEmitter {
  constructor(options = {}) {
    super();

    this.voiceParser = new VoiceCommandParser();
    this.hud = new HUDState();
    this.stateMachine = options.stateMachine || null;
    this.solveLoop = options.solveLoop || null;
    this.atlas = options.atlas || null;

    this.lastExplanation = '';
    this.commandHistory = [];
  }

  // ═══════════════════════════════════════════════════════════════
  // VOICE INPUT PROCESSING
  // ═══════════════════════════════════════════════════════════════

  processVoiceInput(voiceInput) {
    const command = this.voiceParser.parse(voiceInput);

    this.commandHistory.push({
      timestamp: Date.now(),
      input: voiceInput,
      command
    });

    this.hud.addFeed('center', `Voice: "${voiceInput}" → ${command.action}`);

    return this.executeCommand(command);
  }

  executeCommand(command) {
    const { action } = command;

    switch (action) {
      // Navigation
      case 'SOLVE':
        return this.startSolve();
      case 'NEXT':
        return this.nextProblem();
      case 'BACK':
        return this.goBack();
      case 'RESET':
        return this.reset();

      // Control
      case 'SLOW_DOWN':
        return this.adjustSpeed(-0.25);
      case 'SPEED_UP':
        return this.adjustSpeed(0.25);
      case 'PAUSE':
        return this.pause();
      case 'RESUME':
        return this.resume();
      case 'STOP':
        return this.stop();

      // Observation
      case 'REPEAT':
        return this.repeat();
      case 'EXPLAIN':
        return this.explain();
      case 'EXPLAIN_PATH':
        return this.explainPath();
      case 'SHOW_STRATEGY':
        return this.showStrategy();
      case 'SHOW_POSITION':
        return this.showPosition();

      // Verification
      case 'VERIFY':
        return this.verify();
      case 'FORCE_VERIFY':
        return this.forceVerify();
      case 'OVERRIDE':
        return this.override();

      // Strategy
      case 'SWITCH_STRATEGY':
        return this.switchStrategy();
      case 'EXPAND_IMAGINATION':
        return this.expandAxis('imagination');
      case 'FOCUS_INSIGHT':
        return this.expandAxis('insight');
      case 'BOOST_INTELLIGENCE':
        return this.expandAxis('intelligence');

      // System
      case 'STATUS':
        return this.getStatus();
      case 'HELP':
        return this.getHelp();
      case 'SAVE':
        return this.save();
      case 'LOAD':
        return this.load();

      default:
        return this.unknownCommand(command);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // COMMAND IMPLEMENTATIONS
  // ═══════════════════════════════════════════════════════════════

  startSolve() {
    if (this.stateMachine) {
      this.stateMachine.transition('START_SOLVE');
    }
    if (this.solveLoop) {
      this.solveLoop.start();
    }

    this.hud.updateProblem({ phase: 'SOLVING' });
    this.hud.addFeed('center', 'Initiating solve sequence...');
    this.emit('solve:start');

    return { success: true, message: 'Solve sequence initiated' };
  }

  nextProblem() {
    // Only allow if current is verified
    if (this.hud.verificationState.status !== 'VERIFIED') {
      const msg = 'Cannot advance: current problem not verified';
      this.hud.addFeed('center', `⚠️ ${msg}`);
      return { success: false, message: msg };
    }

    this.emit('problem:next');
    return { success: true, message: 'Moving to next problem' };
  }

  goBack() {
    this.emit('navigation:back');
    return { success: true, message: 'Going back' };
  }

  reset() {
    this.hud.updateProblem({ phase: 'IDLE', currentOutput: null });
    this.hud.updateVerification({ status: 'PENDING', attempts: 0 });
    this.hud.addFeed('center', 'Problem state reset');
    this.emit('problem:reset');
    return { success: true, message: 'Problem reset' };
  }

  adjustSpeed(delta) {
    const newSpeed = Math.max(0.25, Math.min(4.0, this.hud.systemState.speed + delta));
    this.hud.systemState.speed = newSpeed;
    this.hud.addFeed('center', `Speed: ${newSpeed.toFixed(2)}x`);
    this.emit('system:speed', newSpeed);
    return { success: true, speed: newSpeed };
  }

  pause() {
    this.hud.systemState.paused = true;
    this.hud.addFeed('center', '⏸️ Paused');
    this.emit('system:pause');
    return { success: true, message: 'Paused' };
  }

  resume() {
    this.hud.systemState.paused = false;
    this.hud.addFeed('center', '▶️ Resumed');
    this.emit('system:resume');
    return { success: true, message: 'Resumed' };
  }

  stop() {
    this.hud.systemState.paused = true;
    this.hud.updateProblem({ phase: 'STOPPED' });
    this.hud.addFeed('center', '⏹️ Stopped');
    this.emit('system:stop');
    return { success: true, message: 'Stopped' };
  }

  repeat() {
    if (this.lastExplanation) {
      this.hud.addFeed('center', `Repeating: ${this.lastExplanation}`);
      return { success: true, message: this.lastExplanation };
    }
    return { success: false, message: 'Nothing to repeat' };
  }

  explain() {
    const snapshot = this.hud.getSnapshot();
    const explanation = this.generateExplanation(snapshot);
    this.lastExplanation = explanation;
    this.hud.addFeed('center', explanation);
    return { success: true, message: explanation };
  }

  explainPath() {
    const trajectory = this.hud.cognitivePosition.getTrajectory(20);
    const path = trajectory.map((t, i) =>
      `Step ${i + 1}: ${this.describeMove(t)}`
    ).join('\n');

    const explanation = `Reasoning path:\n${path}`;
    this.lastExplanation = explanation;
    this.hud.addFeed('center', explanation);
    return { success: true, message: explanation };
  }

  showStrategy() {
    const { current, confidence, queue } = this.hud.strategyState;
    const msg = `Current strategy: ${current || 'none'}\nConfidence: ${(confidence * 100).toFixed(1)}%\nQueued: ${queue.join(', ') || 'none'}`;
    this.hud.addFeed('center', msg);
    return { success: true, message: msg };
  }

  showPosition() {
    const pos = this.hud.cognitivePosition.getPosition();
    const msg = `3iAtlas Position:\n  Insight: ${(pos.insight * 100).toFixed(1)}%\n  Intelligence: ${(pos.intelligence * 100).toFixed(1)}%\n  Imagination: ${(pos.imagination * 100).toFixed(1)}%`;
    this.hud.addFeed('center', msg);
    return { success: true, position: pos, message: msg };
  }

  verify() {
    if (this.solveLoop) {
      const result = this.solveLoop.verify();
      this.hud.updateVerification({
        status: result.verified ? 'VERIFIED' : 'FAILED',
        lastResult: result,
        attempts: this.hud.verificationState.attempts + 1
      });

      const msg = result.verified ? '✓ Verified' : '✗ Verification failed';
      this.hud.addFeed('center', msg);
      this.emit('verification:complete', result);
      return { success: true, verified: result.verified, result };
    }

    return { success: false, message: 'No solve loop attached' };
  }

  forceVerify() {
    this.hud.updateVerification({ attempts: 0 });
    return this.verify();
  }

  override() {
    // Requires explicit confirmation - dangerous operation
    this.hud.addFeed('center', '⚠️ Override requested. Say "confirm override" to proceed.');
    this.hud.systemState.pendingOverride = true;
    return { success: true, message: 'Override pending confirmation' };
  }

  switchStrategy() {
    const strategies = [
      'pattern_match', 'logical_deduction', 'creative_synthesis',
      'exhaustive_search', 'analogical_transfer', 'decomposition', 'abstraction'
    ];

    const current = this.hud.strategyState.current;
    const available = strategies.filter(s => s !== current);
    const next = available[Math.floor(Math.random() * available.length)];

    this.hud.updateStrategy({ current: next, confidence: 0.5 });
    this.hud.cognitivePosition.adjustForStrategy(next);
    this.hud.addFeed('center', `Strategy switched to: ${next}`);
    this.emit('strategy:switch', next);

    return { success: true, strategy: next };
  }

  expandAxis(axis) {
    const delta = { [axis]: 0.15 };
    const newPos = this.hud.cognitivePosition.move(delta);
    this.hud.addFeed('center', `Expanded ${axis}: ${(newPos[axis] * 100).toFixed(1)}%`);
    this.emit('position:change', newPos);
    return { success: true, position: newPos };
  }

  getStatus() {
    const snapshot = this.hud.getSnapshot();
    const status = {
      phase: snapshot.problem.phase,
      verification: snapshot.verification.status,
      strategy: snapshot.strategy.current,
      speed: snapshot.system.speed,
      paused: snapshot.system.paused,
      position: snapshot.position
    };

    const msg = `Status:\n  Phase: ${status.phase}\n  Verified: ${status.verification}\n  Strategy: ${status.strategy}\n  Speed: ${status.speed}x\n  Paused: ${status.paused}`;
    this.hud.addFeed('center', msg);
    return { success: true, status, message: msg };
  }

  getHelp() {
    const commands = this.voiceParser.getHelp();
    const msg = 'Available commands:\n' +
      commands.map(c => `  "${c.phrase}" - ${c.description}`).join('\n');
    this.hud.addFeed('center', 'Help displayed');
    return { success: true, commands, message: msg };
  }

  save() {
    const state = this.hud.getSnapshot();
    this.emit('state:save', state);
    this.hud.addFeed('center', 'State saved');
    return { success: true, message: 'State saved' };
  }

  load() {
    this.emit('state:load');
    this.hud.addFeed('center', 'Loading state...');
    return { success: true, message: 'Load initiated' };
  }

  unknownCommand(command) {
    const msg = `Unknown command: "${command.description}". Say "help" for available commands.`;
    this.hud.addFeed('center', msg);
    return { success: false, message: msg };
  }

  // ═══════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════

  generateExplanation(snapshot) {
    const { problem, position, strategy, verification } = snapshot;

    let explanation = `Currently in ${problem.phase} phase. `;

    if (strategy.current) {
      explanation += `Using ${strategy.current} strategy with ${(strategy.confidence * 100).toFixed(0)}% confidence. `;
    }

    explanation += `Position: Insight ${(position.insight * 100).toFixed(0)}%, Intelligence ${(position.intelligence * 100).toFixed(0)}%, Imagination ${(position.imagination * 100).toFixed(0)}%. `;

    explanation += `Verification: ${verification.status} (${verification.attempts} attempts).`;

    return explanation;
  }

  describeMove(move) {
    const { from, to, delta } = move;
    const changes = [];

    if (delta.insight) changes.push(`insight ${delta.insight > 0 ? '+' : ''}${(delta.insight * 100).toFixed(0)}%`);
    if (delta.intelligence) changes.push(`intelligence ${delta.intelligence > 0 ? '+' : ''}${(delta.intelligence * 100).toFixed(0)}%`);
    if (delta.imagination) changes.push(`imagination ${delta.imagination > 0 ? '+' : ''}${(delta.imagination * 100).toFixed(0)}%`);

    return changes.join(', ') || 'no change';
  }

  // ═══════════════════════════════════════════════════════════════
  // EXTERNAL UPDATES
  // ═══════════════════════════════════════════════════════════════

  updateFromSolveLoop(update) {
    if (update.problem) this.hud.updateProblem(update.problem);
    if (update.strategy) this.hud.updateStrategy(update.strategy);
    if (update.verification) this.hud.updateVerification(update.verification);
    if (update.position) this.hud.cognitivePosition.setPosition(update.position);
    if (update.feed) this.hud.addFeed(update.feed.panel || 'center', update.feed.message);

    this.emit('hud:update', this.hud.getSnapshot());
  }

  // ═══════════════════════════════════════════════════════════════
  // CONNECT TO STATE MACHINE
  // ═══════════════════════════════════════════════════════════════

  connectStateMachine(stateMachine) {
    this.stateMachine = stateMachine;

    stateMachine.on('state:change', (state) => {
      this.hud.updateProblem({ phase: state.name });
      this.hud.addFeed('center', `State: ${state.name}`);
    });

    stateMachine.on('verification:result', (result) => {
      this.hud.updateVerification({
        status: result.verified ? 'VERIFIED' : 'FAILED',
        lastResult: result
      });
    });
  }

  connectSolveLoop(solveLoop) {
    this.solveLoop = solveLoop;

    solveLoop.on('phase:change', (phase) => {
      this.hud.updateProblem({ phase });
      this.hud.addFeed('left', `Phase: ${phase}`);
    });

    solveLoop.on('strategy:update', (strategy) => {
      this.hud.updateStrategy(strategy);
      this.hud.cognitivePosition.adjustForStrategy(strategy.current);
    });

    solveLoop.on('result', (result) => {
      this.hud.addFeed('right', `Result: ${JSON.stringify(result).slice(0, 100)}...`);
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // GET HUD STATE FOR RENDERING
  // ═══════════════════════════════════════════════════════════════

  getHUDState() {
    return this.hud.getSnapshot();
  }

  getAtlasVisualization() {
    return this.hud.cognitivePosition.toVisualization();
  }
}

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

module.exports = {
  VoiceCockpit,
  VoiceCommandParser,
  AtlasPosition,
  HUDState
};
