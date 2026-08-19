import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CupId } from '../../types/hydration';
import { CUPS } from '../../utils/storage';
import { soundEngine } from '../../utils/audio';
import { GlassObject3D } from './GlassMesh';
import { PouringStreamEffect } from './PouringStream';
import { createStudioEnvironmentTexture } from './GlassGeometries';
import { GlassFallback2D } from './GlassFallback2D';
import { Sparkles, CheckCircle2 } from 'lucide-react';

interface CinematicPourSceneProps {
  cupId: CupId;
  onComplete: () => void;
  onCancel?: () => void;
}

export const CinematicPourScene: React.FC<CinematicPourSceneProps> = ({ cupId, onComplete, onCancel }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cup = CUPS[cupId];

  const [pourProgress, setPourProgress] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [hasWebGLError, setHasWebGLError] = useState(false);

  const glassObjRef = useRef<GlassObject3D | null>(null);
  const streamObjRef = useRef<PouringStreamEffect | null>(null);
  const soundStopRef = useRef<{ stop: () => void } | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const isSkippedRef = useRef(false);
  const hasCompletedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 390;
    const height = container.clientHeight || 750;

    let renderer: THREE.WebGLRenderer;
    let stream: PouringStreamEffect;
    let glass: GlassObject3D;
    const pourDurationSec = 2.2;
    hasCompletedRef.current = false;
    isSkippedRef.current = false;

    try {
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x060913);

      const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 50);
      const targetY = cupId === 'tall-10oz' ? 1.15 : cupId === 'bulbous-10oz' ? 0.8 : 0.65;
      camera.position.set(0, targetY + 0.45, 4.3);
      camera.lookAt(0, targetY, 0);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.25;
      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      const envTexture = createStudioEnvironmentTexture(renderer);
      scene.environment = envTexture;

      const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
      scene.add(ambientLight);

      const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
      keyLight.position.set(3.5, 6, 4.5);
      scene.add(keyLight);

      const rimLight = new THREE.DirectionalLight(0x38bdf8, 2.4);
      rimLight.position.set(-4, 3, -3);
      scene.add(rimLight);

      const blueGlow = new THREE.PointLight(0x0ea5e9, 3.0, 6);
      blueGlow.position.set(0, -0.5, 2);
      scene.add(blueGlow);

      // Glass sits firm and steady at origin
      glass = new GlassObject3D(cupId, 0.0, envTexture);
      glass.position.set(0, 0, 0);
      scene.add(glass);
      glassObjRef.current = glass;

      // Pouring Stream plunging directly down to bottom sham
      const initialTargetY = cup.proportions.solidBaseHeight;
      stream = new PouringStreamEffect(initialTargetY);
      scene.add(stream);
      streamObjRef.current = stream;

      soundStopRef.current = soundEngine.playPourSound(pourDurationSec);
      soundEngine.triggerHaptic('medium');

      const clock = new THREE.Clock();
      startTimeRef.current = performance.now();

      const animate = () => {
        animFrameRef.current = requestAnimationFrame(animate);
        const delta = clock.getDelta();
        const time = clock.getElapsedTime();
        const elapsed = (performance.now() - (startTimeRef.current || performance.now())) / 1000;

        let progress = 0;
        if (isSkippedRef.current) {
          progress = 1.0;
        } else {
          progress = Math.min(1.0, elapsed / pourDurationSec);
        }

        setPourProgress(progress);
        glass.setFillRatio(progress);

        // Calculate dynamic water level height inside the cup
        const currentLiquidY =
          cup.proportions.solidBaseHeight +
          (cup.proportions.liquidMaxHeight - cup.proportions.solidBaseHeight) * progress;
        stream.setTargetY(currentLiquidY);

        // Glass remains completely steady
        glass.rotation.set(0, 0, 0);

        glass.update(delta, time);
        stream.update(delta, time);

        // Handle exact single completion
        if (progress >= 1.0 && !hasCompletedRef.current) {
          hasCompletedRef.current = true;
          setIsFinished(true);
          if (stream.parent) {
            scene.remove(stream);
          }
          soundEngine.playClinkSound();
          soundEngine.triggerHaptic('success');

          setTimeout(() => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
            onCompleteRef.current();
          }, 600);
        }

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
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        resizeObserver.disconnect();
        if (soundStopRef.current) soundStopRef.current.stop();
        glass.dispose();
        stream.dispose();
        renderer.dispose();
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      };
    } catch (e) {
      console.warn('WebGL init error in CinematicPourScene, falling back to 2D', e);
      setHasWebGLError(true);

      const start = performance.now();
      const interval = setInterval(() => {
        const elapsed = (performance.now() - start) / 1000;
        const prog = Math.min(1.0, elapsed / 2.0);
        setPourProgress(prog);
        if (prog >= 1.0 && !hasCompletedRef.current) {
          hasCompletedRef.current = true;
          clearInterval(interval);
          setIsFinished(true);
          soundEngine.playClinkSound();
          setTimeout(() => onCompleteRef.current(), 600);
        }
      }, 50);

      return () => clearInterval(interval);
    }
  }, [cupId]);

  const handleFastForward = () => {
    isSkippedRef.current = true;
    if (soundStopRef.current) soundStopRef.current.stop();
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-xl animate-fade-in select-none">
      {/* Top Header info */}
      <div className="p-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/20 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
          <span className="text-xs font-semibold text-cyan-300">Filling with Pure Water...</span>
        </div>

        {onCancel && (
          <button
            onClick={onCancel}
            className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-full bg-white/5 border border-white/10"
          >
            Cancel
          </button>
        )}
      </div>

      {/* 3D or 2D Pouring Canvas */}
      <div ref={containerRef} className="flex-1 w-full relative flex items-center justify-center">
        {hasWebGLError && (
          <div className="w-56 h-72">
            <GlassFallback2D cupId={cupId} fillRatio={pourProgress} />
          </div>
        )}
      </div>

      {/* Bottom Status & Info */}
      <div className="p-6 pb-10 flex flex-col items-center gap-4 z-10">
        <div className="text-center">
          <div className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            <span>{cup.name}</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30">
              +{cup.capacityOz} oz
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">{cup.subtitle} • {cup.capacityMl} ml pure water</p>
        </div>

        {/* Dynamic Fluid Progress Bar */}
        <div className="w-64 h-2.5 bg-slate-900 rounded-full overflow-hidden border border-white/10 relative p-0.5">
          <div
            className="h-full bg-gradient-to-r from-sky-500 via-cyan-400 to-teal-300 rounded-full transition-all duration-75 ease-out shadow-[0_0_12px_rgba(56,189,248,0.8)]"
            style={{ width: `${Math.round(pourProgress * 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between w-64 text-[11px] text-slate-400 font-medium">
          <span>0 oz</span>
          <span className="text-cyan-300 font-semibold">{Math.round(pourProgress * cup.capacityOz * 10) / 10} oz</span>
          <span>{cup.capacityOz} oz</span>
        </div>

        {!isFinished && (
          <button
            onClick={handleFastForward}
            className="text-xs text-slate-400 hover:text-white underline underline-offset-4 active:scale-95 transition-all mt-1"
          >
            Tap to fast-fill
          </button>
        )}

        {isFinished && (
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400 animate-bounce">
            <CheckCircle2 className="w-4 h-4" />
            <span>Added to today's shelf!</span>
          </div>
        )}
      </div>
    </div>
  );
};
