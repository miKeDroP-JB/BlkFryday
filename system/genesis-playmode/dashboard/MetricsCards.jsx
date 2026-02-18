import React from 'react';

const MetricCard = ({ label, value, level, color, icon, trend }) => {
    const trendIcon = trend > 0 ? '↑' : trend < 0 ? '↓' : '→';
    const trendColor = trend > 0 ? '#44ff44' : trend < 0 ? '#ff4444' : '#888888';

    return (
        <div style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            borderRadius: '12px',
            padding: '16px',
            border: `2px solid ${color}40`,
            boxShadow: `0 4px 20px ${color}20`
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '24px' }}>{icon}</span>
                <span style={{ color: trendColor, fontSize: '14px' }}>{trendIcon}</span>
            </div>

            <div style={{ marginTop: '12px' }}>
                <div style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase' }}>
                    {label}
                </div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: color }}>
                    {typeof value === 'number' ? Math.round(value) : value}
                    {typeof value === 'number' && <span style={{ fontSize: '14px', color: '#666' }}>%</span>}
                </div>
                <div style={{
                    fontSize: '11px',
                    color: color,
                    textTransform: 'uppercase',
                    marginTop: '4px'
                }}>
                    {level}
                </div>
            </div>

            {/* Progress bar */}
            <div style={{
                marginTop: '12px',
                height: '4px',
                background: '#333',
                borderRadius: '2px',
                overflow: 'hidden'
            }}>
                <div style={{
                    width: `${typeof value === 'number' ? value : 50}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${color}80, ${color})`,
                    transition: 'width 0.3s ease'
                }} />
            </div>
        </div>
    );
};

const MetricsCards = ({ data }) => {
    if (!data) return null;

    const { metrics, state, session } = data;

    const cards = [
        {
            label: 'Energy',
            value: metrics?.energy || 0,
            level: state?.energyLevel || 'unknown',
            color: state?.energyLevel === 'high' ? '#44ff44' :
                   state?.energyLevel === 'medium' ? '#ffaa00' : '#ff4444',
            icon: '⚡',
            trend: 0
        },
        {
            label: 'Focus',
            value: metrics?.focus || 0,
            level: state?.focusLevel || 'unknown',
            color: state?.focusLevel === 'hyperfocus' ? '#ff66ff' :
                   state?.focusLevel === 'flow' ? '#66ff66' :
                   state?.focusLevel === 'normal' ? '#6666ff' : '#ff6666',
            icon: '🎯',
            trend: 0
        },
        {
            label: 'Mood',
            value: ((metrics?.mood || 0) + 1) * 50, // Convert -1 to 1 to 0-100
            level: state?.moodLevel || 'unknown',
            color: state?.moodLevel === 'positive' ? '#ffcc00' :
                   state?.moodLevel === 'neutral' ? '#888888' : '#8844aa',
            icon: '😊',
            trend: 0
        },
        {
            label: 'Rest',
            value: metrics?.rest || 0,
            level: state?.restLevel || 'unknown',
            color: state?.restLevel === 'refreshed' ? '#44ffff' :
                   state?.restLevel === 'rested' ? '#44ff88' :
                   state?.restLevel === 'tired' ? '#ffaa44' : '#ff4444',
            icon: '🌙',
            trend: 0
        }
    ];

    return (
        <div>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '16px',
                marginBottom: '20px'
            }}>
                {cards.map((card, i) => (
                    <MetricCard key={i} {...card} />
                ))}
            </div>

            {/* Status bar */}
            <div style={{
                display: 'flex',
                gap: '20px',
                padding: '12px 16px',
                background: '#1a1a2e',
                borderRadius: '8px',
                fontSize: '13px'
            }}>
                <div>
                    <span style={{ color: '#666' }}>Session: </span>
                    <span style={{ color: '#fff' }}>{Math.round(metrics?.sessionDuration || 0)} min</span>
                </div>
                <div>
                    <span style={{ color: '#666' }}>Flow time: </span>
                    <span style={{ color: '#66ff66' }}>{Math.round(session?.flowMinutes || 0)} min</span>
                </div>
                <div>
                    <span style={{ color: '#666' }}>Breaks: </span>
                    <span style={{ color: '#ffaa00' }}>{session?.breaks || 0}</span>
                </div>
                {state?.inFlow && (
                    <div style={{
                        marginLeft: 'auto',
                        color: '#66ff66',
                        fontWeight: 'bold'
                    }}>
                        🌊 IN FLOW
                    </div>
                )}
                {state?.needsBreak && (
                    <div style={{
                        marginLeft: state?.inFlow ? '0' : 'auto',
                        color: '#ff6644',
                        fontWeight: 'bold'
                    }}>
                        ⚠️ NEEDS BREAK
                    </div>
                )}
            </div>
        </div>
    );
};

export default MetricsCards;
