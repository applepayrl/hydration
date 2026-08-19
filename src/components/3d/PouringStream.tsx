import * as THREE from 'three';

export class PouringStreamEffect extends THREE.Group {
  private streamMesh: THREE.Mesh;
  private splashParticles: THREE.Points;
  private splashVelocities: THREE.Vector3[] = [];
  private splashLifetimes: number[] = [];
  private particleCount: number = 48;
  private targetY: number;
  private startY: number = 3.8;
  private segments: number = 32;

  constructor(targetY: number = 0.5) {
    super();
    this.targetY = targetY;

    // 1. Organic Tapered Water Stream
    const streamGeom = this.createStreamGeometry(this.startY, this.targetY);

    const streamMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x38bdf8),
      transmission: 0.85,
      roughness: 0.03,
      metalness: 0.05,
      ior: 1.333,
      transparent: true,
      opacity: 0.92,
      emissive: new THREE.Color(0x0284c7),
      emissiveIntensity: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    this.streamMesh = new THREE.Mesh(streamGeom, streamMat);
    this.streamMesh.renderOrder = 2;
    this.add(this.streamMesh);

    // 2. Splash droplet & mist particles at fluid contact point
    const positions = new Float32Array(this.particleCount * 3);
    for (let i = 0; i < this.particleCount; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 0.06;
      positions[i * 3 + 1] = this.targetY;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.06;

      const angle = Math.random() * Math.PI * 2;
      const speed = 0.6 + Math.random() * 1.4;
      const up = 0.8 + Math.random() * 1.6;
      this.splashVelocities.push(new THREE.Vector3(Math.cos(angle) * speed, up, Math.sin(angle) * speed));
      this.splashLifetimes.push(Math.random() * 0.35);
    }

    const splashGeom = new THREE.BufferGeometry();
    splashGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(16, 16, 1, 16, 16, 15);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.4, 'rgba(56, 189, 248, 0.9)');
    grad.addColorStop(1, 'rgba(2, 132, 199, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(16, 16, 15, 0, Math.PI * 2);
    ctx.fill();

    const splashTex = new THREE.CanvasTexture(canvas);

    const splashMat = new THREE.PointsMaterial({
      size: 0.09,
      map: splashTex,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.splashParticles = new THREE.Points(splashGeom, splashMat);
    this.splashParticles.renderOrder = 3;
    this.add(this.splashParticles);
  }

  private createStreamGeometry(startY: number, targetY: number): THREE.BufferGeometry {
    const height = Math.max(0.1, startY - targetY);
    const radiusTop = 0.045;
    const radiusBottom = 0.035;

    // Build tapered curved profile
    const geom = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 24, this.segments);
    geom.translate(0, targetY + height / 2, 0);
    geom.computeVertexNormals();
    return geom;
  }

  public setTargetY(y: number) {
    this.targetY = y;
    this.streamMesh.geometry.dispose();
    this.streamMesh.geometry = this.createStreamGeometry(this.startY, this.targetY);
  }

  public update(delta: number, time: number) {
    // 1. Organic fluid stream perturbation
    const wobbleX = Math.sin(time * 10) * 0.008 + Math.cos(time * 16) * 0.004;
    const wobbleZ = Math.cos(time * 12) * 0.008 + Math.sin(time * 14) * 0.004;
    this.streamMesh.position.set(wobbleX, 0, wobbleZ);
    this.streamMesh.rotation.y = time * 3.0;

    // 2. Animate splash droplets
    const posAttr = this.splashParticles.geometry.getAttribute('position') as THREE.BufferAttribute;
    const positions = posAttr.array as Float32Array;

    for (let i = 0; i < this.particleCount; i++) {
      this.splashLifetimes[i] += delta;
      const idx = i * 3;

      if (this.splashLifetimes[i] > 0.32) {
        this.splashLifetimes[i] = 0;
        positions[idx + 0] = (Math.random() - 0.5) * 0.04 + wobbleX;
        positions[idx + 1] = this.targetY;
        positions[idx + 2] = (Math.random() - 0.5) * 0.04 + wobbleZ;

        const angle = Math.random() * Math.PI * 2;
        const speed = 0.4 + Math.random() * 0.9;
        this.splashVelocities[i].set(Math.cos(angle) * speed, 0.8 + Math.random() * 1.2, Math.sin(angle) * speed);
      } else {
        positions[idx + 0] += this.splashVelocities[i].x * delta;
        positions[idx + 1] += this.splashVelocities[i].y * delta;
        positions[idx + 2] += this.splashVelocities[i].z * delta;

        this.splashVelocities[i].y -= 9.8 * delta;
      }
    }
    posAttr.needsUpdate = true;
  }

  public dispose() {
    this.streamMesh.geometry.dispose();
    (this.streamMesh.material as THREE.Material).dispose();
    this.splashParticles.geometry.dispose();
    (this.splashParticles.material as THREE.Material).dispose();
  }
}
