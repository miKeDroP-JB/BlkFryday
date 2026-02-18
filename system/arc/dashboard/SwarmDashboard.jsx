/**
 * Amoeba V4.0 Swarm Dashboard
 * Animated canvas visualization of branch swarm behavior
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';

export default function SwarmDashboard() {
    const canvasRef = useRef(null);
    const [branches, setBranches] = useState([]);
    const [particles, setParticles] = useState([]);
    const [connected, setConnected] = useState(false);
    const [stats, setStats] = useState({ total: 0, successful: 0, phase: 'Idle' });

    // WebSocket connection
    useEffect(() => {
        const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8080';
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            setConnected(true);
            ws.send(JSON.stringify({
                type: 'subscribe',
                channels: ['metrics', 'branch', 'progress']
            }));
        };

        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);

            if (msg.type === 'metrics') {
                const data = msg.data;
                setBranches(prev => {
                    const updated = [...prev, data];
                    return updated.slice(-200); // Keep last 200
                });

                // Create particle for visualization
                setParticles(prev => [...prev, {
                    id: Date.now() + Math.random(),
                    x: Math.random() * 1200,
                    y: Math.random() * 600,
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 2,
                    phase: data.phase,
                    branchId: data.branchId,
                    score: data.score || data.successRate || 0.5,
                    status: data.status,
                    life: 1.0,
                    size: 8 + (data.score || 0.5) * 15
                }]);

                if (data.totalBranches) {
                    setStats(s => ({
                        ...s,
                        total: data.totalBranches,
                        successful: data.successfulBranches || s.successful
                    }));
                }
            }

            if (msg.type === 'progress') {
                setStats(s => ({ ...s, phase: msg.data.phase }));
            }

            if (msg.type === 'branch' && msg.data.event === 'spawn') {
                // Spawn burst effect
                const centerX = 600;
                const centerY = 300;
                for (let i = 0; i < 3; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 2 + Math.random() * 3;
                    setParticles(prev => [...prev, {
                        id: Date.now() + Math.random(),
                        x: centerX,
                        y: centerY,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        phase: msg.data.phase,
                        branchId: msg.data.branchId,
                        score: 0.5,
                        status: 'spawn',
                        life: 1.0,
                        size: 5
                    }]);
                }
            }
        };

        ws.onclose = () => setConnected(false);
        ws.onerror = () => setConnected(false);

        return () => ws.close();
    }, []);

    // Animation loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let animationId;

        const phaseColors = {
            MemoryFastPath: '#58a6ff',
            CompositeChains: '#a371f7',
            Convergence: '#3fb950',
            InfiniteSearch: '#f0883e'
        };

        function draw() {
            // Clear with trail effect
            ctx.fillStyle = 'rgba(13, 17, 23, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Update and draw particles
            setParticles(prev => {
                const updated = [];

                for (const p of prev) {
                    // Update position
                    p.x += p.vx;
                    p.y += p.vy;

                    // Bounce off walls
                    if (p.x < 0 || p.x > canvas.width) p.vx *= -0.8;
                    if (p.y < 0 || p.y > canvas.height) p.vy *= -0.8;

                    // Apply friction
                    p.vx *= 0.99;
                    p.vy *= 0.99;

                    // Decay life
                    p.life -= 0.002;

                    if (p.life > 0) {
                        // Draw particle
                        const baseColor = phaseColors[p.phase] || '#8b949e';
                        const alpha = p.life * 0.8;

                        // Glow effect
                        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
                        gradient.addColorStop(0, baseColor);
                        gradient.addColorStop(0.5, baseColor.replace(')', `, ${alpha * 0.5})`).replace('rgb', 'rgba'));
                        gradient.addColorStop(1, 'transparent');

                        ctx.beginPath();
                        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);

                        // Color based on status
                        if (p.status === 'win') {
                            ctx.fillStyle = `rgba(63, 185, 80, ${alpha})`;
                            ctx.shadowColor = '#3fb950';
                            ctx.shadowBlur = 20;
                        } else if (p.status === 'failed') {
                            ctx.fillStyle = `rgba(248, 81, 73, ${alpha})`;
                        } else {
                            ctx.fillStyle = hexToRgba(baseColor, alpha);
                        }

                        ctx.fill();
                        ctx.shadowBlur = 0;

                        updated.push(p);
                    }
                }

                return updated;
            });

            // Draw connections between nearby particles
            const currentParticles = particles;
            ctx.strokeStyle = 'rgba(88, 166, 255, 0.1)';
            ctx.lineWidth = 1;

            for (let i = 0; i < currentParticles.length; i++) {
                for (let j = i + 1; j < currentParticles.length; j++) {
                    const dx = currentParticles[i].x - currentParticles[j].x;
                    const dy = currentParticles[i].y - currentParticles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 100 && currentParticles[i].phase === currentParticles[j].phase) {
                        ctx.beginPath();
                        ctx.moveTo(currentParticles[i].x, currentParticles[i].y);
                        ctx.lineTo(currentParticles[j].x, currentParticles[j].y);
                        ctx.stroke();
                    }
                }
            }

            animationId = requestAnimationFrame(draw);
        }

        draw();
        return () => cancelAnimationFrame(animationId);
    }, [particles]);

    return (
        <div style={{ position: 'relative', width: '100%', background: '#0d1117' }}>
            {/* Header overlay */}
            <div style={{
                position: 'absolute',
                top: 16,
                left: 16,
                right: 16,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 10,
                fontFamily: 'monospace'
            }}>
                <h2 style={{ margin: 0, color: '#c9d1d9' }}>
                    🧬 Swarm View
                </h2>
                <div style={{ display: 'flex', gap: 24, color: '#8b949e' }}>
                    <span>Phase: <strong style={{ color: '#58a6ff' }}>{stats.phase}</strong></span>
                    <span>Branches: <strong style={{ color: '#c9d1d9' }}>{stats.total}</strong></span>
                    <span>Successful: <strong style={{ color: '#3fb950' }}>{stats.successful}</strong></span>
                    <span style={{
                        padding: '4px 8px',
                        borderRadius: 4,
                        background: connected ? '#238636' : '#da3633',
                        color: '#fff',
                        fontSize: 12
                    }}>
                        {connected ? 'LIVE' : 'OFFLINE'}
                    </span>
                </div>
            </div>

            {/* Legend */}
            <div style={{
                position: 'absolute',
                bottom: 16,
                left: 16,
                display: 'flex',
                gap: 16,
                zIndex: 10,
                fontFamily: 'monospace',
                fontSize: 12
            }}>
                <LegendItem color="#58a6ff" label="MemoryFastPath" />
                <LegendItem color="#a371f7" label="CompositeChains" />
                <LegendItem color="#3fb950" label="Convergence" />
                <LegendItem color="#f0883e" label="InfiniteSearch" />
            </div>

            <canvas
                ref={canvasRef}
                width={1200}
                height={600}
                style={{ display: 'block', width: '100%', height: '600px' }}
            />
        </div>
    );
}

function LegendItem({ color, label }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: color,
                boxShadow: `0 0 8px ${color}`
            }} />
            <span style={{ color: '#8b949e' }}>{label}</span>
        </div>
    );
}

function hexToRgba(hex, alpha) {
    // Handle shorthand hex
    if (hex.length === 4) {
        hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    }
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
