import * as THREE from "three";
import type {
  StarProperties,
  RenderableCelestialObject,
} from "@teskooano/data-types";
import { NeutronStarSubtype } from "@teskooano/data-types";
import { GravitationalLensingHelper } from "@teskooano/celestials-stars";
import { LODLevel } from "@teskooano/renderer-threejs-celestial";
import { BaseStarRenderer } from "../base/base-star";
import { RealisticStarMaterial } from "../materials/realistic-star.material";
import {
  BaseCelestialRendererOptions,
  CelestialMeshOptions,
  LightSourcesMap,
} from "@teskooano/renderer-threejs-celestial";

/**
 * Neutron star renderer
 * Uses volumetric ray-marching material with gravitational lensing and intense lighting
 *
 * Characteristics:
 * - Temperature: 600,000-1,000,000 K (surface)
 * - Color: White to pale blue
 * - Typical mass: 1.4-2.0 M☉
 * - Typical radius: ~10-20 km (city-sized)
 * - Extreme density: 10^17 kg/m³ (neutron degeneracy pressure)
 * - Strong magnetic fields (especially magnetars)
 * - Rapid rotation (especially pulsars)
 * - Gravitational lensing effects
 *
 * Subtypes:
 * - STANDARD: Regular neutron star
 * - PULSAR: Rapidly rotating with beamed radiation
 * - MAGNETAR: Extremely strong magnetic field
 */
export class NeutronStarRenderer extends BaseStarRenderer<RealisticStarMaterial> {
  private materialCache: Map<string, RealisticStarMaterial> = new Map();
  protected gravitationalLensingHelper: GravitationalLensingHelper | undefined;
  private subtype: NeutronStarSubtype;
  private intenseLights: THREE.PointLight[] = [];
  private renderer?: THREE.WebGLRenderer;
  private scene?: THREE.Scene;
  private mainCamera?: THREE.PerspectiveCamera;

  constructor(
    object: RenderableCelestialObject,
    options: BaseCelestialRendererOptions & {
      subtype?: NeutronStarSubtype;
      renderer?: THREE.WebGLRenderer;
      scene?: THREE.Scene;
      camera?: THREE.PerspectiveCamera;
    } = {},
  ) {
    super(object, options);
    this.subtype = options?.subtype ?? NeutronStarSubtype.STANDARD;
    this.renderer = options.renderer;
    this.scene = options.scene;
    this.mainCamera = options.camera;
  }

  /**
   * Get subtype-specific color for the neutron star
   */
  private getSubtypeColor(subtype: NeutronStarSubtype): THREE.Color {
    switch (subtype) {
      case NeutronStarSubtype.PULSAR:
        return new THREE.Color(0xe0f0ff); // Bright pale blue
      case NeutronStarSubtype.MAGNETAR:
        return new THREE.Color(0xfff0e0); // Pale orange (magnetic heating)
      case NeutronStarSubtype.STANDARD:
      default:
        return new THREE.Color(0xf0f8ff); // White with slight blue tint
    }
  }

  protected createMaterial(
    object: RenderableCelestialObject<StarProperties>,
  ): RealisticStarMaterial {
    if (this.materialCache.has(object.id)) {
      return this.materialCache.get(object.id)!;
    }
    const color = this.getSubtypeColor(this.subtype);
    const material = new RealisticStarMaterial(object, color);
    this.materialCache.set(object.id, material);
    return material;
  }

  /**
   * Creates EXTREME intensity lighting for neutron stars
   * Even brighter than white dwarfs due to extreme surface temperature
   */
  private createIntenseLighting(
    object: RenderableCelestialObject<StarProperties>,
    group: THREE.Group,
  ): void {
    const color = this.getSubtypeColor(this.subtype);

    // NUCLEAR intensity - neutron stars are incredibly bright and energetic
    const mainIntensity = 100000000; // 100 million (double white dwarf)
    const ringIntensity = 60000000; // 60 million
    const verticalIntensity = 50000000; // 50 million
    const diagonalIntensity = 40000000; // 40 million

    // Main ultra-intense point light at the center - NO DECAY
    const mainLight = new THREE.PointLight(color, mainIntensity, 0, 0);
    mainLight.name = `${object.id}-main-light`;
    mainLight.castShadow = false;
    group.add(mainLight);
    this.intenseLights.push(mainLight);

    // Ring of lights for omnidirectional coverage
    const additionalLightCount = 12; // Even more lights
    const lightDistance = object.radius * 4;

    for (let i = 0; i < additionalLightCount; i++) {
      const angle = (i / additionalLightCount) * Math.PI * 2;
      const x = Math.cos(angle) * lightDistance;
      const z = Math.sin(angle) * lightDistance;

      const light = new THREE.PointLight(color, ringIntensity, 0, 0.3);
      light.position.set(x, 0, z);
      light.name = `${object.id}-intense-light-${i}`;
      light.castShadow = false;
      group.add(light);
      this.intenseLights.push(light);
    }

    // Vertical lights for top/bottom coverage
    const verticalLight1 = new THREE.PointLight(
      color,
      verticalIntensity,
      0,
      0.3,
    );
    verticalLight1.position.set(0, lightDistance * 2, 0);
    verticalLight1.name = `${object.id}-top-light`;
    verticalLight1.castShadow = false;
    group.add(verticalLight1);
    this.intenseLights.push(verticalLight1);

    const verticalLight2 = new THREE.PointLight(
      color,
      verticalIntensity,
      0,
      0.3,
    );
    verticalLight2.position.set(0, -lightDistance * 2, 0);
    verticalLight2.name = `${object.id}-bottom-light`;
    verticalLight2.castShadow = false;
    group.add(verticalLight2);
    this.intenseLights.push(verticalLight2);

    // Diagonal lights for complete spherical coverage
    const diagonalDistance = lightDistance * 1.5;

    const diagonalLight1 = new THREE.PointLight(
      color,
      diagonalIntensity,
      0,
      0.3,
    );
    diagonalLight1.position.set(diagonalDistance, diagonalDistance, 0);
    diagonalLight1.name = `${object.id}-diagonal-light-1`;
    diagonalLight1.castShadow = false;
    group.add(diagonalLight1);
    this.intenseLights.push(diagonalLight1);

    const diagonalLight2 = new THREE.PointLight(
      color,
      diagonalIntensity,
      0,
      0.3,
    );
    diagonalLight2.position.set(-diagonalDistance, diagonalDistance, 0);
    diagonalLight2.name = `${object.id}-diagonal-light-2`;
    diagonalLight2.castShadow = false;
    group.add(diagonalLight2);
    this.intenseLights.push(diagonalLight2);

    const diagonalLight3 = new THREE.PointLight(
      color,
      diagonalIntensity,
      0,
      0.3,
    );
    diagonalLight3.position.set(diagonalDistance, -diagonalDistance, 0);
    diagonalLight3.name = `${object.id}-diagonal-light-3`;
    diagonalLight3.castShadow = false;
    group.add(diagonalLight3);
    this.intenseLights.push(diagonalLight3);

    const diagonalLight4 = new THREE.PointLight(
      color,
      diagonalIntensity,
      0,
      0.3,
    );
    diagonalLight4.position.set(-diagonalDistance, -diagonalDistance, 0);
    diagonalLight4.name = `${object.id}-diagonal-light-4`;
    diagonalLight4.castShadow = false;
    group.add(diagonalLight4);
    this.intenseLights.push(diagonalLight4);

    // For pulsars, add pulsing behavior to lights
    if (this.subtype === NeutronStarSubtype.PULSAR) {
      // Store original intensities for pulsing animation
      this.intenseLights.forEach((light) => {
        (light as any).originalIntensity = light.intensity;
      });
    }
  }

  protected getCustomLODs(
    object: RenderableCelestialObject<StarProperties>,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    const material = this.createAndRegisterMaterial(object);

    // Volumetric rendering for neutron star - smaller box due to tiny size
    const boxSize = object.radius * 6.0;
    const geometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `${object.id}-body-volume`;

    const highLodGroup = new THREE.Group();
    highLodGroup.name = `${object.id}-high-lod-group`;
    highLodGroup.add(mesh);

    // Add extreme intensity lighting
    this.createIntenseLighting(object, highLodGroup);

    // Initialize gravitational lensing if we have the required context
    if (this.renderer && this.scene && this.mainCamera) {
      try {
        this.gravitationalLensingHelper = new GravitationalLensingHelper(
          this.renderer,
          this.scene,
          this.mainCamera,
          highLodGroup,
          {
            intensity: 2.5,
            radius: object.radius,
            distortionScale: 1.5,
            lensSphereScale: 8.0, // Large lensing sphere for dramatic effect
          },
        );
      } catch (error) {
        console.warn(
          `Failed to create gravitational lensing for ${object.id}:`,
          error,
        );
      }
    }

    // Medium LOD - simpler volumetric render
    const mediumMesh = new THREE.Mesh(geometry, material);
    mediumMesh.name = `${object.id}-medium-lod-volume`;
    const mediumGroup = new THREE.Group();
    mediumGroup.name = `${object.id}-medium-lod-group`;
    mediumGroup.add(mediumMesh);

    return [
      { object: highLodGroup, distance: 0 },
      { object: mediumGroup, distance: object.radius * 100 },
    ];
  }

  protected getBillboardLODDistance(
    object: RenderableCelestialObject<StarProperties>,
  ): number {
    return object.radius * 3000;
  }

  protected getStarColor(
    star: RenderableCelestialObject<StarProperties>,
  ): THREE.Color {
    const properties = star.properties!;

    if (properties && properties.color) {
      if (Array.isArray(properties.color)) {
        return new THREE.Color(
          Number(properties.color[0]),
          Number(properties.color[1]),
          Number(properties.color[2]),
        );
      }
      return new THREE.Color(properties.color);
    }

    return this.getSubtypeColor(this.subtype);
  }

  public override update(
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

    // Update gravitational lensing effect
    if (
      this.gravitationalLensingHelper &&
      this.renderer &&
      this.scene &&
      camera
    ) {
      this.gravitationalLensingHelper.update(this.renderer, this.scene, camera);
    }

    // Pulsar pulsing effect on lights
    if (this.subtype === NeutronStarSubtype.PULSAR) {
      const pulsePhase = (time * 0.002) % (2 * Math.PI); // Fast pulsing
      const pulseIntensity = 0.6 + 0.4 * Math.sin(pulsePhase * 10); // Rapid pulses

      this.intenseLights.forEach((light) => {
        const originalIntensity =
          (light as any).originalIntensity || light.intensity;
        light.intensity = originalIntensity * pulseIntensity;
      });
    }
    // Magnetar irregular pulsing
    else if (this.subtype === NeutronStarSubtype.MAGNETAR) {
      const pulsePhase = (time * 0.0005) % (2 * Math.PI); // Slower
      const noise = Math.sin(time * 0.003) * 0.2; // Add irregularity
      const pulseIntensity = 0.7 + 0.3 * Math.sin(pulsePhase) + noise;

      this.intenseLights.forEach((light) => {
        const originalIntensity =
          (light as any).originalIntensity || light.intensity;
        light.intensity = originalIntensity * Math.max(0.5, pulseIntensity);
      });
    }
  }

  public override dispose(): void {
    // Clean up lights
    for (const light of this.intenseLights) {
      light.dispose();
    }
    this.intenseLights = [];

    // Clean up materials
    for (const material of this.materialCache.values()) {
      material.dispose();
    }
    this.materialCache.clear();

    // Clean up gravitational lensing
    this.gravitationalLensingHelper?.dispose();
    this.gravitationalLensingHelper = undefined;

    super.dispose();
  }
}
