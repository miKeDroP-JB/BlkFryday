import React, { useState, useEffect, useCallback } from 'react';
import MetricsCards from './MetricsCards';
import UniverseView from './UniverseView';
import BranchLog from './BranchLog';

const Dashboard = () => {
    const [connected, setConnected] = useState(false);
    const [humanData, setHumanData] = useState(null);
    const [universeData, setUniverseData] = useState({ universes: [], branches: [] });
    const [events, setEvents] = useState([]);
    const [suggestion, setSuggestion] = useState(null);
    const [ws, setWs] = useState(null);

    // Connect to WebSocket
    useEffect(() => {
        const connect = () => {
            const socket = new WebSocket('ws://localhost:8085');

            socket.onopen = () => {
                setConnected(true);
                console.log('Connected to Human Node');
                addEvent({ type: 'human', message: 'Connected to Human Node' });
            };

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    handleMessage(data);
                } catch (e) {
                    console.error('Parse error:', e);
                }
            };

            socket.onclose = () => {
                setConnected(false);
                console.log('Disconnected');
                addEvent({ type: 'alert', message: 'Disconnected from server' });
                // Reconnect after 3 seconds
                setTimeout(connect, 3000);
            };

            socket.onerror = (err) => {
                console.error('WebSocket error:', err);
            };

            setWs(socket);
        };

        connect();

        return () => {
            if (ws) ws.close();
        };
    }, []);

    const handleMessage = useCallback((data) => {
        switch (data.type) {
            case 'init':
            case 'update':
                setHumanData(data.data);

                // Check for flow state change
                if (data.data?.state?.inFlow) {
                    addEvent({ type: 'flow', message: 'Flow state detected!' });
                }
                break;

            case 'suggestion':
                setSuggestion(data.suggestion);
                addEvent({
                    type: 'suggestion',
                    message: data.suggestion?.message || 'New suggestion'
                });
                break;

            case 'universe_update':
                setUniverseData(prev => ({
                    ...prev,
                    universes: data.universes || prev.universes
                }));
                break;

            case 'branch_event':
                setUniverseData(prev => ({
                    ...prev,
                    branches: [...prev.branches.slice(-100), data.branch]
                }));
                addEvent({
                    type: data.eventType || 'branch',
                    message: data.message || `Branch: ${data.branch?.id}`
                });
                break;

            default:
                if (data.type) {
                    addEvent({ type: data.type, message: JSON.stringify(data).slice(0, 100) });
                }
        }
    }, []);

    const addEvent = useCallback((event) => {
        setEvents(prev => [...prev.slice(-200), {
            ...event,
            id: Date.now() + Math.random(),
            timestamp: Date.now()
        }]);
    }, []);

    const handleBreak = () => {
        if (ws && ws.readyState === 1) {
            ws.send(JSON.stringify({ type: 'take_break', duration: 10 }));
            addEvent({ type: 'break', message: 'Taking a break' });
        }
    };

    const handleAcceptSuggestion = () => {
        if (ws && ws.readyState === 1) {
            ws.send(JSON.stringify({ type: 'accept_suggestion' }));
            setSuggestion(null);
            addEvent({ type: 'human', message: 'Accepted suggestion' });
        }
    };

    const handleDeclineSuggestion = () => {
        if (ws && ws.readyState === 1) {
            ws.send(JSON.stringify({ type: 'decline_suggestion' }));
            setSuggestion(null);
        }
    };

    return (
        <div style={{
            background: '#0f0f1a',
            minHeight: '100vh',
            padding: '20px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#fff'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
            }}>
                <div>
                    <h1 style={{
                        margin: 0,
                        fontSize: '24px',
                        background: 'linear-gradient(90deg, #4488ff, #ff88ff)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        🎮 Genesis PlayMode
                    </h1>
                    <div style={{ color: '#666', fontSize: '13px', marginTop: '4px' }}>
                        Human Node Dashboard
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {/* Connection status */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        background: connected ? '#44ff4420' : '#ff444420',
                        border: `1px solid ${connected ? '#44ff44' : '#ff4444'}`,
                        borderRadius: '20px',
                        fontSize: '12px'
                    }}>
                        <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: connected ? '#44ff44' : '#ff4444'
                        }} />
                        {connected ? 'Connected' : 'Disconnected'}
                    </div>

                    {/* Break button */}
                    <button
                        onClick={handleBreak}
                        style={{
                            background: 'linear-gradient(135deg, #4488ff, #6644ff)',
                            border: 'none',
                            color: '#fff',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: 'bold'
                        }}
                    >
                        🧘 Take Break
                    </button>
                </div>
            </div>

            {/* Suggestion banner */}
            {suggestion && (
                <div style={{
                    background: 'linear-gradient(135deg, #ffaa4420, #ff884420)',
                    border: '1px solid #ffaa44',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ffaa44' }}>
                            💡 Suggestion
                        </div>
                        <div style={{ color: '#fff', marginTop: '4px' }}>
                            {suggestion.message}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={handleAcceptSuggestion}
                            style={{
                                background: '#44ff44',
                                border: 'none',
                                color: '#000',
                                padding: '8px 16px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            Accept
                        </button>
                        <button
                            onClick={handleDeclineSuggestion}
                            style={{
                                background: '#333',
                                border: '1px solid #555',
                                color: '#888',
                                padding: '8px 16px',
                                borderRadius: '6px',
                                cursor: 'pointer'
                            }}
                        >
                            Later
                        </button>
                    </div>
                </div>
            )}

            {/* Metrics cards */}
            <MetricsCards data={humanData} />

            {/* Main content */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr',
                gap: '20px',
                marginTop: '20px'
            }}>
                {/* Universe view */}
                <UniverseView
                    humanData={humanData}
                    universeData={universeData}
                />

                {/* Event log */}
                <div style={{ height: '600px' }}>
                    <BranchLog events={events} />
                </div>
            </div>

            {/* Footer */}
            <div style={{
                marginTop: '20px',
                padding: '12px',
                textAlign: 'center',
                color: '#666',
                fontSize: '12px'
            }}>
                Genesis PlayMode v1.0 • Human Node Integration Layer
            </div>
        </div>
    );
};

export default Dashboard;
