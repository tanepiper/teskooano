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
 * Renders an asteroid field using instanced meshes with LOD support.
 *
 * This renderer creates multiple LOD levels with varying particle counts
 * to provide optimal performance at different viewing distances.
 */
export class AsteroidFieldRenderer extends BaseCelestialRenderer<AsteroidFieldMaterial> {
  private baseGeometry: THREE.BufferGeometry; // Base geometry for a single asteroid
  private instancedMeshes: THREE.InstancedMesh[] = []; // Store instanced meshes
  private asteroidData: {
    position: THREE.Vector3;
    color: THREE.Color;
    size: number;
    textureIndex: number;
    initialRotation: number;
  }[] = [];
  private beltRotationSpeed = 0.00005;
  private particleRotationSpeed = 1.5;
  private beltRotationAngle = 0;
  private previousSimTime = 0;
  private cumulativeParticleTime = 0;
  private renderScale = 1.0;
  private random: () => number = () => 0;
  private objectId: string;

  // Pre-allocated for performance in update loop
  private _tempMatrix = new THREE.Matrix4();
  private _tempPosition = new THREE.Vector3();
  private _tempRotation = new THREE.Euler();
  private _tempScale = new THREE.Vector3();

  constructor(
    object: RenderableCelestialObject,
    options: AsteroidFieldRendererOptions = {},
  ) {
    super(object, {
      ...options,
      disableBillboard: options.disableBillboard ?? true,
    });
    this.objectId = object.celestialObjectId;
    this.baseGeometry = new THREE.SphereGeometry(1, 8, 8); // Simple sphere for instance
    this.baseGeometry.name = "AsteroidBaseGeometry";
  }

  protected createMaterial(
    object: RenderableCelestialObject,
  ): AsteroidFieldMaterial {
    const properties = this._getAsteroidFieldProperties(object);

    const material = new AsteroidFieldMaterial({
      particleRotationSpeed: this.particleRotationSpeed,
      renderScale: this.renderScale,
    });

    if (properties.texturePaths && properties.texturePaths.length > 0) {
      material.loadTexturesFromPaths(properties.texturePaths);
    }

    return material;
  }

  /**
   * Generates asteroid data (positions, colors, sizes, etc.) for a given count.
   * This data will be used to populate the instance attributes of InstancedMesh.
   * @param object The celestial object.
   * @param count Number of asteroids to generate.
   * @returns An array of asteroid data.
   */
  private _generateAsteroidData(
    object: RenderableCelestialObject,
    count: number,
  ): typeof this.asteroidData {
    if (!this.random) {
      this.random = createSeededRandomSync(
        object.seed ?? object.celestialObjectId,
      );
    }

    const data: typeof this.asteroidData = [];

    const properties = this._getAsteroidFieldProperties(object);

    const innerRadius = properties.innerRadiusAU * SCALE.RENDER_SCALE_AU;
    const outerRadius = properties.outerRadiusAU * SCALE.RENDER_SCALE_AU;
    const height = properties.heightAU * SCALE.RENDER_SCALE_AU;
    const baseColor = new THREE.Color(properties.color || "#8B7355");

    for (let i = 0; i < count; i++) {
      const angle = this.random() * Math.PI * 2;
      const radiusSpread = this.random();
      const radius = innerRadius + (outerRadius - innerRadius) * radiusSpread;

      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = (this.random() - 0.5) * height;

      const colorVariation = this.random() * 0.3 - 0.15;
      const brightnessVariation = this.random() * 0.4 + 0.8;

      const finalColor = baseColor.clone();
      finalColor.offsetHSL(colorVariation * 0.1, 0, colorVariation * 0.2);
      finalColor.multiplyScalar(brightnessVariation);

      const distanceFromCenter = Math.sqrt(x * x + z * z);
      const normalizedDistance =
        (distanceFromCenter - innerRadius) / (outerRadius - innerRadius);
      const baseSizeVariation =
        (5.0 - normalizedDistance * 0.3) * (0.7 + this.random() * 0.6);

      // Scale asteroid size proportionally to belt dimensions
      const beltWidth = outerRadius - innerRadius;
      const sizeScaleFactor = Math.min(1.0, beltWidth / 1000); // Normalize to reasonable belt width
      const size = Math.max(0.1, baseSizeVariation * 0.3 * sizeScaleFactor);

      const textureIndex = Math.floor(this.random() * 5);
      const initialRotation = this.random() * Math.PI * 2;

      data.push({
        position: new THREE.Vector3(x, y, z),
        color: finalColor,
        size,
        textureIndex,
        initialRotation,
      });
    }
    return data;
  }

  /**
   * Creates and returns an array of LOD levels with varying particle counts,
   * using THREE.InstancedMesh for performance.
   */
  getLODLevels(
    object: RenderableCelestialObject,
    options?: AsteroidFieldRendererOptions,
  ): LODLevel[] {
    this.instancedMeshes = []; // Clear previous meshes

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

    const properties = this._getAsteroidFieldProperties(object);
    const fieldRadius = properties.outerRadiusAU * SCALE.RENDER_SCALE_AU;

    const distancesSceneUnits = [
      0, // Always visible
      1000, // 1000 scene units
      5000, // 5000 scene units
      20000, // 20000 scene units
    ];

    const particleCounts = [50000, 25000, 10000, 1000];

    const lodLevels: LODLevel[] = [];

    for (let i = 0; i < distancesSceneUnits.length; i++) {
      const distance = distancesSceneUnits[i];
      const count = particleCounts[Math.min(i, particleCounts.length - 1)];

      // Generate all asteroid data once for this LOD level
      const asteroidsToRender = this._generateAsteroidData(object, count);
      this.asteroidData = asteroidsToRender; // Store for update method

      // Create InstancedMesh
      const instancedMesh = new THREE.InstancedMesh(
        this.baseGeometry,
        material,
        count,
      );
      instancedMesh.name = `${object.celestialObjectId}-asteroidfield-lod-${i}`;
      instancedMesh.frustumCulled = true;
      // Pre-populate instance matrices and colors (will be updated dynamically)
      for (let j = 0; j < count; j++) {
        const asteroid = asteroidsToRender[j];

        this._tempPosition.copy(asteroid.position);
        this._tempScale.set(asteroid.size, asteroid.size, asteroid.size);
        this._tempRotation.set(0, asteroid.initialRotation, 0); // Apply initial rotation

        this._tempMatrix.compose(
          this._tempPosition,
          new THREE.Quaternion().setFromEuler(this._tempRotation),
          this._tempScale,
        );
        instancedMesh.setMatrixAt(j, this._tempMatrix);
        instancedMesh.setColorAt(j, asteroid.color);
      }

      instancedMesh.instanceMatrix.needsUpdate = true;
      if (instancedMesh.instanceColor) {
        instancedMesh.instanceColor.needsUpdate = true;
      }

      this.instancedMeshes.push(instancedMesh); // Store for cleanup and update

      lodLevels.push({ object: instancedMesh, distance: distance });
    }

    if (lodLevels.length === 0) {
      const fallbackMesh = new THREE.Mesh(
        this.baseGeometry,
        this.createMaterial(object),
      );
      fallbackMesh.name = `${object.celestialObjectId}-asteroidfield-fallback`;
      return [{ object: fallbackMesh, distance: 0 }];
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
      const deltaTime = (time - this.previousSimTime) * timeScale;

      // Update belt rotation for the entire field
      this.beltRotationAngle += this.beltRotationSpeed * deltaTime;
      this.beltRotationAngle %= 2 * Math.PI;

      // Update cumulative time for individual particle rotation
      this.cumulativeParticleTime += deltaTime * 0.05;
      this.cumulativeParticleTime %= 2 * Math.PI;

      // Update material uniforms
      material.updateBeltRotation(this.beltRotationAngle);
      material.updateTime(this.cumulativeParticleTime);
      material.updateParticleRotationSpeed(this.particleRotationSpeed);
      material.updateRenderScale(this.renderScale);

      // Update instance matrices for each asteroid
      this.instancedMeshes.forEach((mesh) => {
        if (!mesh.instanceMatrix) return;

        for (let i = 0; i < this.asteroidData.length; i++) {
          const asteroid = this.asteroidData[i];

          // Apply belt rotation to asteroid position
          this._tempPosition.copy(asteroid.position);
          this._tempPosition.applyAxisAngle(
            new THREE.Vector3(0, 1, 0),
            this.beltRotationAngle,
          );

          // Apply individual asteroid size and initial rotation (from generation)
          this._tempScale.set(
            asteroid.size * this.renderScale,
            asteroid.size * this.renderScale,
            asteroid.size * this.renderScale,
          );
          this._tempRotation.set(0, asteroid.initialRotation, 0);

          this._tempMatrix.compose(
            this._tempPosition,
            new THREE.Quaternion().setFromEuler(this._tempRotation),
            this._tempScale,
          );
          mesh.setMatrixAt(i, this._tempMatrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
      });

      this.previousSimTime = time;
    }
  }

  dispose(): void {
    super.dispose();

    // Dispose base geometry
    this.baseGeometry.dispose();

    // Dispose instanced meshes and their attributes
    this.instancedMeshes.forEach((mesh) => {
      if (mesh.parent) {
        mesh.parent.remove(mesh);
      }
      if (mesh.instanceMatrix) {
        // These are attributes on the geometry, but InstancedMesh manages them.
        // Disposing the mesh usually handles it, but explicit nulling is safer.
        // mesh.instanceMatrix.dispose(); // No, this is managed by the InstancedBufferAttribute
      }
      if (mesh.instanceColor) {
        // mesh.instanceColor.dispose();
      }
    });
    this.instancedMeshes = [];
    this.asteroidData = [];

    this.beltRotationAngle = 0;
    this.previousSimTime = 0;
    this.cumulativeParticleTime = 0;
  }
}
