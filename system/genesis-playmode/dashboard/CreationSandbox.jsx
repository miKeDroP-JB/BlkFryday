import React, { useState, useCallback } from 'react';

/**
 * CreationSandbox - Interactive parameter editing & node spawning
 * Spawn new nodes, tweak physics, infinite parameter editing
 */

const SliderControl = ({ label, value, min, max, step, onChange, color }) => (
    <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: '#aaa', fontSize: '12px' }}>{label}</span>
            <span style={{ color: color || '#fff', fontSize: '12px', fontWeight: 'bold' }}>{value}</span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            style={{
                width: '100%',
                height: '6px',
                appearance: 'none',
                background: `linear-gradient(to right, ${color || '#4488ff'} ${((value - min) / (max - min)) * 100}%, #333 0%)`,
                borderRadius: '3px',
                cursor: 'pointer'
            }}
        />
    </div>
);

const ActionButton = ({ children, onClick, color, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        style={{
            background: disabled ? '#333' : `linear-gradient(135deg, ${color}80, ${color})`,
            border: `1px solid ${color}`,
            color: '#fff',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            fontWeight: 'bold',
            opacity: disabled ? 0.5 : 1,
            transition: 'all 0.2s'
        }}
    >
        {children}
    </button>
);

const CreationSandbox = ({ ws, onSpawn, onTweak }) => {
    // Universe parameters
    const [universeParams, setUniverseParams] = useState({
        dimensions: 3,
        complexity: 50,
        stability: 0.8,
        entropy: 0.1,
        resonance: 0.5
    });

    // Branch parameters
    const [branchParams, setBranchParams] = useState({
        branchFactor: 5,
        beamWidth: 10,
        maxDepth: 15,
        explorationRate: 0.3
    });

    // Physics parameters
    const [physicsParams, setPhysicsParams] = useState({
        gravity: 1.0,
        timeScale: 1.0,
        particleMass: 1.0,
        interactionStrength: 0.5,
        decayRate: 0.01
    });

    // Spawn counter
    const [spawnCount, setSpawnCount] = useState(0);

    const sendCommand = useCallback((command, params) => {
        if (ws && ws.readyState === 1) {
            ws.send(JSON.stringify({ command, params }));
        }
    }, [ws]);

    const handleSpawnUniverse = () => {
        sendCommand('spawn_universe', universeParams);
        setSpawnCount(prev => prev + 1);
        if (onSpawn) onSpawn({ type: 'universe', params: universeParams });
    };

    const handleSpawnBranch = () => {
        sendCommand('spawn_branch', branchParams);
        setSpawnCount(prev => prev + 1);
        if (onSpawn) onSpawn({ type: 'branch', params: branchParams });
    };

    const handleApplyPhysics = () => {
        sendCommand('apply_physics', physicsParams);
        if (onTweak) onTweak({ type: 'physics', params: physicsParams });
    };

    const handleBoost = () => sendCommand('boost', { factor: 2.0 });
    const handleSlow = () => sendCommand('slow', { factor: 0.5 });
    const handleFreeze = () => sendCommand('freeze', {});
    const handleResume = () => sendCommand('resume', {});

    return (
        <div style={{
            background: '#0a0a1a',
            borderRadius: '12px',
            border: '1px solid #333',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid #333',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <span style={{ color: '#fff', fontWeight: 'bold' }}>🎨 Creation Sandbox</span>
                <span style={{ color: '#666', fontSize: '12px' }}>Spawned: {spawnCount}</span>
            </div>

            <div style={{ padding: '16px' }}>
                {/* Quick Actions */}
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ color: '#888', fontSize: '11px', marginBottom: '8px', textTransform: 'uppercase' }}>
                        Quick Actions
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <ActionButton onClick={handleBoost} color="#44ff44">⚡ Boost</ActionButton>
                        <ActionButton onClick={handleSlow} color="#ffaa44">🐢 Slow</ActionButton>
                        <ActionButton onClick={handleFreeze} color="#4488ff">❄️ Freeze</ActionButton>
                        <ActionButton onClick={handleResume} color="#ff88ff">▶️ Resume</ActionButton>
                    </div>
                </div>

                {/* Universe Controls */}
                <div style={{ marginBottom: '20px' }}>
                    <div style={{
                        color: '#888',
                        fontSize: '11px',
                        marginBottom: '12px',
                        textTransform: 'uppercase',
                        display: 'flex',
                        justifyContent: 'space-between'
                    }}>
                        <span>Universe Parameters</span>
                        <ActionButton onClick={handleSpawnUniverse} color="#ffcc00">🌌 Spawn</ActionButton>
                    </div>
                    <SliderControl
                        label="Dimensions"
                        value={universeParams.dimensions}
                        min={2} max={11} step={1}
                        onChange={(v) => setUniverseParams(p => ({ ...p, dimensions: v }))}
                        color="#ff88ff"
                    />
                    <SliderControl
                        label="Complexity"
                        value={universeParams.complexity}
                        min={1} max={100} step={1}
                        onChange={(v) => setUniverseParams(p => ({ ...p, complexity: v }))}
                        color="#ffaa44"
                    />
                    <SliderControl
                        label="Stability"
                        value={universeParams.stability}
                        min={0} max={1} step={0.05}
                        onChange={(v) => setUniverseParams(p => ({ ...p, stability: v }))}
                        color="#44ff88"
                    />
                    <SliderControl
                        label="Entropy"
                        value={universeParams.entropy}
                        min={0} max={1} step={0.05}
                        onChange={(v) => setUniverseParams(p => ({ ...p, entropy: v }))}
                        color="#ff4444"
                    />
                </div>

                {/* Branch Controls */}
                <div style={{ marginBottom: '20px' }}>
                    <div style={{
                        color: '#888',
                        fontSize: '11px',
                        marginBottom: '12px',
                        textTransform: 'uppercase',
                        display: 'flex',
                        justifyContent: 'space-between'
                    }}>
                        <span>Branch Parameters</span>
                        <ActionButton onClick={handleSpawnBranch} color="#44ff88">🌿 Spawn</ActionButton>
                    </div>
                    <SliderControl
                        label="Branch Factor"
                        value={branchParams.branchFactor}
                        min={1} max={20} step={1}
                        onChange={(v) => setBranchParams(p => ({ ...p, branchFactor: v }))}
                        color="#44ffff"
                    />
                    <SliderControl
                        label="Beam Width"
                        value={branchParams.beamWidth}
                        min={1} max={50} step={1}
                        onChange={(v) => setBranchParams(p => ({ ...p, beamWidth: v }))}
                        color="#88ff88"
                    />
                    <SliderControl
                        label="Max Depth"
                        value={branchParams.maxDepth}
                        min={1} max={30} step={1}
                        onChange={(v) => setBranchParams(p => ({ ...p, maxDepth: v }))}
                        color="#ff88ff"
                    />
                    <SliderControl
                        label="Exploration Rate"
                        value={branchParams.explorationRate}
                        min={0} max={1} step={0.05}
                        onChange={(v) => setBranchParams(p => ({ ...p, explorationRate: v }))}
                        color="#ffcc44"
                    />
                </div>

                {/* Physics Controls */}
                <div>
                    <div style={{
                        color: '#888',
                        fontSize: '11px',
                        marginBottom: '12px',
                        textTransform: 'uppercase',
                        display: 'flex',
                        justifyContent: 'space-between'
                    }}>
                        <span>Physics Parameters</span>
                        <ActionButton onClick={handleApplyPhysics} color="#4488ff">⚙️ Apply</ActionButton>
                    </div>
                    <SliderControl
                        label="Gravity"
                        value={physicsParams.gravity}
                        min={0} max={3} step={0.1}
                        onChange={(v) => setPhysicsParams(p => ({ ...p, gravity: v }))}
                        color="#8888ff"
                    />
                    <SliderControl
                        label="Time Scale"
                        value={physicsParams.timeScale}
                        min={0.1} max={5} step={0.1}
                        onChange={(v) => setPhysicsParams(p => ({ ...p, timeScale: v }))}
                        color="#ffff44"
                    />
                    <SliderControl
                        label="Interaction Strength"
                        value={physicsParams.interactionStrength}
                        min={0} max={2} step={0.1}
                        onChange={(v) => setPhysicsParams(p => ({ ...p, interactionStrength: v }))}
                        color="#ff8844"
                    />
                </div>
            </div>
        </div>
    );
};

export default CreationSandbox;
