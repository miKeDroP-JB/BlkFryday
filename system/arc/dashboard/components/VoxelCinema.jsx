/**
 * VoxelCinema.jsx
 * 3D Voxel-based cinematic visualization for Amoeba branches
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export default function VoxelCinema({ wsUrl = 'ws://localhost:8081', maxParticles = 800 }) {
    const mountRef = useRef(null);
    const [stats, setStats] = useState({ particles: 0, fps: 0 });

    useEffect(() => {
        if (!mountRef.current) return;

        // Scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0a0a12);
        scene.fog = new THREE.FogExp2(0x0a0a12, 0.001);

        // Camera
        const camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            5000
        );
        camera.position.set(0, 200, 900);

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        mountRef.current.appendChild(renderer.domElement);

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(1, 1, 1).normalize();
        scene.add(dirLight);

        const pointLight = new THREE.PointLight(0x58a6ff, 1, 1000);
        pointLight.position.set(0, 300, 0);
        scene.add(pointLight);

        // Grid
        const gridHelper = new THREE.GridHelper(1500, 30, 0x1a1a2e, 0x1a1a2e);
        gridHelper.position.y = -200;
        scene.add(gridHelper);

        // Voxel geometry (shared)
        const voxelGeometry = new THREE.BoxGeometry(6, 6, 6);

        // Particle storage
        const particles = new Map();
        const trails = new Map();

        // Phase colors
        const phaseColors = {
            MemoryFastPath: 0x58a6ff,
            CompositeChains: 0xa371f7,
            Convergence: 0x3fb950,
            InfiniteSearch: 0xf0883e,
            GODMODE: 0xff6b6b,
            default: 0x8b949e
        };

        // WebSocket connection
        const ws = new WebSocket(wsUrl);

        ws.onmessage = (e) => {
            const m = JSON.parse(e.data);

            if (m.type === 'branch_spawn') {
                if (particles.size >= maxParticles) {
                    // Remove oldest particle
                    const oldest = particles.keys().next().value;
                    if (oldest) {
                        const oldMesh = particles.get(oldest);
                        scene.remove(oldMesh);
                        particles.delete(oldest);
                    }
                }

                const color = phaseColors[m.meta?.phase] || phaseColors.default;
                const material = new THREE.MeshLambertMaterial({
                    color: new THREE.Color(color),
                    emissive: new THREE.Color(color),
                    emissiveIntensity: 0.3
                });

                const voxel = new THREE.Mesh(voxelGeometry, material);

                // Position based on parent or random
                const parentPos = m.parent && particles.get(m.parent)
                    ? particles.get(m.parent).position
                    : new THREE.Vector3(0, 0, 0);

                voxel.position.set(
                    parentPos.x + (Math.random() - 0.5) * 200,
                    parentPos.y + (Math.random() - 0.5) * 200 + 50,
                    parentPos.z + (Math.random() - 0.5) * 200
                );

                voxel.userData = {
                    id: m.id,
                    phase: m.meta?.phase,
                    birthTime: Date.now(),
                    velocity: new THREE.Vector3(
                        (Math.random() - 0.5) * 2,
                        (Math.random() - 0.5) * 2,
                        (Math.random() - 0.5) * 2
                    )
                };

                scene.add(voxel);
                particles.set(m.id, voxel);
                trails.set(m.id, []);
            }

            if (m.type === 'branch_complete') {
                const voxel = particles.get(m.id);
                if (voxel) {
                    if (m.result?.status === 'win') {
                        // Win effect - pulse green
                        voxel.material.color.setHex(0x3fb950);
                        voxel.material.emissive.setHex(0x3fb950);
                        voxel.material.emissiveIntensity = 0.8;
                        voxel.scale.setScalar(2);
                    } else {
                        // Fade out
                        voxel.material.opacity = 0.5;
                        voxel.material.transparent = true;
                    }
                }
            }

            if (m.type === 'metric_update') {
                setStats(s => ({ ...s, ...m.stats }));
            }
        };

        ws.onclose = () => {
            console.log('[VoxelCinema] WebSocket closed');
        };

        // Animation loop
        const clock = new THREE.Clock();
        let frameCount = 0;
        let lastFpsUpdate = Date.now();

        function animate() {
            requestAnimationFrame(animate);

            const time = clock.getElapsedTime();
            frameCount++;

            // FPS calculation
            if (Date.now() - lastFpsUpdate > 1000) {
                setStats(s => ({ ...s, fps: frameCount, particles: particles.size }));
                frameCount = 0;
                lastFpsUpdate = Date.now();
            }

            // Update particles
            particles.forEach((voxel, id) => {
                const ud = voxel.userData;
                const age = (Date.now() - ud.birthTime) / 1000;

                // Floating motion
                voxel.position.y += Math.sin(time * 2 + parseInt(id || 0, 16) % 100) * 0.2;

                // Apply velocity
                voxel.position.add(ud.velocity);

                // Damping
                ud.velocity.multiplyScalar(0.99);

                // Rotation
                voxel.rotation.x += 0.01;
                voxel.rotation.y += 0.015;

                // Pulse scale
                const pulse = 1 + 0.1 * Math.sin(time * 3 + parseInt(id || 0, 16) % 50);
                voxel.scale.setScalar(pulse);

                // Boundary bounce
                if (Math.abs(voxel.position.x) > 600) ud.velocity.x *= -0.8;
                if (Math.abs(voxel.position.z) > 600) ud.velocity.z *= -0.8;
                if (voxel.position.y < -150) ud.velocity.y = Math.abs(ud.velocity.y);
                if (voxel.position.y > 400) ud.velocity.y = -Math.abs(ud.velocity.y);

                // Trail (limited)
                const trail = trails.get(id);
                if (trail && trail.length < 10 && Math.random() < 0.1) {
                    const trailGeom = new THREE.BoxGeometry(3, 3, 3);
                    const trailMat = new THREE.MeshBasicMaterial({
                        color: voxel.material.color,
                        transparent: true,
                        opacity: 0.3
                    });
                    const trailVoxel = new THREE.Mesh(trailGeom, trailMat);
                    trailVoxel.position.copy(voxel.position);
                    trailVoxel.userData.birth = Date.now();
                    scene.add(trailVoxel);
                    trail.push(trailVoxel);
                }

                // Cleanup old trails
                if (trail) {
                    for (let i = trail.length - 1; i >= 0; i--) {
                        const t = trail[i];
                        const trailAge = (Date.now() - t.userData.birth) / 1000;
                        if (trailAge > 2) {
                            scene.remove(t);
                            t.geometry.dispose();
                            t.material.dispose();
                            trail.splice(i, 1);
                        } else {
                            t.material.opacity = 0.3 * (1 - trailAge / 2);
                            t.scale.setScalar(1 - trailAge / 2);
                        }
                    }
                }

                // Remove very old particles
                if (age > 30) {
                    scene.remove(voxel);
                    voxel.geometry.dispose();
                    voxel.material.dispose();
                    particles.delete(id);
                    trails.delete(id);
                }
            });

            controls.update();
            renderer.render(scene, camera);
        }

        animate();

        // Resize handler
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            ws.close();
            window.removeEventListener('resize', handleResize);
            if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
                mountRef.current.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, [wsUrl, maxParticles]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
            {/* Stats overlay */}
            <div style={{
                position: 'absolute',
                top: 16,
                right: 16,
                zIndex: 20,
                fontFamily: 'monospace',
                fontSize: 12,
                color: '#8b949e',
                background: 'rgba(13, 17, 23, 0.8)',
                padding: 12,
                borderRadius: 8
            }}>
                <div>🎬 VoxelCinema</div>
                <div style={{ marginTop: 8 }}>
                    Particles: <span style={{ color: '#58a6ff' }}>{stats.particles}</span>
                </div>
                <div>
                    FPS: <span style={{ color: stats.fps > 30 ? '#3fb950' : '#f85149' }}>{stats.fps}</span>
                </div>
            </div>

            <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
        </div>
    );
}
