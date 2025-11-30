// ============================================================
//  ORBOS V11.5 - AMOEBA DEFENSE SYSTEM
//  Adaptive, Self-Healing, Decentralized Security
// ============================================================
//
//  AMOEBA PRINCIPLES:
//  1. SHAPESHIFTING - Adapts form to counter threats
//  2. SELF-HEALING - Automatically repairs damage
//  3. DECENTRALIZED - No single point of failure
//  4. ENGULFING - Absorbs and learns from attacks
//  5. SPLITTING - Replicates to handle load/threats
//  6. FLOWING - Moves around obstacles fluidly
//
// ============================================================

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

class AmoebaDefense extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = config;
    this.dataDir = config.dataDir || path.join(__dirname, '../../data/defense');
    this.ensureDirectories();

    // ============================================================
    //  AMOEBA CELLS (Distributed Defense Nodes)
    // ============================================================

    this.cells = new Map();
    this.cellCount = config.initialCells || 10;

    // ============================================================
    //  MEMBRANE (Outer Defense Layer)
    // ============================================================

    this.membrane = {
      integrity: 1.0,
      permeability: 0.1, // How much can pass through
      thickness: 5, // Defense layers
      sections: new Map(), // Distributed sections
      lastReinforced: Date.now()
    };

    // ============================================================
    //  NUCLEUS (Core Intelligence)
    // ============================================================

    this.nucleus = {
      threatPatterns: new Map(),
      learnedDefenses: new Map(),
      adaptationHistory: [],
      dna: this.generateDefenseDNA()
    };

    // ============================================================
    //  CYTOPLASM (Active Defense Zone)
    // ============================================================

    this.cytoplasm = {
      activeDefenders: new Map(),
      digestingThreats: [],
      nutrients: [], // Learned patterns that strengthen us
      waste: [] // Blocked/neutralized threats
    };

    // ============================================================
    //  STATE
    // ============================================================

    this.state = {
      form: 'neutral', // neutral, defensive, aggressive, evasive
      health: 1.0,
      energy: 1.0,
      threatLevel: 0,
      isHealing: false,
      isSplitting: false
    };

    // Initialize cells
    this.initializeCells();

    // Start autonomous processes
    this.startAutonomousDefense();

    console.log(`[AmoebaDefense] Initialized with ${this.cellCount} cells`);
  }

  ensureDirectories() {
    const dirs = [
      this.dataDir,
      path.join(this.dataDir, 'threats'),
      path.join(this.dataDir, 'learned'),
      path.join(this.dataDir, 'adaptations')
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  generateDefenseDNA() {
    // Core defense behaviors encoded as "DNA"
    return {
      adaptationSpeed: 0.8, // How fast we adapt (0-1)
      healingRate: 0.1, // Health restored per cycle
      splitThreshold: 0.3, // Threat level to trigger splitting
      mergeThreshold: 0.1, // Threat level to merge cells back
      membraneRegen: 0.05, // Membrane regeneration rate
      learningRate: 0.2, // How fast we learn from threats
      aggressionFactor: 0.5 // Balance between defense and offense
    };
  }

  // ============================================================
  //  CELL MANAGEMENT
  // ============================================================

  initializeCells() {
    for (let i = 0; i < this.cellCount; i++) {
      const cell = this.createCell(`cell_${i}`);
      this.cells.set(cell.id, cell);
    }
  }

  createCell(id = null) {
    const cellId = id || `cell_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    return {
      id: cellId,
      type: 'defender',
      status: 'active',
      position: {
        section: Math.floor(Math.random() * this.membrane.thickness),
        angle: Math.random() * 360
      },
      specialization: this.randomSpecialization(),
      health: 1.0,
      energy: 1.0,
      threatsNeutralized: 0,
      parent: null,
      children: [],
      createdAt: Date.now()
    };
  }

  randomSpecialization() {
    const specializations = [
      'scanner', // Detects threats
      'neutralizer', // Neutralizes threats
      'absorber', // Absorbs threat patterns
      'healer', // Repairs damage
      'communicator', // Coordinates with other cells
      'reinforcer' // Strengthens membrane
    ];

    return specializations[Math.floor(Math.random() * specializations.length)];
  }

  // ============================================================
  //  PRINCIPLE 1: SHAPESHIFTING
  // ============================================================

  async shapeshift(newForm, reason) {
    const oldForm = this.state.form;

    console.log(`[AmoebaDefense] SHAPESHIFTING: ${oldForm} → ${newForm} (${reason})`);

    this.state.form = newForm;

    // Adjust cell behavior based on form
    switch (newForm) {
      case 'defensive':
        this.contractMembrane();
        this.reinforcePerimeter();
        break;

      case 'aggressive':
        this.extendPseudopods();
        this.activateNeutralizers();
        break;

      case 'evasive':
        this.disperseCells();
        this.reduceSurface();
        break;

      case 'neutral':
        this.normalizeForm();
        break;
    }

    // Record adaptation
    this.nucleus.adaptationHistory.push({
      from: oldForm,
      to: newForm,
      reason,
      timestamp: Date.now()
    });

    this.emit('shapeshift', { from: oldForm, to: newForm, reason });
  }

  contractMembrane() {
    // Pull all cells inward for maximum protection
    for (const cell of this.cells.values()) {
      cell.position.section = Math.max(0, cell.position.section - 1);
    }
    this.membrane.permeability = 0.05; // Nearly impermeable
    this.membrane.thickness += 1;
  }

  extendPseudopods() {
    // Extend cells outward to engage threats
    const attackCells = Array.from(this.cells.values())
      .filter(c => c.specialization === 'neutralizer');

    for (const cell of attackCells) {
      cell.position.section = this.membrane.thickness; // Move to edge
    }
  }

  disperseCells() {
    // Spread cells to avoid concentrated attacks
    let angle = 0;
    const angleStep = 360 / this.cells.size;

    for (const cell of this.cells.values()) {
      cell.position.angle = angle;
      angle += angleStep;
    }
  }

  reduceSurface() {
    this.membrane.thickness = Math.max(2, this.membrane.thickness - 2);
  }

  normalizeForm() {
    this.membrane.permeability = 0.1;
    this.membrane.thickness = 5;
  }

  // ============================================================
  //  PRINCIPLE 2: SELF-HEALING
  // ============================================================

  async heal() {
    if (this.state.isHealing) return;
    this.state.isHealing = true;

    console.log('[AmoebaDefense] SELF-HEALING initiated...');

    // Heal cells
    for (const cell of this.cells.values()) {
      if (cell.health < 1) {
        cell.health = Math.min(1, cell.health + this.nucleus.dna.healingRate);
      }
      if (cell.energy < 1) {
        cell.energy = Math.min(1, cell.energy + this.nucleus.dna.healingRate * 0.5);
      }
    }

    // Heal membrane
    this.membrane.integrity = Math.min(1, this.membrane.integrity + this.nucleus.dna.membraneRegen);

    // Regenerate membrane sections
    for (const [id, section] of this.membrane.sections) {
      if (section.health < 1) {
        section.health = Math.min(1, section.health + this.nucleus.dna.membraneRegen);
      }
    }

    // Overall health
    this.state.health = this.calculateOverallHealth();

    // Repair damaged cells by specialization
    const healerCells = Array.from(this.cells.values())
      .filter(c => c.specialization === 'healer' && c.health > 0.5);

    for (const healer of healerCells) {
      const damaged = Array.from(this.cells.values())
        .filter(c => c.health < 0.5)
        .slice(0, 2);

      for (const target of damaged) {
        target.health = Math.min(1, target.health + 0.2);
        healer.energy -= 0.1;
      }
    }

    this.state.isHealing = false;
    this.emit('healed', { health: this.state.health });
  }

  calculateOverallHealth() {
    const cellHealth = Array.from(this.cells.values())
      .reduce((sum, c) => sum + c.health, 0) / this.cells.size;

    return (cellHealth + this.membrane.integrity) / 2;
  }

  // ============================================================
  //  PRINCIPLE 3: DECENTRALIZED
  // ============================================================

  isAnyNodeAlive() {
    // As long as ONE cell survives, the system lives
    return Array.from(this.cells.values()).some(c => c.health > 0);
  }

  redistributeLoad(failedCell) {
    // Redistribute failed cell's duties to neighbors
    const neighbors = this.findNearestCells(failedCell, 3);

    console.log(`[AmoebaDefense] Cell ${failedCell.id} failed, redistributing to ${neighbors.length} neighbors`);

    for (const neighbor of neighbors) {
      // Inherit some specialization temporarily
      if (neighbor.health > 0.5) {
        neighbor.secondaryRole = failedCell.specialization;
      }
    }
  }

  findNearestCells(targetCell, count) {
    const sorted = Array.from(this.cells.values())
      .filter(c => c.id !== targetCell.id && c.health > 0)
      .sort((a, b) => {
        const distA = Math.abs(a.position.angle - targetCell.position.angle);
        const distB = Math.abs(b.position.angle - targetCell.position.angle);
        return distA - distB;
      });

    return sorted.slice(0, count);
  }

  electNewLeader() {
    // Decentralized leader election if needed
    const healthiest = Array.from(this.cells.values())
      .filter(c => c.health > 0.5)
      .sort((a, b) => b.health - a.health)[0];

    if (healthiest) {
      healthiest.isLeader = true;
      return healthiest;
    }
    return null;
  }

  // ============================================================
  //  PRINCIPLE 4: ENGULFING (Absorb & Learn)
  // ============================================================

  async engulfThreat(threat) {
    console.log(`[AmoebaDefense] ENGULFING threat: ${threat.type}`);

    // Move threat to digestion
    this.cytoplasm.digestingThreats.push({
      threat,
      startedAt: Date.now(),
      progress: 0
    });

    // Start digestion (learning) process
    const learned = await this.digestThreat(threat);

    if (learned) {
      // Store learned pattern
      this.nucleus.threatPatterns.set(learned.signature, learned);
      this.nucleus.learnedDefenses.set(learned.signature, learned.defense);

      // Convert to "nutrient" (strengthening pattern)
      this.cytoplasm.nutrients.push({
        source: threat.type,
        pattern: learned,
        absorbedAt: Date.now()
      });

      this.emit('threat-absorbed', { threat, learned });

      // Save learned pattern
      this.saveLearnedPattern(learned);
    }

    // Move to waste
    this.cytoplasm.waste.push({
      threat,
      neutralizedAt: Date.now()
    });
  }

  async digestThreat(threat) {
    // Analyze threat and extract learnable patterns
    const signature = this.generateThreatSignature(threat);

    const learned = {
      signature,
      type: threat.type,
      patterns: this.extractPatterns(threat),
      severity: threat.severity || 0.5,
      defense: this.generateDefense(threat),
      digestedAt: Date.now()
    };

    return learned;
  }

  generateThreatSignature(threat) {
    const data = JSON.stringify({
      type: threat.type,
      source: threat.source,
      patterns: threat.patterns
    });

    return crypto.createHash('sha256').update(data).digest('hex').slice(0, 16);
  }

  extractPatterns(threat) {
    return {
      sourcePattern: threat.source,
      behaviorPattern: threat.behavior || 'unknown',
      payloadPattern: threat.payload ? this.analyzePayload(threat.payload) : null,
      timePattern: threat.timestamp ? new Date(threat.timestamp).getHours() : null
    };
  }

  analyzePayload(payload) {
    // Extract patterns from malicious payloads
    const patterns = [];

    // SQL injection patterns
    if (/(SELECT|INSERT|UPDATE|DELETE|DROP|UNION)/i.test(payload)) {
      patterns.push('sql-injection');
    }

    // XSS patterns
    if (/<script|javascript:|on\w+=/i.test(payload)) {
      patterns.push('xss');
    }

    // Command injection
    if (/[;&|`$()]/.test(payload)) {
      patterns.push('command-injection');
    }

    // Path traversal
    if (/\.\.\/|\.\.\\/.test(payload)) {
      patterns.push('path-traversal');
    }

    return patterns;
  }

  generateDefense(threat) {
    // Create defense based on threat type
    return {
      type: threat.type,
      countermeasures: [
        `Block pattern: ${threat.type}`,
        'Rate limit source',
        'Increase monitoring',
        'Alert on similar patterns'
      ],
      autoApply: threat.severity > 0.7,
      effectiveness: 0.9
    };
  }

  saveLearnedPattern(learned) {
    const filepath = path.join(this.dataDir, 'learned', `${learned.signature}.json`);
    fs.writeFileSync(filepath, JSON.stringify(learned, null, 2));
  }

  // ============================================================
  //  PRINCIPLE 5: SPLITTING (Replicate)
  // ============================================================

  async split() {
    if (this.state.isSplitting) return;
    this.state.isSplitting = true;

    console.log('[AmoebaDefense] SPLITTING - Creating new cells...');

    // Select healthy cells that can split
    const healthyCells = Array.from(this.cells.values())
      .filter(c => c.health > 0.8 && c.energy > 0.7)
      .slice(0, 5); // Split up to 5 cells

    for (const parent of healthyCells) {
      const child = this.createCell();

      // Child inherits from parent
      child.specialization = parent.specialization;
      child.position = {
        section: parent.position.section,
        angle: (parent.position.angle + 10) % 360
      };
      child.parent = parent.id;
      child.health = 0.5; // Start at half health
      child.energy = 0.5;

      // Parent loses some energy
      parent.energy -= 0.3;
      parent.children.push(child.id);

      this.cells.set(child.id, child);

      console.log(`[AmoebaDefense] Cell ${parent.id} split → ${child.id}`);
    }

    this.cellCount = this.cells.size;
    this.state.isSplitting = false;

    this.emit('split', { newCellCount: this.cells.size });
  }

  async merge() {
    // Merge cells back when threat level is low
    console.log('[AmoebaDefense] MERGING - Consolidating cells...');

    const lowEnergyCells = Array.from(this.cells.values())
      .filter(c => c.energy < 0.3)
      .slice(0, 3);

    for (const weak of lowEnergyCells) {
      const strong = Array.from(this.cells.values())
        .find(c => c.id !== weak.id && c.health > 0.7);

      if (strong) {
        // Strong absorbs weak
        strong.energy = Math.min(1, strong.energy + weak.energy * 0.5);
        strong.threatsNeutralized += weak.threatsNeutralized;

        this.cells.delete(weak.id);
        console.log(`[AmoebaDefense] Cell ${weak.id} merged into ${strong.id}`);
      }
    }

    this.cellCount = this.cells.size;
  }

  // ============================================================
  //  PRINCIPLE 6: FLOWING (Move Around Obstacles)
  // ============================================================

  async flow(direction, reason) {
    console.log(`[AmoebaDefense] FLOWING ${direction} (${reason})`);

    // Move all cells in a direction
    for (const cell of this.cells.values()) {
      switch (direction) {
        case 'expand':
          cell.position.section = Math.min(
            this.membrane.thickness,
            cell.position.section + 1
          );
          break;

        case 'contract':
          cell.position.section = Math.max(0, cell.position.section - 1);
          break;

        case 'rotate':
          cell.position.angle = (cell.position.angle + 30) % 360;
          break;

        case 'scatter':
          cell.position.angle = Math.random() * 360;
          cell.position.section = Math.floor(Math.random() * this.membrane.thickness);
          break;
      }
    }

    // Adjust membrane
    if (direction === 'expand') {
      this.membrane.thickness++;
    } else if (direction === 'contract') {
      this.membrane.thickness = Math.max(2, this.membrane.thickness - 1);
    }

    this.emit('flow', { direction, reason });
  }

  async bypassObstacle(obstacle) {
    // Find cells blocked by obstacle
    const blocked = Array.from(this.cells.values())
      .filter(c => this.isBlocked(c, obstacle));

    // Route around obstacle
    for (const cell of blocked) {
      // Find clear path
      const clearAngle = this.findClearPath(cell, obstacle);
      cell.position.angle = clearAngle;
    }
  }

  isBlocked(cell, obstacle) {
    // Check if cell path is blocked
    return Math.abs(cell.position.angle - obstacle.angle) < 30;
  }

  findClearPath(cell, obstacle) {
    // Find angle that avoids obstacle
    const offset = obstacle.angle > 180 ? -45 : 45;
    return (cell.position.angle + offset + 360) % 360;
  }

  // ============================================================
  //  AUTONOMOUS DEFENSE LOOP
  // ============================================================

  startAutonomousDefense() {
    setInterval(() => this.autonomousCycle(), 5000);
  }

  async autonomousCycle() {
    // 1. Assess threat level
    const threatAssessment = this.assessThreats();
    this.state.threatLevel = threatAssessment.level;

    // 2. Adapt form based on threats
    if (threatAssessment.level > 0.7 && this.state.form !== 'defensive') {
      await this.shapeshift('defensive', 'High threat detected');
    } else if (threatAssessment.level > 0.5 && this.state.form !== 'aggressive') {
      await this.shapeshift('aggressive', 'Moderate threat - engaging');
    } else if (threatAssessment.level < 0.2 && this.state.form !== 'neutral') {
      await this.shapeshift('neutral', 'Low threat - normalizing');
    }

    // 3. Split if under heavy attack
    if (threatAssessment.level > this.nucleus.dna.splitThreshold && !this.state.isSplitting) {
      await this.split();
    }

    // 4. Merge if threat is low and we have many cells
    if (threatAssessment.level < this.nucleus.dna.mergeThreshold && this.cells.size > this.config.initialCells) {
      await this.merge();
    }

    // 5. Heal if damaged
    if (this.state.health < 0.9) {
      await this.heal();
    }

    // 6. Check for failed cells and redistribute
    for (const cell of this.cells.values()) {
      if (cell.health <= 0) {
        this.redistributeLoad(cell);
      }
    }

    // 7. Update energy from nutrients
    this.metabolize();
  }

  assessThreats() {
    // Calculate threat level from various sources
    const digestingCount = this.cytoplasm.digestingThreats.length;
    const membraneIntegrity = this.membrane.integrity;
    const cellHealthAvg = Array.from(this.cells.values())
      .reduce((sum, c) => sum + c.health, 0) / this.cells.size;

    const level = Math.min(1,
      (digestingCount * 0.1) +
      ((1 - membraneIntegrity) * 0.3) +
      ((1 - cellHealthAvg) * 0.2)
    );

    return {
      level,
      sources: {
        activeThreats: digestingCount,
        membraneStatus: membraneIntegrity,
        cellHealth: cellHealthAvg
      }
    };
  }

  metabolize() {
    // Convert nutrients to energy
    const nutrient = this.cytoplasm.nutrients.shift();
    if (nutrient) {
      this.state.energy = Math.min(1, this.state.energy + 0.1);

      // Strengthen relevant cells
      const relevantCells = Array.from(this.cells.values())
        .filter(c => c.specialization === 'neutralizer')
        .slice(0, 3);

      for (const cell of relevantCells) {
        cell.energy = Math.min(1, cell.energy + 0.05);
      }
    }

    // Clean waste
    if (this.cytoplasm.waste.length > 100) {
      this.cytoplasm.waste = this.cytoplasm.waste.slice(-50);
    }
  }

  // ============================================================
  //  THREAT DETECTION & RESPONSE
  // ============================================================

  async detectThreat(input) {
    const threat = {
      id: `threat_${Date.now()}`,
      type: this.classifyThreat(input),
      source: input.source || 'unknown',
      payload: input.payload || input,
      severity: this.calculateSeverity(input),
      timestamp: Date.now()
    };

    // Check if we've seen this before
    const signature = this.generateThreatSignature(threat);
    const known = this.nucleus.threatPatterns.get(signature);

    if (known) {
      // Apply learned defense immediately
      return this.applyLearnedDefense(threat, known);
    }

    // New threat - engage
    return this.respondToThreat(threat);
  }

  classifyThreat(input) {
    const payload = typeof input === 'string' ? input : JSON.stringify(input);

    if (/(SELECT|INSERT|UPDATE|DELETE|DROP)/i.test(payload)) return 'sql-injection';
    if (/<script|javascript:/i.test(payload)) return 'xss';
    if (/\.\.\//i.test(payload)) return 'path-traversal';
    if (/password|credential|token/i.test(payload)) return 'credential-theft';
    if (/rate.*limit|flood|ddos/i.test(payload)) return 'dos';

    return 'unknown';
  }

  calculateSeverity(input) {
    let severity = 0.5;

    const payload = typeof input === 'string' ? input : JSON.stringify(input);

    // High severity indicators
    if (/DROP|DELETE|TRUNCATE/i.test(payload)) severity += 0.3;
    if (/admin|root|sudo/i.test(payload)) severity += 0.2;
    if (/password|secret|key/i.test(payload)) severity += 0.2;

    return Math.min(1, severity);
  }

  async respondToThreat(threat) {
    console.log(`[AmoebaDefense] Responding to ${threat.type} (severity: ${threat.severity})`);

    // Activate relevant cells
    const activatedCells = [];

    // Scanner cells detect
    const scanners = Array.from(this.cells.values())
      .filter(c => c.specialization === 'scanner' && c.health > 0.3);

    for (const scanner of scanners) {
      scanner.status = 'scanning';
      activatedCells.push(scanner);
    }

    // Neutralizer cells engage
    const neutralizers = Array.from(this.cells.values())
      .filter(c => c.specialization === 'neutralizer' && c.health > 0.5);

    for (const neutralizer of neutralizers) {
      neutralizer.status = 'engaging';
      neutralizer.energy -= 0.1;
      neutralizer.threatsNeutralized++;
      activatedCells.push(neutralizer);
    }

    // Engulf and learn
    await this.engulfThreat(threat);

    // Damage to membrane based on severity
    this.membrane.integrity -= threat.severity * 0.05;

    return {
      blocked: true,
      threat,
      cellsActivated: activatedCells.length,
      learned: true
    };
  }

  async applyLearnedDefense(threat, known) {
    console.log(`[AmoebaDefense] Applying LEARNED defense for ${threat.type}`);

    const defense = this.nucleus.learnedDefenses.get(known.signature);

    return {
      blocked: true,
      threat,
      defense: defense.type,
      effectiveness: defense.effectiveness,
      wasKnown: true
    };
  }

  // ============================================================
  //  STATISTICS
  // ============================================================

  getStats() {
    const cellsBySpec = {};
    for (const cell of this.cells.values()) {
      cellsBySpec[cell.specialization] = (cellsBySpec[cell.specialization] || 0) + 1;
    }

    return {
      state: this.state,
      cells: {
        total: this.cells.size,
        bySpecialization: cellsBySpec,
        avgHealth: Array.from(this.cells.values()).reduce((s, c) => s + c.health, 0) / this.cells.size
      },
      membrane: {
        integrity: this.membrane.integrity,
        thickness: this.membrane.thickness,
        permeability: this.membrane.permeability
      },
      nucleus: {
        knownThreats: this.nucleus.threatPatterns.size,
        learnedDefenses: this.nucleus.learnedDefenses.size,
        adaptations: this.nucleus.adaptationHistory.length
      },
      cytoplasm: {
        digestingThreats: this.cytoplasm.digestingThreats.length,
        nutrients: this.cytoplasm.nutrients.length,
        waste: this.cytoplasm.waste.length
      }
    };
  }

  reinforcePerimeter() {
    const reinforcers = Array.from(this.cells.values())
      .filter(c => c.specialization === 'reinforcer');

    for (const cell of reinforcers) {
      cell.status = 'reinforcing';
      this.membrane.integrity = Math.min(1, this.membrane.integrity + 0.05);
      cell.energy -= 0.1;
    }
  }

  activateNeutralizers() {
    const neutralizers = Array.from(this.cells.values())
      .filter(c => c.specialization === 'neutralizer');

    for (const cell of neutralizers) {
      cell.status = 'active-hunting';
    }
  }
}

// ============================================================
//  EXPORT
// ============================================================

module.exports = { AmoebaDefense };
