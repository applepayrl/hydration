import * as THREE from 'three';
import { CupId } from '../../types/hydration';

/**
 * Creates lathe profiles for the 3 reference glass shapes in the photo.
 */

export function createTallHighballGlassGeometry(): THREE.BufferGeometry {
  const points: THREE.Vector2[] = [];
  const segments = 64;

  // 1. Bottom flat base & outer rounded corner
  points.push(new THREE.Vector2(0, 0));
  points.push(new THREE.Vector2(0.42, 0));
  points.push(new THREE.Vector2(0.46, 0.03));
  points.push(new THREE.Vector2(0.465, 0.20));
  points.push(new THREE.Vector2(0.47, 0.42)); // End of solid bottom sham
  points.push(new THREE.Vector2(0.475, 1.30));
  points.push(new THREE.Vector2(0.48, 2.28));
  
  // Smooth rounded rim lip
  points.push(new THREE.Vector2(0.48, 2.30));
  points.push(new THREE.Vector2(0.47, 2.31));
  points.push(new THREE.Vector2(0.445, 2.31));
  points.push(new THREE.Vector2(0.438, 2.29));

  // Inner wall going down
  points.push(new THREE.Vector2(0.435, 2.0));
  points.push(new THREE.Vector2(0.43, 1.30));
  points.push(new THREE.Vector2(0.425, 0.50));
  points.push(new THREE.Vector2(0.41, 0.42)); // Inner floor start (thick glass bottom at y=0.42)
  points.push(new THREE.Vector2(0, 0.42)); // Center of inner bottom

  const geometry = new THREE.LatheGeometry(points, segments);
  geometry.computeVertexNormals();
  return geometry;
}

export function createBulbousTumblerGlassGeometry(): THREE.BufferGeometry {
  const points: THREE.Vector2[] = [];
  const segments = 64;

  // 1. Bottom base
  points.push(new THREE.Vector2(0, 0));
  points.push(new THREE.Vector2(0.36, 0));
  points.push(new THREE.Vector2(0.40, 0.04));
  
  // 2. Outer belly curve (curves out to 0.65 at y=0.55, then tapers in to 0.46 at top rim)
  const outerSpline = new THREE.SplineCurve([
    new THREE.Vector2(0.40, 0.04),
    new THREE.Vector2(0.56, 0.25),
    new THREE.Vector2(0.65, 0.55),
    new THREE.Vector2(0.62, 0.90),
    new THREE.Vector2(0.54, 1.25),
    new THREE.Vector2(0.46, 1.54),
  ]);
  const outerPoints = outerSpline.getPoints(24);
  points.push(...outerPoints.slice(1));

  // Smooth rounded rim lip
  points.push(new THREE.Vector2(0.455, 1.56));
  points.push(new THREE.Vector2(0.425, 1.56));
  points.push(new THREE.Vector2(0.415, 1.53));

  // Inner wall
  const innerSpline = new THREE.SplineCurve([
    new THREE.Vector2(0.415, 1.53),
    new THREE.Vector2(0.49, 1.25),
    new THREE.Vector2(0.57, 0.90),
    new THREE.Vector2(0.59, 0.55),
    new THREE.Vector2(0.51, 0.28),
    new THREE.Vector2(0.35, 0.16),
  ]);
  const innerPoints = innerSpline.getPoints(24);
  points.push(...innerPoints.slice(1));

  // Inner floor
  points.push(new THREE.Vector2(0, 0.16));

  const geometry = new THREE.LatheGeometry(points, segments);
  geometry.computeVertexNormals();
  return geometry;
}

export function createRocksGlassGeometry(): THREE.BufferGeometry {
  const points: THREE.Vector2[] = [];
  const segments = 64;

  // 1. Bottom base
  points.push(new THREE.Vector2(0, 0));
  points.push(new THREE.Vector2(0.50, 0));
  points.push(new THREE.Vector2(0.54, 0.04));
  points.push(new THREE.Vector2(0.55, 0.14)); // solid base floor
  points.push(new THREE.Vector2(0.555, 0.65));
  points.push(new THREE.Vector2(0.56, 1.24));

  // Rim
  points.push(new THREE.Vector2(0.56, 1.26));
  points.push(new THREE.Vector2(0.54, 1.27));
  points.push(new THREE.Vector2(0.51, 1.27));
  points.push(new THREE.Vector2(0.50, 1.25));

  // Inner wall
  points.push(new THREE.Vector2(0.495, 0.65));
  points.push(new THREE.Vector2(0.49, 0.14));
  points.push(new THREE.Vector2(0, 0.14));

  const geometry = new THREE.LatheGeometry(points, segments);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Creates clean, watertight water volume geometry strictly contained inside the inner cavity
 */
export function createWaterGeometry(cupId: CupId, fillRatio: number = 1.0): THREE.BufferGeometry {
  const segments = 48;
  const clampedRatio = Math.max(0.01, Math.min(1.0, fillRatio));

  if (cupId === 'tall-10oz') {
    const startY = 0.425;
    const maxTargetY = 2.12;
    const currentHeight = (maxTargetY - startY) * clampedRatio;
    const radius = 0.395; // Firmly inset inside the 0.435 inner wall

    const geom = new THREE.CylinderGeometry(radius, radius, currentHeight, segments);
    geom.translate(0, startY + currentHeight / 2, 0);
    geom.computeVertexNormals();
    return geom;
  }

  if (cupId === 'bulbous-10oz') {
    const startY = 0.165;
    const maxTargetY = 1.40;
    const currentTopY = startY + (maxTargetY - startY) * clampedRatio;

    // Inner water contour spline safely inset from inner glass wall
    const spline = new THREE.SplineCurve([
      new THREE.Vector2(0.30, 0.165),
      new THREE.Vector2(0.44, 0.28),
      new THREE.Vector2(0.51, 0.55),
      new THREE.Vector2(0.48, 0.90),
      new THREE.Vector2(0.42, 1.25),
      new THREE.Vector2(0.36, 1.45),
    ]);

    const allSplinePoints = spline.getPoints(40);
    const filteredPoints = allSplinePoints.filter((p) => p.y < currentTopY);

    let topRadius = 0.36;
    for (let i = 0; i < allSplinePoints.length - 1; i++) {
      const p1 = allSplinePoints[i];
      const p2 = allSplinePoints[i + 1];
      if (p1.y <= currentTopY && p2.y >= currentTopY) {
        const factor = (currentTopY - p1.y) / (p2.y - p1.y || 1);
        topRadius = p1.x + (p2.x - p1.x) * factor;
        break;
      }
    }

    const lathePoints: THREE.Vector2[] = [
      new THREE.Vector2(0, startY),
      ...filteredPoints,
      new THREE.Vector2(topRadius, currentTopY),
      new THREE.Vector2(0, currentTopY),
    ];

    const geom = new THREE.LatheGeometry(lathePoints, segments);
    geom.computeVertexNormals();
    return geom;
  }

  // rocks-8oz
  const startY = 0.145;
  const maxTargetY = 1.12;
  const currentHeight = (maxTargetY - startY) * clampedRatio;
  const radius = 0.435; // Firmly inset inside the 0.49 inner wall

  const geom = new THREE.CylinderGeometry(radius, radius, currentHeight, segments);
  geom.translate(0, startY + currentHeight / 2, 0);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Procedurally generates a studio reflection HDRI texture
 */
export function createStudioEnvironmentTexture(renderer?: THREE.WebGLRenderer): THREE.Texture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const bgGrad = ctx.createLinearGradient(0, 0, 0, size);
  bgGrad.addColorStop(0, '#1e293b');
  bgGrad.addColorStop(0.5, '#0f172a');
  bgGrad.addColorStop(1, '#020617');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, size, size);

  // Softbox light top-left
  const keyGrad = ctx.createRadialGradient(size * 0.3, size * 0.25, 10, size * 0.3, size * 0.25, 220);
  keyGrad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
  keyGrad.addColorStop(0.3, 'rgba(224, 242, 254, 0.8)');
  keyGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = keyGrad;
  ctx.fillRect(0, 0, size, size);

  // Rim strip light on right
  const rimGrad = ctx.createLinearGradient(size * 0.75, 0, size * 0.95, 0);
  rimGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  rimGrad.addColorStop(0.5, 'rgba(186, 230, 253, 0.9)');
  rimGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = rimGrad;
  ctx.fillRect(size * 0.7, 0, size * 0.3, size);

  // Bottom table reflection bounce
  const tableGrad = ctx.createLinearGradient(0, size * 0.7, 0, size);
  tableGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  tableGrad.addColorStop(1, 'rgba(56, 189, 248, 0.3)');
  ctx.fillStyle = tableGrad;
  ctx.fillRect(0, size * 0.7, size, size * 0.3);

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Physical Crystal Glass Material
 */
export function createGlassMaterial(envMap?: THREE.Texture): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0xffffff),
    transmission: 0.92,
    opacity: 1.0,
    transparent: true,
    roughness: 0.02,
    metalness: 0.04,
    ior: 1.52,
    thickness: 0.25,
    specularIntensity: 1.0,
    specularColor: new THREE.Color(0xffffff),
    envMap: envMap || null,
    envMapIntensity: 2.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.01,
    side: THREE.FrontSide,
    depthWrite: false,
  });
}

/**
 * Physical Water Material with vibrant crystal blue depth
 */
export function createWaterMaterial(envMap?: THREE.Texture): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0x38bdf8),
    transmission: 0.65,
    opacity: 0.94,
    transparent: true,
    roughness: 0.04,
    metalness: 0.08,
    ior: 1.333,
    thickness: 0.6,
    attenuationColor: new THREE.Color(0x0284c7),
    attenuationDistance: 0.45,
    specularIntensity: 1.0,
    specularColor: new THREE.Color(0xe0f2fe),
    emissive: new THREE.Color(0x0284c7),
    emissiveIntensity: 0.22,
    envMap: envMap || null,
    envMapIntensity: 1.8,
    side: THREE.DoubleSide,
    depthWrite: true,
  });
}
