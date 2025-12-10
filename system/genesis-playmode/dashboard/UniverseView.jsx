import React, { useRef, useEffect, useState } from 'react';

const UniverseView = ({ humanData, universeData }) => {
    const canvasRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = dimensions.width;
        const height = dimensions.height;

        // Animation state
        let animationFrame;
        let time = 0;

        // Universe objects
        const universes = (universeData?.universes || []).slice(0, 20);
        const branches = universeData?.branches || [];

        // Human aura
        const aura = humanData?.aura || {
            position: { x: 0, y: 0 },
            color: '#4488ff',
            radius: 100,
            intensity: 1
        };

        // Particles
        const particles = (humanData?.particles || []).map(p => ({
            ...p,
            x: p.x + width / 2,
            y: p.y + height / 2
        }));

        // Stars background
        const stars = Array(200).fill(0).map(() => ({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 2,
            twinkle: Math.random() * Math.PI * 2
        }));

        const draw = () => {
            time += 0.016;

            // Clear
            ctx.fillStyle = '#0a0a1a';
            ctx.fillRect(0, 0, width, height);

            // Draw stars
            stars.forEach(star => {
                const alpha = 0.3 + Math.sin(star.twinkle + time * 2) * 0.3;
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fill();
            });

            // Draw universe nodes
            const centerX = width / 2;
            const centerY = height / 2;

            universes.forEach((universe, i) => {
                const angle = (i / universes.length) * Math.PI * 2 + time * 0.1;
                const radius = 200 + (universe.type === 'prime' ? 0 : 50);
                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius;
                const size = universe.type === 'prime' ? 30 : 15 + Math.random() * 5;

                // Glow
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2);
                const color = universe.type === 'prime' ? '#ffcc00' :
                             universe.type === 'woven' ? '#4488ff' :
                             universe.type === 'dreamed' ? '#ff88ff' :
                             universe.type === 'fractalized' ? '#88ff88' : '#ff8844';

                gradient.addColorStop(0, color);
                gradient.addColorStop(0.5, `${color}40`);
                gradient.addColorStop(1, 'transparent');

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(x, y, size * 2, 0, Math.PI * 2);
                ctx.fill();

                // Core
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();

                // Label
                ctx.fillStyle = '#ffffff80';
                ctx.font = '10px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(universe.type || universe.id, x, y + size + 15);
            });

            // Draw branches as connections
            branches.slice(-50).forEach((branch, i) => {
                const alpha = (i / 50) * 0.5;
                ctx.strokeStyle = `rgba(100, 200, 255, ${alpha})`;
                ctx.lineWidth = 1;
                ctx.beginPath();

                // Random curved line from center
                const startAngle = Math.random() * Math.PI * 2;
                const endAngle = startAngle + (Math.random() - 0.5) * Math.PI;
                const startRadius = 50 + Math.random() * 50;
                const endRadius = 150 + Math.random() * 100;

                ctx.moveTo(
                    centerX + Math.cos(startAngle) * startRadius,
                    centerY + Math.sin(startAngle) * startRadius
                );
                ctx.quadraticCurveTo(
                    centerX + Math.cos((startAngle + endAngle) / 2) * (startRadius + endRadius) / 2 * 1.2,
                    centerY + Math.sin((startAngle + endAngle) / 2) * (startRadius + endRadius) / 2 * 1.2,
                    centerX + Math.cos(endAngle) * endRadius,
                    centerY + Math.sin(endAngle) * endRadius
                );
                ctx.stroke();
            });

            // Draw human aura at center
            const humanX = centerX + (aura.position?.x || 0) * 0.1;
            const humanY = centerY + (aura.position?.y || 0) * 0.1;
            const auraRadius = (aura.radius || 100) * (aura.intensity || 1);

            // Aura glow
            const auraGradient = ctx.createRadialGradient(
                humanX, humanY, 0,
                humanX, humanY, auraRadius
            );
            const auraColor = aura.color || '#4488ff';
            const pulse = Math.sin(time * 2) * 0.2 + 0.8;

            auraGradient.addColorStop(0, `${auraColor}${Math.round(pulse * 100).toString(16).padStart(2, '0')}`);
            auraGradient.addColorStop(0.5, `${auraColor}40`);
            auraGradient.addColorStop(1, 'transparent');

            ctx.fillStyle = auraGradient;
            ctx.beginPath();
            ctx.arc(humanX, humanY, auraRadius, 0, Math.PI * 2);
            ctx.fill();

            // Draw aura particles
            particles.forEach(p => {
                const px = humanX + (p.x - width / 2) * 0.5;
                const py = humanY + (p.y - height / 2) * 0.5;

                ctx.fillStyle = `${auraColor}${Math.round((p.alpha || 0.5) * 255).toString(16).padStart(2, '0')}`;
                ctx.beginPath();
                ctx.arc(px, py, p.size || 3, 0, Math.PI * 2);
                ctx.fill();
            });

            // Human node core
            ctx.fillStyle = aura.glowColor || '#88ccff';
            ctx.beginPath();
            ctx.arc(humanX, humanY, 20 + Math.sin(time * 3) * 3, 0, Math.PI * 2);
            ctx.fill();

            // Human icon
            ctx.fillStyle = '#ffffff';
            ctx.font = '20px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('👤', humanX, humanY);

            // Name label
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px monospace';
            ctx.fillText(humanData?.name || 'Player', humanX, humanY + 35);

            animationFrame = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            cancelAnimationFrame(animationFrame);
        };
    }, [dimensions, humanData, universeData]);

    return (
        <div style={{
            background: '#0a0a1a',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid #333'
        }}>
            <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid #333',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <span style={{ color: '#fff', fontWeight: 'bold' }}>🌌 Universe View</span>
                <span style={{ color: '#666', fontSize: '12px' }}>
                    {universeData?.universes?.length || 0} universes active
                </span>
            </div>
            <canvas
                ref={canvasRef}
                width={dimensions.width}
                height={dimensions.height}
                style={{ display: 'block' }}
            />
        </div>
    );
};

export default UniverseView;
