/**
 * ORB TERMINAL - INDEX
 * ====================
 * AI-Powered Terminal with full ORBOS integration
 */

const { OrbTerminal, SPIRIT_PROMPTS, TERMINAL_CONFIG } = require('./orb-terminal');
const { TerminalAIAssistant, NLCommandParser } = require('./ai-integration');

// Re-export everything
module.exports = {
    OrbTerminal,
    TerminalAIAssistant,
    NLCommandParser,
    SPIRIT_PROMPTS,
    TERMINAL_CONFIG,

    // Quick boot function
    boot: (options = {}) => {
        const terminal = new OrbTerminal(options);
        terminal.boot();
        return terminal;
    }
};
