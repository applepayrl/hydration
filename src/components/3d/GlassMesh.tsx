import * as THREE from 'three';
import { CupId } from '../../types/hydration';
import {
  createTallHighballGlassGeometry,
  createBulbousTumblerGlassGeometry,
  createRocksGlassGeometry,
  createWaterGeometry,
  createGlassMaterial,
  createWaterMaterial,
} from './GlassGeometries';

export interface GlassMeshProps {
  cupId: CupId;
  fillRatio?: number;
  isAnimated?: boolean;
  showBubbles?: boolean;
  envMap?: THREE.Texture;
}

export class GlassObject3D extends THREE.Group {
  public cupId: CupId;
  public fillRatio: number;
  public glassMesh: THREE.Mesh;
  public waterMesh: THREE.Mesh | null = null;
  public meniscusMesh: THREE.Mesh | null = null;
  public causticRingMesh: THREE.Mesh | null = null;
  public bubbleParticles: THREE.Points | null = null;
  private bubbleVelocities: Float32Array | null = null;
  private bubbleCount: number = 24;
  private envMap?: THREE.Texture;
  private glassMat: THREE.MeshPhysicalMaterial;
  private waterMat: THREE.MeshPhysicalMaterial;

  constructor(cupId: CupId, fillRatio: number = 1.0, envMap?: THREE.Texture) {
    super();
    this.cupId = cupId;
    this.fillRatio = fillRatio;
    this.envMap = envMap;

    this.glassMat = createGlassMaterial(envMap);
    this.waterMat = createWaterMaterial(envMap);

    // 1. Create Glass Outer Mesh
    const glassGeom = this.getGlassGeometry(cupId);
    this.glassMesh = new THREE.Mesh(glassGeom, this.glassMat);
    this.glassMesh.castShadow = true;
    this.glassMesh.receiveShadow = true;
    this.glassMesh.renderOrder = 3;
    this.add(this.glassMesh);

    // 2. Create Table Caustic Glow Ring
    this.setupCausticGlow();

    // 3. Create Water & Meniscus Mesh
    if (this.fillRatio > 0.01) {
      this.updateWaterMesh();
    }

    // 4. Create Micro-Bubbles
    this.setupBubbles();
  }

  private getGlassGeometry(cupId: CupId): THREE.BufferGeometry {
    switch (cupId) {
      case 'tall-10oz':
        return createTallHighballGlassGeometry();
      case 'bulbous-10oz':
        return createBulbousTumblerGlassGeometry();
      case 'rocks-8oz':
        return createRocksGlassGeometry();
    }
  }

  private setupCausticGlow() {
    const radius = this.cupId === 'bulbous-10oz' ? 0.65 : this.cupId === 'rocks-8oz' ? 0.58 : 0.50;
    const geom = new THREE.PlaneGeometry(radius * 2.2, radius * 2.2);
    geom.rotateX(-Math.PI / 2);

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(64, 64, 15, 64, 64, 60);
    grad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
    grad.addColorStop(0.5, 'rgba(14, 165, 233, 0.25)');
    grad.addColorStop(1, 'rgba(14, 165, 233, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const causticTex = new THREE.CanvasTexture(canvas);
    const causticMat = new THREE.MeshBasicMaterial({
      map: causticTex,
      transparent: true,
      opacity: this.fillRatio > 0.1 ? 0.7 : 0.2,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.causticRingMesh = new THREE.Mesh(geom, causticMat);
    this.causticRingMesh.position.set(0, 0.005, 0);
    this.add(this.causticRingMesh);
  }

  public setFillRatio(ratio: number) {
    this.fillRatio = Math.max(0, Math.min(1, ratio));
    this.updateWaterMesh();
    if (this.causticRingMesh) {
      const mat = this.causticRingMesh.material as THREE.MeshBasicMaterial;
      mat.opacity = this.fillRatio > 0.1 ? 0.7 : 0.2;
    }
  }

  private updateWaterMesh() {
    if (this.waterMesh) {
      this.remove(this.waterMesh);
      this.waterMesh.geometry.dispose();
      this.waterMesh = null;
    }
    if (this.meniscusMesh) {
      this.remove(this.meniscusMesh);
      this.meniscusMesh.geometry.dispose();
      this.meniscusMesh = null;
    }

    if (this.fillRatio <= 0.01) return;

    // 1. Water Body Mesh
    const waterGeom = createWaterGeometry(this.cupId, this.fillRatio);
    this.waterMesh = new THREE.Mesh(waterGeom, this.waterMat);
    this.waterMesh.renderOrder = 1;
    this.waterMesh.receiveShadow = true;
    this.add(this.waterMesh);

    // 2. Top Water Surface Meniscus Disk (firmly inside rim)
    const bounds = this.getLiquidBounds();
    const meniscusGeom = new THREE.CircleGeometry(bounds.radius * 0.96, 36);
    meniscusGeom.rotateX(-Math.PI / 2);
    meniscusGeom.translate(0, bounds.maxY, 0);

    const meniscusMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x7dd3fc),
      transmission: 0.8,
      roughness: 0.02,
      metalness: 0.1,
      ior: 1.333,
      transparent: true,
      opacity: 0.9,
      emissive: new THREE.Color(0x38bdf8),
      emissiveIntensity: 0.2,
      envMap: this.envMap || null,
      side: THREE.DoubleSide,
      depthWrite: true,
    });

    this.meniscusMesh = new THREE.Mesh(meniscusGeom, meniscusMat);
    this.meniscusMesh.renderOrder = 2;
    this.add(this.meniscusMesh);
  }

  private setupBubbles() {
    if (this.fillRatio <= 0.05) return;

    const count = this.bubbleCount;
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    this.bubbleVelocities = new Float32Array(count);

    const bounds = this.getLiquidBounds();

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * (bounds.radius * 0.7);
      positions[i * 3 + 0] = Math.cos(angle) * r;
      positions[i * 3 + 1] = bounds.minY + Math.random() * (bounds.maxY - bounds.minY);
      positions[i * 3 + 2] = Math.sin(angle) * r;

      scales[i] = 0.03 + Math.random() * 0.04;
      this.bubbleVelocities[i] = 0.25 + Math.random() * 0.4;
    }

    const bubbleGeom = new THREE.BufferGeometry();
    bubbleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    bubbleGeom.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.4, 'rgba(186, 230, 253, 0.85)');
    grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(32, 32, 30, 0, Math.PI * 2);
    ctx.fill();

    const bubbleTexture = new THREE.CanvasTexture(canvas);

    const bubbleMat = new THREE.PointsMaterial({
      size: 0.06,
      map: bubbleTexture,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.bubbleParticles = new THREE.Points(bubbleGeom, bubbleMat);
    this.bubbleParticles.renderOrder = 4;
    this.add(this.bubbleParticles);
  }

  private getLiquidBounds() {
    switch (this.cupId) {
      case 'tall-10oz':
        return {
          minY: 0.43,
          maxY: 0.43 + (2.12 - 0.43) * this.fillRatio,
          radius: 0.395,
        };
      case 'bulbous-10oz':
        const t = this.fillRatio;
        const currentTopY = 0.165 + (1.40 - 0.165) * t;
        const r = t < 0.45 ? 0.30 + t * 0.46 : 0.51 - (t - 0.45) * 0.26;
        return {
          minY: 0.17,
          maxY: currentTopY,
          radius: Math.max(0.30, Math.min(0.51, r)),
        };
      case 'rocks-8oz':
        return {
          minY: 0.15,
          maxY: 0.15 + (1.12 - 0.15) * this.fillRatio,
          radius: 0.435,
        };
    }
  }

  public update(delta: number, time: number) {
    // 1. Update micro-bubbles
    if (this.bubbleParticles && this.bubbleVelocities) {
      const posAttr = this.bubbleParticles.geometry.getAttribute('position') as THREE.BufferAttribute;
      const positions = posAttr.array as Float32Array;
      const bounds = this.getLiquidBounds();

      for (let i = 0; i < this.bubbleCount; i++) {
        const yIndex = i * 3 + 1;
        positions[yIndex] += this.bubbleVelocities[i] * delta;
        
        positions[i * 3 + 0] += Math.sin(time * 3 + i) * 0.0008;
        positions[i * 3 + 2] += Math.cos(time * 3 + i) * 0.0008;

        if (positions[yIndex] > bounds.maxY) {
          positions[yIndex] = bounds.minY + Math.random() * 0.05;
          const angle = Math.random() * Math.PI * 2;
          const r = Math.random() * (bounds.radius * 0.7);
          positions[i * 3 + 0] = Math.cos(angle) * r;
          positions[i * 3 + 2] = Math.sin(angle) * r;
        }
      }
      posAttr.needsUpdate = true;
    }

    // 2. Liquid vertical wave ripple
    if (this.meniscusMesh) {
      this.meniscusMesh.position.y = Math.sin(time * 2.5) * 0.003;
    }
  }

  public dispose() {
    this.glassMesh.geometry.dispose();
    this.glassMat.dispose();
    if (this.waterMesh) {
      this.waterMesh.geometry.dispose();
      this.waterMat.dispose();
    }
    if (this.meniscusMesh) {
      this.meniscusMesh.geometry.dispose();
      (this.meniscusMesh.material as THREE.Material).dispose();
    }
    if (this.causticRingMesh) {
      this.causticRingMesh.geometry.dispose();
      (this.causticRingMesh.material as THREE.Material).dispose();
    }
    if (this.bubbleParticles) {
      this.bubbleParticles.geometry.dispose();
      (this.bubbleParticles.material as THREE.Material).dispose();
    }
  }
}
