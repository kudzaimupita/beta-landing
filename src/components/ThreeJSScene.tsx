import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const ParticleAttractorSystem = () => {
    const mountRef = useRef(null);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const controlsRef = useRef(null);
    const particlesRef = useRef(null);
    const frameIdRef = useRef(null);
    const attractorsRef = useRef([]);
    const positionsRef = useRef(null);
    const velocitiesRef = useRef(null);
    const timeRef = useRef(0);

    useEffect(() => {
        const currentMount = mountRef.current;
        if (!currentMount) return;

        // Scene setup
        const scene = new THREE.Scene();
        sceneRef.current = scene;

        // Camera setup
        const camera = new THREE.PerspectiveCamera(
            25,
            currentMount.clientWidth / currentMount.clientHeight,
            0.1,
            100
        );
        camera.position.set(3, 5, 8);
        cameraRef.current = camera;

        // Renderer with alpha for transparency
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        renderer.setClearColor(0x000000, 0); // Transparent background
        rendererRef.current = renderer;
        currentMount.appendChild(renderer.domElement);

        // Add OrbitControls for interaction
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.minDistance = 0.1;
        controls.maxDistance = 50;
        controlsRef.current = controls;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight.position.set(4, 2, 0);
        scene.add(directionalLight);

        // Particle system setup
        const COUNT = 200000; // Match the example's high particle count

        // Create attractors
        const attractorsPositions = [
            new THREE.Vector3(-1, 0, 0),
            new THREE.Vector3(1, 0, -0.5),
            new THREE.Vector3(0, 0.5, 1)
        ];

        const attractorsOrientations = [
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(1, 0, -0.5).normalize()
        ];

        const attractors = attractorsPositions.map((pos, i) => ({
            position: pos,
            orientation: attractorsOrientations[i]
        }));

        attractorsRef.current = attractors;

        // Create attractor helpers for visualization
        attractors.forEach((attractor) => {
            // Create a small sphere to represent attractor position
            const geometry = new THREE.SphereGeometry(0.1, 16, 16);
            const material = new THREE.MeshBasicMaterial({
                color: 0x00ffff,
                transparent: true,
                opacity: 0.7
            });
            const sphere = new THREE.Mesh(geometry, material);
            sphere.position.copy(attractor.position);
            // scene.add(sphere);

            // Create a small arrow to represent orientation
            // const arrowHelper = new THREE.ArrowHelper(
            //     attractor.orientation,
            //     attractor.position,
            //     0.5,
            //     0xff00ff,
            //     0.1,
            //     0.05
            // );
            // scene.add(arrowHelper);
        });

        // Particle system parameters
        const attractorMass = 1e7;
        const particleGlobalMass = 1e4;
        const maxSpeed = 8;
        const velocityDamping = 0.9;
        const spinningStrength = 2.75;
        const boundHalfExtent = 8;
        const gravityConstant = 6.67e-11;

        // Prepare color gradient
        const colorA = new THREE.Color(0x5900ff);
        const colorB = new THREE.Color(0xffa575);

        // Create particle material
        const material = new THREE.PointsMaterial({
            size: 0.008,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            transparent: true,
            sizeAttenuation: true,
            depthWrite: false
        });

        // Create particle geometry
        const geometry = new THREE.BufferGeometry();

        // Initialize positions with random values
        const positions = new Float32Array(COUNT * 3);
        const velocities = new Float32Array(COUNT * 3);
        const colors = new Float32Array(COUNT * 3);
        const particleMasses = new Float32Array(COUNT);

        // Set initial positions, velocities and colors
        for (let i = 0; i < COUNT; i++) {
            const i3 = i * 3;

            // Position - spread particles in a disk
            positions[i3] = (Math.random() - 0.5) * 5;
            positions[i3 + 1] = (Math.random() - 0.5) * 0.2;
            positions[i3 + 2] = (Math.random() - 0.5) * 5;

            // Random initial velocity (spherical coordinates)
            const phi = Math.random() * Math.PI * 2;
            const theta = Math.random() * Math.PI;
            const speed = 0.05;

            // Convert spherical to cartesian
            const sinPhiRadius = Math.sin(phi);
            velocities[i3] = sinPhiRadius * Math.sin(theta) * speed;
            velocities[i3 + 1] = Math.cos(phi) * speed;
            velocities[i3 + 2] = sinPhiRadius * Math.cos(theta) * speed;

            // Random mass per particle
            particleMasses[i] = 0.25 + Math.random() * 0.75;

            // Initial color
            colors[i3] = colorA.r;
            colors[i3 + 1] = colorA.g;
            colors[i3 + 2] = colorA.b;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        // Store refs for animation updates
        positionsRef.current = positions;
        velocitiesRef.current = velocities;

        // Create particle system
        const particles = new THREE.Points(geometry, material);
        scene.add(particles);
        particlesRef.current = particles;

        // Animation update function
        const animate = () => {
            frameIdRef.current = requestAnimationFrame(animate);

            // Update orbit controls
            // if (controlsRef.current) {
            //     controlsRef.current.update();
            // }

            // Fixed delta time for consistent results
            const delta = 1 / 60;
            timeRef.current += delta;

            // Slowly rotate attractors
            attractors[0].orientation.applyAxisAngle(new THREE.Vector3(0, 0, 1), 0.002);
            attractors[1].orientation.applyAxisAngle(new THREE.Vector3(1, 0, 0), 0.003);
            attractors[2].orientation.applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.001);

            // Update all particles
            for (let i = 0; i < COUNT; i++) {
                const i3 = i * 3;

                // Get current position and velocity
                const px = positions[i3];
                const py = positions[i3 + 1];
                const pz = positions[i3 + 2];

                let vx = velocities[i3];
                let vy = velocities[i3 + 1];
                let vz = velocities[i3 + 2];

                // Calculate forces from all attractors
                let fx = 0, fy = 0, fz = 0;

                for (const attractor of attractors) {
                    // Vector to attractor
                    const dx = attractor.position.x - px;
                    const dy = attractor.position.y - py;
                    const dz = attractor.position.z - pz;

                    // Distance (squared and normal)
                    const distSq = dx * dx + dy * dy + dz * dz;
                    const dist = Math.sqrt(distSq);

                    if (dist < 0.001) continue; // Avoid division by zero

                    // Normalize direction
                    const nx = dx / dist;
                    const ny = dy / dist;
                    const nz = dz / dist;

                    // Gravitational force
                    const particleMass = particleMasses[i] * particleGlobalMass;
                    const gravityStrength = attractorMass * particleMass * gravityConstant / distSq;

                    // Add gravity force
                    fx += nx * gravityStrength;
                    fy += ny * gravityStrength;
                    fz += nz * gravityStrength;

                    // Spinning force calculation
                    const ox = attractor.orientation.x;
                    const oy = attractor.orientation.y;
                    const oz = attractor.orientation.z;

                    // Apply spinning force (cross product of orientation and distance vector)
                    const spinFactor = gravityStrength * spinningStrength;
                    fx += (oy * dz - oz * dy) * spinFactor;
                    fy += (oz * dx - ox * dz) * spinFactor;
                    fz += (ox * dy - oy * dx) * spinFactor;
                }

                // Update velocity
                vx += fx * delta;
                vy += fy * delta;
                vz += fz * delta;

                // Limit speed
                const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);
                if (speed > maxSpeed) {
                    const factor = maxSpeed / speed;
                    vx *= factor;
                    vy *= factor;
                    vz *= factor;
                }

                // Apply damping
                vx *= velocityDamping;
                vy *= velocityDamping;
                vz *= velocityDamping;

                // Update position
                positions[i3] += vx * delta;
                positions[i3 + 1] += vy * delta;
                positions[i3 + 2] += vz * delta;

                // Store updated velocity
                velocities[i3] = vx;
                velocities[i3 + 1] = vy;
                velocities[i3 + 2] = vz;

                // Box loop (wrap positions)
                const halfExtent = boundHalfExtent / 2;

                // Modulo for position wrapping
                positions[i3] = ((positions[i3] + halfExtent) % boundHalfExtent) - halfExtent;
                positions[i3 + 1] = ((positions[i3 + 1] + halfExtent) % boundHalfExtent) - halfExtent;
                positions[i3 + 2] = ((positions[i3 + 2] + halfExtent) % boundHalfExtent) - halfExtent;

                // Update color based on velocity (speed)
                const speedNormalized = Math.min(speed / maxSpeed, 1);
                colors[i3] = colorA.r * (1 - speedNormalized) + colorB.r * speedNormalized;
                colors[i3 + 1] = colorA.g * (1 - speedNormalized) + colorB.g * speedNormalized;
                colors[i3 + 2] = colorA.b * (1 - speedNormalized) + colorB.b * speedNormalized;
            }

            // Update the geometry attributes
            geometry.attributes.position.needsUpdate = true;
            geometry.attributes.color.needsUpdate = true;

            // Render
            renderer.render(scene, camera);
        };

        // Start animation
        animate();

        // Handle window resize
        const handleResize = () => {
            if (!currentMount || !cameraRef.current || !rendererRef.current) return;

            const width = currentMount.clientWidth;
            const height = currentMount.clientHeight;

            cameraRef.current.aspect = width / height;
            cameraRef.current.updateProjectionMatrix();

            rendererRef.current.setSize(width, height);
        };

        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);

            if (frameIdRef.current) {
                cancelAnimationFrame(frameIdRef.current);
            }

            if (rendererRef.current && rendererRef.current.domElement) {
                currentMount.removeChild(rendererRef.current.domElement);
            }

            if (geometry) {
                geometry.dispose();
            }

            if (material) {
                material.dispose();
            }
        };
    }, []);

    return (
        <div
            ref={mountRef}
            className="w-full h-full"
            style={{ touchAction: 'none' }}
        />
    );
};

export default ParticleAttractorSystem;