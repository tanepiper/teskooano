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

    // High intensity single light - neutron stars are very bright and energetic
    // Distance limit prevents overpowering other stars in multi-star systems
    const maxLightDistance = object.radius * 800; // Limit light reach
    const mainIntensity = 12000000; // 12 million - single concentrated light

    // Single intense point light at the center with shadow casting
    // decay=2.0 for physically accurate inverse-square falloff
    const mainLight = new THREE.PointLight(
      color,
      mainIntensity,
      maxLightDistance,
      2.0,
    );
    mainLight.name = `${object.id}-main-light`;
    mainLight.castShadow = true;
    group.add(mainLight);
    this.intenseLights.push(mainLight);

    // For pulsars, store original intensity for pulsing animation
    if (this.subtype === NeutronStarSubtype.PULSAR) {
      (mainLight as any).originalIntensity = mainLight.intensity;
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
