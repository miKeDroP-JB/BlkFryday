/**
 * 0r8.term Command Executor
 * "Code writes itself"
 *
 * Executes code in various languages with sandboxing and output capture
 */

import { spawn } from 'child_process';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

// Language execution configs
const EXECUTORS = {
    javascript: {
        name: 'JavaScript',
        command: 'node',
        extension: '.js',
        args: [],
        timeout: 10000,
        setup: null
    },
    python: {
        name: 'Python',
        command: 'python3',
        fallback: 'python',
        extension: '.py',
        args: [],
        timeout: 10000,
        setup: null
    },
    bash: {
        name: 'Bash',
        command: 'bash',
        extension: '.sh',
        args: [],
        timeout: 10000,
        setup: null
    },
    typescript: {
        name: 'TypeScript',
        command: 'npx',
        args: ['ts-node'],
        extension: '.ts',
        timeout: 15000,
        setup: null
    },
    rust: {
        name: 'Rust',
        command: 'rustc',
        extension: '.rs',
        compile: true,
        runCommand: null, // Set dynamically
        timeout: 30000,
        setup: null
    },
    go: {
        name: 'Go',
        command: 'go',
        args: ['run'],
        extension: '.go',
        timeout: 15000,
        setup: null
    }
};

// Sandboxing rules
const SANDBOX_RULES = {
    blockedPatterns: [
        /rm\s+-rf\s+\//,
        /sudo\s+/,
        /chmod\s+777/,
        /eval\s*\(/,
        /exec\s*\(/,
        /system\s*\(/,
        /os\.system/,
        /subprocess\.call/,
        /child_process/,
        /__import__/,
        /require\s*\(\s*['"]child_process['"]\s*\)/
    ],
    maxOutputSize: 50000,
    maxRuntime: 30000
};

/**
 * Check if code is safe to execute
 */
function sandboxCheck(code) {
    const violations = [];

    for (const pattern of SANDBOX_RULES.blockedPatterns) {
        if (pattern.test(code)) {
            violations.push({
                pattern: pattern.source,
                severity: 'high',
                message: 'Potentially dangerous pattern detected'
            });
        }
    }

    return {
        safe: violations.length === 0,
        violations,
        checked: true
    };
}

/**
 * Create temporary file for code execution
 */
function createTempFile(code, extension) {
    const filename = `0r8_exec_${Date.now()}${extension}`;
    const filepath = join(tmpdir(), filename);
    writeFileSync(filepath, code, 'utf8');
    return filepath;
}

/**
 * Clean up temporary files
 */
function cleanup(filepath) {
    try {
        if (existsSync(filepath)) {
            unlinkSync(filepath);
        }
        // Also clean up compiled binaries for rust
        const binPath = filepath.replace(/\.\w+$/, '');
        if (existsSync(binPath)) {
            unlinkSync(binPath);
        }
    } catch (e) {
        // Ignore cleanup errors
    }
}

/**
 * Execute code and capture output
 */
function executeCode(command, args, options = {}) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        let stdout = '';
        let stderr = '';
        let killed = false;

        const timeout = options.timeout || SANDBOX_RULES.maxRuntime;

        const proc = spawn(command, args, {
            timeout,
            maxBuffer: SANDBOX_RULES.maxOutputSize,
            cwd: options.cwd || tmpdir()
        });

        // Set timeout
        const timeoutId = setTimeout(() => {
            killed = true;
            proc.kill('SIGTERM');
        }, timeout);

        proc.stdout.on('data', (data) => {
            stdout += data.toString();
            if (stdout.length > SANDBOX_RULES.maxOutputSize) {
                stdout = stdout.substring(0, SANDBOX_RULES.maxOutputSize) + '\n[OUTPUT TRUNCATED]';
                proc.kill('SIGTERM');
            }
        });

        proc.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        proc.on('close', (code) => {
            clearTimeout(timeoutId);
            const duration = Date.now() - startTime;

            resolve({
                success: code === 0 && !killed,
                exitCode: code,
                stdout: stdout.trim(),
                stderr: stderr.trim(),
                duration,
                killed,
                timedOut: killed && duration >= timeout
            });
        });

        proc.on('error', (err) => {
            clearTimeout(timeoutId);
            resolve({
                success: false,
                exitCode: -1,
                stdout: '',
                stderr: err.message,
                duration: Date.now() - startTime,
                error: err.message
            });
        });
    });
}

/**
 * Command Executor module for 0r8.term
 */
export const commandExecutor = {
    name: 'CommandExecutor',

    /**
     * Execute code in detected or specified language
     */
    async execute(code, language = 'javascript', options = {}) {
        // Sandbox check
        const safety = sandboxCheck(code);
        if (!safety.safe && !options.bypassSandbox) {
            return {
                success: false,
                error: 'Security violation',
                violations: safety.violations,
                executed: false
            };
        }

        // Get executor config
        const executor = EXECUTORS[language];
        if (!executor) {
            return {
                success: false,
                error: `Unsupported language: ${language}`,
                supportedLanguages: Object.keys(EXECUTORS),
                executed: false
            };
        }

        // Create temp file
        const filepath = createTempFile(code, executor.extension);

        try {
            let result;

            if (executor.compile) {
                // Compile first (for Rust, etc.)
                const outputPath = filepath.replace(/\.\w+$/, '');
                const compileResult = await executeCode(
                    executor.command,
                    [filepath, '-o', outputPath],
                    { timeout: executor.timeout }
                );

                if (!compileResult.success) {
                    return {
                        success: false,
                        phase: 'compile',
                        ...compileResult,
                        executed: true
                    };
                }

                // Run compiled binary
                result = await executeCode(outputPath, [], { timeout: executor.timeout });
            } else {
                // Direct execution
                const args = [...(executor.args || []), filepath];
                const command = executor.command;

                result = await executeCode(command, args, { timeout: executor.timeout });

                // Try fallback if primary fails
                if (!result.success && executor.fallback) {
                    result = await executeCode(executor.fallback, args, { timeout: executor.timeout });
                }
            }

            return {
                success: result.success,
                language,
                languageName: executor.name,
                output: result.stdout,
                error: result.stderr,
                exitCode: result.exitCode,
                duration: result.duration,
                timedOut: result.timedOut,
                executed: true
            };

        } finally {
            cleanup(filepath);
        }
    },

    /**
     * Execute shell command directly
     */
    async shell(command, options = {}) {
        // Safety check for shell commands
        const safety = sandboxCheck(command);
        if (!safety.safe && !options.bypassSandbox) {
            return {
                success: false,
                error: 'Dangerous command blocked',
                violations: safety.violations
            };
        }

        return executeCode('bash', ['-c', command], {
            timeout: options.timeout || 10000,
            cwd: options.cwd
        });
    },

    /**
     * Process for 0r8.term pipeline
     */
    async process(input, userContext = {}) {
        const language = userContext.detectedLanguage || 'javascript';

        // Check if this looks like code
        const codePatterns = [
            /function\s+\w+/,
            /const\s+\w+/,
            /def\s+\w+/,
            /class\s+\w+/,
            /console\./,
            /print\(/,
            /return\s+/
        ];

        const looksLikeCode = codePatterns.some(p => p.test(input));

        if (!looksLikeCode) {
            return {
                executed: false,
                reason: 'Input does not appear to be executable code',
                hint: 'Wrap code in triple backticks or use explicit language tag'
            };
        }

        const result = await this.execute(input, language);

        // Calculate XP gain
        const baseXP = result.success ? 10 : 5;
        const multiplier = userContext.trusted ? 2 : 1;

        return {
            ...result,
            xpGain: baseXP * multiplier,
            bondGain: result.success ? multiplier : 0
        };
    },

    /**
     * Get supported languages
     */
    getSupportedLanguages() {
        return Object.entries(EXECUTORS).map(([key, config]) => ({
            key,
            name: config.name,
            extension: config.extension
        }));
    },

    /**
     * Format execution result for display
     */
    formatResult(result) {
        const lines = [
            '╔═══════════════════════════════════════════════════════╗',
            '║             COMMAND EXECUTOR OUTPUT                   ║',
            '╠═══════════════════════════════════════════════════════╣'
        ];

        const status = result.success ? '✓ SUCCESS' : '✗ FAILED';
        lines.push(`║ Status: ${status.padEnd(44)}║`);
        lines.push(`║ Language: ${(result.languageName || 'unknown').padEnd(42)}║`);
        lines.push(`║ Duration: ${(result.duration + 'ms').padEnd(42)}║`);

        if (result.output) {
            lines.push('╠───────────────────────────────────────────────────────╣');
            lines.push('║ Output:                                               ║');
            const outputLines = result.output.split('\n').slice(0, 10);
            for (const line of outputLines) {
                const truncated = line.substring(0, 51);
                lines.push(`║   ${truncated.padEnd(50)}║`);
            }
        }

        if (result.error) {
            lines.push('╠───────────────────────────────────────────────────────╣');
            lines.push('║ Error:                                                ║');
            const errorLines = result.error.split('\n').slice(0, 5);
            for (const line of errorLines) {
                const truncated = line.substring(0, 51);
                lines.push(`║   ${truncated.padEnd(50)}║`);
            }
        }

        lines.push('╚═══════════════════════════════════════════════════════╝');

        return lines.join('\n');
    }
};

export default commandExecutor;
