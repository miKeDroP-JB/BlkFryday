import React, { useState, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import Dashboard from './Dashboard';
import SwarmDashboard from './SwarmDashboard';
import SwarmDashboardMax from './SwarmDashboardMax';

// Lazy load heavy 3D dashboards (Three.js bundle)
const SwarmDashboard3D = lazy(() => import('./SwarmDashboard3D'));
const SwarmDashboard3DVR = lazy(() => import('./SwarmDashboard3DVR'));
const SwarmDashboard3DVRInteract = lazy(() => import('./SwarmDashboard3DVRInteract'));

function App() {
    const [view, setView] = useState('metrics');

    return (
        <div style={{ minHeight: '100vh', background: '#0d1117' }}>
            {/* View Switcher */}
            <div style={{
                position: 'fixed',
                top: 16,
                right: 16,
                zIndex: 100,
                display: 'flex',
                gap: 6,
                fontFamily: 'monospace',
                flexWrap: 'wrap',
                maxWidth: 500,
                justifyContent: 'flex-end'
            }}>
                <ViewButton
                    active={view === 'metrics'}
                    onClick={() => setView('metrics')}
                    icon="📊"
                    label="Metrics"
                />
                <ViewButton
                    active={view === 'swarm'}
                    onClick={() => setView('swarm')}
                    icon="🧬"
                    label="Swarm"
                />
                <ViewButton
                    active={view === 'multinode'}
                    onClick={() => setView('multinode')}
                    icon="🌐"
                    label="Multi-Node"
                />
                <ViewButton
                    active={view === '3d'}
                    onClick={() => setView('3d')}
                    icon="🎮"
                    label="3D"
                />
                <ViewButton
                    active={view === 'vr'}
                    onClick={() => setView('vr')}
                    icon="🥽"
                    label="VR"
                />
                <ViewButton
                    active={view === 'godmode'}
                    onClick={() => setView('godmode')}
                    icon="🔥"
                    label="GODMODE"
                    highlight={true}
                />
            </div>

            {/* Dashboard Views */}
            {view === 'metrics' && <Dashboard />}
            {view === 'swarm' && <SwarmDashboard />}
            {view === 'multinode' && <SwarmDashboardMax />}
            {view === '3d' && (
                <Suspense fallback={<LoadingScreen text="Loading 3D Swarm..." />}>
                    <SwarmDashboard3D />
                </Suspense>
            )}
            {view === 'vr' && (
                <Suspense fallback={<LoadingScreen text="Loading VR Swarm..." />}>
                    <SwarmDashboard3DVR />
                </Suspense>
            )}
            {view === 'godmode' && (
                <Suspense fallback={<LoadingScreen text="Loading GODMODE..." icon="🔥" />}>
                    <SwarmDashboard3DVRInteract />
                </Suspense>
            )}
        </div>
    );
}

function ViewButton({ active, onClick, icon, label, highlight }) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: '8px 12px',
                border: highlight ? '1px solid #f0883e' : 'none',
                borderRadius: 4,
                cursor: 'pointer',
                background: active
                    ? (highlight ? '#f0883e' : '#238636')
                    : '#21262d',
                color: '#c9d1d9',
                fontFamily: 'monospace',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 12,
                boxShadow: highlight && active ? '0 0 10px #f0883e' : 'none'
            }}
            onMouseEnter={(e) => {
                if (!active) {
                    e.target.style.background = highlight ? '#da6d25' : '#30363d';
                }
            }}
            onMouseLeave={(e) => {
                if (!active) {
                    e.target.style.background = '#21262d';
                }
            }}
        >
            <span>{icon}</span>
            <span>{label}</span>
        </button>
    );
}

function LoadingScreen({ text, icon = '🧬' }) {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            color: '#8b949e',
            fontFamily: 'monospace',
            flexDirection: 'column'
        }}>
            <div style={{ fontSize: 64, marginBottom: 24, animation: 'pulse 2s infinite' }}>
                {icon}
            </div>
            <div style={{ fontSize: 16 }}>{text}</div>
            <div style={{ marginTop: 8, fontSize: 12, color: '#484f58' }}>
                Loading Three.js and WebGL assets...
            </div>
            <style>{`
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.15); opacity: 0.7; }
                }
            `}</style>
        </div>
    );
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
