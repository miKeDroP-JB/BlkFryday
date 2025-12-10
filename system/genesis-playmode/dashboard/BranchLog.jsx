import React, { useState, useEffect, useRef } from 'react';

const EventIcon = ({ type }) => {
    const icons = {
        spawn: '🌟',
        branch: '🌿',
        merge: '🔀',
        collapse: '💫',
        win: '🏆',
        phase: '⚡',
        alert: '⚠️',
        break: '🧘',
        flow: '🌊',
        suggestion: '💡',
        human: '👤',
        default: '•'
    };
    return <span>{icons[type] || icons.default}</span>;
};

const EventColor = (type) => {
    const colors = {
        spawn: '#ffcc00',
        branch: '#44ff88',
        merge: '#ff88ff',
        collapse: '#8888ff',
        win: '#ffff44',
        phase: '#ff8844',
        alert: '#ff4444',
        break: '#44ffff',
        flow: '#66ff66',
        suggestion: '#ffaa44',
        human: '#4488ff',
        default: '#888888'
    };
    return colors[type] || colors.default;
};

const BranchLog = ({ events = [], maxEvents = 50 }) => {
    const scrollRef = useRef(null);
    const [autoScroll, setAutoScroll] = useState(true);

    useEffect(() => {
        if (autoScroll && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [events, autoScroll]);

    const handleScroll = () => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
        setAutoScroll(isAtBottom);
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const displayEvents = events.slice(-maxEvents);

    return (
        <div style={{
            background: '#0a0a1a',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid #333',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header */}
            <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid #333',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0
            }}>
                <span style={{ color: '#fff', fontWeight: 'bold' }}>📜 Event Log</span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ color: '#666', fontSize: '12px' }}>
                        {events.length} events
                    </span>
                    <button
                        onClick={() => setAutoScroll(!autoScroll)}
                        style={{
                            background: autoScroll ? '#44ff8840' : '#33333340',
                            border: `1px solid ${autoScroll ? '#44ff88' : '#444'}`,
                            color: autoScroll ? '#44ff88' : '#888',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            cursor: 'pointer'
                        }}
                    >
                        {autoScroll ? 'AUTO' : 'MANUAL'}
                    </button>
                </div>
            </div>

            {/* Events list */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '8px'
                }}
            >
                {displayEvents.length === 0 ? (
                    <div style={{
                        color: '#666',
                        textAlign: 'center',
                        padding: '20px',
                        fontSize: '13px'
                    }}>
                        Waiting for events...
                    </div>
                ) : (
                    displayEvents.map((event, i) => (
                        <div
                            key={event.id || i}
                            style={{
                                display: 'flex',
                                gap: '8px',
                                padding: '6px 8px',
                                borderRadius: '4px',
                                marginBottom: '2px',
                                background: i === displayEvents.length - 1 ? '#ffffff08' : 'transparent',
                                borderLeft: `3px solid ${EventColor(event.type)}`,
                                transition: 'background 0.2s'
                            }}
                        >
                            {/* Icon */}
                            <div style={{ fontSize: '14px', width: '20px' }}>
                                <EventIcon type={event.type} />
                            </div>

                            {/* Content */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                    color: EventColor(event.type),
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase'
                                }}>
                                    {event.type}
                                </div>
                                <div style={{
                                    color: '#ccc',
                                    fontSize: '12px',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {event.message || event.data || 'No details'}
                                </div>
                            </div>

                            {/* Timestamp */}
                            <div style={{
                                color: '#666',
                                fontSize: '10px',
                                flexShrink: 0
                            }}>
                                {formatTime(event.timestamp)}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Legend */}
            <div style={{
                padding: '8px 12px',
                borderTop: '1px solid #333',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                fontSize: '10px',
                color: '#666',
                flexShrink: 0
            }}>
                {['spawn', 'branch', 'merge', 'flow', 'alert'].map(type => (
                    <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <EventIcon type={type} />
                        <span style={{ color: EventColor(type) }}>{type}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BranchLog;
