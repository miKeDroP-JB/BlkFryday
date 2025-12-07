#!/usr/bin/env node
/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                                                                           ║
 * ║    ██████╗ ██████╗ ██████╗     ███████╗████████╗ █████╗ ██████╗ ████████╗ ║
 * ║   ██╔═══██╗██╔══██╗██╔══██╗    ██╔════╝╚══██╔══╝██╔══██╗██╔══██╗╚══██╔══╝ ║
 * ║   ██║   ██║██████╔╝██████╔╝    ███████╗   ██║   ███████║██████╔╝   ██║    ║
 * ║   ██║   ██║██╔══██╗██╔══██╗    ╚════██║   ██║   ██╔══██║██╔══██╗   ██║    ║
 * ║   ╚██████╔╝██║  ██║██████╔╝    ███████║   ██║   ██║  ██║██║  ██║   ██║    ║
 * ║    ╚═════╝ ╚═╝  ╚═╝╚═════╝     ╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝    ║
 * ║                                                                           ║
 * ║   THE BUILDER THAT BUILDS THE FUTURE                                      ║
 * ║   One command to rule them all.                                           ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

const { createORB } = require('../core');
const readline = require('readline');

// ═══════════════════════════════════════════════════════════════════════════
// BANNER
// ═══════════════════════════════════════════════════════════════════════════

function printBanner() {
  console.log(`
\x1b[35m╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║     ████████╗██╗  ██╗███████╗     ██████╗ ██████╗ ██████╗                 ║
║     ╚══██╔══╝██║  ██║██╔════╝    ██╔═══██╗██╔══██╗██╔══██╗                ║
║        ██║   ███████║█████╗      ██║   ██║██████╔╝██████╔╝                ║
║        ██║   ██╔══██║██╔══╝      ██║   ██║██╔══██╗██╔══██╗                ║
║        ██║   ██║  ██║███████╗    ╚██████╔╝██║  ██║██████╔╝                ║
║        ╚═╝   ╚═╝  ╚═╝╚══════╝     ╚═════╝ ╚═╝  ╚═╝╚═════╝                 ║
║                                                                           ║
║              THE BUILDER THAT BUILDS THE FUTURE                           ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝\x1b[0m
`);
}

// ═══════════════════════════════════════════════════════════════════════════
// HELP
// ═══════════════════════════════════════════════════════════════════════════

function printHelp() {
  console.log(`
\x1b[36mCommands:\x1b[0m
  \x1b[33mthink <prompt>\x1b[0m     - Run AI on a prompt
  \x1b[33mdeploy <agent> <task>\x1b[0m - Deploy an agent (APOLLO, ATHENA, HERMES, etc.)
  \x1b[33mbuild <objective>\x1b[0m  - Build something with the factory
  \x1b[33mswarm <goal>\x1b[0m       - Deploy multiple agents on a goal
  \x1b[33mstatus\x1b[0m             - Show system status
  \x1b[33msecurity\x1b[0m           - Show security status
  \x1b[33mhelp\x1b[0m               - Show this help
  \x1b[33mexit\x1b[0m               - Exit

\x1b[36mAgent Archetypes:\x1b[0m
  APOLLO    - Research & Illumination
  ATHENA    - Strategy & Wisdom
  HERMES    - Communication & Speed
  ARES      - Execution & Power
  HEPHAESTUS - Building & Crafting
  ARTEMIS   - Precision & Hunting
  MERCURY   - Data & Analysis
`);
}

// ═══════════════════════════════════════════════════════════════════════════
// REPL
// ═══════════════════════════════════════════════════════════════════════════

async function startREPL(orb) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '\x1b[35m⟡ 0RB > \x1b[0m'
  });

  rl.prompt();

  rl.on('line', async (line) => {
    const input = line.trim();
    const [command, ...args] = input.split(' ');
    const argString = args.join(' ');

    try {
      switch (command.toLowerCase()) {
        case 'think':
          if (!argString) {
            console.log('\x1b[31mUsage: think <prompt>\x1b[0m');
            break;
          }
          console.log('\x1b[33m⟡ Thinking...\x1b[0m');
          const thought = await orb.think(argString);
          console.log('\n\x1b[32m' + thought.content + '\x1b[0m\n');
          break;

        case 'deploy':
          const [agent, ...taskParts] = args;
          const task = taskParts.join(' ');
          if (!agent || !task) {
            console.log('\x1b[31mUsage: deploy <agent> <task>\x1b[0m');
            break;
          }
          console.log(`\x1b[33m⟡ Deploying ${agent.toUpperCase()}...\x1b[0m`);
          const result = await orb.deploy(agent.toUpperCase(), task);
          console.log('\n\x1b[32m' + JSON.stringify(result, null, 2) + '\x1b[0m\n');
          break;

        case 'build':
          if (!argString) {
            console.log('\x1b[31mUsage: build <objective>\x1b[0m');
            break;
          }
          console.log('\x1b[33m⟡ Starting factory build...\x1b[0m');
          const buildResult = await orb.build(argString);
          console.log('\n\x1b[32m' + JSON.stringify(buildResult, null, 2) + '\x1b[0m\n');
          break;

        case 'swarm':
          if (!argString) {
            console.log('\x1b[31mUsage: swarm <goal>\x1b[0m');
            break;
          }
          console.log('\x1b[33m⟡ Deploying swarm...\x1b[0m');
          const swarmResult = await orb.swarm(argString);
          console.log('\n\x1b[32m' + JSON.stringify(swarmResult, null, 2) + '\x1b[0m\n');
          break;

        case 'status':
          console.log('\n\x1b[36m' + JSON.stringify(orb.getStatus(), null, 2) + '\x1b[0m\n');
          break;

        case 'security':
          console.log('\n\x1b[36m' + JSON.stringify(orb.getSecurityStatus(), null, 2) + '\x1b[0m\n');
          break;

        case 'help':
          printHelp();
          break;

        case 'exit':
        case 'quit':
          console.log('\x1b[35m⟡ Shutting down...\x1b[0m');
          await orb.shutdown();
          process.exit(0);
          break;

        case '':
          break;

        default:
          console.log(`\x1b[31mUnknown command: ${command}\x1b[0m`);
          console.log('Type "help" for available commands');
      }
    } catch (error) {
      console.error(`\x1b[31mError: ${error.message}\x1b[0m`);
    }

    rl.prompt();
  });

  rl.on('close', async () => {
    console.log('\n\x1b[35m⟡ Goodbye.\x1b[0m');
    await orb.shutdown();
    process.exit(0);
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  printBanner();

  console.log('\x1b[33m⟡ Initializing 0RB System...\x1b[0m\n');

  try {
    const orb = await createORB({
      ai: {
        defaultProvider: process.env.ORB_DEFAULT_PROVIDER || 'anthropic'
      },
      crypto: {
        network: process.env.ORB_DEFAULT_NETWORK || 'base',
        autoConnect: false
      },
      security: {
        enabled: true
      }
    });

    console.log('\x1b[32m✓ System ready\x1b[0m');
    console.log('\nType "help" for commands, "exit" to quit.\n');

    await startREPL(orb);

  } catch (error) {
    console.error('\x1b[31m✗ Failed to initialize:\x1b[0m', error.message);
    console.error('\nMake sure you have set your API keys in environment variables:');
    console.error('  export ANTHROPIC_API_KEY="your-key"');
    console.error('  export OPENAI_API_KEY="your-key"');
    process.exit(1);
  }
}

main();
