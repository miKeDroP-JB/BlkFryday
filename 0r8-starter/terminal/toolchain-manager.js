/**
 * 0r8.term Toolchain Manager
 * "Tools install themselves"
 *
 * Automatic detection, installation, and management of development tools
 */

import { spawn } from 'child_process';

// Supported package managers and their commands
const PACKAGE_MANAGERS = {
    npm: {
        name: 'npm',
        check: 'npm --version',
        install: 'npm install',
        installGlobal: 'npm install -g',
        uninstall: 'npm uninstall',
        list: 'npm list --depth=0',
        search: 'npm search',
        ecosystem: 'javascript'
    },
    yarn: {
        name: 'yarn',
        check: 'yarn --version',
        install: 'yarn add',
        installGlobal: 'yarn global add',
        uninstall: 'yarn remove',
        list: 'yarn list --depth=0',
        search: null,
        ecosystem: 'javascript'
    },
    pnpm: {
        name: 'pnpm',
        check: 'pnpm --version',
        install: 'pnpm add',
        installGlobal: 'pnpm add -g',
        uninstall: 'pnpm remove',
        list: 'pnpm list --depth=0',
        search: null,
        ecosystem: 'javascript'
    },
    pip: {
        name: 'pip',
        check: 'pip3 --version',
        fallbackCheck: 'pip --version',
        install: 'pip3 install',
        installGlobal: 'pip3 install',
        uninstall: 'pip3 uninstall -y',
        list: 'pip3 list',
        search: null,
        ecosystem: 'python'
    },
    cargo: {
        name: 'cargo',
        check: 'cargo --version',
        install: 'cargo add',
        installGlobal: 'cargo install',
        uninstall: 'cargo remove',
        list: 'cargo tree --depth=1',
        search: 'cargo search',
        ecosystem: 'rust'
    },
    go: {
        name: 'go',
        check: 'go version',
        install: 'go get',
        installGlobal: 'go install',
        uninstall: null,
        list: 'go list -m all',
        search: null,
        ecosystem: 'go'
    }
};

// Common tool recommendations by language
const TOOL_RECOMMENDATIONS = {
    javascript: {
        essential: ['typescript', 'eslint', 'prettier'],
        testing: ['jest', 'vitest', 'mocha'],
        frameworks: ['express', 'fastify', 'next'],
        utilities: ['lodash', 'axios', 'dotenv']
    },
    python: {
        essential: ['black', 'flake8', 'mypy'],
        testing: ['pytest', 'unittest'],
        frameworks: ['flask', 'fastapi', 'django'],
        utilities: ['requests', 'numpy', 'pandas']
    },
    rust: {
        essential: ['clippy', 'rustfmt'],
        testing: ['cargo-test'],
        frameworks: ['actix-web', 'rocket', 'axum'],
        utilities: ['serde', 'tokio', 'reqwest']
    },
    go: {
        essential: ['golint', 'gofmt'],
        testing: ['gotestsum'],
        frameworks: ['gin', 'echo', 'fiber'],
        utilities: ['cobra', 'viper']
    }
};

/**
 * Execute command and return result
 */
function runCommand(command, timeout = 60000) {
    return new Promise((resolve) => {
        const [cmd, ...args] = command.split(' ');
        let stdout = '';
        let stderr = '';

        const proc = spawn(cmd, args, {
            shell: true,
            timeout
        });

        proc.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        proc.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        proc.on('close', (code) => {
            resolve({
                success: code === 0,
                exitCode: code,
                stdout: stdout.trim(),
                stderr: stderr.trim()
            });
        });

        proc.on('error', (err) => {
            resolve({
                success: false,
                exitCode: -1,
                stdout: '',
                stderr: err.message,
                error: err.message
            });
        });
    });
}

/**
 * Toolchain Manager module for 0r8.term
 */
export const toolchainManager = {
    name: 'ToolchainManager',

    /**
     * Detect available package managers
     */
    async detectPackageManagers() {
        const available = [];

        for (const [key, pm] of Object.entries(PACKAGE_MANAGERS)) {
            const result = await runCommand(pm.check, 5000);
            if (result.success) {
                available.push({
                    key,
                    name: pm.name,
                    version: result.stdout.split('\n')[0],
                    ecosystem: pm.ecosystem
                });
            } else if (pm.fallbackCheck) {
                const fallback = await runCommand(pm.fallbackCheck, 5000);
                if (fallback.success) {
                    available.push({
                        key,
                        name: pm.name,
                        version: fallback.stdout.split('\n')[0],
                        ecosystem: pm.ecosystem
                    });
                }
            }
        }

        return available;
    },

    /**
     * Install a package
     */
    async install(packageName, options = {}) {
        const pm = options.packageManager || 'npm';
        const global = options.global || false;
        const config = PACKAGE_MANAGERS[pm];

        if (!config) {
            return {
                success: false,
                error: `Unknown package manager: ${pm}`,
                supported: Object.keys(PACKAGE_MANAGERS)
            };
        }

        const cmd = global ? config.installGlobal : config.install;
        const command = `${cmd} ${packageName}`;

        console.log(`Installing ${packageName} via ${pm}...`);

        const result = await runCommand(command, 120000);

        return {
            success: result.success,
            package: packageName,
            packageManager: pm,
            global,
            output: result.stdout,
            error: result.stderr,
            command
        };
    },

    /**
     * Uninstall a package
     */
    async uninstall(packageName, options = {}) {
        const pm = options.packageManager || 'npm';
        const config = PACKAGE_MANAGERS[pm];

        if (!config || !config.uninstall) {
            return {
                success: false,
                error: `Uninstall not supported for: ${pm}`
            };
        }

        const command = `${config.uninstall} ${packageName}`;
        const result = await runCommand(command, 60000);

        return {
            success: result.success,
            package: packageName,
            packageManager: pm,
            output: result.stdout,
            error: result.stderr
        };
    },

    /**
     * List installed packages
     */
    async list(options = {}) {
        const pm = options.packageManager || 'npm';
        const config = PACKAGE_MANAGERS[pm];

        if (!config) {
            return {
                success: false,
                error: `Unknown package manager: ${pm}`
            };
        }

        const result = await runCommand(config.list, 30000);

        return {
            success: result.success,
            packageManager: pm,
            packages: result.stdout,
            error: result.stderr
        };
    },

    /**
     * Get tool recommendations for a language
     */
    recommend(language) {
        const recommendations = TOOL_RECOMMENDATIONS[language];

        if (!recommendations) {
            return {
                language,
                supported: Object.keys(TOOL_RECOMMENDATIONS),
                recommendations: null
            };
        }

        return {
            language,
            ...recommendations,
            total: Object.values(recommendations).flat().length
        };
    },

    /**
     * Auto-setup development environment
     */
    async autoSetup(language, options = {}) {
        const recommendations = this.recommend(language);
        if (!recommendations.essential) {
            return {
                success: false,
                error: `No setup available for: ${language}`
            };
        }

        const pm = options.packageManager || this.getDefaultPM(language);
        const results = [];

        // Install essential tools
        for (const tool of recommendations.essential) {
            if (!options.dryRun) {
                const result = await this.install(tool, { packageManager: pm, global: true });
                results.push({ tool, ...result });
            } else {
                results.push({ tool, dryRun: true, command: `${pm} install ${tool}` });
            }
        }

        return {
            success: results.every(r => r.success || r.dryRun),
            language,
            packageManager: pm,
            installed: results,
            recommendations
        };
    },

    /**
     * Get default package manager for language
     */
    getDefaultPM(language) {
        const mapping = {
            javascript: 'npm',
            typescript: 'npm',
            python: 'pip',
            rust: 'cargo',
            go: 'go'
        };
        return mapping[language] || 'npm';
    },

    /**
     * Process for 0r8.term pipeline
     */
    async process(input, userContext = {}) {
        // Parse install commands
        const installMatch = input.match(/install\s+(\S+)/i);
        const uninstallMatch = input.match(/uninstall\s+(\S+)/i);
        const listMatch = /list\s*(packages|deps)?/i.test(input);
        const setupMatch = input.match(/setup\s+(\w+)/i);

        if (installMatch) {
            const result = await this.install(installMatch[1], userContext);
            return {
                action: 'install',
                ...result,
                xpGain: result.success ? (userContext.trusted ? 10 : 5) : 0
            };
        }

        if (uninstallMatch) {
            const result = await this.uninstall(uninstallMatch[1], userContext);
            return {
                action: 'uninstall',
                ...result
            };
        }

        if (listMatch) {
            const result = await this.list(userContext);
            return {
                action: 'list',
                ...result
            };
        }

        if (setupMatch) {
            const result = await this.autoSetup(setupMatch[1], userContext);
            return {
                action: 'setup',
                ...result,
                xpGain: result.success ? (userContext.trusted ? 20 : 10) : 0
            };
        }

        // Default: show available package managers
        const available = await this.detectPackageManagers();
        return {
            action: 'status',
            availablePackageManagers: available,
            hint: 'Use: install <package>, uninstall <package>, list, or setup <language>'
        };
    },

    /**
     * Format result for display
     */
    formatResult(result) {
        const lines = [
            '╔═══════════════════════════════════════════════════════╗',
            '║             TOOLCHAIN MANAGER                         ║',
            '╠═══════════════════════════════════════════════════════╣'
        ];

        lines.push(`║ Action: ${(result.action || 'unknown').padEnd(44)}║`);

        if (result.package) {
            lines.push(`║ Package: ${result.package.padEnd(43)}║`);
        }

        if (result.packageManager) {
            lines.push(`║ Manager: ${result.packageManager.padEnd(43)}║`);
        }

        const status = result.success ? '✓ SUCCESS' : '✗ FAILED';
        lines.push(`║ Status: ${status.padEnd(44)}║`);

        if (result.availablePackageManagers) {
            lines.push('╠───────────────────────────────────────────────────────╣');
            lines.push('║ Available Package Managers:                           ║');
            for (const pm of result.availablePackageManagers) {
                lines.push(`║   • ${pm.name} (${pm.ecosystem})`.padEnd(56) + '║');
            }
        }

        if (result.error) {
            lines.push('╠───────────────────────────────────────────────────────╣');
            const error = result.error.substring(0, 51);
            lines.push(`║ Error: ${error.padEnd(45)}║`);
        }

        lines.push('╚═══════════════════════════════════════════════════════╝');

        return lines.join('\n');
    }
};

export default toolchainManager;
