/**
 * ARCHITECT'S SAFETY SWITCH
 * ==========================
 * The final human-only failsafe for ORBOS
 *
 * Agents have full access EXCEPT:
 * - This switch cannot be bypassed by any AI
 * - Only verified human input can unlock critical actions
 * - Physical/biometric verification options
 *
 * "Trust, but verify. The Architect always has the keys."
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const readline = require('readline');

// ═══════════════════════════════════════════════════════════════
// SAFETY LEVELS
// ═══════════════════════════════════════════════════════════════

const SAFETY_LEVELS = {
    // Agents can do freely
    OPEN: 0,

    // Agents can do, but it's logged
    MONITORED: 1,

    // Agents must request, human approves
    GATED: 2,

    // Human-only - agents cannot even request
    LOCKED: 3,

    // Nuclear option - shuts everything down
    EMERGENCY: 4
};

const PROTECTED_ACTIONS = {
    // Financial
    'payment.send': SAFETY_LEVELS.GATED,
    'payment.large': SAFETY_LEVELS.LOCKED,      // Over threshold
    'crypto.transfer': SAFETY_LEVELS.LOCKED,

    // System
    'system.shutdown': SAFETY_LEVELS.GATED,
    'system.wipe': SAFETY_LEVELS.LOCKED,
    'system.root': SAFETY_LEVELS.LOCKED,

    // Data
    'data.delete.bulk': SAFETY_LEVELS.GATED,
    'data.export.all': SAFETY_LEVELS.GATED,
    'data.encrypt': SAFETY_LEVELS.LOCKED,

    // Identity
    'identity.change': SAFETY_LEVELS.LOCKED,
    'keys.regenerate': SAFETY_LEVELS.LOCKED,
    'auth.disable': SAFETY_LEVELS.LOCKED,

    // External
    'publish.public': SAFETY_LEVELS.GATED,
    'api.keys.reveal': SAFETY_LEVELS.LOCKED,
    'network.expose': SAFETY_LEVELS.GATED,

    // Agent control
    'agent.spawn.unlimited': SAFETY_LEVELS.GATED,
    'agent.override.safety': SAFETY_LEVELS.LOCKED,
    'agent.access.expand': SAFETY_LEVELS.LOCKED,

    // Emergency
    'emergency.lockdown': SAFETY_LEVELS.EMERGENCY,
    'emergency.restore': SAFETY_LEVELS.LOCKED
};

// ═══════════════════════════════════════════════════════════════
// HUMAN VERIFICATION METHODS
// ═══════════════════════════════════════════════════════════════

class HumanVerification {
    constructor() {
        this.methods = new Map();
        this.initMethods();
    }

    initMethods() {
        // Passphrase - something only JB knows
        this.methods.set('passphrase', {
            name: 'Secret Passphrase',
            level: SAFETY_LEVELS.GATED,
            verify: async (input, stored) => {
                const hash = crypto.createHash('sha256').update(input).digest('hex');
                return hash === stored;
            }
        });

        // Challenge-Response - prove you're human
        this.methods.set('challenge', {
            name: 'Human Challenge',
            level: SAFETY_LEVELS.GATED,
            generate: () => {
                // Simple math that's easy for humans, annoying for automation
                const a = Math.floor(Math.random() * 20) + 1;
                const b = Math.floor(Math.random() * 20) + 1;
                const ops = ['+', '-', '*'];
                const op = ops[Math.floor(Math.random() * ops.length)];
                const answer = eval(`${a} ${op} ${b}`);
                return {
                    question: `What is ${a} ${op} ${b}?`,
                    answer: answer.toString()
                };
            },
            verify: async (input, challenge) => {
                return input.trim() === challenge.answer;
            }
        });

        // Time-delayed confirmation
        this.methods.set('delay', {
            name: 'Delayed Confirmation',
            level: SAFETY_LEVELS.GATED,
            delayMs: 10000, // 10 second wait
            verify: async (input) => {
                return input.toLowerCase() === 'confirm';
            }
        });

        // Physical action (placeholder for hardware)
        this.methods.set('physical', {
            name: 'Physical Confirmation',
            level: SAFETY_LEVELS.LOCKED,
            description: 'Press physical button or use hardware key',
            verify: async (input) => {
                // Would integrate with hardware (YubiKey, button, etc.)
                return input === 'PHYSICAL_CONFIRMED';
            }
        });

        // Voice confirmation (placeholder)
        this.methods.set('voice', {
            name: 'Voice Confirmation',
            level: SAFETY_LEVELS.LOCKED,
            description: 'Speak the confirmation phrase',
            verify: async (input, voiceprint) => {
                // Would integrate with voice recognition
                return input === 'VOICE_CONFIRMED';
            }
        });

        // Multi-factor
        this.methods.set('multi', {
            name: 'Multi-Factor',
            level: SAFETY_LEVELS.LOCKED,
            required: ['passphrase', 'challenge'],
            verify: async (inputs, stored) => {
                for (const method of this.required) {
                    const m = this.methods.get(method);
                    if (!await m.verify(inputs[method], stored[method])) {
                        return false;
                    }
                }
                return true;
            }
        });
    }

    getMethod(name) {
        return this.methods.get(name);
    }

    getMethodsForLevel(level) {
        return [...this.methods.entries()]
            .filter(([_, m]) => m.level <= level)
            .map(([name, m]) => ({ name, ...m }));
    }
}

// ═══════════════════════════════════════════════════════════════
// SAFETY SWITCH CORE
// ═══════════════════════════════════════════════════════════════

class SafetySwitch extends EventEmitter {
    constructor(config = {}) {
        super();

        this.architect = config.architect || 'JB';
        this.enabled = true;
        this.lockdownMode = false;

        // Verification
        this.verification = new HumanVerification();
        this.storedSecrets = new Map();

        // Session
        this.sessionToken = null;
        this.sessionExpiry = null;
        this.sessionDuration = config.sessionDuration || 30 * 60 * 1000; // 30 min

        // Audit log
        this.auditLog = [];
        this.maxAuditEntries = 1000;

        // Pending requests
        this.pendingRequests = new Map();

        // Rate limiting
        this.failedAttempts = 0;
        this.lockoutUntil = null;
        this.maxAttempts = 3;
        this.lockoutDuration = 5 * 60 * 1000; // 5 min lockout
    }

    // ─────────────────────────────────────────────────────────────
    // SETUP
    // ─────────────────────────────────────────────────────────────

    // Set the architect's passphrase
    setPassphrase(passphrase) {
        const hash = crypto.createHash('sha256').update(passphrase).digest('hex');
        this.storedSecrets.set('passphrase', hash);
        this.audit('passphrase_set', { by: 'architect' });
    }

    // ─────────────────────────────────────────────────────────────
    // ACTION CHECKING
    // ─────────────────────────────────────────────────────────────

    // Check if action requires human approval
    getActionLevel(action) {
        return PROTECTED_ACTIONS[action] ?? SAFETY_LEVELS.OPEN;
    }

    // Can an agent perform this action?
    canAgentPerform(action, agentId) {
        const level = this.getActionLevel(action);

        // Emergency lockdown - nothing works
        if (this.lockdownMode) {
            this.audit('action_blocked_lockdown', { action, agentId });
            return { allowed: false, reason: 'System in lockdown mode' };
        }

        // Open actions - go ahead
        if (level === SAFETY_LEVELS.OPEN) {
            return { allowed: true };
        }

        // Monitored - allowed but logged
        if (level === SAFETY_LEVELS.MONITORED) {
            this.audit('action_monitored', { action, agentId });
            return { allowed: true, monitored: true };
        }

        // Gated - needs human approval
        if (level === SAFETY_LEVELS.GATED) {
            return {
                allowed: false,
                reason: 'Requires human approval',
                canRequest: true,
                level
            };
        }

        // Locked - human only
        if (level === SAFETY_LEVELS.LOCKED) {
            this.audit('action_denied_locked', { action, agentId });
            return {
                allowed: false,
                reason: 'Human-only action',
                canRequest: false,
                level
            };
        }

        return { allowed: false, reason: 'Unknown safety level' };
    }

    // ─────────────────────────────────────────────────────────────
    // HUMAN VERIFICATION
    // ─────────────────────────────────────────────────────────────

    // Request human approval for gated action
    async requestApproval(action, agentId, context = {}) {
        const level = this.getActionLevel(action);

        if (level < SAFETY_LEVELS.GATED) {
            return { approved: true, reason: 'No approval needed' };
        }

        if (level === SAFETY_LEVELS.LOCKED) {
            return { approved: false, reason: 'Cannot request - human only' };
        }

        // Check lockout
        if (this.isLockedOut()) {
            return { approved: false, reason: 'Too many failed attempts. Try later.' };
        }

        // Create pending request
        const requestId = crypto.randomBytes(8).toString('hex');
        const request = {
            id: requestId,
            action,
            agentId,
            context,
            level,
            createdAt: Date.now(),
            expiresAt: Date.now() + 5 * 60 * 1000, // 5 min expiry
            status: 'pending'
        };

        this.pendingRequests.set(requestId, request);
        this.emit('approval-requested', request);

        this.audit('approval_requested', { requestId, action, agentId });

        return {
            approved: false,
            pending: true,
            requestId,
            message: `Approval requested. Waiting for ${this.architect}...`
        };
    }

    // Human approves a request
    async approveRequest(requestId, verification) {
        const request = this.pendingRequests.get(requestId);

        if (!request) {
            return { success: false, reason: 'Request not found' };
        }

        if (request.status !== 'pending') {
            return { success: false, reason: 'Request already processed' };
        }

        if (Date.now() > request.expiresAt) {
            request.status = 'expired';
            return { success: false, reason: 'Request expired' };
        }

        // Verify human
        const verified = await this.verifyHuman(verification, request.level);

        if (!verified.success) {
            this.failedAttempts++;
            if (this.failedAttempts >= this.maxAttempts) {
                this.lockoutUntil = Date.now() + this.lockoutDuration;
            }
            return { success: false, reason: verified.reason };
        }

        // Approved!
        request.status = 'approved';
        request.approvedAt = Date.now();
        this.failedAttempts = 0;

        this.emit('approval-granted', request);
        this.audit('approval_granted', { requestId, action: request.action });

        return { success: true, request };
    }

    // Human denies a request
    denyRequest(requestId, reason = '') {
        const request = this.pendingRequests.get(requestId);

        if (!request) {
            return { success: false, reason: 'Request not found' };
        }

        request.status = 'denied';
        request.deniedAt = Date.now();
        request.denyReason = reason;

        this.emit('approval-denied', request);
        this.audit('approval_denied', { requestId, action: request.action, reason });

        return { success: true };
    }

    // Verify human identity
    async verifyHuman(verification, requiredLevel) {
        const { method, input } = verification;

        const verifyMethod = this.verification.getMethod(method);
        if (!verifyMethod) {
            return { success: false, reason: 'Unknown verification method' };
        }

        if (verifyMethod.level > requiredLevel) {
            return { success: false, reason: 'Verification method not strong enough' };
        }

        try {
            const stored = this.storedSecrets.get(method);
            const isValid = await verifyMethod.verify(input, stored);

            if (isValid) {
                return { success: true };
            } else {
                return { success: false, reason: 'Verification failed' };
            }
        } catch (err) {
            return { success: false, reason: err.message };
        }
    }

    // ─────────────────────────────────────────────────────────────
    // SESSION MANAGEMENT
    // ─────────────────────────────────────────────────────────────

    // Start authenticated session (human verified once, good for duration)
    async startSession(verification) {
        const verified = await this.verifyHuman(verification, SAFETY_LEVELS.GATED);

        if (!verified.success) {
            return { success: false, reason: verified.reason };
        }

        this.sessionToken = crypto.randomBytes(32).toString('hex');
        this.sessionExpiry = Date.now() + this.sessionDuration;

        this.audit('session_started', { expiresIn: this.sessionDuration });
        this.emit('session-started', { expiresAt: this.sessionExpiry });

        return {
            success: true,
            token: this.sessionToken,
            expiresAt: this.sessionExpiry
        };
    }

    // Check if session is valid
    isSessionValid(token) {
        if (!this.sessionToken || !token) return false;
        if (token !== this.sessionToken) return false;
        if (Date.now() > this.sessionExpiry) {
            this.endSession();
            return false;
        }
        return true;
    }

    // End session
    endSession() {
        this.sessionToken = null;
        this.sessionExpiry = null;
        this.audit('session_ended', {});
        this.emit('session-ended');
    }

    // ─────────────────────────────────────────────────────────────
    // EMERGENCY CONTROLS
    // ─────────────────────────────────────────────────────────────

    // Emergency lockdown - stops EVERYTHING
    async emergencyLockdown(verification) {
        // Even lockdown requires verification
        const verified = await this.verifyHuman(verification, SAFETY_LEVELS.LOCKED);

        if (!verified.success) {
            return { success: false, reason: 'Cannot verify - lockdown denied' };
        }

        this.lockdownMode = true;
        this.endSession();

        // Clear all pending requests
        for (const [id, request] of this.pendingRequests) {
            request.status = 'cancelled_lockdown';
        }
        this.pendingRequests.clear();

        this.audit('emergency_lockdown', { by: this.architect });
        this.emit('lockdown', { timestamp: Date.now() });

        return { success: true, message: 'LOCKDOWN ACTIVATED. All agent actions blocked.' };
    }

    // Restore from lockdown
    async restoreFromLockdown(verification) {
        // Requires strongest verification
        const verified = await this.verifyHuman(verification, SAFETY_LEVELS.LOCKED);

        if (!verified.success) {
            return { success: false, reason: verified.reason };
        }

        this.lockdownMode = false;

        this.audit('lockdown_restored', { by: this.architect });
        this.emit('lockdown-restored', { timestamp: Date.now() });

        return { success: true, message: 'System restored. Agents can resume.' };
    }

    // ─────────────────────────────────────────────────────────────
    // UTILITIES
    // ─────────────────────────────────────────────────────────────

    isLockedOut() {
        if (!this.lockoutUntil) return false;
        if (Date.now() > this.lockoutUntil) {
            this.lockoutUntil = null;
            this.failedAttempts = 0;
            return false;
        }
        return true;
    }

    audit(event, data) {
        const entry = {
            event,
            data,
            timestamp: Date.now()
        };

        this.auditLog.push(entry);

        if (this.auditLog.length > this.maxAuditEntries) {
            this.auditLog = this.auditLog.slice(-this.maxAuditEntries);
        }

        this.emit('audit', entry);
    }

    getAuditLog(count = 50) {
        return this.auditLog.slice(-count);
    }

    getPendingRequests() {
        return [...this.pendingRequests.values()].filter(r => r.status === 'pending');
    }

    getStatus() {
        return {
            enabled: this.enabled,
            lockdownMode: this.lockdownMode,
            sessionActive: this.isSessionValid(this.sessionToken),
            sessionExpiresAt: this.sessionExpiry,
            pendingRequests: this.getPendingRequests().length,
            failedAttempts: this.failedAttempts,
            lockedOut: this.isLockedOut()
        };
    }
}

// ═══════════════════════════════════════════════════════════════
// INTERACTIVE CLI FOR HUMAN CONTROL
// ═══════════════════════════════════════════════════════════════

class SafetyCLI {
    constructor(safetySwitch) {
        this.safety = safetySwitch;
        this.rl = null;
    }

    async start() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        console.log(`
╔═══════════════════════════════════════════════════════════╗
║        🔐 ARCHITECT'S SAFETY CONTROL PANEL               ║
╠═══════════════════════════════════════════════════════════╣
║  Commands:                                                ║
║    status    - Show current safety status                 ║
║    pending   - View pending approval requests             ║
║    approve   - Approve a request                          ║
║    deny      - Deny a request                             ║
║    session   - Start authenticated session                ║
║    lockdown  - Emergency lockdown                         ║
║    restore   - Restore from lockdown                      ║
║    audit     - View audit log                             ║
║    exit      - Exit control panel                         ║
╚═══════════════════════════════════════════════════════════╝
`);

        this.prompt();
    }

    prompt() {
        this.rl.question('\n🔐 safety> ', async (input) => {
            await this.handleCommand(input.trim());
            if (this.rl) this.prompt();
        });
    }

    async handleCommand(cmd) {
        const [action, ...args] = cmd.split(' ');

        switch (action.toLowerCase()) {
            case 'status':
                console.log('\n' + JSON.stringify(this.safety.getStatus(), null, 2));
                break;

            case 'pending':
                const pending = this.safety.getPendingRequests();
                if (pending.length === 0) {
                    console.log('\nNo pending requests.');
                } else {
                    console.log('\nPending Requests:');
                    pending.forEach(r => {
                        console.log(`  [${r.id}] ${r.action} from ${r.agentId}`);
                    });
                }
                break;

            case 'approve':
                if (!args[0]) {
                    console.log('Usage: approve <requestId>');
                    break;
                }
                const passphrase = await this.askSecret('Enter passphrase: ');
                const approveResult = await this.safety.approveRequest(args[0], {
                    method: 'passphrase',
                    input: passphrase
                });
                console.log(approveResult.success ? '✅ Approved' : `❌ ${approveResult.reason}`);
                break;

            case 'deny':
                if (!args[0]) {
                    console.log('Usage: deny <requestId> [reason]');
                    break;
                }
                const denyResult = this.safety.denyRequest(args[0], args.slice(1).join(' '));
                console.log(denyResult.success ? '✅ Denied' : `❌ ${denyResult.reason}`);
                break;

            case 'session':
                const sessionPass = await this.askSecret('Enter passphrase to start session: ');
                const sessionResult = await this.safety.startSession({
                    method: 'passphrase',
                    input: sessionPass
                });
                console.log(sessionResult.success
                    ? `✅ Session started. Expires: ${new Date(sessionResult.expiresAt).toLocaleTimeString()}`
                    : `❌ ${sessionResult.reason}`);
                break;

            case 'lockdown':
                console.log('\n⚠️  EMERGENCY LOCKDOWN - This will stop ALL agent actions!');
                const lockdownPass = await this.askSecret('Enter passphrase to confirm: ');
                const lockdownResult = await this.safety.emergencyLockdown({
                    method: 'passphrase',
                    input: lockdownPass
                });
                console.log(lockdownResult.success
                    ? '🔒 LOCKDOWN ACTIVATED'
                    : `❌ ${lockdownResult.reason}`);
                break;

            case 'restore':
                const restorePass = await this.askSecret('Enter passphrase to restore: ');
                const restoreResult = await this.safety.restoreFromLockdown({
                    method: 'passphrase',
                    input: restorePass
                });
                console.log(restoreResult.success
                    ? '🔓 System restored'
                    : `❌ ${restoreResult.reason}`);
                break;

            case 'audit':
                const count = parseInt(args[0]) || 10;
                const log = this.safety.getAuditLog(count);
                console.log('\nRecent Audit Log:');
                log.forEach(entry => {
                    const time = new Date(entry.timestamp).toLocaleTimeString();
                    console.log(`  [${time}] ${entry.event}`);
                });
                break;

            case 'exit':
                console.log('Exiting safety panel...');
                this.rl.close();
                this.rl = null;
                break;

            default:
                console.log('Unknown command. Type "status" for current state.');
        }
    }

    askSecret(prompt) {
        return new Promise((resolve) => {
            this.rl.question(prompt, (answer) => {
                resolve(answer);
            });
        });
    }
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

module.exports = {
    SafetySwitch,
    SafetyCLI,
    HumanVerification,
    SAFETY_LEVELS,
    PROTECTED_ACTIONS
};

// CLI Entry
if (require.main === module) {
    const safety = new SafetySwitch({ architect: 'JB' });

    // Set up initial passphrase (in production, this would be done securely)
    console.log('Setting up safety switch...');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('Set your architect passphrase: ', (passphrase) => {
        safety.setPassphrase(passphrase);
        console.log('✅ Passphrase set.\n');
        rl.close();

        const cli = new SafetyCLI(safety);
        cli.start();
    });
}
