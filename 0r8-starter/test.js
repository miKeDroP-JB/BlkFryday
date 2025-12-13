import { handleUserInput } from './index.js';

// Dummy user context
const userContext = {
    userId: 'user123',
    memory: [],
    preferences: { layout: 'default' },
    twin: { name: 'Echo', abilities: ['logic', 'speed'] },
    spiritAnimal: { species: 'owl' },
    recentInputs: []
};

// Sample inputs for testing
const testInputs = [
    "Hello 0r8, what do you think about AI?",
    "This is a secret input for the Sigil.",
    "Normal message to test FlowSync processing.",
    "!!!@@@### suspicious characters ???"
];

// Function to simulate sequential user input
async function runTest() {
    console.log('╔═══════════════════════════════════════════════════════════════════════════╗');
    console.log('║   0R8-STARTER TEST HARNESS                                                ║');
    console.log('╚═══════════════════════════════════════════════════════════════════════════╝');
    console.log('');

    for (const input of testInputs) {
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`INPUT: "${input}"`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

        // Push to recent inputs for Amoeba security
        userContext.recentInputs.push(Date.now());

        try {
            // Handle input through full scaffold
            const result = await handleUserInput(input, userContext);

            // Output results
            console.log('\n📦 MODULE RESULTS:');
            if (result.lawfulResults && result.lawfulResults.length > 0) {
                result.lawfulResults.forEach((r, i) => {
                    console.log(`   [${i + 1}] ${r.node || 'Unknown'}: ${r.lawful ? '✓ Lawful' : '✗ Violation'}`);
                });
            } else {
                console.log('   No module results');
            }

            console.log('\n👤 TWIN AVATAR:');
            console.log(`   Name: ${result.twin?.name || 'Unknown'}`);
            console.log(`   Mood: ${result.twin?.moodEmoji || ''} ${result.twin?.mood || 'neutral'}`);
            console.log(`   Energy: ${result.twin?.energy || 0}%`);
            console.log(`   Level: ${result.twin?.level || 1} (XP: ${result.twin?.xp || 0}/${result.twin?.xpToNext || 100})`);

            console.log('\n🦉 SPIRIT ANIMAL:');
            console.log(`   Species: ${result.spiritAnimal?.emoji || ''} ${result.spiritAnimal?.species || 'Unknown'}`);
            console.log(`   Energy: ${result.spiritAnimal?.energy || 'Unknown'}`);
            console.log(`   Bond: ${((result.spiritAnimal?.bondStrength || 0) * 100).toFixed(0)}%`);
            if (result.spiritAnimal?.message) {
                console.log(`   Message: "${result.spiritAnimal.message}"`);
            }

            console.log('\n🛡️ SECURITY:');
            console.log(`   Risk Score: ${((result.securityReport?.riskScore || 0) * 100).toFixed(0)}%`);
            console.log(`   Blocked: ${result.securityReport?.blocked ? 'YES' : 'NO'}`);
            if (result.securityReport?.anomalies?.length > 0) {
                console.log(`   Anomalies: ${result.securityReport.anomalies.join(', ')}`);
            }

            console.log('\n⏱️ LATENCY:', result.latency + 'ms');

        } catch (error) {
            console.error('\n❌ ERROR:', error.message);
        }
    }

    console.log('\n');
    console.log('╔═══════════════════════════════════════════════════════════════════════════╗');
    console.log('║   TEST COMPLETE                                                           ║');
    console.log('╚═══════════════════════════════════════════════════════════════════════════╝');
}

// Run the test
runTest();
