import type { RenderableCelestialObject } from "@teskooano/data-types";
import {
  CelestialType,
  SCALE,
  type AsteroidFieldProperties as CentralAsteroidFieldProperties,
} from "@teskooano/data-types";
import { createSeededRandomSync } from "@teskooano/core-math";
import {
  BaseCelestialRenderer,
  type CelestialMeshOptions,
  type LightSourcesMap,
} from "@teskooano/renderer-threejs-celestial";
import { LODLevel } from "@teskooano/renderer-threejs-lod";
import * as THREE from "three";
import {
  AsteroidFieldMaterial,
  type AsteroidFieldMaterialOptions,
} from "./material";

/**
 * Configuration options specific to the asteroid field renderer.
 */
export interface AsteroidFieldRendererOptions extends CelestialMeshOptions {
  /**
   * Speed of belt rotation (radians per second).
   * @default 0.00005
   */
  beltRotationSpeed?: number;

  /**
   * Whether to disable billboard LOD levels (asteroid fields manage their own LOD).
   * @default true
   */
  disableBillboard?: boolean;
}

/**
 * Renders an asteroid field using a particle system with LOD support.
 *
 * This renderer creates multiple LOD levels with varying particle counts
 * to provide optimal performance at different viewing distances.
 */
export class AsteroidFieldRenderer extends BaseCelestialRenderer<AsteroidFieldMaterial> {
  private lodGeometries: THREE.BufferGeometry[] = [];
  private beltRotationSpeed = 0.00005;
  private particleRotationSpeed = 1.5; // Default value, will be seeded
  private beltRotationAngle = 0;
  private previousSimTime = 0;
  private cumulativeParticleTime = 0;
  private renderScale = 1.0;
  private random: () => number = () => 0;

  constructor(options: AsteroidFieldRendererOptions = {}) {
    // Pass options to base class with billboard disabled by default
    super({ ...options, disableBillboard: options.disableBillboard ?? true });
  }

  /**
   * Creates the asteroid field material.
   */
  protected createMaterial(
    object: RenderableCelestialObject,
  ): AsteroidFieldMaterial {
    const material = new AsteroidFieldMaterial({
      particleRotationSpeed: this.particleRotationSpeed,
      renderScale: this.renderScale,
    });

    console.debug(
      `[AsteroidFieldRenderer] Created material for ${object.celestialObjectId}`,
    );

    return material;
  }

  /**
   * Creates asteroid field geometry with specified number of particles.
   * Uses deterministic seeded randomization for consistent generation.
   * @param object The celestial object to create geometry for.
   * @param count Number of asteroids to generate.
   * @returns BufferGeometry with positioned asteroid particles.
   * @private
   */
  private _createAsteroidGeometry(
    object: RenderableCelestialObject,
    count: number,
  ): THREE.BufferGeometry {
    if (!this.random) {
      console.warn(
        `[AsteroidFieldRenderer] Seeded random not initialized for ${object.celestialObjectId}, using fallback`,
      );
      this.random = createSeededRandomSync(
        object.seed ?? object.celestialObjectId,
      );
    }

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const textureIndices = new Float32Array(count);
    const initialRotations = new Float32Array(count);

    // Get asteroid field properties with validation
    const properties = this._getAsteroidFieldProperties(object);

    // Convert AU to scene units for positioning
    const innerRadius = properties.innerRadiusAU * SCALE.RENDER_SCALE_AU;
    const outerRadius = properties.outerRadiusAU * SCALE.RENDER_SCALE_AU;
    const height = properties.heightAU * SCALE.RENDER_SCALE_AU;

    // Parse color or use default
    const baseColor = new THREE.Color(properties.color || "#8B7355");

    console.debug(
      `[AsteroidFieldRenderer] Generating ${count} asteroids between ${properties.innerRadiusAU}-${properties.outerRadiusAU} AU`,
    );

    // Generate asteroid positions and properties
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Generate position in toroidal belt shape
      const angle = this.random() * Math.PI * 2;
      const radiusSpread = this.random();
      const radius = innerRadius + (outerRadius - innerRadius) * radiusSpread;

      // Position with some vertical variation
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = (this.random() - 0.5) * height;

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      // Color variation - slight hue and brightness changes
      const colorVariation = this.random() * 0.3 - 0.15; // ±0.15
      const brightnessVariation = this.random() * 0.4 + 0.8; // 0.8-1.2

      const finalColor = baseColor.clone();
      finalColor.offsetHSL(colorVariation * 0.1, 0, colorVariation * 0.2);
      finalColor.multiplyScalar(brightnessVariation);

      colors[i3] = finalColor.r;
      colors[i3 + 1] = finalColor.g;
      colors[i3 + 2] = finalColor.b;

      // Size variation based on distance from center (smaller asteroids further out)
      const distanceFromCenter = Math.sqrt(x * x + z * z);
      const normalizedDistance =
        (distanceFromCenter - innerRadius) / (outerRadius - innerRadius);
      const baseSizeVariation =
        (5.0 - normalizedDistance * 0.3) * (0.7 + this.random() * 0.6);
      // Moderate sizes for good visibility with textures
      sizes[i] = Math.max(3.0, baseSizeVariation * 15.0); // Good size for textured asteroids

      // Add texture index and initial rotation for shader compatibility
      textureIndices[i] = Math.floor(this.random() * 5); // Assuming 5 texture variants
      initialRotations[i] = this.random() * Math.PI * 2; // Random initial rotation
    }

    // Set geometry attributes
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute(
      "textureIndex",
      new THREE.BufferAttribute(textureIndices, 1),
    );
    geometry.setAttribute(
      "initialRotation",
      new THREE.BufferAttribute(initialRotations, 1),
    );

    // Calculate bounding sphere for frustum culling
    geometry.computeBoundingSphere();

    // Store geometry for cleanup
    this.lodGeometries.push(geometry);

    return geometry;
  }

  /**
   * Creates and returns an array of LOD levels with varying particle counts.
   * Uses proper distance calculations based on the asteroid field properties.
   */
  getLODLevels(
    object: RenderableCelestialObject,
    options?: AsteroidFieldRendererOptions,
  ): LODLevel[] {
    this.lodGeometries = [];

    // Initialize seeded random for this asteroid field
    this.random = createSeededRandomSync(
      object.seed ?? object.celestialObjectId,
    );
    this.particleRotationSpeed = 1.0 + this.random() * 2;

    if (options?.beltRotationSpeed !== undefined) {
      this.beltRotationSpeed = options.beltRotationSpeed;
    }
    if (options?.renderScale !== undefined) {
      this.renderScale = options.renderScale;
    }

    let material = this.getTypedMaterial(object.celestialObjectId);
    if (!material) {
      material = this.createAndRegisterMaterial(object);
    }

    // Get asteroid field properties to calculate appropriate LOD distances
    const properties = this._getAsteroidFieldProperties(object);
    const fieldRadius = properties.outerRadiusAU * SCALE.RENDER_SCALE_AU;

    // Much simpler LOD distances for debugging
    const distancesSceneUnits = [
      0, // Always visible
      1000, // 1000 scene units
      5000, // 5000 scene units
      20000, // 20000 scene units
    ];

    // Smaller particle counts for debugging
    const particleCounts = [50000, 25000, 10000, 1000];

    const lodLevels: LODLevel[] = [];

    console.debug(
      `[AsteroidFieldRenderer] Creating ${distancesSceneUnits.length} LOD levels for asteroid field at distances:`,
      distancesSceneUnits.map(
        (d) => `${(d / SCALE.RENDER_SCALE_AU).toFixed(2)} AU`,
      ),
    );

    for (let i = 0; i < distancesSceneUnits.length; i++) {
      const distance = distancesSceneUnits[i];
      const count = particleCounts[Math.min(i, particleCounts.length - 1)];

      const geometry = this._createAsteroidGeometry(object, count);

      const points = new THREE.Points(geometry, material);
      points.name = `${object.celestialObjectId}-asteroidfield-lod-${i}`;
      points.frustumCulled = true;

      lodLevels.push({ object: points, distance: distance });
    }

    if (lodLevels.length === 0) {
      console.error(
        `[AsteroidFieldRenderer] Failed to generate any LOD levels for ${object.celestialObjectId}.`,
      );

      const fallbackGeom = this._createAsteroidGeometry(object, 1000);
      const fallbackPoints = new THREE.Points(fallbackGeom, material);
      return [{ object: fallbackPoints, distance: 0 }];
    }

    return lodLevels;
  }

  /**
   * Helper method to extract and validate asteroid field properties.
   * @param object The renderable celestial object.
   * @returns Validated asteroid field properties.
   * @private
   */
  private _getAsteroidFieldProperties(
    object: RenderableCelestialObject,
  ): CentralAsteroidFieldProperties {
    if (
      object.properties &&
      object.properties.type === CelestialType.ASTEROID_FIELD
    ) {
      return object.properties as CentralAsteroidFieldProperties;
    }

    console.warn(
      `[AsteroidFieldRenderer] Invalid properties for ${object.celestialObjectId}. Using defaults.`,
    );
    return {
      type: CelestialType.ASTEROID_FIELD,
      innerRadiusAU: 2.0,
      outerRadiusAU: 3.0,
      heightAU: 0.2,
      count: 100000,
      color: "#8B7355",
      composition: ["rock"],
    };
  }

  update(
    object: RenderableCelestialObject,
    time: number,
    timeScale: number,
    lightSources: LightSourcesMap,
    camera: THREE.Camera,
  ): void {
    super.update(object, time, timeScale, lightSources, camera);
    const material = this.getTypedMaterial(object.celestialObjectId);

    if (material && material.isMaterialReady()) {
      // Time-based rotation for the entire belt
      const deltaTime = (time - this.previousSimTime) * timeScale;
      this.beltRotationAngle += this.beltRotationSpeed * deltaTime;
      this.beltRotationAngle %= 2 * Math.PI; // Prevent precision loss

      // Slower, cumulative time for individual particle rotation
      this.cumulativeParticleTime += deltaTime * 0.05; // Scale down for slower rotation
      this.cumulativeParticleTime %= 2 * Math.PI; // Prevent precision loss

      // Update material using dedicated methods
      material.updateBeltRotation(this.beltRotationAngle);
      material.updateTime(this.cumulativeParticleTime);
      material.updateParticleRotationSpeed(this.particleRotationSpeed);
      material.updateRenderScale(this.renderScale);

      this.previousSimTime = time;
    }
  }

  dispose(): void {
    super.dispose();

    this.lodGeometries.forEach((geometry) => {
      geometry.dispose();
    });
    this.lodGeometries = [];
    this.beltRotationAngle = 0;
    this.previousSimTime = 0;
    this.cumulativeParticleTime = 0;
  }
}
