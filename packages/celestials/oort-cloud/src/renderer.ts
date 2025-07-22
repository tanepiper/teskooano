import {
  CelestialType,
  type OortCloudProperties as CentralOortCloudProperties,
  SCALE,
} from "@teskooano/data-types";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import { createSeededRandomSync } from "@teskooano/core-math";
import {
  BaseCelestialRenderer,
  type CelestialMeshOptions,
  type LightSourcesMap,
} from "@teskooano/renderer-threejs-celestial";
import { LODLevel } from "@teskooano/renderer-threejs-lod";
import * as THREE from "three";
import { AsteroidFieldMaterial } from "@teskooano/celestials-asteroid-field";

/**
 * Configuration options specific to the Oort Cloud renderer.
 */
export interface OortCloudRendererOptions extends CelestialMeshOptions {
  /**
   * Speed of cloud rotation (radians per second).
   * @default 0.00002
   */
  cloudRotationSpeed?: number;

  /**
   * Whether to disable billboard LOD levels (Oort clouds manage their own LOD).
   * @default true
   */
  disableBillboard?: boolean;
}

/**
 * Renders an Oort Cloud using instanced meshes with LOD support.
 *
 * This renderer creates multiple LOD levels with varying particle counts
 * to provide optimal performance at different viewing distances.
 * Uses spherical distribution instead of toroidal like asteroid fields.
 */
export class OortCloudRenderer extends BaseCelestialRenderer<AsteroidFieldMaterial> {
  // Base geometry for a single Oort Cloud particle (asteroid-like)
  private baseGeometry: THREE.BufferGeometry;
  // Store instanced meshes for each LOD level
  private instancedMeshes: THREE.InstancedMesh[] = [];
  // Data for each Oort Cloud particle
  private oortCloudData: {
    position: THREE.Vector3;
    color: THREE.Color;
    size: number;
    textureIndex: number;
    initialRotation: number;
  }[] = [];

  private objectId: string;
  private cloudRotationSpeed = 0.00002;
  private particleRotationSpeed = 0.75;
  private cloudRotationAngle = 0;
  private previousSimTime = 0;
  private cumulativeParticleTime = 0;
  private renderScale = 1.0;
  private random: () => number = () => 0;

  // Pre-allocated for performance in update loop
  private _tempMatrix = new THREE.Matrix4();
  private _tempPosition = new THREE.Vector3();
  private _tempRotation = new THREE.Euler();
  private _tempScale = new THREE.Vector3();

  constructor(
    object: RenderableCelestialObject,
    options: OortCloudRendererOptions = {},
  ) {
    super(object, {
      ...options,
      disableBillboard: options.disableBillboard ?? true,
    });
    this.objectId = object.celestialObjectId;
    this.baseGeometry = new THREE.SphereGeometry(1, 8, 8); // Simple sphere for instance
    this.baseGeometry.name = "OortCloudBaseGeometry";
  }

  /**
   * Creates the asteroid field material (reusing from asteroid-field package).
   */
  protected createMaterial(
    object: RenderableCelestialObject,
  ): AsteroidFieldMaterial {
    const properties = this.getOortCloudProperties(object);

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
   * Generates Oort Cloud particle data (positions, colors, sizes, etc.) for a given count.
   * This data will be used to populate the instance attributes of InstancedMesh.
   * Uses spherical distribution instead of toroidal.
   * @param object The celestial object.
   * @param count Number of particles to generate.
   * @returns An array of Oort Cloud particle data.
   */
  private _generateOortCloudData(
    object: RenderableCelestialObject,
    count: number,
  ): typeof this.oortCloudData {
    if (!this.random) {
      this.random = createSeededRandomSync(
        object.seed ?? object.celestialObjectId,
      );
    }

    const data: typeof this.oortCloudData = [];

    const properties = this.getOortCloudProperties(object);

    const scaledInnerRadius =
      (properties.visualInnerRadius ?? properties.innerRadiusAU) *
      SCALE.RENDER_SCALE_AU;
    const scaledOuterRadius =
      (properties.visualOuterRadius ?? properties.outerRadiusAU) *
      SCALE.RENDER_SCALE_AU;
    const visualThickness = scaledOuterRadius - scaledInnerRadius;
    const visualColorHex =
      properties.color ?? properties.visualParticleColor ?? "#101011";
    const baseColor = new THREE.Color(visualColorHex);

    for (let i = 0; i < count; i++) {
      // Spherical distribution around the cloud center
      const phi = Math.acos(2 * this.random() - 1);
      const theta = this.random() * Math.PI * 2;
      const r = scaledInnerRadius + this.random() * visualThickness;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      // Color variation
      const hsl = { h: 0, s: 0, l: 0 };
      baseColor.getHSL(hsl);
      const newColor = new THREE.Color().setHSL(
        hsl.h + (this.random() * 0.05 - 0.025),
        Math.max(0.05, hsl.s * (0.5 + this.random() * 0.2)),
        Math.max(0.1, hsl.l * (0.3 + this.random() * 0.2)),
      );

      // Vary sizes - Oort Cloud particles are extremely small
      const size = Math.max(0.0000001, this.random() * 0.0000005); // e.g., 0.0000005 AU max radius
      const textureIndex = Math.floor(this.random() * 5); // Assuming 5 texture variants from asteroid material
      const initialRotation = this.random() * Math.PI * 2;

      data.push({
        position: new THREE.Vector3(x, y, z),
        color: newColor,
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
    options?: OortCloudRendererOptions,
  ): LODLevel[] {
    this.instancedMeshes = []; // Clear previous meshes

    this.random = createSeededRandomSync(
      object.seed ?? object.celestialObjectId,
    );
    this.particleRotationSpeed = 0.5 + this.random() * 1.0; // Slightly faster for Oort Cloud

    if (options?.cloudRotationSpeed !== undefined) {
      this.cloudRotationSpeed = options.cloudRotationSpeed;
    }
    if (options?.renderScale !== undefined) {
      this.renderScale = options.renderScale;
    }

    let material = this.getTypedMaterial(object.celestialObjectId);
    if (!material) {
      material = this.createAndRegisterMaterial(object);
    }

    const properties = this.getOortCloudProperties(object);
    const fieldRadius = properties.outerRadiusAU * SCALE.RENDER_SCALE_AU;

    // Distances for LOD - Oort Cloud is always far away
    const distancesSceneUnits = [
      0, // Always visible
      1000, // 1000 scene units
      5000, // 5000 scene units
      20000, // 20000 scene units
    ];
    // Use count or visualParticleCount from properties, but cap for performance
    const baseParticleCount =
      properties.count ?? properties.visualParticleCount;
    const particleCounts = [
      Math.min(baseParticleCount, 50000),
      Math.min(baseParticleCount, 25000),
      Math.min(baseParticleCount, 10000),
      Math.min(baseParticleCount, 1000),
    ];

    const lodLevels: LODLevel[] = [];

    for (let i = 0; i < distancesSceneUnits.length; i++) {
      const distance = distancesSceneUnits[i];
      const count = particleCounts[Math.min(i, particleCounts.length - 1)];

      // Generate all Oort Cloud particle data for this LOD level
      const oortCloudParticles = this._generateOortCloudData(object, count);
      this.oortCloudData = oortCloudParticles; // Store for update method

      // Create InstancedMesh
      const instancedMesh = new THREE.InstancedMesh(
        this.baseGeometry,
        material,
        count,
      );
      instancedMesh.name = `${object.celestialObjectId}-oortcloud-lod-${i}`;
      instancedMesh.frustumCulled = true;

      // Pre-populate instance matrices and colors
      for (let j = 0; j < count; j++) {
        const particle = oortCloudParticles[j];
        this._tempPosition.copy(particle.position);
        this._tempScale.set(particle.size, particle.size, particle.size);
        this._tempRotation.set(0, particle.initialRotation, 0); // Apply initial rotation

        this._tempMatrix.compose(
          this._tempPosition,
          new THREE.Quaternion().setFromEuler(this._tempRotation),
          this._tempScale,
        );
        instancedMesh.setMatrixAt(j, this._tempMatrix);
        instancedMesh.setColorAt(j, particle.color);
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
      fallbackMesh.name = `${object.celestialObjectId}-oortcloud-fallback`;
      return [{ object: fallbackMesh, distance: 0 }];
    }

    return lodLevels;
  }

  /**
   * Helper method to extract and validate Oort Cloud properties.
   * @param object The renderable celestial object.
   * @returns Validated Oort Cloud properties.
   * @private
   */
  private getOortCloudProperties(
    object: RenderableCelestialObject,
  ): CentralOortCloudProperties {
    if (
      object.properties &&
      object.properties.type === CelestialType.OORT_CLOUD
    ) {
      return object.properties as CentralOortCloudProperties;
    }

    return {
      type: CelestialType.OORT_CLOUD,
      innerRadiusAU: 2000,
      outerRadiusAU: 20000,
      visualParticleCount: 1000,
      visualDensity: 0.1,
      visualParticleColor: "#161717",
      composition: ["ice"],
      // Additional properties for consistency
      count: 1000,
      color: "#161717",
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

      // Update cloud rotation for the entire field
      this.cloudRotationAngle += this.cloudRotationSpeed * deltaTime;
      this.cloudRotationAngle %= 2 * Math.PI;

      // Update cumulative time for individual particle rotation
      this.cumulativeParticleTime += deltaTime * 0.05;
      this.cumulativeParticleTime %= 2 * Math.PI;

      // Update material uniforms
      material.updateBeltRotation(this.cloudRotationAngle);
      material.updateTime(this.cumulativeParticleTime);
      material.updateParticleRotationSpeed(this.particleRotationSpeed);
      material.updateRenderScale(this.renderScale);

      // Update instance matrices for each Oort Cloud particle
      this.instancedMeshes.forEach((mesh) => {
        if (!mesh.instanceMatrix) return;

        for (let i = 0; i < this.oortCloudData.length; i++) {
          const particle = this.oortCloudData[i];

          // Apply cloud rotation to particle position
          this._tempPosition.copy(particle.position);
          this._tempPosition.applyAxisAngle(
            new THREE.Vector3(0, 1, 0),
            this.cloudRotationAngle,
          );

          // Apply individual particle size and initial rotation (from generation)
          this._tempScale.set(particle.size, particle.size, particle.size);
          this._tempRotation.set(0, particle.initialRotation, 0);

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
      // No explicit dispose needed for instanceMatrix/instanceColor as they are managed by InstancedMesh
    });
    this.instancedMeshes = [];
    this.oortCloudData = [];

    this.cloudRotationAngle = 0;
    this.previousSimTime = 0;
    this.cumulativeParticleTime = 0;
  }
}
