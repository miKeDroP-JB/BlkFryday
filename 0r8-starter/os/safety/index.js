/**
 * ORBOS SAFETY SYSTEM
 * ===================
 * Human-only failsafe for agent autonomy
 */

const { SafetySwitch, SafetyCLI, SAFETY_LEVELS, PROTECTED_ACTIONS } = require('./switch');

module.exports = {
    SafetySwitch,
    SafetyCLI,
    SAFETY_LEVELS,
    PROTECTED_ACTIONS,

    // Quick create
    create: (config) => new SafetySwitch(config),

    // Boot CLI
    cli: (config) => {
        const safety = new SafetySwitch(config);
        const cli = new SafetyCLI(safety);
        cli.start();
        return { safety, cli };
    }
};
