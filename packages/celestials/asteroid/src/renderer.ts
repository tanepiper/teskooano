import {
  AsteroidProperties,
  RenderableCelestialObject,
} from "@teskooano/data-types";
import { createSeededRandomSync } from "@teskooano/core-math";
import * as THREE from "three";
import {
  BaseCelestialRenderer,
  type CelestialMeshOptions,
  type LightSourcesMap,
  ShadowCasterUtils,
  LODLevel,
} from "@teskooano/renderer-threejs-celestial";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";
import { AsteroidNucleusMaterial } from "./material";
import { SCALE } from "@teskooano/data-values";

const MAX_PARTICLES = 12000;
const PARTICLE_LIFETIME = 5.0; // seconds

/**
 * Renderer for asteroid objects with procedural nucleus geometry and advanced lighting.
 *
 * Features:
 * - Procedurally displaced nucleus geometry with noise-based surface detail
 * - Multi-color procedural surface texturing with height-based blending
 * - Advanced lighting with dynamic ambient light calculation
 * - Shadow casting support from other celestial bodies
 * - LOD system with simplified geometry for distant viewing
 */
export class AsteroidRenderer extends BaseCelestialRenderer {
  private nucleus?: THREE.Mesh;
  private nucleus_lod1?: THREE.Mesh;
  private clock = new THREE.Clock();
  private noise = new SimplexNoise();
  private random: () => number = () => 0;

  constructor(object: RenderableCelestialObject) {
    super(object);
    this.random = createSeededRandomSync(object.seed ?? object.id);

    this.createNucleus(object);
  }

  getLODLevels(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    // Initialize seeded random for this asteroid
    this.random = createSeededRandomSync(object.seed ?? object.id);

    // LOD 0: High detail with nucleus
    const lod0_container = new THREE.Group();
    lod0_container.name = `${object.id}-asteroid-lod0-container`;

    // Add nucleus (should always exist)
    if (this.nucleus) {
      lod0_container.add(this.nucleus);
    }

    // LOD 1: Lower detail with simplified mesh nucleus
    const lod1_container = new THREE.Group();
    lod1_container.name = `${object.id}-asteroid-lod1-container`;

    // Clone nucleus for LOD 1 (only if it exists)
    this.nucleus_lod1 = this.nucleus?.clone(false); // Clone geometry/material but not children
    if (this.nucleus_lod1) {
      lod1_container.add(this.nucleus_lod1);
    }

    return [
      {
        distance: 0,
        object: lod0_container,
      },
      {
        distance: 5 * SCALE.RENDER_SCALE_AU,
        object: lod1_container,
      },
    ];
  }

  update(
    object: RenderableCelestialObject,
    time: number,
    timeScale: number,
    lightSources: LightSourcesMap,
    camera: THREE.PerspectiveCamera,
    allObjects?: Record<string, RenderableCelestialObject>,
    allMeshes?: Record<string, THREE.Object3D>,
  ): void {
    super.update(
      object,
      time,
      timeScale,
      lightSources,
      camera,
      allObjects,
      allMeshes,
    );

    // Update lighting manager with current light sources
    this.updateLightSources(lightSources);

    // Apply centralized light attenuation
    const attenuatedLightSources = this.applyLightAttenuation();

    // Calculate dynamic ambient light based on nearby stars
    const dynamicAmbientIntensity =
      this.lightingManager.calculateDynamicAmbientLight();

    this.updateNucleus(
      object,
      attenuatedLightSources,
      dynamicAmbientIntensity,
      camera,
      allObjects,
    );

    const deltaTime = this.clock.getDelta();
    const activityFactor = this.calculateActivityFactor(object);

    this.updateNucleusRotation(object, deltaTime, activityFactor);
  }

  private createNucleus(object: RenderableCelestialObject): void {
    const nucleusGeometry = this.createNucleusGeometry(object);
    const nucleusMaterial = this.createNucleusMaterial(object);

    this.nucleus = new THREE.Mesh(nucleusGeometry, nucleusMaterial);
    this.nucleus.name = `${object.id}-nucleus`;
    this.registerMaterial(`asteroid-nucleus-${object.id}`, nucleusMaterial);
  }

  private createNucleusGeometry(
    object: RenderableCelestialObject,
  ): THREE.BufferGeometry {
    const nucleusGeometry = new THREE.BoxGeometry(1, 1, 1, 32, 32, 32);

    // Add procedural displacement to make it irregular
    const positionAttribute = nucleusGeometry.getAttribute("position");
    const vertex = new THREE.Vector3();
    for (let i = 0; i < positionAttribute.count; i++) {
      vertex.fromBufferAttribute(positionAttribute, i);

      // Spherify the cube
      const normalizedVertex = vertex.clone().normalize();

      // Get noise value
      const noiseFrequency = 1.0;
      const noisePosition = normalizedVertex
        .clone()
        .multiplyScalar(noiseFrequency);
      let displacement = this.noise.noise3d(
        noisePosition.x,
        noisePosition.y,
        noisePosition.z,
      ); // Range: -1 to 1

      // Apply displacement
      const bumpiness = 0.2;
      const finalRadius = object.radius * (1 + displacement * bumpiness);
      const finalPosition = normalizedVertex.multiplyScalar(finalRadius);

      positionAttribute.setXYZ(
        i,
        finalPosition.x,
        finalPosition.y,
        finalPosition.z,
      );
    }
    nucleusGeometry.computeVertexNormals(); // Recalculate normals for correct lighting

    return nucleusGeometry;
  }

  private createNucleusMaterial(
    object: RenderableCelestialObject,
  ): AsteroidNucleusMaterial {
    const properties = object.properties as AsteroidProperties;

    return new AsteroidNucleusMaterial({
      colors: properties.colors.map((c) => new THREE.Color(c)),
      heights: properties.heights,
      ...(properties.visuals || {}),
    });
  }

  /**
   * Generates a random palette of 2 to 4 colors suitable for a rocky asteroid.
   * Colors will be variations of greys, browns, and dark reds.
   * @returns An array of THREE.Color objects.
   */
  private generateColorPalette(): THREE.Color[] {
    const palette: THREE.Color[] = [];
    const numColors = Math.floor(this.random() * 3) + 2; // 2 to 4 colors

    // Base color properties
    const baseHue = this.random() * 0.1 + 0.02; // 0.02 (reddish) to 0.12 (brownish)
    const baseSaturation = this.random() * 0.4; // 0% to 40% saturation
    const baseLightness = this.random() * 0.3 + 0.2; // 20% to 50% lightness

    for (let i = 0; i < numColors; i++) {
      const color = new THREE.Color();
      const h = baseHue + (this.random() - 0.5) * 0.05; // Small hue shift
      const s = baseSaturation + (this.random() - 0.5) * 0.1;
      const l = baseLightness + (this.random() - 0.5) * 0.15;
      color.setHSL(
        THREE.MathUtils.clamp(h, 0, 1),
        THREE.MathUtils.clamp(s, 0, 1),
        THREE.MathUtils.clamp(l, 0, 1),
      );
      palette.push(color);
    }
    return palette;
  }

  private updateNucleus(
    object: RenderableCelestialObject,
    attenuatedLightSources: Map<string, any>,
    dynamicAmbientIntensity: number,
    camera: THREE.PerspectiveCamera,
    allObjects?: Record<string, RenderableCelestialObject>,
  ): void {
    const nucleusMaterial = this.getMaterial(
      `asteroid-nucleus-${object.id}`,
    ) as AsteroidNucleusMaterial | undefined;

    if (nucleusMaterial) {
      // Update dynamic ambient lighting directly
      if (nucleusMaterial.uniforms.uAmbientIntensity) {
        nucleusMaterial.uniforms.uAmbientIntensity.value =
          dynamicAmbientIntensity;
      }

      // Find shadow casters using centralized utility
      const shadowCasters = this.findShadowCasters();

      // Convert to shader format
      const shadowCastersForShader =
        ShadowCasterUtils.toShaderFormat(shadowCasters);

      // Use the material's update method to handle all lighting calculations
      if (
        "update" in nucleusMaterial &&
        typeof nucleusMaterial.update === "function"
      ) {
        nucleusMaterial.update(
          0, // time - asteroids don't typically need animated time effects
          1, // timeScale
          attenuatedLightSources,
          camera,
          shadowCastersForShader,
        );
      }
    }
  }

  private calculateActivityFactor(object: RenderableCelestialObject): number {
    const primaryLightSource = this.findClosestLightSource();
    if (!primaryLightSource) return 0;

    // Store light position in a dedicated vector to avoid temp vector conflicts
    const lightPosition = new THREE.Vector3().copy(primaryLightSource.position);
    const asteroidPosition = this._tempVector1.copy(object.position);
    const distanceToLight = asteroidPosition.distanceTo(lightPosition);

    const activityDistance = 2 * SCALE.RENDER_SCALE_AU;
    let activityFactor =
      1.0 - THREE.MathUtils.smoothstep(distanceToLight, 0, activityDistance);

    // Asteroids don't have variable activity like comets
    const properties = object.properties as AsteroidProperties;

    return activityFactor;
  }

  private updateNucleusRotation(
    object: RenderableCelestialObject,
    deltaTime: number,
    activityFactor: number,
  ): void {
    if (this.nucleus && object.orbit.siderealRotationPeriod_s) {
      // Use the actual rotation period from the asteroid object
      const rotationSpeed =
        (2 * Math.PI) / object.orbit.siderealRotationPeriod_s;

      // Apply rotation to the group with the correct speed
      // Asteroids tumble, so we rotate around multiple axes
      this.nucleus.rotation.y += rotationSpeed * deltaTime;
      this.nucleus.rotation.x += rotationSpeed * 0.25 * deltaTime; // Slight tilt for tumbling effect

      if (this.nucleus_lod1) {
        this.nucleus_lod1.rotation.copy(this.nucleus.rotation);
      }
    }
  }
}
