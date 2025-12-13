#!/usr/bin/env node
/**
 * 0r8.term - Entry Point
 * "The terminal that thinks before you do"
 *
 * Usage:
 *   node term.js              - Start as mass user
 *   node term.js --trusted    - Start as trusted creator
 *   node term.js --help       - Show help
 *
 * Or via npm:
 *   npm start                 - Start terminal
 *   npm run term:trusted      - Start as trusted creator
 */

import { startTerminal } from './index.js';

// Parse command line arguments
const args = process.argv.slice(2);

const showHelp = () => {
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                          0r8.term HELP                                    ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  Usage:                                                                   ║
║    node term.js [options]                                                 ║
║                                                                           ║
║  Options:                                                                 ║
║    --trusted      Start as trusted creator (2x XP, all features)         ║
║    --user <id>    Set user ID                                             ║
║    --layout <n>   Set UI layout (default, immersive, minimal)            ║
║    --help         Show this help message                                 ║
║    --version      Show version                                            ║
║                                                                           ║
║  Examples:                                                                ║
║    node term.js                    Start as mass user                     ║
║    node term.js --trusted          Start as trusted creator               ║
║    node term.js --trusted --user scientist1                              ║
║                                                                           ║
║  npm scripts:                                                             ║
║    npm start                       Start terminal                         ║
║    npm run term:trusted            Start as trusted creator               ║
╚═══════════════════════════════════════════════════════════════════════════╝
`);
    process.exit(0);
};

const showVersion = () => {
    console.log('0r8.term v1.0.0');
    console.log('Built with 🔮 by The Architect');
    process.exit(0);
};

// Parse arguments
if (args.includes('--help') || args.includes('-h')) {
    showHelp();
}

if (args.includes('--version') || args.includes('-v')) {
    showVersion();
}

// Build user context from arguments
const userContext = {
    trusted: args.includes('--trusted') || args.includes('-t'),
    userId: 'terminal_user',
    preferences: {
        layout: 'default'
    }
};

// Parse --user argument
const userIndex = args.indexOf('--user');
if (userIndex !== -1 && args[userIndex + 1]) {
    userContext.userId = args[userIndex + 1];
}

// Parse --layout argument
const layoutIndex = args.indexOf('--layout');
if (layoutIndex !== -1 && args[layoutIndex + 1]) {
    userContext.preferences.layout = args[layoutIndex + 1];
}

// Start the terminal
console.log('Starting 0r8.term...\n');

startTerminal(userContext).catch((err) => {
    console.error('Failed to start 0r8.term:', err.message);
    process.exit(1);
});
