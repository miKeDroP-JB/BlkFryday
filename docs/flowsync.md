# Flowsync Builder Protocol

Our iterative cycle for perfection and beyond. Every system is perfectible if broken down to its atomic bottleneck.

---

## The Cycle

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│    LEARN ──► BUILD ──► TEST ──► REFINE ──► REPEAT          │
│      ▲                                          │          │
│      └──────────────────────────────────────────┘          │
│                         │                                   │
│                         ▼                                   │
│                     REPLICATE                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1. LEARN
- Deep research and design
- Identify the atomic bottleneck (smallest solvable problem)
- Understand the domain completely before writing code

### 2. BUILD
- Prototype, implement, scaffold
- Write code that solves ONE thing perfectly
- No half-measures - if it's not right, don't ship it

### 3. TEST
- Functional, integration, and performance checks
- Run `npm test` - all tests must pass
- Run `npm run benchmark` - performance must not regress

### 4. REFINE
- Code review (human + AI)
- Optimize for clarity, speed, and maintainability
- Remove anything unnecessary

### 5. REPEAT
- Find the next bottleneck
- Apply the cycle again
- Compound improvements over time

### 6. REPLICATE
- Once perfected, document the pattern
- Apply to similar problems across the system
- Build libraries/utilities from repeated solutions

---

## Current Flowsync Cycles

### Active Cycles

| Cycle | Module | Status | Bottleneck |
|-------|--------|--------|------------|
| #1 | `/core/agents/archetypes.js` | ✅ Complete | Duplicate agent definitions |
| #2 | `/core/utils/index.js` | ✅ Complete | Repeated utility functions |
| #3 | `/core/outreach/engine.js` | ✅ Complete | No sales automation |
| #4 | `/scripts/automate.js` | ✅ Complete | Manual daily tasks |

### Next Bottlenecks (Backlog)

| Priority | Module | Bottleneck | Proposed Solution |
|----------|--------|------------|-------------------|
| HIGH | `/system/` folder | Parallel to `/core/` | Consolidate or clearly separate |
| MEDIUM | AI Provider routing | No intelligent fallback | Smart router with cost/speed optimization |
| LOW | Game engines | Placeholder code | Wire to real AI |

---

## Logging Format

When completing a cycle, add an entry:

```markdown
### Cycle #N - [Module Name]
**Date:** YYYY-MM-DD
**Bottleneck:** What was the problem?
**Solution:** What did we build?
**Tests:** What tests were added?
**Metrics:** Performance impact?
**Next:** What's the next bottleneck?
```

---

## Completed Cycle Log

### Cycle #1 - Agent Archetypes Consolidation
**Date:** 2024-12-08
**Bottleneck:** Agent definitions duplicated in `/core/agents/executor.js` and `/system/agents/AgentManager.js`
**Solution:** Created `/core/agents/archetypes.js` as single source of truth
**Tests:** `tests/e2e/core.test.js` - archetype tests
**Metrics:** -600 lines of duplicate code
**Next:** Consolidate utility functions

### Cycle #2 - Shared Utilities
**Date:** 2024-12-08
**Bottleneck:** `parseJSON`, `generateId` duplicated across atlas.js, iris.js, hydra-sentinel.js
**Solution:** Created `/core/utils/index.js` with all shared utilities
**Tests:** Utility tests in e2e suite
**Metrics:** -100 lines, consistent behavior
**Next:** Build outreach automation

### Cycle #3 - Outreach Engine
**Date:** 2024-12-08
**Bottleneck:** No integrated sales/outreach automation
**Solution:** Built `/core/outreach/` with campaign management, prospects, email providers
**Tests:** Outreach engine tests in e2e suite
**Metrics:** 4 new benchmark tests, all passing
**Next:** Daily automation

### Cycle #4 - Zero-Touch Automation
**Date:** 2024-12-08
**Bottleneck:** Manual daily tasks (briefs, outreach, reports)
**Solution:** Built `/scripts/automate.js` with scheduler daemon
**Tests:** Benchmark suite tests automation speed
**Metrics:** Full daily cycle automated
**Next:** System consolidation

---

## Philosophy

> "No stone unturned. Every module perfection-bound. Built with pure intent—LFG!"

- Start from the atomic bottleneck
- Perfect it before moving on
- Document everything
- Automate the repetitive
- Test relentlessly
- Ship only what's ready
