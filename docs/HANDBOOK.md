# 0RB System Developer Handbook

Welcome to the 0RB System. This handbook covers everything you need to understand, build, and advance this codebase.

---

## Quick Start

```bash
# Clone and setup
git clone <repo>
cd BlkFryday
npm run quick-setup

# Start interactive REPL
npm start

# Run tests
npm test

# Run benchmarks
npm run benchmark
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           0RB CORE SYSTEM                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │   AI ENGINE  │  │    AGENTS    │  │   FACTORY    │  │  SECURITY  │  │
│  │              │  │              │  │              │  │            │  │
│  │ - Providers  │  │ - Archetypes │  │ - Blueprints │  │ - HYDRA    │  │
│  │ - Tools      │  │ - ATLAS      │  │ - Workflows  │  │ - Sentinel │  │
│  │ - Memory     │  │ - IRIS       │  │ - Builder    │  │ - Patterns │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘  │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │   OUTREACH   │  │    CRYPTO    │  │    UTILS     │                  │
│  │              │  │              │  │              │                  │
│  │ - Campaigns  │  │ - Web3       │  │ - parseJSON  │                  │
│  │ - Prospects  │  │ - Contracts  │  │ - generateId │                  │
│  │ - Email      │  │ - Wallets    │  │ - validation │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
BlkFryday/
├── core/                    # Main system code
│   ├── ai/                  # AI engine and providers
│   │   ├── engine.js        # Main AI engine
│   │   └── providers.js     # OpenAI, Anthropic, Ollama, Groq
│   ├── agents/              # Agent system
│   │   ├── archetypes.js    # The 7 agent archetypes (source of truth)
│   │   ├── executor.js      # Agent execution engine
│   │   ├── atlas.js         # ATLAS - Chief of Staff
│   │   └── iris.js          # IRIS - Intel Scout
│   ├── crypto/              # Web3/blockchain
│   │   └── web3-engine.js   # Multi-chain support
│   ├── factory/             # Company builder
│   │   └── company-builder.js
│   ├── outreach/            # Sales automation
│   │   ├── engine.js        # Campaign management
│   │   └── providers/       # Email providers
│   ├── security/            # HYDRA protocol
│   │   └── hydra-sentinel.js
│   ├── utils/               # Shared utilities
│   │   └── index.js
│   └── index.js             # Main exports
├── contracts/               # Solidity smart contracts
├── scripts/                 # CLI tools
│   ├── start.js             # Interactive REPL
│   ├── automate.js          # Daily automation
│   ├── benchmark.js         # Performance tests
│   └── quick-setup.sh       # Setup script
├── tests/                   # Test suites
│   └── e2e/                 # End-to-end tests
├── docs/                    # Documentation
│   ├── flowsync.md          # Development protocol
│   ├── BENCHMARK.md         # Competitive analysis
│   └── HANDBOOK.md          # This file
└── system/                  # Legacy/application code
```

---

## The 7 Agent Archetypes

| Agent | Domain | Use For |
|-------|--------|---------|
| **APOLLO** | Vision & Strategy | Roadmaps, business models, positioning |
| **ATHENA** | Wisdom & Analysis | Research, due diligence, data analysis |
| **HERMES** | Communication | Copy, emails, sales scripts |
| **ARES** | Execution | Deployment, automation, launches |
| **HEPHAESTUS** | Building | Code, products, systems |
| **ARTEMIS** | Targeting | Leads, opportunities, competitors |
| **MERCURY** | Speed & Commerce | Trading, real-time analysis |

---

## Development Workflow

### 1. Follow Flowsync Protocol

See `docs/flowsync.md` for the iterative development cycle:
- LEARN → BUILD → TEST → REFINE → REPEAT → REPLICATE

### 2. Run Tests Before Committing

```bash
npm test                    # Must pass
npm run benchmark           # Check performance
```

### 3. Use Conventional Commits

```
feat: Add new feature
fix: Fix a bug
refactor: Code cleanup
docs: Documentation only
chore: Maintenance
test: Add tests
```

### 4. PR Requirements

- All tests passing
- No performance regression
- Update flowsync.md if completing a cycle
- Clear description of changes

---

## Key APIs

### Create ORB Instance

```javascript
const { createORB } = require('./core');

const orb = await createORB({
  ai: { defaultProvider: 'anthropic' },
  security: { enabled: true }
});

// Use the system
await orb.think('Strategic question');
await orb.deploy('agent swarm for research');
await orb.build('New feature description');

// Cleanup
await orb.shutdown();
```

### Use Outreach Engine

```javascript
const { OutreachEngine, createEmailProvider } = require('./core');

const engine = new OutreachEngine({ aiEngine: orb.ai });
engine.setEmailProvider(createEmailProvider('sendgrid'));

// Create campaign
const campaign = engine.createCampaign({
  name: 'Product Launch',
  type: 'cold_outreach'
});

// Add prospects
engine.importProspects([
  { firstName: 'John', email: 'john@example.com', company: 'Acme' }
]);
```

### Use Personal Agents

```javascript
const { AtlasAgent, IrisAgent } = require('./core');

// ATLAS - Your Chief of Staff
const atlas = new AtlasAgent(orb.ai);
const brief = await atlas.generateDailyBrief();
await atlas.triageEmails(emails);

// IRIS - Intel Scout
const iris = new IrisAgent(orb.ai);
const opportunities = await iris.scoreOpportunities();
await iris.analyzeCompetitor('competitor.com');
```

---

## Environment Variables

```bash
# AI Providers (at least one required)
ANTHROPIC_API_KEY=your-key
OPENAI_API_KEY=your-key

# Email (optional)
SENDGRID_API_KEY=your-key
RESEND_API_KEY=your-key

# Outreach
SENDER_NAME=Your Name
SENDER_EMAIL=you@example.com

# Defaults
ORB_DEFAULT_PROVIDER=anthropic
ORB_DEFAULT_NETWORK=base
```

---

## npm Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Interactive REPL |
| `npm test` | Run test suite |
| `npm run benchmark` | Performance tests |
| `npm run automate` | Full daily cycle |
| `npm run schedule` | Start scheduler daemon |
| `npm run quick-setup` | Initial setup |

---

## Contributing

1. Read `docs/flowsync.md` for the development protocol
2. Pick a bottleneck from the backlog
3. Create a branch: `feat/your-feature`
4. Follow the flowsync cycle
5. Submit PR with tests

---

## Philosophy

> "Every system is perfectible if broken down into its smallest possible node."

- We reverse engineer obstacles by finding the atomic bottleneck
- Simplicity is strength
- If it doesn't exist, we build it
- No compromise on quality
- Ship only what's ready

---

## Support

- Issues: GitHub Issues
- Docs: This handbook + flowsync.md
- Tests: `npm test` for examples

**LFG!**
