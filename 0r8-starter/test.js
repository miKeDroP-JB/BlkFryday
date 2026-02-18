import { handleUserInput } from './index.js';

console.log('');
console.log('╔═══════════════════════════════════════════════════════════════════════════╗');
console.log('║   0R8-STARTER TEST HARNESS v2.0                                           ║');
console.log('║   Testing: Leveling • Trusted Creators • Research Node • Data Moat        ║');
console.log('╚═══════════════════════════════════════════════════════════════════════════╝');
console.log('');

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 1: Mass User (non-trusted)
// ═══════════════════════════════════════════════════════════════════════════════

const massUserContext = {
    userId: 'mass_user_001',
    trusted: false,  // <-- Mass user
    memory: [],
    preferences: { layout: 'default' },
    recentInputs: []
};

const massInputs = [
    "Hello 0r8, what do you think about AI?",
    "This is a secret message.",
    "Tell me about ancient wisdom.",
    "I want to do some research on climate change.",  // Should NOT access ResearchNode
    "Show me my patterns."
];

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 2: Trusted Creator (scientist/leader)
// ═══════════════════════════════════════════════════════════════════════════════

const trustedContext = {
    userId: 'scientist_001',
    trusted: true,  // <-- Trusted creator
    memory: [],
    preferences: { layout: 'immersive', spiritAnimal: 'owl' },
    recentInputs: []
};

const trustedInputs = [
    "Research: What are the patterns in climate data?",
    "Prophecy: What does the future hold?",  // Should trigger trusted-only pattern
    "Genesis: Create a new paradigm.",  // Should trigger trusted-only pattern
    "Simulate: Test hypothesis about renewable energy adoption.",
    "Ancient void mystery."  // Multiple pattern triggers
];

async function runTest() {
    // ═══════════════════════════════════════════════════════════════════════════
    // MASS USER TEST
    // ═══════════════════════════════════════════════════════════════════════════
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════════════════');
    console.log('  TEST 1: MASS USER (Non-Trusted)');
    console.log('  - Should NOT access Research Node');
    console.log('  - Should unlock Sigil patterns gradually');
    console.log('  - 1x XP/bond multiplier');
    console.log('═══════════════════════════════════════════════════════════════════════════');

    for (const input of massInputs) {
        console.log(`\n┌─────────────────────────────────────────────────────────────────────────┐`);
        console.log(`│ INPUT: "${input.substring(0, 60)}${input.length > 60 ? '...' : ''}"`);
        console.log(`└─────────────────────────────────────────────────────────────────────────┘`);

        massUserContext.recentInputs.push(Date.now());

        try {
            const result = await handleUserInput(input, massUserContext);

            // Check modules
            console.log('\n  📦 MODULES:');
            if (result.lawfulResults) {
                result.lawfulResults.forEach(r => {
                    const status = r.success ? '✓' : '✗';
                    const trusted = r.trusted ? ' [TRUSTED]' : '';
                    console.log(`     ${status} ${r.node}${trusted}`);
                });
            }

            // Twin status
            console.log(`\n  👤 TWIN: L${result.twin?.level} | XP: ${result.twin?.XP}/${result.twin?.xpToNext} | Abilities: ${result.twin?.abilities?.length || 0}`);

            // Spirit status
            console.log(`  🦉 SPIRIT: L${result.spiritAnimal?.level} | Bond: ${result.spiritAnimal?.bond}/${result.spiritAnimal?.bondToNext}`);

            // Sigil status
            const sigil = massUserContext.sigil;
            if (sigil) {
                console.log(`  ✨ SIGIL: L${sigil.level} | Patterns: ${sigil.patternsUnlocked?.join(', ')}`);
            }

        } catch (error) {
            console.error('  ❌ ERROR:', error.message);
        }
    }

    // Show mass user final state
    console.log('\n┌─────────────────────────────────────────────────────────────────────────┐');
    console.log('│ MASS USER FINAL STATE                                                   │');
    console.log('├─────────────────────────────────────────────────────────────────────────┤');
    console.log(`│ Twin Level: ${massUserContext.twin?.level || 1}`);
    console.log(`│ Twin XP: ${massUserContext.twin?.XP || 0}`);
    console.log(`│ Twin Abilities: ${massUserContext.twin?.abilities?.join(', ') || 'observe'}`);
    console.log(`│ Spirit Level: ${massUserContext.spiritAnimal?.level || 1}`);
    console.log(`│ Spirit Bond: ${massUserContext.spiritAnimal?.bond || 10}`);
    console.log(`│ Sigil Level: ${massUserContext.sigil?.level || 1}`);
    console.log(`│ Sigil Patterns: ${massUserContext.sigil?.patternsUnlocked?.join(', ') || 'reverse, mirror'}`);
    console.log('└─────────────────────────────────────────────────────────────────────────┘');

    // ═══════════════════════════════════════════════════════════════════════════
    // TRUSTED CREATOR TEST
    // ═══════════════════════════════════════════════════════════════════════════
    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════════════════════');
    console.log('  TEST 2: TRUSTED CREATOR (Scientist/Leader)');
    console.log('  - SHOULD access Research Node');
    console.log('  - All Sigil patterns unlocked instantly');
    console.log('  - 2x XP/bond multiplier');
    console.log('═══════════════════════════════════════════════════════════════════════════');

    for (const input of trustedInputs) {
        console.log(`\n┌─────────────────────────────────────────────────────────────────────────┐`);
        console.log(`│ INPUT: "${input.substring(0, 60)}${input.length > 60 ? '...' : ''}"`);
        console.log(`└─────────────────────────────────────────────────────────────────────────┘`);

        trustedContext.recentInputs.push(Date.now());

        try {
            const result = await handleUserInput(input, trustedContext);

            // Check modules
            console.log('\n  📦 MODULES:');
            if (result.lawfulResults) {
                result.lawfulResults.forEach(r => {
                    const status = r.success ? '✓' : '✗';
                    const trusted = r.trusted ? ' [TRUSTED-ONLY]' : '';

                    if (r.node === 'ResearchNode' && r.output?.domain) {
                        console.log(`     ${status} ${r.node}${trusted}`);
                        console.log(`        Domain: ${r.output.domain}`);
                        console.log(`        Confidence: ${r.output.confidence}%`);
                        if (r.output.insights) {
                            console.log(`        Insights: ${r.output.insights.length}`);
                        }
                    } else {
                        console.log(`     ${status} ${r.node}${trusted}`);
                    }
                });
            }

            // Twin status (2x multiplier)
            console.log(`\n  👤 TWIN: L${result.twin?.level} | XP: ${result.twin?.XP}/${result.twin?.xpToNext} | XP Gained: ${result.twin?.xpGained} (2x)`);

            // Spirit status (2x multiplier)
            console.log(`  🦉 SPIRIT: L${result.spiritAnimal?.level} | Bond: ${result.spiritAnimal?.bond}/${result.spiritAnimal?.bondToNext} | Bond Gained: ${result.spiritAnimal?.bondGain} (2x)`);

            // Sigil status (all patterns)
            const sigil = trustedContext.sigil;
            if (sigil) {
                console.log(`  ✨ SIGIL: L${sigil.level} | ALL ${sigil.patternsUnlocked?.length} patterns unlocked`);
            }

        } catch (error) {
            console.error('  ❌ ERROR:', error.message);
        }
    }

    // Show trusted creator final state
    console.log('\n┌─────────────────────────────────────────────────────────────────────────┐');
    console.log('│ TRUSTED CREATOR FINAL STATE                                             │');
    console.log('├─────────────────────────────────────────────────────────────────────────┤');
    console.log(`│ Twin Level: ${trustedContext.twin?.level || 1}`);
    console.log(`│ Twin XP: ${trustedContext.twin?.XP || 0}`);
    console.log(`│ Twin Abilities: ${trustedContext.twin?.abilities?.join(', ') || 'observe'}`);
    console.log(`│ Twin Discoveries: ${trustedContext.twin?.discoveries || 0}`);
    console.log(`│ Spirit Level: ${trustedContext.spiritAnimal?.level || 1}`);
    console.log(`│ Spirit Bond: ${trustedContext.spiritAnimal?.bond || 10}`);
    console.log(`│ Sigil Level: ${trustedContext.sigil?.level || 1}`);
    console.log(`│ Sigil Patterns: ALL UNLOCKED`);
    console.log('└─────────────────────────────────────────────────────────────────────────┘');

    // ═══════════════════════════════════════════════════════════════════════════
    // COMPARISON
    // ═══════════════════════════════════════════════════════════════════════════
    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════════════════════');
    console.log('  COMPARISON: Mass User vs Trusted Creator');
    console.log('═══════════════════════════════════════════════════════════════════════════');
    console.log('');
    console.log('  │ Metric           │ Mass User      │ Trusted Creator │');
    console.log('  ├──────────────────┼────────────────┼─────────────────┤');
    console.log(`  │ Twin XP Total    │ ${String(massUserContext.twin?.XP || 0).padEnd(14)} │ ${String(trustedContext.twin?.XP || 0).padEnd(15)} │`);
    console.log(`  │ Spirit Bond      │ ${String(massUserContext.spiritAnimal?.bond || 10).padEnd(14)} │ ${String(trustedContext.spiritAnimal?.bond || 10).padEnd(15)} │`);
    console.log(`  │ Sigil Patterns   │ ${String(massUserContext.sigil?.patternsUnlocked?.length || 2).padEnd(14)} │ ${String(trustedContext.sigil?.patternsUnlocked?.length || 8).padEnd(15)} │`);
    console.log(`  │ Research Access  │ ${'NO'.padEnd(14)} │ ${'YES'.padEnd(15)} │`);
    console.log(`  │ Discoveries      │ ${String(massUserContext.twin?.discoveries || 0).padEnd(14)} │ ${String(trustedContext.twin?.discoveries || 0).padEnd(15)} │`);
    console.log('');

    console.log('╔═══════════════════════════════════════════════════════════════════════════╗');
    console.log('║   TEST COMPLETE                                                           ║');
    console.log('╚═══════════════════════════════════════════════════════════════════════════╝');
}

// Run the test
runTest();
