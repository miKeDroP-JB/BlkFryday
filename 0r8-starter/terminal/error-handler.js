/**
 * 0r8.term Error Handler & Auto-Fix
 * "Errors fix themselves"
 *
 * Intelligent error detection and automatic repair system
 */

// Common error patterns and fixes
const ERROR_PATTERNS = {
    javascript: [
        {
            pattern: /SyntaxError: Unexpected token/,
            type: 'syntax',
            fixes: [
                { check: /}\s*$/, suggest: 'Missing closing bracket or semicolon' },
                { check: /\(\s*$/, suggest: 'Unclosed parenthesis' },
                { check: /'\s*$/, suggest: 'Unclosed string literal' }
            ]
        },
        {
            pattern: /ReferenceError: (\w+) is not defined/,
            type: 'reference',
            extract: 1,
            fixes: [
                { suggest: 'Variable "{match}" not declared - add const/let declaration' },
                { suggest: 'Missing import for "{match}"' }
            ]
        },
        {
            pattern: /TypeError: Cannot read propert(y|ies) .* of (undefined|null)/,
            type: 'null_access',
            fixes: [
                { suggest: 'Add null check before accessing property' },
                { suggest: 'Use optional chaining (?.)' },
                { suggest: 'Initialize variable before use' }
            ]
        },
        {
            pattern: /TypeError: (\w+) is not a function/,
            type: 'not_function',
            extract: 1,
            fixes: [
                { suggest: '"{match}" is not callable - check if it\'s a function' },
                { suggest: 'Missing parentheses in import/require' }
            ]
        },
        {
            pattern: /Cannot find module '(.+)'/,
            type: 'missing_module',
            extract: 1,
            fixes: [
                { suggest: 'Run: npm install {match}' },
                { suggest: 'Check if path "{match}" is correct' }
            ]
        }
    ],
    python: [
        {
            pattern: /IndentationError/,
            type: 'indentation',
            fixes: [
                { suggest: 'Fix indentation - use consistent spaces or tabs' },
                { suggest: 'Python requires proper indentation for blocks' }
            ]
        },
        {
            pattern: /NameError: name '(\w+)' is not defined/,
            type: 'name_error',
            extract: 1,
            fixes: [
                { suggest: 'Variable "{match}" not defined - declare before use' },
                { suggest: 'Check for typo in "{match}"' }
            ]
        },
        {
            pattern: /ImportError: No module named '(.+)'/,
            type: 'import_error',
            extract: 1,
            fixes: [
                { suggest: 'Run: pip install {match}' },
                { suggest: 'Check if module name "{match}" is correct' }
            ]
        },
        {
            pattern: /TypeError: .* takes (\d+) positional argument/,
            type: 'argument_error',
            fixes: [
                { suggest: 'Wrong number of arguments passed to function' },
                { suggest: 'Check function signature' }
            ]
        }
    ],
    rust: [
        {
            pattern: /error\[E0382\]: borrow of moved value/,
            type: 'ownership',
            fixes: [
                { suggest: 'Value was moved - use .clone() or borrow with &' },
                { suggest: 'Consider using references instead of ownership transfer' }
            ]
        },
        {
            pattern: /error\[E0308\]: mismatched types/,
            type: 'type_mismatch',
            fixes: [
                { suggest: 'Type mismatch - check expected vs actual types' },
                { suggest: 'Use type conversion or casting' }
            ]
        },
        {
            pattern: /error\[E0433\]: failed to resolve/,
            type: 'unresolved',
            fixes: [
                { suggest: 'Add missing use statement' },
                { suggest: 'Check crate is in Cargo.toml dependencies' }
            ]
        }
    ],
    go: [
        {
            pattern: /undefined: (\w+)/,
            type: 'undefined',
            extract: 1,
            fixes: [
                { suggest: '"{match}" not defined - add declaration or import' }
            ]
        },
        {
            pattern: /cannot use .* as .* in/,
            type: 'type_error',
            fixes: [
                { suggest: 'Type mismatch - check variable types' },
                { suggest: 'Use type assertion or conversion' }
            ]
        }
    ],
    generic: [
        {
            pattern: /error|Error|ERROR/,
            type: 'generic_error',
            fixes: [
                { suggest: 'Check the error message for details' },
                { suggest: 'Review recent changes' }
            ]
        },
        {
            pattern: /warning|Warning|WARNING/,
            type: 'warning',
            fixes: [
                { suggest: 'Consider addressing the warning' }
            ]
        }
    ]
};

// Auto-fix templates
const AUTO_FIX_TEMPLATES = {
    missing_semicolon: {
        detect: /;\s*$/,
        fix: (code) => code.trim() + ';'
    },
    missing_bracket: {
        detect: /{\s*$/,
        fix: (code) => code + '\n}'
    },
    optional_chaining: {
        detect: /(\w+)\.(\w+)/g,
        fix: (code, match) => code.replace(match, match.replace('.', '?.'))
    },
    null_check: {
        detect: /if\s*\(/,
        fix: (code, varName) => `if (${varName} != null) {\n  ${code}\n}`
    },
    add_import: {
        detect: /^import/m,
        fix: (code, module) => `import ${module} from '${module}';\n${code}`
    }
};

/**
 * Analyze error and provide diagnosis
 */
function diagnoseError(error, language = 'javascript') {
    const patterns = ERROR_PATTERNS[language] || ERROR_PATTERNS.generic;
    const allPatterns = [...patterns, ...ERROR_PATTERNS.generic];

    for (const errorDef of allPatterns) {
        const match = error.match(errorDef.pattern);
        if (match) {
            const extracted = errorDef.extract ? match[errorDef.extract] : null;
            const fixes = errorDef.fixes.map(f => ({
                ...f,
                suggestion: f.suggest.replace('{match}', extracted || '')
            }));

            return {
                matched: true,
                type: errorDef.type,
                pattern: errorDef.pattern.source,
                extracted,
                fixes,
                severity: errorDef.type.includes('warning') ? 'warning' : 'error'
            };
        }
    }

    return {
        matched: false,
        type: 'unknown',
        fixes: [{ suggestion: 'Unable to diagnose - check error details' }],
        severity: 'unknown'
    };
}

/**
 * Attempt automatic fix
 */
function attemptAutoFix(code, diagnosis, language) {
    const fixes = [];

    // Try template-based fixes
    for (const [name, template] of Object.entries(AUTO_FIX_TEMPLATES)) {
        if (template.detect.test(code)) {
            try {
                const fixed = template.fix(code);
                if (fixed !== code) {
                    fixes.push({
                        name,
                        original: code,
                        fixed,
                        confidence: 'medium'
                    });
                }
            } catch (e) {
                // Fix failed, continue
            }
        }
    }

    return fixes;
}

/**
 * Error Handler module for 0r8.term
 */
export const errorHandler = {
    name: 'ErrorHandler',

    /**
     * Analyze an error
     */
    analyze(error, context = {}) {
        const language = context.language || 'javascript';
        const diagnosis = diagnoseError(error, language);

        return {
            error,
            diagnosis,
            language,
            timestamp: Date.now()
        };
    },

    /**
     * Get fix suggestions
     */
    suggest(error, code = '', context = {}) {
        const language = context.language || 'javascript';
        const diagnosis = diagnoseError(error, language);
        const autoFixes = attemptAutoFix(code, diagnosis, language);

        return {
            diagnosis,
            suggestions: diagnosis.fixes.map(f => f.suggestion),
            autoFixes,
            canAutoFix: autoFixes.length > 0,
            confidence: autoFixes.length > 0 ? 'high' : 'low'
        };
    },

    /**
     * Attempt to fix code automatically
     */
    async autoFix(code, error, context = {}) {
        const language = context.language || 'javascript';
        const suggestions = this.suggest(error, code, { language });

        if (!suggestions.canAutoFix) {
            return {
                success: false,
                reason: 'No automatic fix available',
                suggestions: suggestions.suggestions,
                original: code
            };
        }

        // Apply the first auto-fix
        const fix = suggestions.autoFixes[0];

        return {
            success: true,
            fixApplied: fix.name,
            original: code,
            fixed: fix.fixed,
            confidence: fix.confidence,
            suggestions: suggestions.suggestions
        };
    },

    /**
     * Process for 0r8.term pipeline
     */
    async process(input, userContext = {}) {
        // Check if input looks like an error
        const isError = /error|Error|exception|Exception|failed|Failed/i.test(input);

        if (!isError) {
            return {
                isError: false,
                message: 'No error detected in input'
            };
        }

        const analysis = this.analyze(input, userContext);
        const suggestions = this.suggest(input, userContext.lastCode || '', userContext);

        return {
            isError: true,
            analysis,
            suggestions: suggestions.suggestions,
            autoFixes: suggestions.autoFixes,
            canAutoFix: suggestions.canAutoFix,
            xpGain: userContext.trusted ? 4 : 2 // XP for identifying errors
        };
    },

    /**
     * Format error report for display
     */
    formatReport(analysis) {
        const lines = [
            '╔═══════════════════════════════════════════════════════╗',
            '║              ERROR HANDLER REPORT                     ║',
            '╠═══════════════════════════════════════════════════════╣'
        ];

        lines.push(`║ Type: ${analysis.diagnosis.type.padEnd(45)}║`);
        lines.push(`║ Severity: ${analysis.diagnosis.severity.padEnd(41)}║`);
        lines.push('╠───────────────────────────────────────────────────────╣');
        lines.push('║ Suggestions:                                          ║');

        for (const fix of analysis.diagnosis.fixes.slice(0, 3)) {
            const suggestion = fix.suggestion.substring(0, 49);
            lines.push(`║   • ${suggestion.padEnd(48)}║`);
        }

        lines.push('╚═══════════════════════════════════════════════════════╝');

        return lines.join('\n');
    }
};

export default errorHandler;
