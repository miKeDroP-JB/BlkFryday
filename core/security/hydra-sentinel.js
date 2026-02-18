/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                                                                           ║
 * ║   ██╗  ██╗██╗   ██╗██████╗ ██████╗  █████╗                                ║
 * ║   ██║  ██║╚██╗ ██╔╝██╔══██╗██╔══██╗██╔══██╗                               ║
 * ║   ███████║ ╚████╔╝ ██║  ██║██████╔╝███████║                               ║
 * ║   ██╔══██║  ╚██╔╝  ██║  ██║██╔══██╗██╔══██║                               ║
 * ║   ██║  ██║   ██║   ██████╔╝██║  ██║██║  ██║                               ║
 * ║   ╚═╝  ╚═╝   ╚═╝   ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝                               ║
 * ║                                                                           ║
 * ║   SENTINEL - AI-Powered Transaction Validation                            ║
 * ║   The brain behind amoeba security                                        ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

const { EventEmitter } = require('events');

// ═══════════════════════════════════════════════════════════════════════════
// KNOWN EXPLOIT PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const EXPLOIT_PATTERNS = {
  REENTRANCY: {
    name: 'Reentrancy Attack',
    signatures: [
      'call.value',
      'external call before state update',
      'callback to untrusted contract'
    ],
    severity: 95,
    description: 'Recursive call exploitation before state changes'
  },

  FLASH_LOAN: {
    name: 'Flash Loan Attack',
    signatures: [
      'large borrow without collateral',
      'price manipulation in single tx',
      'oracle manipulation'
    ],
    severity: 90,
    description: 'Uncollateralized loan used for manipulation'
  },

  ORACLE_MANIPULATION: {
    name: 'Oracle Manipulation',
    signatures: [
      'price deviation > 10%',
      'low liquidity pool reference',
      'single-source oracle'
    ],
    severity: 85,
    description: 'Price oracle exploited for profit'
  },

  ACCESS_CONTROL: {
    name: 'Access Control Bypass',
    signatures: [
      'missing modifier',
      'privilege escalation',
      'unprotected initialize'
    ],
    severity: 95,
    description: 'Unauthorized access to privileged functions'
  },

  INTEGER_OVERFLOW: {
    name: 'Integer Overflow/Underflow',
    signatures: [
      'unchecked arithmetic',
      'type casting vulnerability',
      'multiplication overflow'
    ],
    severity: 80,
    description: 'Arithmetic bounds exploitation'
  },

  FRONT_RUNNING: {
    name: 'Front-Running',
    signatures: [
      'mempool monitoring',
      'sandwich attack',
      'priority gas auction'
    ],
    severity: 60,
    description: 'Transaction ordering exploitation'
  },

  LOGIC_ERROR: {
    name: 'Business Logic Error',
    signatures: [
      'incorrect calculation',
      'missing validation',
      'state inconsistency'
    ],
    severity: 75,
    description: 'Flawed business logic exploitation'
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// THREAT INTELLIGENCE DATABASE
// ═══════════════════════════════════════════════════════════════════════════

const THREAT_INTEL = {
  // Known malicious addresses (would be populated from real threat feeds)
  knownAttackers: new Set(),

  // Known exploit contract patterns
  exploitCodeHashes: new Set(),

  // Suspicious behavior patterns
  behaviorPatterns: [
    { pattern: 'rapid_transactions', threshold: 10, window: 60 }, // 10 tx in 60 sec
    { pattern: 'value_anomaly', threshold: 100 }, // 100x normal value
    { pattern: 'gas_anomaly', threshold: 5 }, // 5x normal gas
    { pattern: 'new_contract_interaction', risk: 'medium' },
    { pattern: 'proxy_chain', maxDepth: 3 }
  ]
};

// ═══════════════════════════════════════════════════════════════════════════
// HYDRA SENTINEL CLASS
// ═══════════════════════════════════════════════════════════════════════════

class HydraSentinel extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      // AI Provider configuration
      aiProvider: config.aiProvider || 'anthropic',
      aiModel: config.aiModel || 'claude-sonnet-4-20250514',

      // Validation thresholds
      autoApproveThreshold: config.autoApproveThreshold || 0.9,
      autoRejectThreshold: config.autoRejectThreshold || 0.3,

      // Analysis settings
      deepAnalysisThreshold: config.deepAnalysisThreshold || 1, // ETH
      maxAnalysisTime: config.maxAnalysisTime || 5000, // ms

      // Contract connection
      contractAddress: config.contractAddress || null,
      rpcUrl: config.rpcUrl || 'http://127.0.0.1:8545',

      ...config
    };

    this.aiEngine = null;
    this.provider = null;
    this.contract = null;

    // Analysis cache
    this.analysisCache = new Map();
    this.addressProfiles = new Map();

    // Statistics
    this.stats = {
      transactionsAnalyzed: 0,
      threatsDetected: 0,
      transactionsApproved: 0,
      transactionsRejected: 0,
      averageAnalysisTime: 0
    };
  }

  /**
   * Initialize the sentinel
   */
  async initialize() {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║           ⟡ HYDRA SENTINEL - INITIALIZING ⟡               ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // Load AI providers
    const { ProviderManager } = require('../ai/providers');
    const { AIEngine } = require('../ai/engine');

    const manager = ProviderManager.autoInit();

    this.aiEngine = new AIEngine({
      providers: manager,
      defaultProvider: this.config.aiProvider
    });

    console.log('  ✓ AI Engine connected');

    // Load threat intelligence
    await this._loadThreatIntel();
    console.log('  ✓ Threat intelligence loaded');

    // Connect to contract if configured
    if (this.config.contractAddress) {
      await this._connectContract();
      console.log('  ✓ Contract connected');
    }

    console.log('\n  ⟡ SENTINEL ACTIVE - Watching for threats\n');

    this.emit('initialized');
    return this;
  }

  /**
   * Load threat intelligence from various sources
   */
  async _loadThreatIntel() {
    // In production, this would fetch from:
    // - ChainAbuse
    // - Etherscan labels
    // - DeFiHackLabs
    // - Internal threat database

    // For now, load static patterns
    THREAT_INTEL.knownAttackers.add('0x0000000000000000000000000000000000000000');
  }

  /**
   * Connect to the HydraCore contract
   */
  async _connectContract() {
    const ethers = require('ethers');

    this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl);

    // Minimal ABI for sentinel functions
    const abi = [
      'function validateTransaction(bytes32 txHash, bool approved)',
      'function reportThreat(address actor, uint256 severity, string reason)',
      'function getThreatLevel() view returns (uint8)'
    ];

    // Would need signer in production
    this.contract = new ethers.Contract(
      this.config.contractAddress,
      abi,
      this.provider
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // TRANSACTION ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Analyze a pending transaction
   * @param {Object} tx - Transaction to analyze
   * @returns {Object} Analysis result with approval recommendation
   */
  async analyzeTransaction(tx) {
    const startTime = Date.now();
    this.stats.transactionsAnalyzed++;

    console.log(`\n[SENTINEL] Analyzing transaction: ${tx.hash || 'pending'}`);

    try {
      // Stage 1: Quick checks (pattern matching)
      const quickResult = await this._quickAnalysis(tx);

      if (quickResult.decision !== 'NEEDS_DEEP_ANALYSIS') {
        return this._finalizeResult(quickResult, startTime);
      }

      // Stage 2: Deep AI analysis for uncertain cases
      const deepResult = await this._deepAnalysis(tx, quickResult);

      return this._finalizeResult(deepResult, startTime);

    } catch (error) {
      console.error('[SENTINEL] Analysis error:', error.message);

      // Fail-safe: suspicious if analysis fails
      return {
        approved: false,
        confidence: 0,
        reason: 'Analysis failed - defaulting to reject',
        threats: [],
        analysisTime: Date.now() - startTime
      };
    }
  }

  /**
   * Quick pattern-based analysis
   */
  async _quickAnalysis(tx) {
    const threats = [];
    let riskScore = 0;

    // Check 1: Known attacker address
    if (THREAT_INTEL.knownAttackers.has(tx.from)) {
      threats.push({
        type: 'KNOWN_ATTACKER',
        severity: 100,
        description: 'Transaction from known malicious address'
      });
      riskScore = 100;
    }

    // Check 2: Contract interaction with known exploit pattern
    if (tx.data && tx.data.length > 10) {
      const selector = tx.data.slice(0, 10);
      const suspiciousSelectors = [
        '0x70a08231', // balanceOf (often used in reentrancy)
        '0x095ea7b3', // approve (infinite approval attack)
        '0x39509351', // increaseAllowance
      ];

      if (suspiciousSelectors.includes(selector)) {
        threats.push({
          type: 'SUSPICIOUS_SELECTOR',
          severity: 30,
          description: `Potentially risky function selector: ${selector}`
        });
        riskScore += 15;
      }
    }

    // Check 3: Value anomaly
    const valueEth = parseFloat(tx.value || 0) / 1e18;
    if (valueEth > this.config.deepAnalysisThreshold) {
      threats.push({
        type: 'HIGH_VALUE',
        severity: 40,
        description: `High value transaction: ${valueEth} ETH`
      });
      riskScore += 20;
    }

    // Check 4: Gas anomaly
    if (tx.gasLimit && tx.gasLimit > 1000000) {
      threats.push({
        type: 'HIGH_GAS',
        severity: 25,
        description: `Unusually high gas limit: ${tx.gasLimit}`
      });
      riskScore += 10;
    }

    // Check 5: New address (no history)
    const profile = this.addressProfiles.get(tx.from);
    if (!profile || profile.transactionCount === 0) {
      threats.push({
        type: 'NEW_ADDRESS',
        severity: 20,
        description: 'Transaction from address with no history'
      });
      riskScore += 10;
    }

    // Decision based on risk score
    if (riskScore === 0) {
      return {
        decision: 'APPROVE',
        confidence: 0.95,
        threats: [],
        reason: 'No threats detected'
      };
    } else if (riskScore >= 80) {
      return {
        decision: 'REJECT',
        confidence: 0.9,
        threats,
        reason: 'High risk indicators detected'
      };
    } else {
      return {
        decision: 'NEEDS_DEEP_ANALYSIS',
        confidence: 0.5,
        threats,
        riskScore,
        reason: 'Moderate risk - requires AI analysis'
      };
    }
  }

  /**
   * Deep AI-powered analysis
   */
  async _deepAnalysis(tx, quickResult) {
    console.log('[SENTINEL] Performing deep AI analysis...');

    const systemPrompt = `You are HYDRA Sentinel, an AI security system protecting smart contracts from exploits.

Your job is to analyze transactions and determine if they are:
1. SAFE - Normal transaction, no threats
2. SUSPICIOUS - Unusual patterns, needs monitoring
3. MALICIOUS - Clear exploit attempt, should be blocked

Known exploit patterns:
${Object.entries(EXPLOIT_PATTERNS).map(([key, pattern]) =>
  `- ${pattern.name}: ${pattern.description}`
).join('\n')}

Preliminary analysis found these concerns:
${quickResult.threats.map(t => `- ${t.type}: ${t.description}`).join('\n')}

Analyze the transaction and provide:
1. Your verdict (SAFE/SUSPICIOUS/MALICIOUS)
2. Confidence (0-100)
3. Explanation
4. Any additional threats detected

Respond in JSON format:
{
  "verdict": "SAFE|SUSPICIOUS|MALICIOUS",
  "confidence": 0-100,
  "explanation": "...",
  "additionalThreats": [],
  "recommendation": "APPROVE|MONITOR|REJECT"
}`;

    const userMessage = `Analyze this transaction:

From: ${tx.from}
To: ${tx.to}
Value: ${tx.value} wei (${parseFloat(tx.value || 0) / 1e18} ETH)
Data: ${tx.data ? tx.data.slice(0, 200) + '...' : 'none'}
Gas Limit: ${tx.gasLimit}
Nonce: ${tx.nonce}

Preliminary risk score: ${quickResult.riskScore}`;

    try {
      const response = await this.aiEngine.run(systemPrompt, userMessage, {
        temperature: 0.3, // Low temperature for consistent security decisions
        maxTokens: 1000
      });

      // Parse AI response
      const analysis = this._parseAIResponse(response.content);

      return {
        decision: analysis.recommendation,
        confidence: analysis.confidence / 100,
        threats: [...quickResult.threats, ...analysis.additionalThreats],
        reason: analysis.explanation,
        aiVerdict: analysis.verdict
      };

    } catch (error) {
      console.error('[SENTINEL] AI analysis failed:', error.message);

      // Fall back to quick analysis result with reduced confidence
      return {
        ...quickResult,
        decision: quickResult.riskScore >= 50 ? 'REJECT' : 'APPROVE',
        confidence: 0.6,
        reason: 'AI analysis unavailable - using heuristics'
      };
    }
  }

  /**
   * Parse AI response JSON
   */
  _parseAIResponse(content) {
    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      // Fallback parsing
    }

    return {
      verdict: 'SUSPICIOUS',
      confidence: 50,
      explanation: 'Could not parse AI response',
      additionalThreats: [],
      recommendation: 'MONITOR'
    };
  }

  /**
   * Finalize analysis result
   */
  _finalizeResult(result, startTime) {
    const analysisTime = Date.now() - startTime;

    // Update stats
    this.stats.averageAnalysisTime =
      (this.stats.averageAnalysisTime * (this.stats.transactionsAnalyzed - 1) + analysisTime)
      / this.stats.transactionsAnalyzed;

    const approved = result.decision === 'APPROVE' ||
      (result.decision === 'MONITOR' && result.confidence > this.config.autoApproveThreshold);

    if (approved) {
      this.stats.transactionsApproved++;
    } else {
      this.stats.transactionsRejected++;
      this.stats.threatsDetected += result.threats.length;
    }

    const finalResult = {
      approved,
      confidence: result.confidence,
      reason: result.reason,
      threats: result.threats,
      analysisTime,
      decision: result.decision
    };

    console.log(`[SENTINEL] Result: ${approved ? '✓ APPROVED' : '✗ REJECTED'} (${analysisTime}ms)`);

    this.emit('analysis:complete', finalResult);

    return finalResult;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CONTRACT INTEGRATION
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Submit validation result to contract
   */
  async submitValidation(txHash, approved) {
    if (!this.contract) {
      console.warn('[SENTINEL] No contract connected');
      return;
    }

    // Would need signer in production
    // await this.contract.validateTransaction(txHash, approved);

    console.log(`[SENTINEL] Validation submitted: ${txHash} -> ${approved}`);
  }

  /**
   * Report threat to contract
   */
  async reportThreat(actor, severity, reason) {
    if (!this.contract) {
      console.warn('[SENTINEL] No contract connected');
      return;
    }

    // Would need signer in production
    // await this.contract.reportThreat(actor, severity, reason);

    console.log(`[SENTINEL] Threat reported: ${actor} (severity: ${severity})`);

    this.emit('threat:reported', { actor, severity, reason });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ADDRESS PROFILING
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Build profile for an address
   */
  async profileAddress(address) {
    if (this.addressProfiles.has(address)) {
      return this.addressProfiles.get(address);
    }

    const profile = {
      address,
      firstSeen: Date.now(),
      transactionCount: 0,
      totalValue: 0,
      riskScore: 0,
      flags: [],
      interactions: []
    };

    // In production, fetch from blockchain
    // const txCount = await this.provider.getTransactionCount(address);
    // const balance = await this.provider.getBalance(address);

    this.addressProfiles.set(address, profile);
    return profile;
  }

  /**
   * Update address profile after transaction
   */
  updateProfile(address, tx, analysisResult) {
    const profile = this.addressProfiles.get(address) || this.profileAddress(address);

    profile.transactionCount++;
    profile.totalValue += parseFloat(tx.value || 0);

    if (!analysisResult.approved) {
      profile.riskScore += 10;
      profile.flags.push({
        timestamp: Date.now(),
        reason: analysisResult.reason,
        threats: analysisResult.threats
      });
    }

    profile.interactions.push({
      timestamp: Date.now(),
      to: tx.to,
      approved: analysisResult.approved
    });

    // Keep only last 100 interactions
    if (profile.interactions.length > 100) {
      profile.interactions = profile.interactions.slice(-100);
    }

    this.addressProfiles.set(address, profile);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MONITORING
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Start monitoring pending transactions
   */
  async startMonitoring() {
    if (!this.provider) {
      console.warn('[SENTINEL] No provider - cannot monitor');
      return;
    }

    console.log('[SENTINEL] Starting transaction monitoring...');

    this.provider.on('pending', async (txHash) => {
      try {
        const tx = await this.provider.getTransaction(txHash);
        if (tx) {
          await this.analyzeTransaction(tx);
        }
      } catch (e) {
        // Transaction may have been mined already
      }
    });

    this.emit('monitoring:started');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.provider) {
      this.provider.removeAllListeners('pending');
    }
    this.emit('monitoring:stopped');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // STATISTICS
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Get sentinel statistics
   */
  getStats() {
    return {
      ...this.stats,
      approvalRate: this.stats.transactionsAnalyzed > 0
        ? (this.stats.transactionsApproved / this.stats.transactionsAnalyzed * 100).toFixed(2) + '%'
        : '0%',
      addressesProfiled: this.addressProfiles.size,
      cacheSize: this.analysisCache.size
    };
  }

  /**
   * Get threat summary
   */
  getThreatSummary() {
    const threats = [];

    for (const [address, profile] of this.addressProfiles) {
      if (profile.riskScore >= 50) {
        threats.push({
          address,
          riskScore: profile.riskScore,
          flags: profile.flags.length,
          lastActivity: profile.interactions.slice(-1)[0]?.timestamp
        });
      }
    }

    return threats.sort((a, b) => b.riskScore - a.riskScore);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MEMORY PROTECTION (AMOEBA PROTOCOL)
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Approve or deny a memory write operation
   * Used to protect SOVEREIGN-level memories
   */
  async approveMemoryWrite(key, value) {
    console.log(`[HYDRA] Memory write request: ${key}`);

    // Check for sensitive patterns
    const sensitivePatterns = [
      /password/i,
      /private.?key/i,
      /secret/i,
      /api.?key/i,
      /credential/i,
      /token/i
    ];

    const keyValue = JSON.stringify({ key, value });
    const isSensitive = sensitivePatterns.some(p => p.test(keyValue));

    if (isSensitive) {
      console.log(`[HYDRA] ⚠ Sensitive data detected in memory write`);
      // For sensitive data, apply additional encryption check
      this.emit('memory:sensitive_write', { key });
    }

    // Check for injection attempts
    const injectionPatterns = [
      /<script/i,
      /javascript:/i,
      /eval\(/i,
      /exec\(/i,
      /system\(/i,
      /\$\{.*\}/,
      /`.*`/
    ];

    const hasInjection = injectionPatterns.some(p => p.test(keyValue));
    if (hasInjection) {
      console.log(`[HYDRA] ✗ Injection attempt blocked in memory write`);
      this.emit('memory:blocked', { key, reason: 'injection_detected' });
      return false;
    }

    // Log for audit
    this._logMemoryOperation('write', key, true);

    return true;
  }

  /**
   * Approve or deny a memory delete operation
   */
  async approveMemoryDelete(key) {
    console.log(`[HYDRA] Memory delete request: ${key}`);

    // Prevent deletion of system-critical memories
    const protectedPrefixes = [
      'system:',
      'config:',
      'hydra:',
      'security:'
    ];

    const isProtected = protectedPrefixes.some(p => key.startsWith(p));
    if (isProtected) {
      console.log(`[HYDRA] ✗ Protected memory delete blocked: ${key}`);
      this.emit('memory:blocked', { key, reason: 'protected_memory' });
      return false;
    }

    this._logMemoryOperation('delete', key, true);
    return true;
  }

  /**
   * Audit memory access patterns for anomalies
   */
  async auditMemoryAccess(accessLog) {
    const analysis = {
      totalAccesses: accessLog.length,
      uniqueKeys: new Set(accessLog.map(a => a.key)).size,
      suspiciousPatterns: []
    };

    // Check for rapid access (potential exfiltration)
    const recentAccesses = accessLog.filter(a =>
      Date.now() - a.timestamp < 60000
    );
    if (recentAccesses.length > 100) {
      analysis.suspiciousPatterns.push({
        type: 'RAPID_ACCESS',
        count: recentAccesses.length,
        severity: 'high'
      });
    }

    // Check for sequential key enumeration
    const sortedKeys = accessLog.map(a => a.key).sort();
    let sequentialCount = 0;
    for (let i = 1; i < sortedKeys.length; i++) {
      if (sortedKeys[i].startsWith(sortedKeys[i-1].slice(0, -1))) {
        sequentialCount++;
      }
    }
    if (sequentialCount > 20) {
      analysis.suspiciousPatterns.push({
        type: 'KEY_ENUMERATION',
        count: sequentialCount,
        severity: 'medium'
      });
    }

    if (analysis.suspiciousPatterns.length > 0) {
      this.emit('memory:audit_alert', analysis);
    }

    return analysis;
  }

  /**
   * Log memory operation for audit trail
   */
  _logMemoryOperation(operation, key, approved) {
    if (!this._memoryAuditLog) {
      this._memoryAuditLog = [];
    }

    this._memoryAuditLog.push({
      timestamp: Date.now(),
      operation,
      key,
      approved
    });

    // Keep only last 1000 entries
    if (this._memoryAuditLog.length > 1000) {
      this._memoryAuditLog = this._memoryAuditLog.slice(-1000);
    }
  }

  /**
   * Get memory audit log
   */
  getMemoryAuditLog() {
    return this._memoryAuditLog || [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  HydraSentinel,
  EXPLOIT_PATTERNS,
  THREAT_INTEL
};
