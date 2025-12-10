import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * TimeStream - Timeline scrubbing, playback control
 * Observe past, present, emergent futures
 * Scrub timeline, accelerate, freeze
 */

const TimeStream = ({ events = [], onSeek, onSpeedChange, ws }) => {
    const [isPlaying, setIsPlaying] = useState(true);
    const [speed, setSpeed] = useState(1.0);
    const [currentTime, setCurrentTime] = useState(Date.now());
    const [viewMode, setViewMode] = useState('live'); // live, history, future
    const [selectedEvent, setSelectedEvent] = useState(null);
    const timelineRef = useRef(null);

    // Time range
    const [timeRange, setTimeRange] = useState({
        start: Date.now() - 60000, // 1 minute ago
        end: Date.now() + 60000    // 1 minute ahead (prediction)
    });

    // Speed presets
    const speedPresets = [
        { label: '0.1x', value: 0.1 },
        { label: '0.5x', value: 0.5 },
        { label: '1x', value: 1.0 },
        { label: '2x', value: 2.0 },
        { label: '5x', value: 5.0 },
        { label: '10x', value: 10.0 }
    ];

    // Update current time
    useEffect(() => {
        if (!isPlaying) return;

        const interval = setInterval(() => {
            setCurrentTime(prev => prev + 100 * speed);
            setTimeRange(prev => ({
                start: prev.start + 100 * speed,
                end: prev.end + 100 * speed
            }));
        }, 100);

        return () => clearInterval(interval);
    }, [isPlaying, speed]);

    const handleSpeedChange = useCallback((newSpeed) => {
        setSpeed(newSpeed);
        if (onSpeedChange) onSpeedChange(newSpeed);
        if (ws && ws.readyState === 1) {
            ws.send(JSON.stringify({ command: 'set_speed', params: { speed: newSpeed } }));
        }
    }, [onSpeedChange, ws]);

    const handleSeek = useCallback((timestamp) => {
        setCurrentTime(timestamp);
        setViewMode('history');
        if (onSeek) onSeek(timestamp);
    }, [onSeek]);

    const handleTogglePlay = () => {
        setIsPlaying(prev => !prev);
        if (ws && ws.readyState === 1) {
            ws.send(JSON.stringify({
                command: isPlaying ? 'freeze' : 'resume',
                params: {}
            }));
        }
    };

    const handleGoLive = () => {
        setViewMode('live');
        setCurrentTime(Date.now());
        setTimeRange({
            start: Date.now() - 60000,
            end: Date.now() + 60000
        });
        setIsPlaying(true);
    };

    const formatTime = (ts) => {
        const date = new Date(ts);
        return date.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const formatDuration = (ms) => {
        const seconds = Math.abs(ms / 1000);
        if (seconds < 60) return `${seconds.toFixed(1)}s`;
        return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`;
    };

    // Calculate event position on timeline
    const getEventPosition = (timestamp) => {
        const range = timeRange.end - timeRange.start;
        const offset = timestamp - timeRange.start;
        return (offset / range) * 100;
    };

    // Filter events in current range
    const visibleEvents = events.filter(e =>
        e.timestamp >= timeRange.start && e.timestamp <= timeRange.end
    );

    const currentPosition = getEventPosition(currentTime);

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
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: '#fff', fontWeight: 'bold' }}>⏱️ Time Stream</span>
                    <span style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        background: viewMode === 'live' ? '#44ff4440' : '#ffaa4440',
                        color: viewMode === 'live' ? '#44ff44' : '#ffaa44',
                        border: `1px solid ${viewMode === 'live' ? '#44ff44' : '#ffaa44'}`
                    }}>
                        {viewMode === 'live' ? '🔴 LIVE' : '📜 HISTORY'}
                    </span>
                </div>
                <div style={{ color: '#4488ff', fontSize: '14px', fontFamily: 'monospace' }}>
                    {formatTime(currentTime)}
                </div>
            </div>

            {/* Playback Controls */}
            <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid #222',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
            }}>
                {/* Play/Pause */}
                <button
                    onClick={handleTogglePlay}
                    style={{
                        background: isPlaying ? '#ff444440' : '#44ff4440',
                        border: `1px solid ${isPlaying ? '#ff4444' : '#44ff44'}`,
                        color: isPlaying ? '#ff4444' : '#44ff44',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                >
                    {isPlaying ? '⏸️ Pause' : '▶️ Play'}
                </button>

                {/* Go Live */}
                {viewMode !== 'live' && (
                    <button
                        onClick={handleGoLive}
                        style={{
                            background: '#ff444440',
                            border: '1px solid #ff4444',
                            color: '#ff4444',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px'
                        }}
                    >
                        🔴 Go Live
                    </button>
                )}

                {/* Speed Controls */}
                <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
                    {speedPresets.map(preset => (
                        <button
                            key={preset.value}
                            onClick={() => handleSpeedChange(preset.value)}
                            style={{
                                background: speed === preset.value ? '#4488ff' : '#222',
                                border: `1px solid ${speed === preset.value ? '#4488ff' : '#444'}`,
                                color: speed === preset.value ? '#fff' : '#888',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '11px'
                            }}
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Timeline */}
            <div
                ref={timelineRef}
                style={{
                    padding: '20px 16px',
                    position: 'relative',
                    height: '100px'
                }}
            >
                {/* Timeline track */}
                <div style={{
                    position: 'absolute',
                    left: '16px',
                    right: '16px',
                    top: '50%',
                    height: '4px',
                    background: '#333',
                    borderRadius: '2px',
                    transform: 'translateY(-50%)'
                }}>
                    {/* Past section */}
                    <div style={{
                        position: 'absolute',
                        left: 0,
                        width: `${currentPosition}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #333, #4488ff)',
                        borderRadius: '2px 0 0 2px'
                    }} />
                </div>

                {/* Current time marker */}
                <div style={{
                    position: 'absolute',
                    left: `calc(16px + ${currentPosition}%)`,
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '16px',
                    height: '16px',
                    background: '#4488ff',
                    borderRadius: '50%',
                    border: '3px solid #fff',
                    boxShadow: '0 0 10px #4488ff',
                    zIndex: 10
                }} />

                {/* Event markers */}
                {visibleEvents.map((event, i) => {
                    const pos = getEventPosition(event.timestamp);
                    const colors = {
                        spawn: '#ffcc00',
                        branch: '#44ff88',
                        merge: '#ff88ff',
                        collapse: '#8888ff',
                        alert: '#ff4444',
                        flow: '#44ffff'
                    };
                    const color = colors[event.type] || '#888';

                    return (
                        <div
                            key={event.id || i}
                            onClick={() => {
                                setSelectedEvent(event);
                                handleSeek(event.timestamp);
                            }}
                            style={{
                                position: 'absolute',
                                left: `calc(16px + ${pos}%)`,
                                top: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: '10px',
                                height: '10px',
                                background: color,
                                borderRadius: '50%',
                                cursor: 'pointer',
                                opacity: selectedEvent?.id === event.id ? 1 : 0.6,
                                boxShadow: selectedEvent?.id === event.id ? `0 0 8px ${color}` : 'none',
                                transition: 'all 0.2s'
                            }}
                            title={`${event.type}: ${event.message || ''}`}
                        />
                    );
                })}

                {/* Time labels */}
                <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '16px',
                    color: '#666',
                    fontSize: '10px'
                }}>
                    {formatTime(timeRange.start)}
                </div>
                <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    color: '#888',
                    fontSize: '10px'
                }}>
                    NOW
                </div>
                <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '16px',
                    color: '#666',
                    fontSize: '10px'
                }}>
                    {formatTime(timeRange.end)}
                </div>
            </div>

            {/* Selected Event Detail */}
            {selectedEvent && (
                <div style={{
                    padding: '12px 16px',
                    borderTop: '1px solid #333',
                    background: '#111'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <span style={{
                                color: '#4488ff',
                                fontSize: '12px',
                                textTransform: 'uppercase',
                                fontWeight: 'bold'
                            }}>
                                {selectedEvent.type}
                            </span>
                            <span style={{ color: '#666', fontSize: '11px', marginLeft: '8px' }}>
                                {formatDuration(selectedEvent.timestamp - Date.now())} {selectedEvent.timestamp < Date.now() ? 'ago' : 'ahead'}
                            </span>
                        </div>
                        <button
                            onClick={() => setSelectedEvent(null)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#666',
                                cursor: 'pointer'
                            }}
                        >
                            ✕
                        </button>
                    </div>
                    <div style={{ color: '#aaa', fontSize: '12px', marginTop: '4px' }}>
                        {selectedEvent.message || 'No details'}
                    </div>
                </div>
            )}

            {/* Stats */}
            <div style={{
                padding: '8px 16px',
                borderTop: '1px solid #222',
                display: 'flex',
                gap: '16px',
                fontSize: '11px',
                color: '#666'
            }}>
                <span>Events: {visibleEvents.length}</span>
                <span>Speed: {speed}x</span>
                <span>Range: {formatDuration(timeRange.end - timeRange.start)}</span>
            </div>
        </div>
    );
};

export default TimeStream;
