/**
 * Amoeba V4.0 3D Swarm Dashboard
 * WebGL Three.js visualization with particle physics
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Multi-node configuration
const DEFAULT_NODES = [
    'ws://localhost:8080',
    'ws://localhost:8081',
    'ws://localhost:8082',
    'ws://localhost:8083'
];

export default function SwarmDashboard3D({ nodes = DEFAULT_NODES }) {
    const mountRef = useRef(null);
    const [branches, setBranches] = useState([]);
    const [nodeStatus, setNodeStatus] = useState({});
    const [stats, setStats] = useState({ particles: 0, wins: 0, connected: 0 });

    const sceneRef = useRef(null);
    const particlesRef = useRef([]);
    const nodeColorsRef = useRef([
        new THREE.Color(0x58a6ff), // Blue
        new THREE.Color(0x3fb950), // Green
        new THREE.Color(0xa371f7), // Purple
        new THREE.Color(0xf0883e)  // Orange
    ]);

    // WebSocket connections
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
                        return updated.slice(-500); // Keep last 500
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

    // Update stats
    useEffect(() => {
        const connected = Object.values(nodeStatus).filter(s => s === 'connected').length;
        setStats(s => ({ ...s, connected, particles: branches.length }));
    }, [nodeStatus, branches.length]);

    // Three.js scene setup
    useEffect(() => {
        if (!mountRef.current) return;

        // Scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0d1117);
        scene.fog = new THREE.Fog(0x0d1117, 500, 2000);
        sceneRef.current = scene;

        // Camera
        const camera = new THREE.PerspectiveCamera(
            75,
            mountRef.current.clientWidth / mountRef.current.clientHeight,
            0.1,
            5000
        );
        camera.position.set(0, 200, 600);

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        mountRef.current.appendChild(renderer.domElement);

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.maxDistance = 1500;
        controls.minDistance = 100;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffffff, 1, 1000);
        pointLight.position.set(0, 300, 0);
        scene.add(pointLight);

        // Grid helper
        const gridHelper = new THREE.GridHelper(1000, 20, 0x21262d, 0x21262d);
        gridHelper.position.y = -200;
        scene.add(gridHelper);

        // Node center spheres
        const nodeCenters = [];
        nodes.forEach((url, i) => {
            const angle = (i / nodes.length) * Math.PI * 2;
            const radius = 300;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;

            // Node sphere
            const geometry = new THREE.SphereGeometry(20, 32, 32);
            const material = new THREE.MeshPhongMaterial({
                color: nodeColorsRef.current[i % nodeColorsRef.current.length],
                transparent: true,
                opacity: 0.6,
                emissive: nodeColorsRef.current[i % nodeColorsRef.current.length],
                emissiveIntensity: 0.3
            });
            const sphere = new THREE.Mesh(geometry, material);
            sphere.position.set(x, 0, z);
            scene.add(sphere);
            nodeCenters.push({ sphere, x, z, url });

            // Ring around node
            const ringGeometry = new THREE.RingGeometry(25, 30, 32);
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: nodeColorsRef.current[i % nodeColorsRef.current.length],
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.position.set(x, 0, z);
            ring.rotation.x = Math.PI / 2;
            scene.add(ring);
        });

        // Particle geometry (shared)
        const particleGeometry = new THREE.SphereGeometry(5, 8, 8);

        // Animation loop
        let animationId;
        const clock = new THREE.Clock();

        function animate() {
            animationId = requestAnimationFrame(animate);

            const time = clock.getElapsedTime();

            // Update node center pulses
            nodeCenters.forEach((nc, i) => {
                const isConnected = nodeStatus[nc.url] === 'connected';
                nc.sphere.material.opacity = isConnected ? 0.6 + 0.2 * Math.sin(time * 2 + i) : 0.2;
                nc.sphere.material.emissiveIntensity = isConnected ? 0.3 + 0.2 * Math.sin(time * 2 + i) : 0.1;
            });

            // Add/update particles
            const particles = particlesRef.current;

            branches.forEach((b, idx) => {
                if (!particles[idx]) {
                    // Create new particle
                    const nodeIdx = b.nodeIndex || 0;
                    const nodeColor = nodeColorsRef.current[nodeIdx % nodeColorsRef.current.length];
                    const successRate = b.successRate || b.score || 0.5;

                    const material = new THREE.MeshPhongMaterial({
                        color: b.status === 'win' ? 0x3fb950 : nodeColor,
                        transparent: true,
                        opacity: 0.8,
                        emissive: b.status === 'win' ? 0x3fb950 : nodeColor,
                        emissiveIntensity: b.status === 'win' ? 0.5 : 0.2
                    });

                    const mesh = new THREE.Mesh(particleGeometry, material);

                    // Position near node center
                    const nc = nodeCenters[nodeIdx % nodeCenters.length];
                    mesh.position.set(
                        nc.x + (Math.random() - 0.5) * 200,
                        (Math.random() - 0.5) * 300,
                        nc.z + (Math.random() - 0.5) * 200
                    );

                    // Store velocity and metadata
                    mesh.userData = {
                        vx: (Math.random() - 0.5) * 2,
                        vy: (Math.random() - 0.5) * 2,
                        vz: (Math.random() - 0.5) * 2,
                        nodeIndex: nodeIdx,
                        successRate,
                        status: b.status,
                        birthTime: time,
                        targetX: nc.x,
                        targetZ: nc.z
                    };

                    scene.add(mesh);
                    particles[idx] = mesh;
                } else {
                    // Update existing particle
                    const mesh = particles[idx];
                    const ud = mesh.userData;
                    const age = time - ud.birthTime;

                    // Pulse scale
                    const pulse = 1 + 0.3 * Math.sin(time * 3 + idx * 0.5);
                    const sizeBySuccess = 0.5 + ud.successRate;
                    mesh.scale.setScalar(pulse * sizeBySuccess);

                    // Move towards node center (gentle attraction)
                    const dx = ud.targetX - mesh.position.x;
                    const dz = ud.targetZ - mesh.position.z;
                    const dist = Math.sqrt(dx * dx + dz * dz);

                    if (dist > 100) {
                        ud.vx += dx * 0.0005;
                        ud.vz += dz * 0.0005;
                    }

                    // Apply velocity
                    mesh.position.x += ud.vx;
                    mesh.position.y += ud.vy + Math.sin(time + idx) * 0.5;
                    mesh.position.z += ud.vz;

                    // Damping
                    ud.vx *= 0.99;
                    ud.vy *= 0.99;
                    ud.vz *= 0.99;

                    // Fade out over time
                    mesh.material.opacity = Math.max(0.1, 0.8 - age * 0.05);

                    // Keep in bounds
                    if (mesh.position.y < -200) ud.vy = Math.abs(ud.vy);
                    if (mesh.position.y > 300) ud.vy = -Math.abs(ud.vy);
                }
            });

            // Draw connections between nearby particles
            // (Using line segments would require more setup, skipping for performance)

            controls.update();
            renderer.render(scene, camera);
        }

        animate();

        // Handle resize
        const handleResize = () => {
            if (!mountRef.current) return;
            camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        };

        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', handleResize);
            if (mountRef.current && renderer.domElement) {
                mountRef.current.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, [nodes]); // Only re-init on nodes change

    // Update particles when branches change
    useEffect(() => {
        // Particles are created/updated in animate loop
    }, [branches]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100vh', background: '#0d1117' }}>
            {/* Stats overlay */}
            <div style={{
                position: 'absolute',
                top: 16,
                left: 16,
                zIndex: 10,
                fontFamily: 'monospace',
                background: 'rgba(13, 17, 23, 0.8)',
                padding: 16,
                borderRadius: 8,
                border: '1px solid #21262d'
            }}>
                <h2 style={{ margin: '0 0 12px 0', color: '#c9d1d9', fontSize: 18 }}>
                    🧬 3D Swarm View
                </h2>
                <div style={{ color: '#8b949e', fontSize: 12 }}>
                    <div>Nodes: <span style={{ color: '#58a6ff' }}>{stats.connected}/{nodes.length}</span></div>
                    <div>Particles: <span style={{ color: '#c9d1d9' }}>{stats.particles}</span></div>
                    <div>Wins: <span style={{ color: '#3fb950' }}>{stats.wins}</span></div>
                </div>
                <div style={{ marginTop: 12, fontSize: 10, color: '#484f58' }}>
                    Drag to rotate • Scroll to zoom
                </div>
            </div>

            {/* Node status */}
            <div style={{
                position: 'absolute',
                top: 16,
                right: 16,
                zIndex: 10,
                fontFamily: 'monospace',
                display: 'flex',
                gap: 8
            }}>
                {nodes.map((url, i) => (
                    <div key={url} style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: nodeStatus[url] === 'connected'
                            ? ['#58a6ff', '#3fb950', '#a371f7', '#f0883e'][i % 4]
                            : '#484f58',
                        boxShadow: nodeStatus[url] === 'connected'
                            ? `0 0 10px ${['#58a6ff', '#3fb950', '#a371f7', '#f0883e'][i % 4]}`
                            : 'none'
                    }} />
                ))}
            </div>

            {/* Three.js mount point */}
            <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
        </div>
    );
}
