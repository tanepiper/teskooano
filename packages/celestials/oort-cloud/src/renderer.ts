import {
  CelestialType,
  type OortCloudProperties as CentralOortCloudProperties,
  SCALE,
} from "@teskooano/data-types";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import { createSeededRandomSync } from "@teskooano/core-math";
import {
  BaseCelestialRenderer,
  CelestialMeshOptions,
  LightSourcesMap,
} from "@teskooano/renderer-threejs-celestial";
import { LODLevel } from "@teskooano/renderer-threejs-lod";
import * as THREE from "three";
import { OortCloudMaterial, type OortCloudMaterialOptions } from "./material";

/**
 * Renderer for Oort Cloud objects using a particle system.
 *
 * Features:
 * - Spherical particle distribution representing icy cometary bodies
 * - Seeded random generation for consistent appearance
 * - Subtle color variations and size differences
 * - Texture-based rendering with fallback canvas texture
 * - Single LOD level with always-visible particles
 * - Configurable density and appearance parameters
 *
 * The Oort Cloud is rendered as a sparse collection of small particles
 * distributed in a thick spherical shell around the system's outer edge.
 */
export class OortCloudRenderer extends BaseCelestialRenderer<OortCloudMaterial> {
  private objectId: string | null = null;
  private particles: THREE.Points | null = null;
  private geometry: THREE.BufferGeometry | null = null;
  private cloudTexture: THREE.Texture | null = null;
  private cloudRotationSpeed = 0.00002;
  private particleRotationSpeed = 0.75; // Default, will be seeded
  private textureLoader: THREE.TextureLoader | null = null;

  constructor() {
    super();
  }

  /**
   * Creates and returns the geometry and material for the Oort cloud particles.
   * @returns An object containing the geometry and material.
   */
  getMeshComponents(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): { geometry: THREE.BufferGeometry; material: OortCloudMaterial } {
    let properties: CentralOortCloudProperties | null = null;

    if (
      object.properties &&
      object.properties.type === CelestialType.OORT_CLOUD
    ) {
      properties = object.properties as CentralOortCloudProperties;
    } else {
      console.error(
        `[OortCloudRenderer] Could not find 'oortCloudProperties' in object properties for ${object.celestialObjectId}. Using defaults.`,
      );
      properties = null;
    }

    if (!properties) {
      console.error("Invalid OortCloudProperties:", properties);
      properties = {
        type: CelestialType.OORT_CLOUD,
        innerRadiusAU: 2000, // More realistic Oort cloud distance
        outerRadiusAU: 20000, // Reasonable outer radius for proper sphere
        composition: ["ice"],
        visualDensity: 0.1,
        visualParticleCount: 150, // Much reduced for subtlety
        visualParticleColor: "#101011",
      };

      if (!properties.innerRadiusAU) properties.innerRadiusAU = 2000;
      if (!properties.outerRadiusAU) properties.outerRadiusAU = 20000;
    }

    if (
      typeof properties.visualParticleCount !== "number" ||
      isNaN(properties.visualParticleCount) ||
      typeof properties.innerRadiusAU !== "number" ||
      isNaN(properties.innerRadiusAU) ||
      typeof properties.outerRadiusAU !== "number" ||
      isNaN(properties.outerRadiusAU)
    ) {
      console.error(
        "Invalid essential OortCloudProperties after default assignment:",
        properties,
      );

      properties = {
        type: CelestialType.OORT_CLOUD,
        innerRadiusAU: 2000, // More realistic Oort cloud distance
        outerRadiusAU: 20000, // Reasonable outer radius for proper sphere
        composition: ["ice"],
        visualDensity: 0.1,
        visualParticleCount: 150, // Much reduced for subtlety
        visualParticleColor: "#161717",
      };
    }

    this.geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const colors: number[] = [];
    const sizes: number[] = [];
    const initialRotations: number[] = [];

    const scaledInnerRadius = properties.innerRadiusAU * SCALE.RENDER_SCALE_AU;
    const scaledOuterRadius = properties.outerRadiusAU * SCALE.RENDER_SCALE_AU;
    const visualRadius = scaledInnerRadius;
    const visualThickness = scaledOuterRadius - scaledInnerRadius;

    const visualCount = Math.min(properties.visualParticleCount, 300);

    const visualColorHex = properties.visualParticleColor ?? "#353536";

    if (
      !Number.isFinite(visualRadius) ||
      !Number.isFinite(visualThickness) ||
      !Number.isFinite(visualCount) ||
      visualThickness <= 0
    ) {
      console.error(
        `OortCloudRenderer: Invalid visualRadius (${visualRadius}), visualThickness (${visualThickness}), or visualCount (${visualCount}) before loop for object ${object.celestialObjectId}. Returning empty geometry/material.`,
      );

      const material = this.createAndRegisterMaterial(object);
      return {
        geometry: new THREE.BufferGeometry(),
        material: material || new OortCloudMaterial(),
      };
    }

    // Initialize seeded random for consistent generation
    const random = createSeededRandomSync(
      object.seed ?? object.celestialObjectId,
    );

    // Create particles in a spherical distribution (Oort cloud)
    for (let i = 0; i < visualCount; i++) {
      // Spherical coordinates for uniform distribution on sphere
      const phi = Math.acos(2 * random() - 1);
      const theta = random() * Math.PI * 2;

      // Radius varies between inner and outer radius
      const r = visualRadius + random() * visualThickness;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      positions.push(x, y, z);

      const baseColor = new THREE.Color(visualColorHex);
      const hsl = { h: 0, s: 0, l: 0 };
      baseColor.getHSL(hsl);

      // Very subtle color variation - keep it very dark
      const newColor = new THREE.Color().setHSL(
        hsl.h + (random() * 0.05 - 0.025),
        Math.max(0.05, hsl.s * (0.5 + random() * 0.2)),
        Math.max(0.1, hsl.l * (0.3 + random() * 0.2)),
      );

      colors.push(newColor.r, newColor.g, newColor.b);

      // Make particles very small and subtle
      sizes.push(0.5 + random() * 1.0);
      initialRotations.push(random() * Math.PI * 2);
    }

    this.geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    this.geometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(colors, 3),
    );
    this.geometry.setAttribute(
      "size",
      new THREE.Float32BufferAttribute(sizes, 1),
    );
    this.geometry.setAttribute(
      "initialRotation",
      new THREE.Float32BufferAttribute(initialRotations, 1),
    );

    const material = this.createAndRegisterMaterial(object);

    return {
      geometry: this.geometry,
      material: material || new OortCloudMaterial(),
    };
  }

  /**
   * Creates the shader material for the Oort cloud.
   */
  protected createMaterial(
    object: RenderableCelestialObject,
  ): OortCloudMaterial {
    // Create material with fallback texture
    const material = new OortCloudMaterial({
      cloudTexture: this.cloudTexture || undefined,
      pointSizeScale: 0.3,
      particleRotationSpeed: this.particleRotationSpeed,
    });

    // Load real texture asynchronously if not already loaded
    if (!this.cloudTexture) {
      const texturePath = "space/textures/asteroids/asteroid_1.png";

      this.textureLoader = new THREE.TextureLoader();
      this.textureLoader.load(
        `${window.location.href}${texturePath}`,
        (texture) => {
          this.cloudTexture = texture;
          const currentMaterial = this.getTypedMaterial(
            object.celestialObjectId,
          );
          if (currentMaterial) {
            currentMaterial.setCloudTexture(texture);
          }
        },
        undefined,
        (error) => {
          console.error(
            "[OortCloudRenderer] Error loading cloud texture:",
            error,
          );
        },
      );
    }

    return material;
  }

  /**
   * Creates the THREE.Object3D (Points) for the Oort cloud.
   * This represents the highest LOD level (Level 0).
   */
  createMesh(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): THREE.Object3D {
    const { geometry, material } = this.getMeshComponents(object, options);

    this.objectId = object.celestialObjectId;

    this.particles = new THREE.Points(geometry, material);
    this.particles.name = `${object.celestialObjectId}-oortcloud`;

    this.particles.visible = true;
    this.particles.frustumCulled = true; // Enable frustum culling like asteroid field
    this.particles.renderOrder = 10;

    return this.particles;
  }

  /**
   * Creates and returns an array of LOD levels for the Oort Cloud.
   * Like asteroid field, creates a single fixed spherical shell that's always visible.
   */
  getLODLevels(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions & {
      parentLODDistances?: number[];
      cloudRotationSpeed?: number;
    },
  ): LODLevel[] {
    this.objectId = object.celestialObjectId;

    // Initialize seeded random for this Oort cloud
    const random = createSeededRandomSync(
      object.seed ?? object.celestialObjectId,
    );
    this.particleRotationSpeed = 0.5 + random() * 1.0;

    if (options?.cloudRotationSpeed !== undefined) {
      this.cloudRotationSpeed = options.cloudRotationSpeed;
    }

    // Create material
    const material = this.createAndRegisterMaterial(object);
    if (!material) {
      console.error(
        `[OortCloudRenderer] Could not create material for ${object.celestialObjectId}.`,
      );
      return []; // Return empty array if material fails
    }

    // Create fixed geometry like asteroid field
    const geometry = this._createOortCloudGeometry(object);

    const points = new THREE.Points(geometry, material);
    points.name = `${object.celestialObjectId}-oortcloud`;
    points.frustumCulled = true;

    // Single LOD level - always visible like asteroid field
    return [{ object: points, distance: 0 }];
  }

  /**
   * Creates BufferGeometry for the Oort cloud particles like asteroid field.
   * @param object - The renderable object data.
   * @returns The generated BufferGeometry.
   * @internal
   */
  private _createOortCloudGeometry(
    object: RenderableCelestialObject,
  ): THREE.BufferGeometry {
    // Get properties (reuse the logic from getMeshComponents)
    let properties = this.getOortCloudProperties(object);

    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const colors: number[] = [];
    const sizes: number[] = [];
    const initialRotations: number[] = [];

    const scaledInnerRadius = properties.innerRadiusAU * SCALE.RENDER_SCALE_AU;
    const scaledOuterRadius = properties.outerRadiusAU * SCALE.RENDER_SCALE_AU;
    const visualRadius = scaledInnerRadius;
    const visualThickness = scaledOuterRadius - scaledInnerRadius;

    const visualColorHex = properties.visualParticleColor ?? "#353536";
    const targetParticleCount = properties.visualParticleCount;

    // Initialize seeded random for consistent generation
    const random = createSeededRandomSync(
      object.seed ?? object.celestialObjectId,
    );

    // Create particles in a spherical distribution
    for (let i = 0; i < targetParticleCount; i++) {
      // Spherical distribution around the cloud center
      const phi = Math.acos(2 * random() - 1);
      const theta = random() * Math.PI * 2;
      const r = visualRadius + random() * visualThickness;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      positions.push(x, y, z);

      // Color variation
      const baseColor = new THREE.Color(visualColorHex);
      const hsl = { h: 0, s: 0, l: 0 };
      baseColor.getHSL(hsl);
      const newColor = new THREE.Color().setHSL(
        hsl.h + (random() * 0.05 - 0.025),
        Math.max(0.05, hsl.s * (0.5 + random() * 0.2)),
        Math.max(0.1, hsl.l * (0.3 + random() * 0.2)),
      );
      colors.push(newColor.r, newColor.g, newColor.b);

      // Vary sizes
      sizes.push(0.5 + random() * 1.0);
      initialRotations.push(random() * Math.PI * 2);
    }

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.Float32BufferAttribute(sizes, 1));
    geometry.setAttribute(
      "initialRotation",
      new THREE.Float32BufferAttribute(initialRotations, 1),
    );

    return geometry;
  }

  /**
   * Extract properties logic for reuse
   */
  private getOortCloudProperties(object: RenderableCelestialObject) {
    let properties = null;

    if (
      object.properties &&
      object.properties.type === CelestialType.OORT_CLOUD
    ) {
      properties = object.properties;
    }

    if (!properties) {
      properties = {
        type: CelestialType.OORT_CLOUD,
        innerRadiusAU: 2000,
        outerRadiusAU: 20000,
        composition: ["ice"],
        visualDensity: 0.1,
        visualParticleCount: 1000,
        visualParticleColor: "#303031",
      };
    }

    return properties;
  }

  update(
    object: RenderableCelestialObject,
    time: number,
    timeScale: number,
    lightSources: LightSourcesMap,
    camera: THREE.Camera,
    allObjects?: Record<string, RenderableCelestialObject>,
    allMeshes?: Record<string, THREE.Object3D>,
  ): void {
    // Call parent update to handle LOD and billboard updates
    super.update(
      object,
      time,
      timeScale,
      lightSources,
      camera,
      allObjects,
      allMeshes,
    );

    const material = this.getTypedMaterial(object.celestialObjectId);
    if (material) {
      material.updateTime(this.getElapsedTime() * 0.0001);
    }
  }

  dispose(): void {
    if (this.geometry) {
      this.geometry.dispose();
    }
    if (this.cloudTexture) {
      this.cloudTexture.dispose();
    }
    this.particles = null;
    this.cloudTexture = null;
    this.textureLoader = null;

    // Call parent dispose to clean up base class resources
    super.dispose();
  }
}
