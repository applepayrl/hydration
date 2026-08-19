import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { DrinkLogEntry } from '../../types/hydration';
import { GlassObject3D } from './GlassMesh';
import { createStudioEnvironmentTexture } from './GlassGeometries';
import { GlassFallback2D } from './GlassFallback2D';

interface DrinkBoardSceneProps {
  logs: DrinkLogEntry[];
  onSelectDrink?: (entry: DrinkLogEntry) => void;
}

export interface GlassSlot {
  x: number;
  y: number;
  z: number;
  rotY: number;
}

/**
 * Computes optimal 3D positions with staggered depth tiers and zero horizontal occlusion.
 */
export function computeGlassSlots(count: number): GlassSlot[] {
  if (count === 0) return [];

  if (count === 1) {
    return [{ x: 0, y: 0, z: 0, rotY: 0 }];
  }

  if (count === 2) {
    // 2 glasses placed side by side with ample spacing so neither is ever hidden
    return [
      { x: -0.85, y: 0, z: 0.15, rotY: 0.08 },
      { x: 0.85, y: 0, z: 0.15, rotY: -0.08 },
    ];
  }

  if (count === 3) {
    // Inverted V formation: 2 front, 1 elevated center back in the gap
    return [
      { x: -1.25, y: 0, z: 0.35, rotY: 0.12 },
      { x: 0, y: 0.28, z: -0.75, rotY: 0 },
      { x: 1.25, y: 0, z: 0.35, rotY: -0.12 },
    ];
  }

  if (count === 4) {
    // 2 front, 2 elevated back shifted into the gaps
    return [
      { x: -0.88, y: 0, z: 0.38, rotY: 0.08 },
      { x: 0.88, y: 0, z: 0.38, rotY: -0.08 },
      { x: -1.70, y: 0.28, z: -0.75, rotY: 0.14 },
      { x: 0, y: 0.28, z: -0.75, rotY: 0 },
    ];
  }

  // Count >= 5: Interleaved staggered front/back rows
  const spacing = 1.35;
  const frontCount = Math.ceil(count / 2);
  const backCount = Math.floor(count / 2);

  const frontTotalWidth = (frontCount - 1) * spacing;
  const frontStartX = -frontTotalWidth / 2;

  const slots: GlassSlot[] = [];

  let fIdx = 0;
  let bIdx = 0;

  for (let i = 0; i < count; i++) {
    if (i % 2 === 0) {
      // Front row (y = 0, z = +0.40)
      const x = frontStartX + fIdx * spacing;
      slots.push({
        x,
        y: 0,
        z: 0.40,
        rotY: (fIdx % 2 === 0 ? 1 : -1) * 0.08,
      });
      fIdx++;
    } else {
      // Back row: always shifted into interstitial midpoints (y = 0.28, z = -0.75)
      const x = frontStartX + (bIdx + 0.5) * spacing - (backCount > frontCount ? spacing / 2 : 0);
      slots.push({
        x,
        y: 0.28,
        z: -0.75,
        rotY: (bIdx % 2 === 0 ? -1 : 1) * 0.10,
      });
      bIdx++;
    }
  }

  return slots;
}

export const DrinkBoardScene: React.FC<DrinkBoardSceneProps> = ({ logs }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const glassObjectsRef = useRef<GlassObject3D[]>([]);
  const envTextureRef = useRef<THREE.Texture | null>(null);

  const animationFrameIdRef = useRef<number | null>(null);
  const [hasWebGLError, setHasWebGLError] = useState(false);

  // Target camera position: elevated looking slightly down, vertically centered on glasses
  const targetCamPosRef = useRef(new THREE.Vector3(0, 2.6, 5.0));
  const currentCamPosRef = useRef(new THREE.Vector3(0, 2.6, 5.0));
  const targetLookAtYRef = useRef(1.05);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 390;
    const height = container.clientHeight || 500;

    try {
      // 1. Scene setup
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x080d19);
      scene.fog = new THREE.FogExp2(0x080d19, 0.035);
      sceneRef.current = scene;

      // 2. Camera with balanced composition vertically centered on glasses
      const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
      camera.position.set(0, 2.6, 5.0);
      camera.lookAt(0, 1.05, 0);
      cameraRef.current = camera;

      // 3. Renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.25;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.innerHTML = '';
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // 4. Studio Environment
      const envTexture = createStudioEnvironmentTexture(renderer);
      scene.environment = envTexture;
      envTextureRef.current = envTexture;

      // 5. Studio Lighting
      const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.95);
      scene.add(ambientLight);

      const keyLight = new THREE.DirectionalLight(0xffffff, 2.6);
      keyLight.position.set(4, 9, 5);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      scene.add(keyLight);

      const rimLight = new THREE.DirectionalLight(0x38bdf8, 2.2);
      rimLight.position.set(-5, 5, -4);
      scene.add(rimLight);

      const bottomFill = new THREE.DirectionalLight(0x0ea5e9, 0.9);
      bottomFill.position.set(0, -2, 4);
      scene.add(bottomFill);

      // 6. Deep Tiered Countertop Surface with soft dark glass aesthetic
      const tableGeom = new THREE.BoxGeometry(32, 0.5, 18);
      const tableMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0x090f1d),
        roughness: 0.35,
        metalness: 0.4,
        envMap: envTexture,
      });
      const tableMesh = new THREE.Mesh(tableGeom, tableMat);
      tableMesh.position.set(0, -0.25, 0);
      tableMesh.receiveShadow = true;
      scene.add(tableMesh);

      // Subtle front edge highlight strip
      const stripGeom = new THREE.BoxGeometry(32, 0.02, 0.05);
      const stripMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const strip = new THREE.Mesh(stripGeom, stripMat);
      strip.position.set(0, 0.01, 3.4);
      scene.add(strip);

      // 7. Render Loop with smooth elevated camera framing
      const clock = new THREE.Clock();
      const animate = () => {
        animationFrameIdRef.current = requestAnimationFrame(animate);
        const delta = clock.getDelta();
        const time = clock.getElapsedTime();

        // Smooth camera transition to target elevated framing
        currentCamPosRef.current.lerp(targetCamPosRef.current, 0.06);

        if (cameraRef.current) {
          cameraRef.current.position.copy(currentCamPosRef.current);
          cameraRef.current.lookAt(0, targetLookAtYRef.current, 0);
        }

        // Animate floating micro bubbles & water breathing
        glassObjectsRef.current.forEach((glass, idx) => {
          glass.update(delta, time + idx * 0.5);
        });

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
        if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
        resizeObserver.disconnect();
        glassObjectsRef.current.forEach((g) => g.dispose());
        tableGeom.dispose();
        tableMat.dispose();
        stripGeom.dispose();
        stripMat.dispose();
        renderer.dispose();
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      };
    } catch (e) {
      console.warn('WebGL init error in DrinkBoardScene, using 2D fallback', e);
      setHasWebGLError(true);
    }
  }, []);

  // Compute staggered multi-tier depth positions & auto-framing centered camera
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    // Clean up previous 3D glasses
    glassObjectsRef.current.forEach((g) => {
      scene.remove(g);
      g.dispose();
    });
    glassObjectsRef.current = [];

    const count = logs.length;
    if (count === 0) {
      targetCamPosRef.current.set(0, 2.6, 5.0);
      targetLookAtYRef.current = 1.05;
      return;
    }

    const slots = computeGlassSlots(count);

    // Place all glasses on computed non-overlapping slots
    logs.forEach((log, idx) => {
      const slot = slots[idx] || { x: 0, y: 0, z: 0, rotY: 0 };
      const glass = new GlassObject3D(log.cupId, 1.0, envTextureRef.current || undefined);
      glass.position.set(slot.x, slot.y, slot.z);
      glass.rotation.y = slot.rotY;

      scene.add(glass);
      glassObjectsRef.current.push(glass);
    });

    // Auto-calculate span and zoom camera so tall glasses have balanced top/bottom margins
    const allX = slots.map((s) => s.x);
    const minX = Math.min(...allX);
    const maxX = Math.max(...allX);
    const spanX = Math.max(0, maxX - minX);

    // Position camera distance & elevation with generous vertical centering
    const camZ = Math.max(5.1, 4.1 + spanX * 0.95);
    const camY = Math.max(2.6, 2.3 + count * 0.08);

    targetCamPosRef.current.set(0, camY, camZ);
    targetLookAtYRef.current = 1.08;
  }, [logs]);

  if (hasWebGLError) {
    return (
      <div className="relative w-full h-full flex flex-col justify-end p-4">
        <div className="flex flex-wrap items-center justify-center gap-2 py-4 px-2">
          {logs.map((log) => (
            <div key={log.id} className="w-16 h-24 flex flex-col items-center">
              <GlassFallback2D cupId={log.cupId} fillRatio={1.0} />
              <span className="text-[10px] font-bold text-sky-300 mt-0.5">{log.capacityOz} oz</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full select-none touch-none">
      <div ref={containerRef} className="w-full h-full" />

      {/* Empty State Overlay */}
      {logs.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center mb-4 backdrop-blur-md animate-pulse">
            <span className="text-3xl">💧</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-1">Your Daily Shelf is Clear</h3>
          <p className="text-xs text-slate-400 max-w-[240px]">
            Tap any cup below to log your drink and watch it fill with pure water!
          </p>
        </div>
      )}
    </div>
  );
};
