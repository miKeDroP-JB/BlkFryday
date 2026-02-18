/**
 * HyperControls.jsx
 * Control panel for HyperMode features
 */

import React, { useState, useEffect } from 'react';

export default function HyperControls({ wsUrl = 'ws://localhost:8081' }) {
    const [connected, setConnected] = useState(false);
    const [status, setStatus] = useState({});
    const [ws, setWs] = useState(null);

    useEffect(() => {
        const socket = new WebSocket(wsUrl);

        socket.onopen = () => {
            setConnected(true);
            setWs(socket);
        };

        socket.onmessage = (e) => {
            const m = JSON.parse(e.data);
            if (m.type === 'metric_update') {
                setStatus(m);
            }
        };

        socket.onclose = () => {
            setConnected(false);
            setWs(null);
        };

        socket.onerror = () => {
            setConnected(false);
        };

        return () => socket.close();
    }, [wsUrl]);

    const sendCmd = (cmd, payload = {}) => {
        // Send via WebSocket if connected
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'command', cmd, payload }));
        }

        // Also try HTTP endpoint
        fetch('/api/command', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cmd, payload })
        }).catch(() => {});
    };

    const buttonStyle = {
        padding: '6px 12px',
        margin: '2px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontFamily: 'monospace',
        fontSize: '11px',
        transition: 'all 0.2s'
    };

    return (
        <div style={{
            position: 'absolute',
            left: 12,
            top: 12,
            zIndex: 30,
            background: 'rgba(13, 17, 23, 0.9)',
            padding: 12,
            borderRadius: 8,
            border: '1px solid #21262d',
            fontFamily: 'monospace'
        }}>
            <div style={{
                color: '#9ad',
                fontSize: 14,
                fontWeight: 'bold',
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 8
            }}>
                <span>🚀 HyperMode</span>
                <span style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: connected ? '#3fb950' : '#f85149'
                }} />
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8, maxWidth: 260 }}>
                <button
                    onClick={() => sendCmd('boost')}
                    style={{ ...buttonStyle, background: '#238636', color: '#fff' }}
                >
                    ⚡ Boost
                </button>
                <button
                    onClick={() => sendCmd('slow')}
                    style={{ ...buttonStyle, background: '#21262d', color: '#8b949e' }}
                >
                    🐢 Slow
                </button>
                <button
                    onClick={() => sendCmd('freeze')}
                    style={{ ...buttonStyle, background: '#1f6feb', color: '#fff' }}
                >
                    ❄️ Freeze
                </button>
                <button
                    onClick={() => sendCmd('splitFocused')}
                    style={{ ...buttonStyle, background: '#a371f7', color: '#fff' }}
                >
                    🔀 Split
                </button>
                <button
                    onClick={() => sendCmd('mergeClosest')}
                    style={{ ...buttonStyle, background: '#f0883e', color: '#fff' }}
                >
                    🔗 Merge
                </button>
            </div>

            <pre style={{
                color: '#7cf',
                marginTop: 12,
                width: 260,
                background: 'rgba(0, 0, 0, 0.4)',
                padding: 8,
                borderRadius: 4,
                fontSize: 10,
                maxHeight: 150,
                overflow: 'auto'
            }}>
                {JSON.stringify(status, null, 2) || '{ awaiting data... }'}
            </pre>

            {status.stats && (
                <div style={{ marginTop: 8, fontSize: 10, color: '#8b949e' }}>
                    <div>Branches: {status.stats.branchesSpawned || 0}</div>
                    <div>Wins: {status.stats.wins || 0}</div>
                </div>
            )}
        </div>
    );
}
