import React, { useEffect, useRef, useCallback } from 'react';
import { View } from '@tarojs/components';
import * as THREE from 'three';
import './index.scss';

export interface WorldSceneProps {
  onLoaded?: () => void;
}

const WorldScene: React.FC<WorldSceneProps> = ({ onLoaded }) => {
  const containerRef = useRef<HTMLElement | null>(null);
  const onLoadedRef = useRef<WorldSceneProps['onLoaded']>(undefined);
  const joystickRef = useRef({ x: 0, y: 0 });
  const joystickActiveRef = useRef(false);
  const joystickCenterRef = useRef({ x: 0, y: 0 });
  const joystickKnobRef = useRef<HTMLElement | null>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    onLoadedRef.current = onLoaded;
  }, [onLoaded]);

  const handleContainerRef = useCallback((node: unknown) => {
    containerRef.current = node instanceof HTMLElement ? node : null;
  }, []);

  const handleJoystickKnobRef = useCallback((node: unknown) => {
    joystickKnobRef.current = node instanceof HTMLElement ? node : null;
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- RENDERER ---
    const renderer = new THREE.WebGLRenderer({
      antialias: window.innerWidth > 768,
      alpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x0a0a1a);
    container.appendChild(renderer.domElement);

    // --- SCENE ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0a2a, 0.015);

    // --- CAMERA ---
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const cameraOffset = new THREE.Vector3(0, 5, 10);

    // --- LIGHTING ---
    const ambientLight = new THREE.AmbientLight(0x334466, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xaaccff, 0.8);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    const charLight = new THREE.PointLight(0x4a9eff, 1, 15);
    scene.add(charLight);

    // --- TERRAIN ---
    const terrainGeometry = new THREE.PlaneGeometry(200, 200, 50, 50);
    const positions = terrainGeometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getY(i);
      positions.setZ(i, Math.sin(x * 0.1) * Math.cos(z * 0.1) * 2);
    }
    terrainGeometry.computeVertexNormals();

    const terrainMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a2a4a,
      roughness: 0.8,
      metalness: 0.2,
      flatShading: true,
    });
    const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
    terrain.rotation.x = -Math.PI / 2;
    scene.add(terrain);

    // --- GRID OVERLAY ---
    const gridHelper = new THREE.GridHelper(200, 80, 0x1a3a6a, 0x0a1a3a);
    gridHelper.position.y = 0.05;
    scene.add(gridHelper);

    // --- CHARACTER ---
    const charGeometry = new THREE.CapsuleGeometry(0.4, 1.2, 8, 16);
    const charMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a9eff,
      emissive: 0x1a4a8a,
      emissiveIntensity: 0.5,
      roughness: 0.3,
      metalness: 0.7,
    });
    const character = new THREE.Mesh(charGeometry, charMaterial);
    character.position.set(0, 1.0, 0);
    scene.add(character);

    // --- STARS ---
    const starsGeometry = new THREE.BufferGeometry();
    const starVertices: number[] = [];
    for (let i = 0; i < 2000; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 400;
      starVertices.push(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      );
    }
    starsGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(starVertices, 3)
    );
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.5,
      sizeAttenuation: true,
      fog: false,
    });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // --- MARKERS (placeholder buildings) ---
    const markerGeometry = new THREE.ConeGeometry(0.5, 2, 6);
    const markerMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0x996600,
      emissiveIntensity: 0.3,
    });
    const markerPositions = [
      [10, 0, -10],
      [-15, 0, 5],
      [8, 0, 15],
      [-10, 0, -15],
      [20, 0, 0],
    ];
    markerPositions.forEach(([x, , z]) => {
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.set(x, 1.5, z);
      scene.add(marker);
    });

    // --- INPUT ---
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // --- RESIZE ---
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // --- ANIMATION LOOP ---
    const clock = new THREE.Clock();
    const moveSpeed = 8;

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      let moveX = 0;
      let moveZ = 0;

      // Keyboard
      const keys = keysRef.current;
      if (keys.has('w') || keys.has('arrowup')) moveZ -= 1;
      if (keys.has('s') || keys.has('arrowdown')) moveZ += 1;
      if (keys.has('a') || keys.has('arrowleft')) moveX -= 1;
      if (keys.has('d') || keys.has('arrowright')) moveX += 1;

      // Joystick
      if (joystickActiveRef.current) {
        moveX += joystickRef.current.x;
        moveZ -= joystickRef.current.y;
      }

      // Apply movement
      const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
      if (length > 0) {
        moveX /= length;
        moveZ /= length;

        const cameraDir = new THREE.Vector3();
        camera.getWorldDirection(cameraDir);
        cameraDir.y = 0;
        cameraDir.normalize();

        const right = new THREE.Vector3();
        right.crossVectors(cameraDir, new THREE.Vector3(0, 1, 0));

        character.position.x += (right.x * moveX + cameraDir.x * -moveZ) * moveSpeed * delta;
        character.position.z += (right.z * moveX + cameraDir.z * -moveZ) * moveSpeed * delta;

        const angle = Math.atan2(
          right.x * moveX + cameraDir.x * -moveZ,
          right.z * moveX + cameraDir.z * -moveZ
        );
        character.rotation.y = angle;
      }

      // Clamp to terrain bounds
      character.position.x = Math.max(-95, Math.min(95, character.position.x));
      character.position.z = Math.max(-95, Math.min(95, character.position.z));

      // Update character light
      charLight.position.copy(character.position);
      charLight.position.y += 2;

      // Camera follow
      const targetCamPos = character.position.clone().add(cameraOffset);
      const followStrength = 5;
      const cameraAlpha = 1 - Math.exp(-followStrength * delta);
      camera.position.lerp(targetCamPos, cameraAlpha);
      camera.lookAt(
        character.position.x,
        character.position.y + 1,
        character.position.z
      );

      // Ambient rotation
      stars.rotation.y += 0.0001;

      renderer.render(scene, camera);
    };

    animate();
    onLoadedRef.current?.();

    // --- CLEANUP ---
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);

      renderer.dispose();
      terrainGeometry.dispose();
      terrainMaterial.dispose();
      charGeometry.dispose();
      charMaterial.dispose();
      starsGeometry.dispose();
      starsMaterial.dispose();
      markerGeometry.dispose();
      markerMaterial.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // --- JOYSTICK HANDLERS ---
  const handleJoystickTouchStart = useCallback((e: any) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    joystickCenterRef.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    joystickActiveRef.current = true;
  }, []);

  const handleJoystickTouchMove = useCallback((e: any) => {
    e.stopPropagation();
    if (!joystickActiveRef.current) return;

    const touch = e.touches[0];
    const center = joystickCenterRef.current;
    const maxRadius = 40;

    let dx = touch.clientX - center.x;
    let dy = touch.clientY - center.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    joystickRef.current = {
      x: dx / maxRadius,
      y: -dy / maxRadius,
    };

    if (joystickKnobRef.current) {
      joystickKnobRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
    }
  }, []);

  const handleJoystickTouchEnd = useCallback(() => {
    joystickActiveRef.current = false;
    joystickRef.current = { x: 0, y: 0 };
    if (joystickKnobRef.current) {
      joystickKnobRef.current.style.transform = 'translate(0, 0)';
    }
  }, []);

  return (
    <View className="world-scene">
      <View className="world-scene__canvas" ref={handleContainerRef} />

      <View
        className="world-scene__joystick"
        onTouchStart={handleJoystickTouchStart}
        onTouchMove={handleJoystickTouchMove}
        onTouchEnd={handleJoystickTouchEnd}
        onTouchCancel={handleJoystickTouchEnd}
      >
        <View className="joystick__base">
          <View className="joystick__knob" ref={handleJoystickKnobRef} />
        </View>
      </View>
    </View>
  );
};

export default WorldScene;
