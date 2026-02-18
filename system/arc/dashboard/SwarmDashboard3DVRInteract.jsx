/**
 * Amoeba V4.0 3D VR Interactive Swarm Dashboard
 * GODMODE - Grab and manipulate particles with VR controllers
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';

const DEFAULT_NODES = [
    'ws://localhost:8080',
    'ws://localhost:8081',
    'ws://localhost:8082',
    'ws://localhost:8083'
];

export default function SwarmDashboard3DVRInteract({ nodes = DEFAULT_NODES }) {
    const mountRef = useRef(null);
    const [branches, setBranches] = useState([]);
    const [nodeStatus, setNodeStatus] = useState({});
    const [stats, setStats] = useState({ particles: 0, wins: 0, grabbed: 0, vrActive: false });

    const particlesRef = useRef([]);
    const trailsRef = useRef([]);
    const grabbedRef = useRef(new Map());

    const nodeColors = [
        new THREE.Color(0x58a6ff),
        new THREE.Color(0x3fb950),
        new THREE.Color(0xa371f7),
        new THREE.Color(0xf0883e)
    ];

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
                        return updated.slice(-500);
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
        setStats(s => ({ ...s, particles: branches.length }));
    }, [branches.length]);

    // Three.js + WebXR + Interactive setup
    useEffect(() => {
        if (!mountRef.current) return;

        // Scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0d1117);
        scene.fog = new THREE.FogExp2(0x0d1117, 0.0006);

        // Camera
        const camera = new THREE.PerspectiveCamera(
            75,
            mountRef.current.clientWidth / mountRef.current.clientHeight,
            0.1,
            5000
        );
        camera.position.set(0, 100, 800);

        // Renderer with WebXR
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.xr.enabled = true;
        renderer.outputEncoding = THREE.sRGBEncoding;
        mountRef.current.appendChild(renderer.domElement);

        // VR Button
        const vrButton = VRButton.createButton(renderer);
        vrButton.style.position = 'absolute';
        vrButton.style.bottom = '20px';
        vrButton.style.left = '50%';
        vrButton.style.transform = 'translateX(-50%)';
        mountRef.current.appendChild(vrButton);

        // VR session tracking
        renderer.xr.addEventListener('sessionstart', () => {
            setStats(s => ({ ...s, vrActive: true }));
        });
        renderer.xr.addEventListener('sessionend', () => {
            setStats(s => ({ ...s, vrActive: false }));
        });

        // Orbit Controls (non-VR)
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffffff, 1, 2000);
        pointLight.position.set(0, 500, 0);
        scene.add(pointLight);

        const hemiLight = new THREE.HemisphereLight(0x58a6ff, 0x0d1117, 0.6);
        scene.add(hemiLight);

        // Ground grid
        const gridHelper = new THREE.GridHelper(2000, 40, 0x21262d, 0x161b22);
        gridHelper.position.y = -300;
        scene.add(gridHelper);

        // VR Controllers
        const controllerModelFactory = new XRControllerModelFactory();

        const controller1 = renderer.xr.getController(0);
        scene.add(controller1);

        const controller2 = renderer.xr.getController(1);
        scene.add(controller2);

        // Controller grips with models
        const controllerGrip1 = renderer.xr.getControllerGrip(0);
        controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
        scene.add(controllerGrip1);

        const controllerGrip2 = renderer.xr.getControllerGrip(1);
        controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
        scene.add(controllerGrip2);

        // Controller ray visualization
        const rayGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, -10)
        ]);

        const rayMaterial1 = new THREE.LineBasicMaterial({ color: 0x58a6ff });
        const rayMaterial2 = new THREE.LineBasicMaterial({ color: 0x3fb950 });

        const ray1 = new THREE.Line(rayGeometry, rayMaterial1);
        const ray2 = new THREE.Line(rayGeometry, rayMaterial2);
        controller1.add(ray1);
        controller2.add(ray2);

        // Grab sphere visualization
        const grabSphereGeom = new THREE.SphereGeometry(50, 16, 16);
        const grabSphereMat1 = new THREE.MeshBasicMaterial({ color: 0x58a6ff, transparent: true, opacity: 0.1, wireframe: true });
        const grabSphereMat2 = new THREE.MeshBasicMaterial({ color: 0x3fb950, transparent: true, opacity: 0.1, wireframe: true });
        const grabSphere1 = new THREE.Mesh(grabSphereGeom, grabSphereMat1);
        const grabSphere2 = new THREE.Mesh(grabSphereGeom, grabSphereMat2);
        controller1.add(grabSphere1);
        controller2.add(grabSphere2);

        // Grabbed particles map
        const grabbed = grabbedRef.current;

        // Grab closest particle within range
        function grabParticle(controller, grabSphere) {
            const particles = particlesRef.current;
            let closest = null;
            let minDist = Infinity;

            const controllerWorldPos = new THREE.Vector3();
            controller.getWorldPosition(controllerWorldPos);

            particles.forEach(p => {
                if (p && !isGrabbed(p)) {
                    const dist = controllerWorldPos.distanceTo(p.position);
                    if (dist < minDist && dist < 100) { // 100 unit grab radius
                        closest = p;
                        minDist = dist;
                    }
                }
            });

            if (closest) {
                grabbed.set(controller, {
                    particle: closest,
                    offset: closest.position.clone().sub(controllerWorldPos)
                });
                grabSphere.material.opacity = 0.3;
                setStats(s => ({ ...s, grabbed: grabbed.size }));

                // Visual feedback - highlight grabbed particle
                closest.material.emissiveIntensity = 1.0;
                closest.scale.setScalar(2);
            }
        }

        // Check if particle is already grabbed
        function isGrabbed(particle) {
            for (const [, data] of grabbed) {
                if (data.particle === particle) return true;
            }
            return false;
        }

        // Release particle
        function releaseParticle(controller, grabSphere) {
            const data = grabbed.get(controller);
            if (data) {
                // Add throw velocity based on controller motion
                const controllerWorldPos = new THREE.Vector3();
                controller.getWorldPosition(controllerWorldPos);

                if (data.particle.userData) {
                    data.particle.userData.vx = (Math.random() - 0.5) * 5;
                    data.particle.userData.vy = (Math.random() - 0.5) * 5;
                    data.particle.userData.vz = (Math.random() - 0.5) * 5;
                }

                // Reset visual
                data.particle.material.emissiveIntensity = 0.4;

                grabbed.delete(controller);
                grabSphere.material.opacity = 0.1;
                setStats(s => ({ ...s, grabbed: grabbed.size }));
            }
        }

        // Controller events
        controller1.addEventListener('selectstart', () => grabParticle(controller1, grabSphere1));
        controller1.addEventListener('selectend', () => releaseParticle(controller1, grabSphere1));
        controller2.addEventListener('selectstart', () => grabParticle(controller2, grabSphere2));
        controller2.addEventListener('selectend', () => releaseParticle(controller2, grabSphere2));

        // Squeeze to scale particles
        controller1.addEventListener('squeezestart', () => {
            particlesRef.current.forEach(p => {
                if (p) p.scale.multiplyScalar(1.5);
            });
        });
        controller1.addEventListener('squeezeend', () => {
            particlesRef.current.forEach(p => {
                if (p) p.scale.multiplyScalar(1 / 1.5);
            });
        });

        // Node center indicators
        const nodeCenters = [];
        nodes.forEach((url, i) => {
            const angle = (i / nodes.length) * Math.PI * 2;
            const radius = 400;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;

            const geometry = new THREE.IcosahedronGeometry(25, 2);
            const material = new THREE.MeshStandardMaterial({
                color: nodeColors[i % nodeColors.length],
                transparent: true,
                opacity: 0.7,
                emissive: nodeColors[i % nodeColors.length],
                emissiveIntensity: 0.3
            });
            const sphere = new THREE.Mesh(geometry, material);
            sphere.position.set(x, 0, z);
            scene.add(sphere);
            nodeCenters.push({ sphere, x, z, url });
        });

        // Particle geometry
        const particleGeometry = new THREE.IcosahedronGeometry(6, 1);
        const particles = particlesRef.current;
        const trails = trailsRef.current;

        // Animation loop
        const clock = new THREE.Clock();

        renderer.setAnimationLoop(() => {
            const time = clock.getElapsedTime();

            // Update controls (non-VR)
            if (!renderer.xr.isPresenting) {
                controls.update();
            }

            // Pulse node centers
            nodeCenters.forEach((nc, i) => {
                const isConnected = nodeStatus[nc.url] === 'connected';
                const pulse = Math.sin(time * 2 + i) * 0.2 + 1;
                nc.sphere.scale.setScalar(isConnected ? pulse : 0.5);
                nc.sphere.material.opacity = isConnected ? 0.7 : 0.2;
                nc.sphere.rotation.y += 0.01;
            });

            // Update/create particles
            branches.forEach((b, idx) => {
                const nodeIdx = b.nodeIndex || 0;
                const nodeColor = nodeColors[nodeIdx % nodeColors.length];
                const successRate = b.successRate || b.score || 0.5;

                if (!particles[idx]) {
                    const material = new THREE.MeshStandardMaterial({
                        color: b.status === 'win' ? 0x3fb950 : nodeColor,
                        emissive: b.status === 'win' ? 0x3fb950 : nodeColor,
                        emissiveIntensity: b.status === 'win' ? 0.8 : 0.4,
                        metalness: 0.4,
                        roughness: 0.6
                    });

                    const particle = new THREE.Mesh(particleGeometry, material);

                    const nc = nodeCenters[nodeIdx % nodeCenters.length];
                    particle.position.set(
                        nc.x + (Math.random() - 0.5) * 300,
                        (Math.random() - 0.5) * 400,
                        nc.z + (Math.random() - 0.5) * 300
                    );

                    particle.userData = {
                        vx: (Math.random() - 0.5) * 2,
                        vy: (Math.random() - 0.5) * 2,
                        vz: (Math.random() - 0.5) * 2,
                        nodeIndex: nodeIdx,
                        successRate,
                        birthTime: time,
                        targetX: nc.x,
                        targetZ: nc.z
                    };

                    scene.add(particle);
                    particles[idx] = particle;
                    trails[idx] = [];
                } else {
                    const particle = particles[idx];

                    // Skip grabbed particles (they follow controller)
                    if (isGrabbed(particle)) {
                        // Update position to follow controller
                        for (const [controller, data] of grabbed) {
                            if (data.particle === particle) {
                                const controllerWorldPos = new THREE.Vector3();
                                controller.getWorldPosition(controllerWorldPos);
                                particle.position.copy(controllerWorldPos).add(data.offset);
                            }
                        }
                        return;
                    }

                    const ud = particle.userData;
                    const age = time - ud.birthTime;

                    // Pulse
                    const pulse = 1 + 0.3 * Math.sin(time * 3 + idx * 0.3);
                    particle.scale.setScalar(pulse * (0.6 + ud.successRate * 0.6));

                    // Node attraction
                    const dx = ud.targetX - particle.position.x;
                    const dz = ud.targetZ - particle.position.z;
                    const dist = Math.sqrt(dx * dx + dz * dz);

                    if (dist > 120) {
                        ud.vx += dx * 0.0003;
                        ud.vz += dz * 0.0003;
                    }

                    // Apply velocity
                    particle.position.x += ud.vx;
                    particle.position.y += ud.vy + Math.sin(time * 2 + idx) * 0.2;
                    particle.position.z += ud.vz;

                    // Damping
                    ud.vx *= 0.995;
                    ud.vy *= 0.995;
                    ud.vz *= 0.995;

                    // Bounds
                    if (particle.position.y < -300) ud.vy = Math.abs(ud.vy);
                    if (particle.position.y > 400) ud.vy = -Math.abs(ud.vy);

                    // Fade
                    particle.material.opacity = Math.max(0.3, 1 - age * 0.02);

                    // Rotation
                    particle.rotation.x += 0.02;
                    particle.rotation.y += 0.015;

                    // Trails (limited for performance)
                    if (trails[idx].length < 10 && Math.random() < 0.2) {
                        const trailGeom = new THREE.SphereGeometry(3, 4, 4);
                        const trailMat = new THREE.MeshBasicMaterial({
                            color: particle.material.color,
                            transparent: true,
                            opacity: 0.25
                        });
                        const trailMesh = new THREE.Mesh(trailGeom, trailMat);
                        trailMesh.position.copy(particle.position);
                        scene.add(trailMesh);
                        trails[idx].push({ mesh: trailMesh, birth: time });
                    }

                    // Cleanup trails
                    trails[idx] = trails[idx].filter(t => {
                        const trailAge = time - t.birth;
                        if (trailAge > 1.5) {
                            scene.remove(t.mesh);
                            t.mesh.geometry.dispose();
                            t.mesh.material.dispose();
                            return false;
                        }
                        t.mesh.material.opacity = 0.25 * (1 - trailAge / 1.5);
                        t.mesh.scale.setScalar(1 - trailAge / 1.5);
                        return true;
                    });
                }
            });

            renderer.render(scene, camera);
        });

        // Resize
        const handleResize = () => {
            if (!mountRef.current) return;
            camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        };

        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            renderer.setAnimationLoop(null);
            window.removeEventListener('resize', handleResize);
            if (mountRef.current) {
                if (renderer.domElement.parentNode === mountRef.current) {
                    mountRef.current.removeChild(renderer.domElement);
                }
                if (vrButton.parentNode === mountRef.current) {
                    mountRef.current.removeChild(vrButton);
                }
            }
            renderer.dispose();
        };
    }, [nodes]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100vh', background: '#0d1117' }}>
            {/* Stats overlay */}
            <div style={{
                position: 'absolute',
                top: 16,
                left: 16,
                zIndex: 10,
                fontFamily: 'monospace',
                background: 'rgba(13, 17, 23, 0.9)',
                padding: 16,
                borderRadius: 8,
                border: '1px solid #21262d'
            }}>
                <h2 style={{ margin: '0 0 12px 0', color: '#f0883e', fontSize: 18 }}>
                    🎮 VR Interactive GODMODE
                </h2>
                <div style={{ color: '#8b949e', fontSize: 12 }}>
                    <div>Nodes: <span style={{ color: '#58a6ff' }}>
                        {Object.values(nodeStatus).filter(s => s === 'connected').length}/{nodes.length}
                    </span></div>
                    <div>Particles: <span style={{ color: '#c9d1d9' }}>{stats.particles}</span></div>
                    <div>Wins: <span style={{ color: '#3fb950' }}>{stats.wins}</span></div>
                    <div>Grabbed: <span style={{ color: '#f0883e' }}>{stats.grabbed}</span></div>
                    <div>VR: <span style={{ color: stats.vrActive ? '#3fb950' : '#8b949e' }}>
                        {stats.vrActive ? 'ACTIVE' : 'Ready'}
                    </span></div>
                </div>
                <div style={{ marginTop: 12, fontSize: 10, color: '#484f58', lineHeight: 1.5 }}>
                    <strong style={{ color: '#f0883e' }}>VR Controls:</strong><br/>
                    • Trigger: Grab particles<br/>
                    • Grip: Scale all particles<br/>
                    • Move hand: Throw particles
                </div>
            </div>

            {/* Node indicators */}
            <div style={{
                position: 'absolute',
                top: 16,
                right: 16,
                zIndex: 10,
                display: 'flex',
                gap: 8
            }}>
                {nodes.map((url, i) => (
                    <div key={url} style={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        background: nodeStatus[url] === 'connected'
                            ? ['#58a6ff', '#3fb950', '#a371f7', '#f0883e'][i % 4]
                            : '#484f58',
                        boxShadow: nodeStatus[url] === 'connected'
                            ? `0 0 12px ${['#58a6ff', '#3fb950', '#a371f7', '#f0883e'][i % 4]}`
                            : 'none'
                    }} />
                ))}
            </div>

            {/* Three.js mount */}
            <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
        </div>
    );
}
