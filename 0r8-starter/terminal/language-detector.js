/**
 * 0r8.term Language Detector
 * "The terminal that thinks before you do"
 *
 * Detects programming languages and code patterns from user input
 */

// Language detection patterns
const LANGUAGE_PATTERNS = {
    javascript: {
        name: 'JavaScript',
        emoji: '🟨',
        extensions: ['.js', '.mjs', '.cjs'],
        patterns: [
            /\bconst\s+\w+\s*=/,
            /\blet\s+\w+\s*=/,
            /\bvar\s+\w+\s*=/,
            /\bfunction\s+\w+\s*\(/,
            /=>\s*{/,
            /console\.(log|error|warn)/,
            /require\s*\(/,
            /import\s+.*\s+from/,
            /export\s+(default|const|function|class)/,
            /async\s+function/,
            /await\s+/,
            /new\s+Promise/
        ],
        keywords: ['const', 'let', 'var', 'function', 'async', 'await', 'import', 'export', 'require']
    },
    python: {
        name: 'Python',
        emoji: '🐍',
        extensions: ['.py'],
        patterns: [
            /^def\s+\w+\s*\(/m,
            /^class\s+\w+.*:/m,
            /^import\s+\w+/m,
            /^from\s+\w+\s+import/m,
            /print\s*\(/,
            /if\s+__name__\s*==\s*['"]__main__['"]/,
            /:\s*$/m,
            /^\s+pass\s*$/m,
            /lambda\s+\w+:/,
            /\bself\./
        ],
        keywords: ['def', 'class', 'import', 'from', 'print', 'lambda', 'self', 'None', 'True', 'False']
    },
    typescript: {
        name: 'TypeScript',
        emoji: '🔷',
        extensions: ['.ts', '.tsx'],
        patterns: [
            /:\s*(string|number|boolean|any|void|never)\b/,
            /interface\s+\w+/,
            /type\s+\w+\s*=/,
            /<\w+>/,
            /as\s+(string|number|boolean|any)/,
            /:\s*\w+\[\]/,
            /private\s+\w+:/,
            /public\s+\w+:/,
            /readonly\s+\w+:/
        ],
        keywords: ['interface', 'type', 'as', 'private', 'public', 'readonly', 'extends', 'implements']
    },
    rust: {
        name: 'Rust',
        emoji: '🦀',
        extensions: ['.rs'],
        patterns: [
            /fn\s+\w+\s*\(/,
            /let\s+mut\s+\w+/,
            /impl\s+\w+/,
            /struct\s+\w+/,
            /enum\s+\w+/,
            /pub\s+(fn|struct|enum)/,
            /use\s+\w+::/,
            /println!\s*\(/,
            /->.*{/,
            /&mut\s+/
        ],
        keywords: ['fn', 'let', 'mut', 'impl', 'struct', 'enum', 'pub', 'use', 'match', 'mod']
    },
    go: {
        name: 'Go',
        emoji: '🐹',
        extensions: ['.go'],
        patterns: [
            /^package\s+\w+/m,
            /func\s+\w+\s*\(/,
            /func\s+\(\w+\s+\*?\w+\)\s+\w+/,
            /import\s+\(/,
            /fmt\.(Print|Sprintf|Errorf)/,
            /:=\s*/,
            /interface\s*{/,
            /go\s+\w+\(/,
            /chan\s+\w+/
        ],
        keywords: ['package', 'func', 'import', 'go', 'chan', 'defer', 'select', 'range']
    },
    bash: {
        name: 'Bash',
        emoji: '🐚',
        extensions: ['.sh', '.bash'],
        patterns: [
            /^#!/,
            /\$\{?\w+\}?/,
            /\becho\s+/,
            /\bif\s+\[\s*/,
            /\bfor\s+\w+\s+in\b/,
            /\bwhile\s+/,
            /\|\s*\w+/,
            /\bgrep\s+/,
            /\bawk\s+/,
            /\bsed\s+/
        ],
        keywords: ['echo', 'if', 'then', 'else', 'fi', 'for', 'while', 'do', 'done', 'case', 'esac']
    },
    sql: {
        name: 'SQL',
        emoji: '🗄️',
        extensions: ['.sql'],
        patterns: [
            /\bSELECT\s+.*\s+FROM\b/i,
            /\bINSERT\s+INTO\b/i,
            /\bUPDATE\s+\w+\s+SET\b/i,
            /\bDELETE\s+FROM\b/i,
            /\bCREATE\s+TABLE\b/i,
            /\bWHERE\s+/i,
            /\bJOIN\s+\w+\s+ON\b/i,
            /\bGROUP\s+BY\b/i,
            /\bORDER\s+BY\b/i
        ],
        keywords: ['SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'TABLE', 'JOIN']
    },
    html: {
        name: 'HTML',
        emoji: '🌐',
        extensions: ['.html', '.htm'],
        patterns: [
            /<html/i,
            /<head/i,
            /<body/i,
            /<div/i,
            /<span/i,
            /<script/i,
            /<style/i,
            /<!DOCTYPE/i,
            /<\/\w+>/
        ],
        keywords: ['html', 'head', 'body', 'div', 'span', 'script', 'style']
    },
    css: {
        name: 'CSS',
        emoji: '🎨',
        extensions: ['.css', '.scss', '.sass'],
        patterns: [
            /\.\w+\s*{/,
            /#\w+\s*{/,
            /@media\s*\(/,
            /@import\s+/,
            /:\s*(flex|grid|block|inline)/,
            /background(-color)?:/,
            /margin:|padding:/,
            /font-(size|family|weight):/
        ],
        keywords: ['display', 'margin', 'padding', 'background', 'color', 'font', 'border']
    },
    json: {
        name: 'JSON',
        emoji: '📋',
        extensions: ['.json'],
        patterns: [
            /^\s*{/,
            /"\w+":\s*["{[\d]/,
            /^\s*\[/
        ],
        keywords: []
    },
    markdown: {
        name: 'Markdown',
        emoji: '📝',
        extensions: ['.md', '.markdown'],
        patterns: [
            /^#{1,6}\s+/m,
            /\*\*.*\*\*/,
            /\[.*\]\(.*\)/,
            /```[\w]*/,
            /^\s*[-*]\s+/m,
            /^\s*\d+\.\s+/m
        ],
        keywords: []
    }
};

// Intent patterns for non-code input
const INTENT_PATTERNS = {
    research: {
        patterns: [/research/i, /discover/i, /hypothesis/i, /experiment/i, /analyze/i, /study/i],
        requires: 'ResearchNode'
    },
    mentor: {
        patterns: [/teach/i, /explain/i, /help me understand/i, /mentor/i, /guide/i, /learn/i],
        requires: 'MentorNode'
    },
    sigil: {
        patterns: [/sigil/i, /pattern/i, /encrypt/i, /cipher/i, /rune/i, /whisper/i, /mystery/i],
        requires: 'Sigil'
    },
    execute: {
        patterns: [/run/i, /execute/i, /compile/i, /build/i, /test/i, /deploy/i],
        requires: 'CommandExecutor'
    },
    fix: {
        patterns: [/fix/i, /error/i, /bug/i, /debug/i, /repair/i, /solve/i],
        requires: 'ErrorHandler'
    },
    install: {
        patterns: [/install/i, /npm/i, /pip/i, /cargo/i, /brew/i, /apt/i],
        requires: 'ToolchainManager'
    }
};

/**
 * Detect the programming language of input
 */
export function detectLanguage(input) {
    const scores = {};

    for (const [lang, config] of Object.entries(LANGUAGE_PATTERNS)) {
        let score = 0;

        // Check patterns
        for (const pattern of config.patterns) {
            if (pattern.test(input)) {
                score += 2;
            }
        }

        // Check keywords
        for (const keyword of config.keywords) {
            const regex = new RegExp(`\\b${keyword}\\b`, 'g');
            const matches = input.match(regex);
            if (matches) {
                score += matches.length;
            }
        }

        if (score > 0) {
            scores[lang] = { score, ...config };
        }
    }

    // Find the highest scoring language
    const sorted = Object.entries(scores).sort((a, b) => b[1].score - a[1].score);

    if (sorted.length === 0) {
        return {
            detected: false,
            language: null,
            confidence: 0,
            isCode: false,
            allScores: {}
        };
    }

    const [topLang, topData] = sorted[0];
    const maxPossibleScore = (topData.patterns?.length || 0) * 2 + (topData.keywords?.length || 0);
    const confidence = Math.min(100, Math.round((topData.score / Math.max(maxPossibleScore, 1)) * 100));

    return {
        detected: true,
        language: topLang,
        name: topData.name,
        emoji: topData.emoji,
        confidence,
        score: topData.score,
        isCode: true,
        allScores: scores
    };
}

/**
 * Detect intent from natural language input
 */
export function detectIntent(input) {
    const detectedIntents = [];

    for (const [intent, config] of Object.entries(INTENT_PATTERNS)) {
        for (const pattern of config.patterns) {
            if (pattern.test(input)) {
                detectedIntents.push({
                    intent,
                    requires: config.requires,
                    matchedPattern: pattern.source
                });
                break;
            }
        }
    }

    return {
        intents: detectedIntents,
        primaryIntent: detectedIntents[0] || null,
        hasIntent: detectedIntents.length > 0
    };
}

/**
 * Full analysis of user input
 */
export function analyzeInput(input) {
    const language = detectLanguage(input);
    const intent = detectIntent(input);

    // Determine input type
    let inputType = 'text';
    if (language.isCode && language.confidence > 30) {
        inputType = 'code';
    } else if (intent.hasIntent) {
        inputType = 'command';
    }

    // Extract code blocks if present
    const codeBlocks = [];
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    let match;
    while ((match = codeBlockRegex.exec(input)) !== null) {
        codeBlocks.push({
            language: match[1] || language.language,
            code: match[2].trim()
        });
    }

    return {
        input,
        inputType,
        language,
        intent,
        codeBlocks,
        hasCodeBlocks: codeBlocks.length > 0,
        timestamp: Date.now()
    };
}

/**
 * Language detector module for 0r8.term
 */
export const languageDetector = {
    name: 'LanguageDetector',

    detect(input) {
        return analyzeInput(input);
    },

    getSupportedLanguages() {
        return Object.entries(LANGUAGE_PATTERNS).map(([key, config]) => ({
            key,
            name: config.name,
            emoji: config.emoji,
            extensions: config.extensions
        }));
    },

    isCode(input) {
        const analysis = detectLanguage(input);
        return analysis.isCode && analysis.confidence > 30;
    }
};

export default languageDetector;
