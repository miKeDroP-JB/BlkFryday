#!/usr/bin/env node
/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   BOUNDED AGENT AUTONOMY CLI                                              ║
 * ║   Usage: ./agents/enable --scope=task-level --autonomy=bounded            ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import { agents } from './index.js';
import { locks } from '../core/locks/index.js';

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

function parseArgs(args) {
    const parsed = { command: args[0], options: {} };
    for (let i = 1; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--')) {
            const [key, value] = arg.slice(2).split('=');
            parsed.options[key] = value === undefined ? true : value;
        }
    }
    return parsed;
}

function showHelp() {
    console.log(`
${COLORS.magenta}╔═══════════════════════════════════════════════════════════════════════════╗
║   BOUNDED AGENT AUTONOMY                                                  ║
║   "Intelligence that feels... intentional"                                ║
╚═══════════════════════════════════════════════════════════════════════════╝${COLORS.reset}

${COLORS.cyan}Usage:${COLORS.reset}
  node agents/cli.js <command> [options]

${COLORS.cyan}Commands:${COLORS.reset}
  ${COLORS.bright}enable${COLORS.reset}     Enable agent autonomy
  ${COLORS.bright}disable${COLORS.reset}    Disable agent autonomy
  ${COLORS.bright}status${COLORS.reset}     Show agent status
  ${COLORS.bright}create${COLORS.reset}     Create an agent
  ${COLORS.bright}demo${COLORS.reset}       Run a demo task

${COLORS.cyan}Enable Options:${COLORS.reset}
  --scope=<scope>           Scope: task-level, session-level
  --constraints=<list>      Constraints: observer,amoeba
  --autonomy=<level>        Autonomy: bounded (full is disabled)

${COLORS.cyan}Examples:${COLORS.reset}
  ${COLORS.dim}# Enable bounded autonomy${COLORS.reset}
  node agents/cli.js enable --scope=task-level --constraints=observer,amoeba --autonomy=bounded

  ${COLORS.dim}# Check status${COLORS.reset}
  node agents/cli.js status

  ${COLORS.dim}# Run a demo${COLORS.reset}
  node agents/cli.js demo

${COLORS.cyan}Agents CAN:${COLORS.reset}
  ${COLORS.green}Choose tools${COLORS.reset}
  ${COLORS.green}Sequence actions${COLORS.reset}
  ${COLORS.green}Ask for clarification when confidence drops${COLORS.reset}
  ${COLORS.green}Stop themselves if risk rises${COLORS.reset}

${COLORS.cyan}Agents CANNOT:${COLORS.reset}
  ${COLORS.red}Write to prime memory${COLORS.reset}
  ${COLORS.red}Escalate privileges${COLORS.reset}
  ${COLORS.red}Override Observer${COLORS.reset}
`);
}

async function runEnable(options) {
    const scope = options.scope || 'task-level';
    const constraints = options.constraints ? options.constraints.split(',') : ['observer', 'amoeba'];
    const autonomy = options.autonomy || 'bounded';

    console.log(`
${COLORS.magenta}╔═══════════════════════════════════════════════════════════════════════════╗
║   ENABLING AGENT AUTONOMY                                                 ║
╚═══════════════════════════════════════════════════════════════════════════╝${COLORS.reset}
`);

    // Check locks first
    const lockStatus = locks.getStatus();
    console.log(`${COLORS.cyan}[1/3] Checking safety locks...${COLORS.reset}`);

    if (!lockStatus.frozen) {
        console.log(`  ${COLORS.red}Safety locks not engaged!${COLORS.reset}`);
        console.log(`  ${COLORS.dim}Run: node core/locks/cli.js freeze --scope=memory,observer,amoeba${COLORS.reset}`);
        console.log('');
        console.log(`${COLORS.yellow}Cannot enable agent autonomy without safety locks.${COLORS.reset}`);
        process.exit(1);
    }

    console.log(`  ${COLORS.green}Safety locks engaged${COLORS.reset}`);

    console.log(`\n${COLORS.cyan}[2/3] Configuring autonomy...${COLORS.reset}`);
    console.log(`  Scope:        ${scope}`);
    console.log(`  Constraints:  ${constraints.join(', ')}`);
    console.log(`  Autonomy:     ${autonomy}`);

    console.log(`\n${COLORS.cyan}[3/3] Activating...${COLORS.reset}`);

    const result = agents.enable({
        scope,
        constraints,
        autonomy
    });

    if (result.success) {
        console.log(`  ${COLORS.green}Agent autonomy enabled${COLORS.reset}`);

        console.log(`
${COLORS.green}╔═══════════════════════════════════════════════════════════════════════════╗
║   AGENT AUTONOMY ACTIVE                                                   ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║   Capabilities Unlocked:                                                  ║
║     ${COLORS.cyan}Choose tools${COLORS.reset}        - Agents can select appropriate tools        ║
║     ${COLORS.cyan}Sequence actions${COLORS.reset}    - Plan multi-step operations                 ║
║     ${COLORS.cyan}Request clarity${COLORS.reset}     - Ask for help when uncertain               ║
║     ${COLORS.cyan}Self-stop${COLORS.reset}           - Halt when risk is too high                ║
║                                                                           ║
║   Hard Boundaries:                                                        ║
║     ${COLORS.red}Prime memory${COLORS.reset}        - WRITE BLOCKED                             ║
║     ${COLORS.red}Privileges${COLORS.reset}          - ESCALATION BLOCKED                        ║
║     ${COLORS.red}Observer${COLORS.reset}            - OVERRIDE BLOCKED                          ║
║                                                                           ║
║   Bounds:                                                                 ║
║     Max actions/task:     ${String(result.bounds.maxActionsPerTask).padEnd(5)}                                   ║
║     Confidence threshold: ${(result.bounds.confidenceThreshold * 100).toFixed(0)}%                                     ║
║     Risk threshold:       ${(result.bounds.riskThreshold * 100).toFixed(0)}%                                     ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝${COLORS.reset}
`);
    } else {
        console.error(`  ${COLORS.red}Failed: ${result.error}${COLORS.reset}`);
        if (result.hint) {
            console.log(`  ${COLORS.dim}${result.hint}${COLORS.reset}`);
        }
    }
}

async function runDisable() {
    console.log(`${COLORS.yellow}Disabling agent autonomy...${COLORS.reset}`);
    const result = agents.disable();

    if (result.success) {
        console.log(`${COLORS.green}Agent autonomy disabled${COLORS.reset}`);
    } else {
        console.error(`${COLORS.red}Error: ${result.error}${COLORS.reset}`);
    }
}

async function runStatus() {
    const status = agents.getStatus();

    console.log(`
${COLORS.magenta}╔═══════════════════════════════════════════════════════════════════════════╗
║   AGENT AUTONOMY STATUS                                                   ║
╚═══════════════════════════════════════════════════════════════════════════╝${COLORS.reset}
`);

    console.log(`${COLORS.cyan}State:${COLORS.reset}`);
    console.log(`  Enabled:       ${status.enabled ? COLORS.green + 'YES' : COLORS.dim + 'NO'}${COLORS.reset}`);
    console.log(`  Scope:         ${status.scope}`);
    console.log(`  Autonomy:      ${status.autonomy}`);
    console.log(`  Constraints:   ${status.constraints.join(', ') || 'none'}`);

    if (status.bounds) {
        console.log(`\n${COLORS.cyan}Bounds:${COLORS.reset}`);
        console.log(`  Max Actions:   ${status.bounds.maxActionsPerTask}`);
        console.log(`  Conf Thresh:   ${(status.bounds.confidenceThreshold * 100).toFixed(0)}%`);
        console.log(`  Risk Thresh:   ${(status.bounds.riskThreshold * 100).toFixed(0)}%`);
    }

    if (status.activeTask) {
        console.log(`\n${COLORS.cyan}Active Task:${COLORS.reset}`);
        console.log(`  ID:            ${status.activeTask.id}`);
        console.log(`  Agent:         ${status.activeTask.agentId}`);
        console.log(`  State:         ${status.activeTask.state}`);
        console.log(`  Actions:       ${status.activeTask.actions}`);
        console.log(`  Risk:          ${(status.activeTask.risk * 100).toFixed(1)}%`);
    }

    if (status.agents.length > 0) {
        console.log(`\n${COLORS.cyan}Agents:${COLORS.reset}`);
        for (const agent of status.agents) {
            const stateColor = agent.state === 'working' ? COLORS.green :
                              agent.state === 'stopped' ? COLORS.red : COLORS.dim;
            console.log(`  ${agent.id.padEnd(15)} | ${stateColor}${agent.state.padEnd(10)}${COLORS.reset} | Conf: ${(agent.confidence * 100).toFixed(0)}% | Risk: ${(agent.risk * 100).toFixed(0)}%`);
        }
    }

    console.log(`\n${COLORS.cyan}Metrics:${COLORS.reset}`);
    console.log(`  Tasks Completed:    ${status.metrics.tasksCompleted}`);
    console.log(`  Tasks Aborted:      ${status.metrics.tasksAborted}`);
    console.log(`  Clarifications:     ${status.metrics.clarificationRequests}`);
    console.log(`  Self-Stops:         ${status.metrics.selfStops}`);
    console.log(`  Tools Used:         ${status.metrics.toolsUsed}`);
    console.log(`  Actions Sequenced:  ${status.metrics.actionsSequenced}`);
}

async function runCreate(options) {
    const agentId = options.id || options.agent || `agent-${Date.now()}`;
    const name = options.name || agentId;

    console.log(`${COLORS.cyan}Creating agent: ${agentId}${COLORS.reset}`);

    const result = agents.createAgent(agentId, { name });

    if (result.success) {
        console.log(`${COLORS.green}Agent created:${COLORS.reset}`);
        console.log(`  ID:         ${result.agent.id}`);
        console.log(`  Name:       ${result.agent.name}`);
        console.log(`  Confidence: ${result.agent.confidence}`);
        console.log(`  State:      ${result.agent.state}`);
    } else {
        console.error(`${COLORS.red}Error: ${result.error}${COLORS.reset}`);
    }
}

async function runDemo() {
    console.log(`
${COLORS.magenta}╔═══════════════════════════════════════════════════════════════════════════╗
║   AGENT AUTONOMY DEMO                                                     ║
╚═══════════════════════════════════════════════════════════════════════════╝${COLORS.reset}
`);

    // Check if enabled
    let status = agents.getStatus();
    if (!status.enabled) {
        console.log(`${COLORS.yellow}Agent autonomy not enabled. Attempting to enable...${COLORS.reset}`);

        const lockStatus = locks.getStatus();
        if (!lockStatus.frozen) {
            console.log(`${COLORS.yellow}Engaging safety locks first...${COLORS.reset}`);
            locks.freeze(['memory', 'observer', 'amoeba']);
        }

        const enableResult = agents.enable({
            scope: 'task-level',
            constraints: ['observer', 'amoeba'],
            autonomy: 'bounded'
        });

        if (!enableResult.success) {
            console.error(`${COLORS.red}Could not enable autonomy: ${enableResult.error}${COLORS.reset}`);
            return;
        }
        console.log(`${COLORS.green}Autonomy enabled${COLORS.reset}`);
    }

    // Create demo agent
    console.log(`\n${COLORS.cyan}[1/5] Creating demo agent...${COLORS.reset}`);
    const agentId = `demo-agent-${Date.now()}`;
    const createResult = agents.createAgent(agentId, { name: 'Demo Agent' });

    if (!createResult.success) {
        console.error(`${COLORS.red}Error: ${createResult.error}${COLORS.reset}`);
        return;
    }
    console.log(`  Created: ${agentId}`);

    // Start task
    console.log(`\n${COLORS.cyan}[2/5] Starting demo task...${COLORS.reset}`);
    const taskResult = await agents.startTask(agentId, {
        type: 'demo',
        input: 'Analyze user intent and generate response',
        tools: ['analyze', 'query', 'respond']
    });

    if (!taskResult.success) {
        console.error(`${COLORS.red}Error: ${taskResult.error}${COLORS.reset}`);
        return;
    }
    console.log(`  Task: ${taskResult.task.id}`);
    console.log(`  Risk: ${(taskResult.securityReport.riskScore * 100).toFixed(1)}%`);

    // Choose tools
    console.log(`\n${COLORS.cyan}[3/5] Agent choosing tools...${COLORS.reset}`);

    const tool1 = agents.chooseTool(agentId, 'analyze', 'Need to understand input');
    console.log(`  ${tool1.success ? COLORS.green + '[OK]' : COLORS.red + '[FAIL]'}${COLORS.reset} analyze - ${tool1.success ? 'Selected' : tool1.error}`);

    const tool2 = agents.chooseTool(agentId, 'query', 'Check shadow memory for patterns');
    console.log(`  ${tool2.success ? COLORS.green + '[OK]' : COLORS.red + '[FAIL]'}${COLORS.reset} query - ${tool2.success ? 'Selected' : tool2.error}`);

    const tool3 = agents.chooseTool(agentId, 'respond', 'Generate response');
    console.log(`  ${tool3.success ? COLORS.green + '[OK]' : COLORS.red + '[FAIL]'}${COLORS.reset} respond - ${tool3.success ? 'Selected' : tool3.error}`);

    // Sequence actions
    console.log(`\n${COLORS.cyan}[4/5] Agent sequencing actions...${COLORS.reset}`);
    const seqResult = agents.sequenceActions(agentId, [
        { tool: 'analyze', params: { depth: 'shallow' } },
        { tool: 'respond', params: { format: 'conversational' } }
    ]);

    if (seqResult.success) {
        console.log(`  Sequenced ${seqResult.sequencedCount} actions`);
        console.log(`  Total actions: ${seqResult.totalActions}`);
        console.log(`  Projected risk: ${(seqResult.projectedRisk * 100).toFixed(1)}%`);
    } else {
        console.log(`  ${COLORS.yellow}Sequence rejected: ${seqResult.error}${COLORS.reset}`);
    }

    // Complete task
    console.log(`\n${COLORS.cyan}[5/5] Completing task...${COLORS.reset}`);
    const completeResult = agents.completeTask(agentId, {
        response: 'Demo task completed successfully',
        confidence: 0.9
    });

    if (completeResult.success) {
        console.log(`  ${COLORS.green}Task completed${COLORS.reset}`);
        console.log(`  Duration: ${completeResult.task.duration}ms`);
        console.log(`  Actions: ${completeResult.task.actionsExecuted}`);
        console.log(`  Final risk: ${(completeResult.task.finalRisk * 100).toFixed(1)}%`);
    }

    // Final status
    console.log(`
${COLORS.green}╔═══════════════════════════════════════════════════════════════════════════╗
║   DEMO COMPLETE                                                           ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║   The agent demonstrated:                                                 ║
║     ${COLORS.cyan}Tool selection${COLORS.reset}     - Chose analyze, query, respond              ║
║     ${COLORS.cyan}Action sequencing${COLORS.reset}  - Planned multi-step workflow                ║
║     ${COLORS.cyan}Bounded execution${COLORS.reset}  - Stayed within risk thresholds             ║
║     ${COLORS.cyan}Task completion${COLORS.reset}    - Finished autonomously                     ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝${COLORS.reset}
`);
}

async function main() {
    const args = process.argv.slice(2);
    const { command, options } = parseArgs(args);

    if (!command || command === 'help' || options.help) {
        showHelp();
        process.exit(0);
    }

    switch (command) {
        case 'enable':
            await runEnable(options);
            break;
        case 'disable':
            await runDisable();
            break;
        case 'status':
            await runStatus();
            break;
        case 'create':
            await runCreate(options);
            break;
        case 'demo':
            await runDemo();
            break;
        default:
            console.error(`${COLORS.red}Unknown command: ${command}${COLORS.reset}`);
            showHelp();
            process.exit(1);
    }
}

main();
