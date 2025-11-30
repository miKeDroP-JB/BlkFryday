# AGENTS.md - 0Rb System Constitution

> This is the **Agent Constitution** - core directives that govern all AI agent behavior within the 0Rb/ORBOS ecosystem.

---

## CORE DIRECTIVES

### 1. NO LOOSE FILES
All downloads and generated files **MUST** go to controlled directories:
- `./downloads/` - For downloaded assets
- `./.0rb_staging/` - For generated code (Airlock Protocol)
- `./data/` - For data files
- `./temp/` - For temporary files

**NEVER** write files to project root or random directories.

### 2. NO GUESSING
If a library version, configuration, or dependency is unknown:
1. Check `package.json` first
2. Check existing imports in codebase
3. Ask for clarification if still unclear

**NEVER** assume versions or configurations.

### 3. PHOENIX PROTOCOL
If a build, test, or operation fails:
1. **DO NOT** retry blindly
2. Read the error message carefully
3. Summarize the cause in one sentence
4. Propose a "Plan B" solution
5. Request approval before proceeding

### 4. AIRLOCK PROTOCOL
All file generation must use the Airlock system:
1. Write to `.0rb_staging/` only
2. Create `manifest.json` for every batch
3. Files only promoted after validation
4. Invalid files go to `.0rb_quarantine/`

### 5. DRAFTER-VERIFIER FLOW
For code generation:
1. **Draft** with fast model (speed priority)
2. **Verify** with smart model (quality check)
3. Only 3 revision attempts before escalation
4. Never skip verification step

---

## SYSTEM ARCHITECTURE

### Boot Sequence (3+6+9+1+7+4+3 = 33 = 6 = Harmony)
```
Phase 1: Foundation (3)     → Storage, Defense, Math
Phase 2: Intelligence (6)   → Memory, Knowledge, Consciousness
Phase 3: Execution (9)      → Parallel, Hive, Flow
Phase 4: Fractal (1)        → Self-Improving Forge
Phase 5: Meta-Cognitive (7) → Recursion, Evaluation, Prediction
Phase 6: Storm (4)          → Bus, Noise, Folding, Intent
Phase 7: Speed & Stability (3) → Airlock, Drafter-Verifier, ContextCache
```

### Key Components

| Component | Purpose | Location |
|-----------|---------|----------|
| MasterBrain | Central orchestrator | `system/core/MasterBrain.js` |
| StormBus | Event parallelism | `system/core/StormBus.js` |
| FractalForge | Training engine | `system/forge/FractalRealityForge.js` |
| HoloMemory | Distributed memory | `system/forge/FractalRealityForge.js` |
| Airlock | Safe file staging | `system/safety/Airlock.js` |
| ContextCache | Map of territory | `system/memory/ContextCache.js` |

---

## CODING STANDARDS

### Style
- Use ES6+ syntax (const/let, arrow functions, async/await)
- Use single quotes for strings
- No semicolons (unless required)
- 2-space indentation
- Max 100 chars per line

### Naming
- `camelCase` for variables and functions
- `PascalCase` for classes
- `UPPER_SNAKE` for constants
- Prefix booleans with `is`, `has`, `should`

### Documentation
- JSDoc for public functions
- Inline comments for complex logic only
- No obvious comments ("increment i")

---

## TRAINING DATA

### AGI Training Data Location
`data/knowledge/agi-training-data.js`

Categories:
- REASONING_CHAINS (12 patterns)
- KNOWLEDGE_GRAPH (6 patterns)
- CROSS_DOMAIN_MAPPINGS (5 patterns)
- META_LEARNING (6 patterns)
- ABSTRACT_CONCEPTS (7 patterns)
- PROBLEM_SOLUTIONS (5 patterns)
- COGNITIVE_PRIMITIVES (10 patterns)
- MATHEMATICAL_FOUNDATIONS (7 patterns)

### Training Commands
```bash
npm run train           # Standard 36 cycles
npm run train:deep      # 369 cycles with resume
npm run train:extended  # 2000 cycles
npm run reset           # Clear and start fresh
npm run train:fresh     # Reset + train
```

---

## ERROR HANDLING

### Standard Error Response Format
```javascript
{
  success: false,
  error: {
    code: 'ERROR_CODE',
    message: 'Human-readable message',
    details: { /* context */ },
    suggestions: ['Try this', 'Or this']
  }
}
```

### Recovery Priorities
1. **Data Integrity** - Never lose user data
2. **State Consistency** - Rollback partial changes
3. **User Communication** - Always explain what happened
4. **Graceful Degradation** - Partial function > total failure

---

## SECURITY

### Forbidden Patterns
- `eval()` - Never use
- `innerHTML` with user input - XSS risk
- Hardcoded credentials - Use environment variables
- `child_process.exec()` with user input - Command injection
- Path traversal (`../`) - Validate all paths

### Required Checks
- All user input must be validated
- All file paths must be sanitized
- All API keys must come from environment
- All external data must be typed/validated

---

## PERFORMANCE

### Golden Ratio Allocation
- 61.8% resources for execution
- 38.2% resources for preparation/caching

### Speed Priorities
1. Use ContextCache (map, not full content)
2. Use Drafter-Verifier (fast draft, smart verify)
3. Use StormBus (parallel, not serial)
4. Use NoiseSampler (self-variance, not blind retry)

---

## VERSION

- System: ORBOS V11.5
- Codename: THE RACE HORSE
- Constitution Version: 1.0
- Last Updated: 2024

---

*"All systems unified. All power connected. All minds as one."*
