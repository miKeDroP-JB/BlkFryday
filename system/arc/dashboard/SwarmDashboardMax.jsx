/**
 * Amoeba V4.0 Multi-Node Swarm Dashboard
 * Fractal breathing visualization with multi-node support
 */

import React, { useEffect, useRef, useState } from 'react';

// Configure orchestrator nodes
const DEFAULT_NODES = [
    'ws://localhost:8080',
    'ws://localhost:8081',
    'ws://localhost:8082',
    'ws://localhost:8083'
];

export default function SwarmDashboardMax({ nodes = DEFAULT_NODES }) {
    const canvasRef = useRef(null);
    const [branches, setBranches] = useState([]);
    const [nodeStatus, setNodeStatus] = useState({});
    const [stats, setStats] = useState({ total: 0, wins: 0, connected: 0 });

    const nodeColors = [
        { r: 88, g: 166, b: 255 },   // Blue
        { r: 63, g: 185, b: 80 },    // Green
        { r: 163, g: 113, b: 247 },  // Purple
        { r: 240, g: 136, b: 62 }    // Orange
    ];

    // Connect to multiple WebSocket feeds
    useEffect(() => {
        const sockets = nodes.map((url, nodeIndex) => {
            const ws = new WebSocket(url);

            ws.onopen = () => {
                setNodeStatus(prev => ({ ...prev, [url]: 'connected' }));
                ws.send(JSON.stringify({
                    type: 'subscribe',
                    channels: ['metrics', 'branch']
                }));
            };

            ws.onmessage = (event) => {
                const msg = JSON.parse(event.data);
                if (msg.type === 'metrics') {
                    setBranches(prev => {
                        const updated = [...prev, {
                            ...msg.data,
                            nodeIndex,
                            timestamp: Date.now()
                        }];
                        // Keep last 300 branches
                        return updated.slice(-300);
                    });

                    if (msg.data.status === 'win') {
                        setStats(s => ({ ...s, wins: s.wins + 1 }));
                    }
                }
            };

            ws.onclose = () => setNodeStatus(prev => ({ ...prev, [url]: 'disconnected' }));
            ws.onerror = () => setNodeStatus(prev => ({ ...prev, [url]: 'error' }));

            return ws;
        });

        return () => sockets.forEach(ws => ws.close());
    }, [nodes]);

    // Update connected count
    useEffect(() => {
        const connected = Object.values(nodeStatus).filter(s => s === 'connected').length;
        setStats(s => ({ ...s, connected, total: branches.length }));
    }, [nodeStatus, branches.length]);

    // Animation loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let animationId;
        let startTime = Date.now();

        function draw() {
            const time = Date.now() - startTime;

            // Clear with slight fade for trail effect
            ctx.fillStyle = 'rgba(13, 17, 23, 0.15)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw node indicators
            nodes.forEach((url, i) => {
                const x = 50 + i * 80;
                const y = 30;
                const isConnected = nodeStatus[url] === 'connected';
                const color = nodeColors[i % nodeColors.length];

                ctx.beginPath();
                ctx.arc(x, y, isConnected ? 8 : 4, 0, Math.PI * 2);
                ctx.fillStyle = isConnected
                    ? `rgba(${color.r}, ${color.g}, ${color.b}, 0.9)`
                    : 'rgba(72, 79, 88, 0.5)';
                ctx.fill();

                // Pulse effect for connected nodes
                if (isConnected) {
                    const pulse = Math.sin(time / 500 + i) * 0.3 + 0.7;
                    ctx.beginPath();
                    ctx.arc(x, y, 12 * pulse, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${0.3 * pulse})`;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            });

            // Draw branches with breathing effect
            branches.forEach((b, idx) => {
                const nodeColor = nodeColors[b.nodeIndex % nodeColors.length];
                const successRate = b.successRate || b.score || 0.5;

                // Position based on branch data
                const baseX = (b.branchId * 120 + b.nodeIndex * 300) % canvas.width + 50;
                const baseY = ((b.phase?.charCodeAt(0) || 65) * 20 + idx * 5) % (canvas.height - 100) + 80;

                // Breathing oscillation
                const breathe = Math.sin(time / 200 + idx * 0.5);
                const radius = 5 + successRate * 25 + 3 * breathe;

                // Age-based fade
                const age = (Date.now() - b.timestamp) / 10000;
                const alpha = Math.max(0.1, 1 - age);

                // Draw fractal trail effect
                for (let t = 0; t < 4; t++) {
                    const trailRadius = Math.max(1, radius - t * 3);
                    const trailAlpha = (0.4 - t * 0.1) * alpha;
                    const offsetX = Math.sin(time / 300 + t) * t * 2;
                    const offsetY = Math.cos(time / 300 + t) * t * 2;

                    ctx.beginPath();
                    ctx.arc(baseX - t * 5 + offsetX, baseY - t * 5 + offsetY, trailRadius, 0, Math.PI * 2);

                    // Color based on success rate (red → green gradient)
                    const r = Math.floor(nodeColor.r * (1 - successRate * 0.5));
                    const g = Math.floor(nodeColor.g * (0.5 + successRate * 0.5));
                    ctx.fillStyle = `rgba(${r}, ${g}, ${nodeColor.b}, ${trailAlpha})`;
                    ctx.fill();
                }

                // Main particle
                ctx.beginPath();
                ctx.arc(baseX, baseY, radius, 0, Math.PI * 2);

                // Win particles glow green
                if (b.status === 'win') {
                    ctx.fillStyle = `rgba(63, 185, 80, ${0.9 * alpha})`;
                    ctx.shadowColor = '#3fb950';
                    ctx.shadowBlur = 20;
                } else {
                    const r = Math.floor(255 * (1 - successRate));
                    const g = Math.floor(255 * successRate);
                    ctx.fillStyle = `rgba(${r}, ${g}, 200, ${0.8 * alpha})`;
                    ctx.shadowBlur = 0;
                }

                ctx.fill();
                ctx.shadowBlur = 0;

                // Draw connections to nearby particles of same node
                if (idx < 50) {
                    for (let j = idx + 1; j < Math.min(branches.length, idx + 20); j++) {
                        const other = branches[j];
                        if (other.nodeIndex !== b.nodeIndex) continue;

                        const otherX = (other.branchId * 120 + other.nodeIndex * 300) % canvas.width + 50;
                        const otherY = ((other.phase?.charCodeAt(0) || 65) * 20 + j * 5) % (canvas.height - 100) + 80;

                        const dx = otherX - baseX;
                        const dy = otherY - baseY;
                        const dist = Math.sqrt(dx * dx + dy * dy);

                        if (dist < 80) {
                            ctx.beginPath();
                            ctx.moveTo(baseX, baseY);
                            ctx.lineTo(otherX, otherY);
                            ctx.strokeStyle = `rgba(${nodeColor.r}, ${nodeColor.g}, ${nodeColor.b}, ${0.15 * (1 - dist / 80)})`;
                            ctx.lineWidth = 1;
                            ctx.stroke();
                        }
                    }
                }
            });

            // Draw stats overlay
            ctx.fillStyle = 'rgba(13, 17, 23, 0.8)';
            ctx.fillRect(canvas.width - 180, 10, 170, 80);
            ctx.strokeStyle = '#21262d';
            ctx.strokeRect(canvas.width - 180, 10, 170, 80);

            ctx.font = '12px monospace';
            ctx.fillStyle = '#8b949e';
            ctx.fillText(`Nodes: ${stats.connected}/${nodes.length}`, canvas.width - 170, 32);
            ctx.fillText(`Particles: ${branches.length}`, canvas.width - 170, 52);
            ctx.fillStyle = '#3fb950';
            ctx.fillText(`Wins: ${stats.wins}`, canvas.width - 170, 72);

            animationId = requestAnimationFrame(draw);
        }

        draw();
        return () => cancelAnimationFrame(animationId);
    }, [branches, nodes, nodeStatus, stats]);

    return (
        <div style={{ position: 'relative', width: '100%', background: '#0d1117' }}>
            {/* Title */}
            <div style={{
                position: 'absolute',
                top: 16,
                left: 400,
                zIndex: 10,
                fontFamily: 'monospace'
            }}>
                <h2 style={{ margin: 0, color: '#c9d1d9', fontSize: 18 }}>
                    🧬 Multi-Node Swarm Visualization
                </h2>
            </div>

            <canvas
                ref={canvasRef}
                width={1400}
                height={700}
                style={{ display: 'block', width: '100%', height: '700px' }}
            />
        </div>
    );
}
