/**
 * 0r8.term - Terminal Module Index
 * "The terminal that thinks before you do"
 *
 * Exports all terminal components for programmatic access
 */

export { languageDetector, detectLanguage, detectIntent, analyzeInput } from './language-detector.js';
export { aiEngine } from './ai-engine.js';
export { errorHandler } from './error-handler.js';
export { commandExecutor } from './command-executor.js';
export { toolchainManager } from './toolchain-manager.js';
export { start0r8Term, COMMANDS, sessionState, processInput, displayResult } from './0r8-term-core.js';

// Default export
import { start0r8Term } from './0r8-term-core.js';
export default start0r8Term;
