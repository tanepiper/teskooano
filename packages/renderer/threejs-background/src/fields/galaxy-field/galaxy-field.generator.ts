import * as THREE from "three";
import { createSeededRandomSync } from "@teskooano/core-math";
import { GalaxyFieldOptions } from "./types";

// --- Galaxy Generation Helpers ---

/** Represents a point in a procedurally generated galaxy cluster. */
interface Body {
  pos: THREE.Vector3;
}

/**
 * A TypeScript implementation of CoordsCylindrical from the user's example.
 */
class CoordsCylindrical {
  static Tau = Math.PI * 2.0;

  constructor(
    public angle: number,
    public radius: number,
    public elevation: number,
  ) {}

  randomize(): this {
    this.angle = CoordsCylindrical.Tau * Math.random();
    this.radius = Math.random();
    this.elevation = Math.random() * 2 - 1;
    return this;
  }

  toCartesian(out: THREE.Vector3): THREE.Vector3 {
    out.set(
      this.radius * Math.cos(this.angle),
      this.radius * Math.sin(this.angle),
      this.elevation,
    );
    return out;
  }
}

/**
 * Generates a 3D point cloud for a spiral galaxy based on the user's algorithm.
 * @returns An array of `Body` objects with normalized positions.
 */
function generateSpiralCluster(
  numberOfBodies: number,
  fractionOfRadiusOccupiedByCentralBulge: number,
  numberOfArms: number,
  lagInCyclesAtRim: number,
): Body[] {
  const bodies: Body[] = [];
  const bodyPosCylindrical = new CoordsCylindrical(0, 0, 0);

  for (let i = 0; i < numberOfBodies; i++) {
    bodyPosCylindrical.randomize();

    // Makes the cluster flatter at the edges
    bodyPosCylindrical.elevation *= 1 - bodyPosCylindrical.radius;

    // Creates spiral arm density using a sine wave
    let radiusScaleFactor = Math.sin(bodyPosCylindrical.angle * numberOfArms);
    radiusScaleFactor = (radiusScaleFactor + 1) / 2;

    bodyPosCylindrical.radius *= radiusScaleFactor;

    // Flattens the galaxy even more outside the central bulge
    if (bodyPosCylindrical.radius >= fractionOfRadiusOccupiedByCentralBulge) {
      bodyPosCylindrical.elevation *= bodyPosCylindrical.elevation;
    }

    // Adds a lag angle to create the spiral arms
    const lagAngle =
      bodyPosCylindrical.radius * CoordsCylindrical.Tau * lagInCyclesAtRim;
    bodyPosCylindrical.angle += lagAngle;

    const bodyPos = new THREE.Vector3();
    bodyPosCylindrical.toCartesian(bodyPos);

    bodies.push({ pos: bodyPos });
  }

  return bodies;
}

/**
 * Generates a 3D point cloud for an elliptical galaxy.
 * @returns An array of `Body` objects with normalized positions.
 */
function generateEllipticalCluster(numberOfBodies: number): Body[] {
  const bodies: Body[] = [];
  const random = Math.random;

  for (let i = 0; i < numberOfBodies; i++) {
    // Generate points in a sphere with higher density at the center
    const r = Math.pow(random(), 2); // Power of 2 biases distribution to the center
    const u = random() * 2 - 1;
    const theta = random() * 2 * Math.PI;
    const x = r * Math.sqrt(1 - u * u) * Math.cos(theta);
    const y = r * Math.sqrt(1 - u * u) * Math.sin(theta);
    const z = r * u;

    const pos = new THREE.Vector3(x, y, z);
    // Scale the sphere into an ellipsoid
    pos.multiply(new THREE.Vector3(1, 0.6, 0.6));
    bodies.push({ pos });
  }
  return bodies;
}

/**
 * Generates a 3D point cloud for an irregular galaxy.
 * @returns An array of `Body` objects with normalized positions.
 */
function generateIrregularCluster(numberOfBodies: number): Body[] {
  const bodies: Body[] = [];
  const numClumps = Math.floor(Math.random() * 3) + 3; // 3 to 5 clumps
  const bodiesPerClump = Math.floor(numberOfBodies / numClumps);

  for (let i = 0; i < numClumps; i++) {
    const clumpCenter = new THREE.Vector3(
      (Math.random() - 0.5) * 1.5,
      (Math.random() - 0.5) * 1.5,
      (Math.random() - 0.5) * 1.5,
    );
    const clumpRadius = 0.2 + Math.random() * 0.4;

    for (let j = 0; j < bodiesPerClump; j++) {
      // Generate points within each clump
      const pos = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5,
      )
        .normalize()
        .multiplyScalar(Math.random() * clumpRadius)
        .add(clumpCenter);
      bodies.push({ pos });
    }
  }
  return bodies;
}

/**
 * A generic renderer for a 3D galaxy point cloud.
 * It rotates, projects, and draws the points onto a 2D canvas.
 */
function drawCluster(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  color: THREE.Color,
  bodies: Body[],
  flatness: number = 0.2,
): void {
  const rotation = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI,
    ),
  );

  // Apply rotation to all points and sort by depth for correct rendering
  bodies.forEach((body) => body.pos.applyQuaternion(rotation));
  bodies.sort((a, b) => a.pos.z - b.pos.z);

  // Use a Vector3 for scaling to control the galaxy's flatness
  const scale = new THREE.Vector3(radius, radius, radius * flatness);

  for (const body of bodies) {
    const screenPos = body.pos.clone().multiply(scale);

    const x = centerX + screenPos.x;
    const y = centerY + screenPos.y;
    const z = screenPos.z;

    // Calculate brightness based on depth and distance from the center
    const distFromCenter = Math.sqrt(
      body.pos.x * body.pos.x + body.pos.y * body.pos.y,
    );
    let brightness = 1 - distFromCenter * 0.7;
    brightness *= 0.8 + (z / radius) * 0.2; // Adjust brightness by depth
    brightness = Math.max(0.05, Math.min(1.0, brightness));
    brightness *= 0.3 + Math.random() * 0.7; // Add randomness

    // Calculate point size
    const pointSize = Math.max(
      0.5,
      (1 - distFromCenter) * 1.2 + Math.random() * 0.5,
    );

    ctx.fillStyle = `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, ${brightness})`;
    ctx.beginPath();
    ctx.arc(x, y, pointSize, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Creates a canvas texture for a galaxy optimized for spherical mapping.
 */
function createGalaxyTexture(
  type: "spiral" | "elliptical" | "irregular",
  color: THREE.Color,
): THREE.Texture {
  const size = 256; // Higher resolution for better sphere mapping
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.45; // Adjusted radius for new generator

  // Clear canvas with transparent background
  ctx.clearRect(0, 0, size, size);

  // Add subtle background glow for better sphere visibility
  const bgGradient = ctx.createRadialGradient(
    centerX,
    centerY,
    0,
    centerX,
    centerY,
    radius * 1.5,
  );
  bgGradient.addColorStop(
    0,
    `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, 0.1)`,
  );
  bgGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, size, size);

  if (type === "spiral") {
    drawSpiralGalaxy(ctx, centerX, centerY, radius, color);
  } else if (type === "elliptical") {
    drawEllipticalGalaxy(ctx, centerX, centerY, radius, color);
  } else {
    drawIrregularGalaxy(ctx, centerX, centerY, radius, color);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping; // Better for sphere mapping
  texture.needsUpdate = true;
  return texture;
}

/**
 * Generates a realistic spiral galaxy using particle-based rendering.
 */
function drawSpiralGalaxy(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  color: THREE.Color,
): void {
  const numberOfBodies = 2500;
  const bodies = generateSpiralCluster(
    numberOfBodies,
    0.25, // fractionOfRadiusOccupiedByCentralBulge
    5, // numberOfArms
    0.5, // lagInCyclesAtRim
  );

  drawCluster(ctx, centerX, centerY, radius, color, bodies, 0.15); // Very flat

  // Add bright central bulge
  const bulgeGradient = ctx.createRadialGradient(
    centerX,
    centerY,
    0,
    centerX,
    centerY,
    radius * 0.3,
  );
  bulgeGradient.addColorStop(
    0,
    `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, 0.9)`,
  );
  bulgeGradient.addColorStop(
    0.7,
    `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, 0.4)`,
  );
  bulgeGradient.addColorStop(
    1,
    `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, 0)`,
  );

  ctx.fillStyle = bulgeGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.3, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draws an elliptical galaxy using a 3D point cloud.
 */
function drawEllipticalGalaxy(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  color: THREE.Color,
): void {
  const numberOfBodies = 3000;
  const bodies = generateEllipticalCluster(numberOfBodies);

  drawCluster(ctx, centerX, centerY, radius, color, bodies, 0.8); // More spherical

  // Add a bright, dense central core
  const coreGradient = ctx.createRadialGradient(
    centerX,
    centerY,
    0,
    centerX,
    centerY,
    radius * 0.25,
  );
  coreGradient.addColorStop(
    0,
    `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, 0.95)`,
  );
  coreGradient.addColorStop(
    1,
    `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, 0)`,
  );

  ctx.fillStyle = coreGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.25, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draws an irregular galaxy using a 3D point cloud.
 */
function drawIrregularGalaxy(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  color: THREE.Color,
): void {
  const numberOfBodies = 1500;
  const bodies = generateIrregularCluster(numberOfBodies);

  drawCluster(ctx, centerX, centerY, radius, color, bodies, 1.0); // Spherical clumps
}

/**
 * Creates a field of galaxies using separate instanced meshes for each type.
 *
 * @param options Configuration object defining the properties of the galaxy field.
 * @returns A THREE.Group containing all the galaxy type meshes.
 */
export function createGalaxyField(options: GalaxyFieldOptions): THREE.Group {
  const random = createSeededRandomSync(
    `galaxyfield-${options.count}-${Date.now()}`,
  );

  const galaxyGroup = new THREE.Group();

  // Galaxy types and their colors
  const galaxyTypes = [
    { type: "spiral" as const, color: new THREE.Color("#FFE4B5"), weight: 0.4 }, // Yellowish spiral
    {
      type: "elliptical" as const,
      color: new THREE.Color("#FFA07A"),
      weight: 0.3,
    }, // Reddish elliptical
    { type: "spiral" as const, color: new THREE.Color("#B0C4DE"), weight: 0.2 }, // Bluish spiral
    {
      type: "irregular" as const,
      color: new THREE.Color("#DDA0DD"),
      weight: 0.1,
    }, // Purple irregular
  ];

  // Calculate count for each galaxy type
  const typeCounts: number[] = [];
  let remainingCount = options.count;

  for (let i = 0; i < galaxyTypes.length; i++) {
    const typeCount = Math.floor(options.count * galaxyTypes[i].weight);
    typeCounts.push(typeCount);
    remainingCount -= typeCount;
  }

  // Distribute remaining galaxies
  for (let i = 0; i < remainingCount; i++) {
    typeCounts[i % typeCounts.length]++;
  }

  // Create separate instanced mesh for each galaxy type
  galaxyTypes.forEach((galaxyType, typeIndex) => {
    const count = typeCounts[typeIndex];
    if (count === 0) return;

    // Create texture for this galaxy type
    const texture = createGalaxyTexture(galaxyType.type, galaxyType.color);

    // Create geometry and material - use sphere so galaxies are visible from all angles
    const geometry = new THREE.SphereGeometry(0.5, 12, 8); // More segments for better texture mapping
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: true,
      depthTest: false,
      fog: false,
      alphaTest: 0.01,
    });

    // Adjust UV mapping for better sphere texture distribution
    const uvs = geometry.attributes.uv.array;
    for (let i = 0; i < uvs.length; i += 2) {
      // Center the UV coordinates and scale them to use more of the texture
      uvs[i] = (uvs[i] - 0.5) * 0.8 + 0.5; // U coordinate
      uvs[i + 1] = (uvs[i + 1] - 0.5) * 0.8 + 0.5; // V coordinate
    }
    geometry.attributes.uv.needsUpdate = true;

    // Create instanced mesh
    const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
    instancedMesh.renderOrder = 1;

    // Create instance data
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const rotation = new THREE.Euler();
    const scale = new THREE.Vector3();
    const opacities = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Generate position on unit sphere with better distribution
      const u = random(); // [0, 1]
      const v = random(); // [0, 1]

      const theta = 2 * Math.PI * u; // Azimuth: [0, 2π]
      const phi = Math.acos(2 * v - 1); // Inclination: [0, π] with proper distribution
      const radius = options.baseDistance;

      position.set(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi),
      );

      // Random rotation
      rotation.set(0, 0, random() * Math.PI * 2);

      // Random size - scale up for proper visibility at distance
      const baseSize =
        options.minSize + random() * (options.maxSize - options.minSize);
      const skyboxSize = baseSize * 10000; // Scale up significantly for visibility
      scale.setScalar(skyboxSize);

      // Set instance matrix
      matrix.compose(
        position,
        new THREE.Quaternion().setFromEuler(rotation),
        scale,
      );
      instancedMesh.setMatrixAt(i, matrix);

      // Set instance opacity
      opacities[i] =
        options.minOpacity +
        random() * (options.maxOpacity - options.minOpacity);
    }

    // Add opacity attribute
    geometry.setAttribute(
      "instanceOpacity",
      new THREE.InstancedBufferAttribute(opacities, 1),
    );

    // Add instance opacity shader
    material.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace(
        "#include <common>",
        `#include <common>
         attribute float instanceOpacity;
         varying float vInstanceOpacity;`,
      );

      shader.vertexShader = shader.vertexShader.replace(
        "#include <uv_vertex>",
        `#include <uv_vertex>
         vInstanceOpacity = instanceOpacity;`,
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <common>",
        `#include <common>
         varying float vInstanceOpacity;`,
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <alphatest_fragment>",
        `#include <alphatest_fragment>
         diffuseColor.a *= vInstanceOpacity;`,
      );
    };

    galaxyGroup.add(instancedMesh);
  });

  return galaxyGroup;
}
