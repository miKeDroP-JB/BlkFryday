/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   AGENTS INDEX - The Eight Approved Business Agents                       ║
 * ║   "The Pantheon stands ready"                                             ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

// Import the eight approved agents from /agents/
const safeRequire = (p, fallback = null) => {
    try { return require(p); } catch(e) { return fallback; }
};

const agents = {
    // Sentinel - Security & Bug Bounty Scanning (passive only)
    sentinel: safeRequire('../../../agents/sentinel'),

    // Apollo - Freelance Gig Automation
    apollo: safeRequire('../../../agents/apollo'),

    // Mercury - Outreach & Cold Pitching
    mercury: safeRequire('../../../agents/mercury'),

    // Athena - Content Generation & Strategy
    athena: safeRequire('../../../agents/athena'),

    // Ares - Bug Bounty Report Submission
    ares: safeRequire('../../../agents/ares'),

    // Hermes - Client Communication & Negotiation
    hermes: safeRequire('../../../agents/hermes'),

    // Hephaestus - Build Automation & Tool Creation
    hephaestus: safeRequire('../../../agents/hephaestus'),

    // Artemis - Compliance Validation & Verification
    artemis: safeRequire('../../../agents/artemis')
};

// Agent metadata for routing
const AGENT_CAPABILITIES = {
    sentinel: {
        name: 'Sentinel',
        domain: 'Security',
        tasks: ['bug_scan', 'scan_site', 'security_audit', 'vulnerability_check'],
        description: 'Passive security scanning and reconnaissance'
    },
    apollo: {
        name: 'Apollo',
        domain: 'Freelance',
        tasks: ['gig_apply', 'gig_research', 'find_gigs', 'proposal_write'],
        description: 'Freelance platform automation'
    },
    mercury: {
        name: 'Mercury',
        domain: 'Outreach',
        tasks: ['outreach', 'send_pitch', 'cold_email', 'daily_outreach'],
        description: 'Client acquisition and pitching'
    },
    athena: {
        name: 'Athena',
        domain: 'Content',
        tasks: ['content_create', 'write_article', 'generate_content', 'social_content', 'generate'],
        description: 'Content creation and strategy'
    },
    ares: {
        name: 'Ares',
        domain: 'Submission',
        tasks: ['submit_bug', 'bug_report', 'compile_report'],
        description: 'Bug bounty report formatting and submission'
    },
    hermes: {
        name: 'Hermes',
        domain: 'Communication',
        tasks: ['client_message', 'send_update', 'negotiate', 'follow_up'],
        description: 'Client communication and relationship management'
    },
    hephaestus: {
        name: 'Hephaestus',
        domain: 'Building',
        tasks: ['build', 'deploy', 'automate', 'create_tool'],
        description: 'Build automation and tool creation'
    },
    artemis: {
        name: 'Artemis',
        domain: 'Compliance',
        tasks: ['validate', 'compliance_check', 'verify_submission'],
        description: 'Compliance validation and quality assurance'
    }
};

/**
 * Resolve which agent handles a task type
 */
function resolveAgent(taskType) {
    for (const [agentId, meta] of Object.entries(AGENT_CAPABILITIES)) {
        if (meta.tasks.includes(taskType)) {
            return agentId;
        }
    }
    return null;
}

/**
 * Get agent instance by name
 */
function getAgent(name) {
    return agents[name] || null;
}

/**
 * List all available agents
 */
function listAgents() {
    return Object.entries(AGENT_CAPABILITIES).map(([id, meta]) => ({
        id,
        ...meta,
        available: !!agents[id]
    }));
}

module.exports = {
    agents,
    AGENT_CAPABILITIES,
    resolveAgent,
    getAgent,
    listAgents
};
