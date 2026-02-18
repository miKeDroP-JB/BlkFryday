/**
 * 0r8.term - The AI-Native Terminal
 * "The terminal that thinks before you do"
 *
 * Built with 🔮 by The Architect
 *
 * Features:
 * - Code writes itself
 * - Errors fix themselves
 * - Tools install themselves
 * - You just think and build
 */

import readline from 'readline';
import { handleUserInput } from '../index.js';
import { languageDetector, analyzeInput } from './language-detector.js';
import { aiEngine } from './ai-engine.js';
import { errorHandler } from './error-handler.js';
import { commandExecutor } from './command-executor.js';
import { toolchainManager } from './toolchain-manager.js';

// Terminal version
const VERSION = '1.0.0';

// ANSI color codes
const COLORS = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    magenta: '\x1b[35m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    white: '\x1b[37m'
};

// Terminal commands
const COMMANDS = {
    help: {
        description: 'Show help message',
        handler: showHelp
    },
    clear: {
        description: 'Clear the terminal',
        handler: () => { console.clear(); return null; }
    },
    exit: {
        description: 'Exit 0r8.term',
        handler: () => process.exit(0)
    },
    quit: {
        description: 'Exit 0r8.term',
        handler: () => process.exit(0)
    },
    status: {
        description: 'Show current status',
        handler: showStatus
    },
    run: {
        description: 'Execute code: run <code>',
        handler: runCode
    },
    fix: {
        description: 'Auto-fix last error',
        handler: autoFix
    },
    install: {
        description: 'Install package: install <package>',
        handler: installPackage
    },
    setup: {
        description: 'Setup dev environment: setup <language>',
        handler: setupEnvironment
    },
    research: {
        description: 'Research mode (trusted only)',
        handler: researchMode
    },
    mentor: {
        description: 'Mentor mode (trusted only)',
        handler: mentorMode
    },
    sigil: {
        description: 'Apply Sigil pattern',
        handler: sigilMode
    },
    twin: {
        description: 'Show Twin Avatar status',
        handler: showTwin
    },
    spirit: {
        description: 'Show Spirit Animal status',
        handler: showSpirit
    },
    languages: {
        description: 'Show supported languages',
        handler: showLanguages
    }
};

// Session state
let sessionState = {
    userContext: {},
    lastInput: null,
    lastOutput: null,
    lastError: null,
    multilineBuffer: null,
    history: [],
    startTime: Date.now()
};

/**
 * Show welcome banner
 */
function showBanner(trusted = false) {
    const trustBadge = trusted ? `${COLORS.green}[TRUSTED CREATOR]${COLORS.reset}` : `${COLORS.dim}[MASS USER]${COLORS.reset}`;

    console.log(`
${COLORS.magenta}╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║   ${COLORS.bright}${COLORS.cyan}██████╗ ██████╗  █████╗    ████████╗███████╗██████╗ ███╗   ███╗${COLORS.magenta}        ║
║   ${COLORS.cyan}██╔═══██╗██╔══██╗██╔══██╗   ╚══██╔══╝██╔════╝██╔══██╗████╗ ████║${COLORS.magenta}        ║
║   ${COLORS.cyan}██║   ██║██████╔╝╚█████╔╝      ██║   █████╗  ██████╔╝██╔████╔██║${COLORS.magenta}        ║
║   ${COLORS.cyan}██║   ██║██╔══██╗██╔══██╗      ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║${COLORS.magenta}        ║
║   ${COLORS.cyan}╚██████╔╝██║  ██║╚█████╔╝      ██║   ███████╗██║  ██║██║ ╚═╝ ██║${COLORS.magenta}        ║
║   ${COLORS.cyan} ╚═════╝ ╚═╝  ╚═╝ ╚════╝       ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝${COLORS.magenta}        ║
║                                                                           ║
║   ${COLORS.yellow}"The terminal that thinks before you do"${COLORS.magenta}                            ║
║                                                                           ║
║   ${COLORS.white}Version ${VERSION}${COLORS.magenta}                              ${trustBadge}${COLORS.magenta}         ║
╠═══════════════════════════════════════════════════════════════════════════╣
║   ${COLORS.green}• Code writes itself${COLORS.magenta}     ${COLORS.cyan}• Errors fix themselves${COLORS.magenta}                  ║
║   ${COLORS.green}• Tools install themselves${COLORS.magenta}   ${COLORS.cyan}• You just think and build${COLORS.magenta}            ║
╠═══════════════════════════════════════════════════════════════════════════╣
║   ${COLORS.dim}Type 'help' for commands • Connected to ORB Engine${COLORS.magenta}                   ║
╚═══════════════════════════════════════════════════════════════════════════╝${COLORS.reset}
`);
}

/**
 * Show help message
 */
function showHelp() {
    console.log(`
${COLORS.cyan}╔═══════════════════════════════════════════════════════════════╗
║                     0r8.term COMMANDS                         ║
╠═══════════════════════════════════════════════════════════════╣${COLORS.reset}`);

    for (const [cmd, info] of Object.entries(COMMANDS)) {
        console.log(`${COLORS.cyan}║${COLORS.reset}  ${COLORS.green}${cmd.padEnd(12)}${COLORS.reset} ${info.description.padEnd(46)}${COLORS.cyan}║${COLORS.reset}`);
    }

    console.log(`${COLORS.cyan}╠═══════════════════════════════════════════════════════════════╣
║  ${COLORS.yellow}MULTILINE INPUT:${COLORS.reset} Start with \`\`\` and end with \`\`\`          ${COLORS.cyan}║
║  ${COLORS.yellow}QUICK RUN:${COLORS.reset} Just paste code - auto-detected and executed   ${COLORS.cyan}║
╚═══════════════════════════════════════════════════════════════╝${COLORS.reset}`);

    return null;
}

/**
 * Show current status
 */
async function showStatus(args, ctx) {
    const pm = await toolchainManager.detectPackageManagers();

    console.log(`
${COLORS.cyan}╔═══════════════════════════════════════════════════════════════╗
║                     SESSION STATUS                            ║
╠═══════════════════════════════════════════════════════════════╣${COLORS.reset}
${COLORS.cyan}║${COLORS.reset}  User Type:    ${ctx.trusted ? `${COLORS.green}TRUSTED CREATOR` : `${COLORS.dim}Mass User`}${COLORS.reset}                            ${COLORS.cyan}║${COLORS.reset}
${COLORS.cyan}║${COLORS.reset}  Session:      ${Math.floor((Date.now() - sessionState.startTime) / 1000)}s                                       ${COLORS.cyan}║${COLORS.reset}
${COLORS.cyan}║${COLORS.reset}  Commands Run: ${sessionState.history.length}                                         ${COLORS.cyan}║${COLORS.reset}
${COLORS.cyan}╠═══════════════════════════════════════════════════════════════╣${COLORS.reset}`);

    if (ctx.twin) {
        console.log(`${COLORS.cyan}║${COLORS.reset}  ${COLORS.yellow}TWIN:${COLORS.reset} Level ${ctx.twin.level} | XP: ${ctx.twin.XP}/${ctx.twin.level * 50}                          ${COLORS.cyan}║${COLORS.reset}`);
    }

    if (ctx.spiritAnimal) {
        console.log(`${COLORS.cyan}║${COLORS.reset}  ${COLORS.magenta}SPIRIT:${COLORS.reset} ${ctx.spiritAnimal.animal} Level ${ctx.spiritAnimal.level} | Bond: ${ctx.spiritAnimal.bond}     ${COLORS.cyan}║${COLORS.reset}`);
    }

    if (ctx.sigil) {
        console.log(`${COLORS.cyan}║${COLORS.reset}  ${COLORS.blue}SIGIL:${COLORS.reset} Level ${ctx.sigil.level} | Patterns: ${ctx.sigil.patternsUnlocked?.length || 0}               ${COLORS.cyan}║${COLORS.reset}`);
    }

    console.log(`${COLORS.cyan}╠═══════════════════════════════════════════════════════════════╣${COLORS.reset}
${COLORS.cyan}║${COLORS.reset}  Package Managers:                                            ${COLORS.cyan}║${COLORS.reset}`);

    for (const p of pm.slice(0, 4)) {
        console.log(`${COLORS.cyan}║${COLORS.reset}    ${COLORS.green}✓${COLORS.reset} ${p.name.padEnd(10)} (${p.ecosystem})                            ${COLORS.cyan}║${COLORS.reset}`);
    }

    console.log(`${COLORS.cyan}╚═══════════════════════════════════════════════════════════════╝${COLORS.reset}`);

    return null;
}

/**
 * Run code command
 */
async function runCode(args, ctx) {
    if (!args) {
        return { error: 'Usage: run <code>' };
    }

    const analysis = analyzeInput(args);
    const lang = analysis.language.language || 'javascript';

    console.log(`${COLORS.dim}Executing ${analysis.language.name || 'code'}...${COLORS.reset}`);

    const result = await commandExecutor.execute(args, lang);
    console.log(commandExecutor.formatResult(result));

    if (!result.success && result.error) {
        sessionState.lastError = result.error;
        console.log(`${COLORS.yellow}💡 Tip: Type 'fix' to auto-repair${COLORS.reset}`);
    }

    return result;
}

/**
 * Auto-fix last error
 */
async function autoFix(args, ctx) {
    if (!sessionState.lastError) {
        console.log(`${COLORS.dim}No recent error to fix${COLORS.reset}`);
        return null;
    }

    console.log(`${COLORS.yellow}🔧 Analyzing error...${COLORS.reset}`);

    const analysis = errorHandler.analyze(sessionState.lastError, ctx);
    console.log(errorHandler.formatReport(analysis));

    if (sessionState.lastInput) {
        const fix = await errorHandler.autoFix(sessionState.lastInput, sessionState.lastError, ctx);
        if (fix.success) {
            console.log(`${COLORS.green}✓ Auto-fix applied: ${fix.fixApplied}${COLORS.reset}`);
            console.log(`${COLORS.dim}Fixed code:${COLORS.reset}\n${fix.fixed}`);
        }
    }

    return analysis;
}

/**
 * Install package
 */
async function installPackage(args, ctx) {
    if (!args) {
        return { error: 'Usage: install <package>' };
    }

    console.log(`${COLORS.cyan}📦 Installing ${args}...${COLORS.reset}`);
    const result = await toolchainManager.install(args, ctx);
    console.log(toolchainManager.formatResult(result));
    return result;
}

/**
 * Setup environment
 */
async function setupEnvironment(args, ctx) {
    if (!args) {
        console.log(`${COLORS.yellow}Supported languages: javascript, python, rust, go${COLORS.reset}`);
        return null;
    }

    console.log(`${COLORS.cyan}⚙️ Setting up ${args} environment...${COLORS.reset}`);
    const result = await toolchainManager.autoSetup(args, { ...ctx, dryRun: true });

    if (result.recommendations) {
        console.log(`\n${COLORS.green}Recommended tools for ${args}:${COLORS.reset}`);
        console.log(`  Essential: ${result.recommendations.essential.join(', ')}`);
        console.log(`  Testing: ${result.recommendations.testing.join(', ')}`);
        console.log(`  Frameworks: ${result.recommendations.frameworks.join(', ')}`);
    }

    return result;
}

/**
 * Research mode (trusted only)
 */
async function researchMode(args, ctx) {
    if (!ctx.trusted) {
        console.log(`${COLORS.red}🔒 Research Node requires TRUSTED CREATOR status${COLORS.reset}`);
        return null;
    }

    console.log(`${COLORS.magenta}🔬 RESEARCH MODE ACTIVATED${COLORS.reset}`);
    console.log(`${COLORS.dim}Enter your research query or hypothesis...${COLORS.reset}`);
    return { mode: 'research' };
}

/**
 * Mentor mode (trusted only)
 */
async function mentorMode(args, ctx) {
    if (!ctx.trusted) {
        console.log(`${COLORS.red}🔒 Mentor Node requires TRUSTED CREATOR status${COLORS.reset}`);
        return null;
    }

    console.log(`${COLORS.blue}📚 MENTOR MODE ACTIVATED${COLORS.reset}`);
    console.log(`${COLORS.dim}Ask any question or request guidance...${COLORS.reset}`);
    return { mode: 'mentor' };
}

/**
 * Sigil mode
 */
async function sigilMode(args, ctx) {
    console.log(`${COLORS.magenta}✨ SIGIL MODE${COLORS.reset}`);

    if (ctx.sigil) {
        console.log(`Patterns unlocked: ${ctx.sigil.patternsUnlocked?.join(', ') || 'reverse, mirror'}`);
    }

    console.log(`${COLORS.dim}Enter text to apply mystical patterns...${COLORS.reset}`);
    return { mode: 'sigil' };
}

/**
 * Show Twin Avatar
 */
function showTwin(args, ctx) {
    if (!ctx.twin) {
        console.log(`${COLORS.dim}Twin Avatar not yet awakened. Interact to begin...${COLORS.reset}`);
        return null;
    }

    const t = ctx.twin;
    const xpBar = '█'.repeat(Math.floor(t.XP / (t.level * 50) * 10)).padEnd(10, '░');

    console.log(`
${COLORS.yellow}╔═══════════════════════════════════════════════════════════════╗
║                     TWIN AVATAR                               ║
╠═══════════════════════════════════════════════════════════════╣
║  Name:       ${t.name.padEnd(47)}║
║  Level:      ${String(t.level).padEnd(47)}║
║  XP:         [${xpBar}] ${t.XP}/${t.level * 50}                      ║
║  Abilities:  ${(t.abilities || []).join(', ').substring(0, 47).padEnd(47)}║
╚═══════════════════════════════════════════════════════════════╝${COLORS.reset}`);

    return ctx.twin;
}

/**
 * Show Spirit Animal
 */
function showSpirit(args, ctx) {
    if (!ctx.spiritAnimal) {
        console.log(`${COLORS.dim}Spirit Animal not yet bonded. Interact to begin...${COLORS.reset}`);
        return null;
    }

    const s = ctx.spiritAnimal;
    const bondBar = '█'.repeat(Math.floor(s.bond / (s.level * 20) * 10)).padEnd(10, '░');

    console.log(`
${COLORS.magenta}╔═══════════════════════════════════════════════════════════════╗
║                     SPIRIT ANIMAL                             ║
╠═══════════════════════════════════════════════════════════════╣
║  Animal:     ${s.animal.padEnd(47)}║
║  Level:      ${String(s.level).padEnd(47)}║
║  Bond:       [${bondBar}] ${s.bond}/${s.level * 20}                    ║
║  State:      ${(s.state || 'Dormant').padEnd(47)}║
╚═══════════════════════════════════════════════════════════════╝${COLORS.reset}`);

    return ctx.spiritAnimal;
}

/**
 * Show supported languages
 */
function showLanguages() {
    const langs = languageDetector.getSupportedLanguages();

    console.log(`
${COLORS.cyan}╔═══════════════════════════════════════════════════════════════╗
║                 SUPPORTED LANGUAGES                           ║
╠═══════════════════════════════════════════════════════════════╣${COLORS.reset}`);

    for (const lang of langs) {
        console.log(`${COLORS.cyan}║${COLORS.reset}  ${lang.emoji} ${lang.name.padEnd(15)} ${lang.extensions.join(', ').padEnd(36)}${COLORS.cyan}║${COLORS.reset}`);
    }

    console.log(`${COLORS.cyan}╚═══════════════════════════════════════════════════════════════╝${COLORS.reset}`);

    return langs;
}

/**
 * Process user input through ORB pipeline
 */
async function processInput(input, userContext) {
    // Store for potential fixes
    sessionState.lastInput = input;

    // AI thinks first
    const plan = await aiEngine.think(input, userContext);

    // Show AI reasoning (if interesting)
    if (plan.analysis.language.isCode) {
        console.log(`${COLORS.dim}${plan.analysis.language.emoji} ${plan.analysis.language.name} detected (${plan.analysis.language.confidence}% confidence)${COLORS.reset}`);
    }

    // Route through ORB engine
    const result = await handleUserInput(input, userContext);

    // Update session context with results
    if (result.twin) userContext.twin = result.twin;
    if (result.spiritAnimal) userContext.spiritAnimal = result.spiritAnimal;
    if (result.sigil) userContext.sigil = result.sigil;

    // Log for Data Moat
    sessionState.history.push({
        input: input.substring(0, 100),
        timestamp: Date.now(),
        modules: plan.decision.modules
    });

    return result;
}

/**
 * Format ORB result for terminal display
 */
function displayResult(result) {
    // Show module results
    if (result.moduleResults && result.moduleResults.length > 0) {
        console.log(`\n${COLORS.cyan}═══ MODULE OUTPUT ═══${COLORS.reset}`);
        for (const mod of result.moduleResults) {
            if (mod.name === 'Sigil') {
                console.log(`${COLORS.magenta}✨ Sigil: ${mod.transformedText || mod.output}${COLORS.reset}`);
            } else if (mod.name === 'ResearchNode') {
                console.log(`${COLORS.green}🔬 Research: ${JSON.stringify(mod.insight || mod, null, 2)}${COLORS.reset}`);
            } else {
                console.log(`📦 ${mod.name}: ${JSON.stringify(mod).substring(0, 100)}`);
            }
        }
    }

    // Show avatar updates
    if (result.twin) {
        const xpGain = result.twin.lastXpGain || 0;
        if (xpGain > 0) {
            console.log(`${COLORS.yellow}👤 Twin: +${xpGain} XP (Level ${result.twin.level})${COLORS.reset}`);
        }
    }

    if (result.spiritAnimal) {
        const bondGain = result.spiritAnimal.lastBondGain || 0;
        if (bondGain > 0) {
            console.log(`${COLORS.magenta}🦉 Spirit: +${bondGain} Bond (${result.spiritAnimal.animal})${COLORS.reset}`);
        }
    }

    // Show security status
    if (result.securityReport && result.securityReport.riskLevel > 0) {
        console.log(`${COLORS.red}⚠️ Security: Risk ${result.securityReport.riskLevel}%${COLORS.reset}`);
    }
}

/**
 * Main terminal interface
 */
export async function start0r8Term(userContext = {}) {
    // Initialize session
    sessionState.userContext = userContext;
    sessionState.startTime = Date.now();

    const trusted = userContext.trusted === true;

    // Show banner
    showBanner(trusted);

    // Create readline interface
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: `${COLORS.cyan}0r8${COLORS.reset} ${trusted ? `${COLORS.green}✦${COLORS.reset}` : '»'} `
    });

    // Handle line input
    rl.on('line', async (line) => {
        line = line.trim();

        if (!line) {
            rl.prompt();
            return;
        }

        // Handle multiline input
        if (line === '```' || line.startsWith('```')) {
            if (sessionState.multilineBuffer === null) {
                sessionState.multilineBuffer = '';
                const lang = line.replace('```', '').trim();
                if (lang) {
                    sessionState.multilineBuffer = `// Language: ${lang}\n`;
                }
                console.log(`${COLORS.dim}(multiline mode - end with \`\`\`)${COLORS.reset}`);
                rl.setPrompt(`${COLORS.dim}...${COLORS.reset} `);
                rl.prompt();
                return;
            } else {
                line = sessionState.multilineBuffer;
                sessionState.multilineBuffer = null;
                rl.setPrompt(`${COLORS.cyan}0r8${COLORS.reset} ${trusted ? `${COLORS.green}✦${COLORS.reset}` : '»'} `);
            }
        } else if (sessionState.multilineBuffer !== null) {
            sessionState.multilineBuffer += line + '\n';
            rl.prompt();
            return;
        }

        // Check for built-in commands
        const [cmd, ...args] = line.split(/\s+/);
        const cmdLower = cmd.toLowerCase();

        if (COMMANDS[cmdLower]) {
            try {
                await COMMANDS[cmdLower].handler(args.join(' '), sessionState.userContext);
            } catch (err) {
                console.log(`${COLORS.red}Error: ${err.message}${COLORS.reset}`);
            }
            rl.prompt();
            return;
        }

        // Process through ORB pipeline
        try {
            const result = await processInput(line, sessionState.userContext);
            displayResult(result);
            sessionState.lastOutput = result;
        } catch (err) {
            console.log(`${COLORS.red}Error: ${err.message}${COLORS.reset}`);
            sessionState.lastError = err.message;
        }

        rl.prompt();
    });

    // Handle close
    rl.on('close', () => {
        console.log(`\n${COLORS.magenta}👋 Exiting 0r8.term. May the ORB guide you.${COLORS.reset}`);
        process.exit(0);
    });

    // Start prompt
    rl.prompt();
}

// Export for programmatic use
export {
    COMMANDS,
    sessionState,
    processInput,
    displayResult
};

export default { start0r8Term };
