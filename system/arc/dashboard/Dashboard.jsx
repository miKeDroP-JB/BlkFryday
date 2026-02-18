/**
 * Amoeba V4.0 Live Dashboard
 * Real-time metrics visualization via WebSocket
 */

import React, { useEffect, useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
    const [metrics, setMetrics] = useState([]);
    const [progress, setProgress] = useState(null);
    const [branches, setBranches] = useState([]);
    const [connected, setConnected] = useState(false);
    const [stats, setStats] = useState({ totalBranches: 0, successfulBranches: 0 });

    useEffect(() => {
        const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8080';
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            setConnected(true);
            // Subscribe to all channels
            ws.send(JSON.stringify({
                type: 'subscribe',
                channels: ['metrics', 'progress', 'results', 'branch']
            }));
        };

        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);

            switch (msg.type) {
                case 'metrics':
                    setMetrics(prev => {
                        const updated = [...prev, {
                            ...msg.data,
                            time: new Date(msg.timestamp).toLocaleTimeString()
                        }];
                        // Keep last 100 data points
                        return updated.slice(-100);
                    });
                    if (msg.data.totalBranches) {
                        setStats({
                            totalBranches: msg.data.totalBranches,
                            successfulBranches: msg.data.successfulBranches || 0
                        });
                    }
                    break;

                case 'progress':
                    setProgress(msg.data);
                    break;

                case 'branch':
                    setBranches(prev => {
                        const updated = [...prev, { ...msg.data, time: msg.timestamp }];
                        return updated.slice(-50);
                    });
                    break;

                case 'init':
                    console.log('Connected to Amoeba server:', msg.message);
                    break;

                default:
                    break;
            }
        };

        ws.onclose = () => {
            setConnected(false);
        };

        ws.onerror = (err) => {
            console.error('WebSocket error:', err);
            setConnected(false);
        };

        return () => ws.close();
    }, []);

    const successRate = stats.totalBranches > 0
        ? ((stats.successfulBranches / stats.totalBranches) * 100).toFixed(1)
        : 0;

    return (
        <div style={{ padding: 20, fontFamily: 'monospace', background: '#0d1117', color: '#c9d1d9', minHeight: '100vh' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h1 style={{ margin: 0, color: '#58a6ff' }}>
                    🧬 Amoeba V4.0 Live Dashboard
                </h1>
                <div style={{
                    padding: '8px 16px',
                    borderRadius: 4,
                    background: connected ? '#238636' : '#da3633',
                    color: '#fff'
                }}>
                    {connected ? '🟢 Connected' : '🔴 Disconnected'}
                </div>
            </header>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                <StatCard label="Generation" value={progress?.generation || 0} />
                <StatCard label="Current Phase" value={progress?.phase || 'Idle'} />
                <StatCard label="Total Branches" value={stats.totalBranches} />
                <StatCard label="Success Rate" value={`${successRate}%`} color={successRate > 50 ? '#3fb950' : '#f85149'} />
            </div>

            {/* Progress Bar */}
            {progress && (
                <div style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span>Phase Progress</span>
                        <span>{progress.currentPhase}/{progress.totalPhases}</span>
                    </div>
                    <div style={{ background: '#21262d', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                        <div style={{
                            width: `${(progress.currentPhase / progress.totalPhases) * 100}%`,
                            background: 'linear-gradient(90deg, #238636, #3fb950)',
                            height: '100%',
                            transition: 'width 0.3s ease'
                        }} />
                    </div>
                </div>
            )}

            {/* Metrics Chart */}
            <div style={{ background: '#161b22', borderRadius: 8, padding: 16, marginBottom: 24 }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#8b949e' }}>Success Rate Over Time</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={metrics}>
                        <CartesianGrid stroke="#30363d" strokeDasharray="3 3" />
                        <XAxis dataKey="time" stroke="#8b949e" fontSize={10} />
                        <YAxis stroke="#8b949e" domain={[0, 1]} />
                        <Tooltip
                            contentStyle={{ background: '#21262d', border: '1px solid #30363d', borderRadius: 4 }}
                            labelStyle={{ color: '#8b949e' }}
                        />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="successRate"
                            stroke="#58a6ff"
                            strokeWidth={2}
                            dot={false}
                            name="Success Rate"
                        />
                        <Line
                            type="monotone"
                            dataKey="score"
                            stroke="#3fb950"
                            strokeWidth={2}
                            dot={false}
                            name="Score"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Branch Events */}
            <div style={{ background: '#161b22', borderRadius: 8, padding: 16 }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#8b949e' }}>Branch Events</h3>
                <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                    {branches.slice().reverse().map((b, i) => (
                        <div key={i} style={{
                            padding: '8px 12px',
                            borderBottom: '1px solid #21262d',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <span>
                                <EventIcon event={b.event} />
                                {' '}
                                <span style={{ color: '#c9d1d9' }}>{b.phase}</span>
                                {' → '}
                                <span style={{ color: '#8b949e' }}>Branch {b.branchId}</span>
                            </span>
                            <span style={{ color: '#484f58', fontSize: 12 }}>
                                {new Date(b.time).toLocaleTimeString()}
                            </span>
                        </div>
                    ))}
                    {branches.length === 0 && (
                        <div style={{ color: '#484f58', textAlign: 'center', padding: 20 }}>
                            Waiting for branch events...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, color }) {
    return (
        <div style={{
            background: '#161b22',
            borderRadius: 8,
            padding: 16,
            border: '1px solid #21262d'
        }}>
            <div style={{ color: '#8b949e', fontSize: 12, marginBottom: 4 }}>{label}</div>
            <div style={{ color: color || '#c9d1d9', fontSize: 24, fontWeight: 'bold' }}>{value}</div>
        </div>
    );
}

function EventIcon({ event }) {
    switch (event) {
        case 'spawn': return <span style={{ color: '#58a6ff' }}>🔹</span>;
        case 'completed': return <span style={{ color: '#3fb950' }}>✓</span>;
        case 'failed': return <span style={{ color: '#f85149' }}>✗</span>;
        case 'evolved': return <span style={{ color: '#a371f7' }}>🧬</span>;
        default: return <span>•</span>;
    }
}
