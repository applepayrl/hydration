import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CupId } from '../../types/hydration';
import { GlassObject3D } from './GlassMesh';
import { createStudioEnvironmentTexture } from './GlassGeometries';
import { GlassFallback2D } from './GlassFallback2D';

interface GlassSelectorSceneProps {
  cupId: CupId;
  isSelected?: boolean;
  fillRatio?: number;
  autoRotate?: boolean;
}

export const GlassSelectorScene: React.FC<GlassSelectorSceneProps> = ({
  cupId,
  fillRatio = 0.85,
  autoRotate = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const glassRef = useRef<GlassObject3D | null>(null);
  const isInteractingRef = useRef(false);
  const prevPointerXRef = useRef(0);
  const [hasWebGLError, setHasWebGLError] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 160;
    const height = container.clientHeight || 180;

    let renderer: THREE.WebGLRenderer;
    let animId: number;
    let glass: GlassObject3D;

    try {
      const scene = new THREE.Scene();

      // Adjusted camera per cup height to keep them proportional yet centered
      const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 50);
      const cameraDistance = cupId === 'tall-10oz' ? 4.8 : 3.8;
      const centerY = cupId === 'tall-10oz' ? 1.15 : cupId === 'bulbous-10oz' ? 0.8 : 0.65;
      camera.position.set(0, centerY + 0.3, cameraDistance);
      camera.lookAt(0, centerY, 0);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      const envTexture = createStudioEnvironmentTexture(renderer);
      scene.environment = envTexture;

      // Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
      scene.add(ambientLight);

      const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
      keyLight.position.set(3, 5, 4);
      scene.add(keyLight);

      const rimLight = new THREE.DirectionalLight(0x38bdf8, 2.0);
      rimLight.position.set(-3, 3, -3);
      scene.add(rimLight);

      // Glass instance
      glass = new GlassObject3D(cupId, fillRatio, envTexture);
      glass.position.set(0, 0, 0);
      scene.add(glass);
      glassRef.current = glass;

      const clock = new THREE.Clock();
      const animate = () => {
        animId = requestAnimationFrame(animate);
        const delta = clock.getDelta();
        const time = clock.getElapsedTime();

        if (autoRotate && !isInteractingRef.current) {
          glass.rotation.y += 0.012;
        }

        glass.update(delta, time);
        renderer.render(scene, camera);
      };
      animate();

      const resizeObserver = new ResizeObserver(() => {
        if (!container || !renderer || !camera) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      });
      resizeObserver.observe(container);

      return () => {
        cancelAnimationFrame(animId);
        resizeObserver.disconnect();
        glass.dispose();
        renderer.dispose();
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      };
    } catch (e) {
      console.warn('WebGL init error in GlassSelectorScene, using 2D fallback', e);
      setHasWebGLError(true);
    }
  }, [cupId, fillRatio, autoRotate]);

  if (hasWebGLError) {
    return <GlassFallback2D cupId={cupId} fillRatio={fillRatio} />;
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    isInteractingRef.current = true;
    prevPointerXRef.current = e.clientX;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isInteractingRef.current || !glassRef.current) return;
    const deltaX = e.clientX - prevPointerXRef.current;
    prevPointerXRef.current = e.clientX;
    glassRef.current.rotation.y += deltaX * 0.02;
  };

  const handlePointerUp = () => {
    isInteractingRef.current = false;
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full cursor-grab active:cursor-grabbing touch-none select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    />
  );
};
