import * as THREE from "three";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import { BaseStarRenderer } from "../../base/base-star";
import { EnhancedStarMaterial } from "../../materials/enhanced-star.material";
import type { LODLevel } from "@teskooano/renderer-threejs-celestial";
import {
  BaseCelestialRendererOptions,
  CelestialMeshOptions,
  LightSourcesMap,
  GeometryUtilities,
} from "@teskooano/renderer-threejs-celestial";

/**
 * Material for Subgiant stars
 * - Temperature: 4,000-7,000 K
 * - Color: Yellow to orange
 * - Typical mass: 0.6-10 M☉
 * - Hydrogen shell burning
 * - Expanding and cooling
 * - Transition phase between main sequence and red giant
 */
export class SubgiantMaterial extends EnhancedStarMaterial {
  constructor(object: RenderableCelestialObject) {
    // Subgiants have moderate expansion and cooling
    const subgiantDefaults = {
      // Basic effects - moderate values
      noiseScale: 1.2,
      noiseIntensity: 0.3,
      plasmaTurbulence: 0.2,
      lightingIntensity: 1.1,
    };

    super(object, new THREE.Color(0xffaa44), subgiantDefaults);
  }

  /**
   * Update for subgiants with gradual expansion effects
   */
  update(
    time: number,
    timeScale: number,
    lightSources: LightSourcesMap,
    camera: THREE.PerspectiveCamera,
    allObjects?: Record<string, RenderableCelestialObject>,
    allMeshes?: Record<string, THREE.Object3D>,
  ): void {
    super.update(time, timeScale, lightSources, camera, allObjects, allMeshes);

    // Gradual expansion effect (subgiants are slowly growing)
    const expansionPhase = Math.sin(time * 0.0001) * 0.1 + 0.9;
    this.uniforms.uLightingIntensity.value = 1.1 * expansionPhase;
  }
}

/**
 * Renderer for Subgiant stars
 * - Creates moderate corona effects
 * - Shows gradual expansion phase
 * - Transitional appearance between main sequence and red giant
 */
export class SubgiantRenderer extends BaseStarRenderer<SubgiantMaterial> {
  private subgiantMaterial: SubgiantMaterial | null = null;

  constructor(
    object: RenderableCelestialObject,
    options: BaseCelestialRendererOptions = {},
  ) {
    super(object, options);
  }

  /**
   * Create material for subgiants
   */
  protected createMaterial(
    object: RenderableCelestialObject,
  ): SubgiantMaterial {
    if (!this.subgiantMaterial) {
      this.subgiantMaterial = new SubgiantMaterial(object);
    }
    return this.subgiantMaterial;
  }

  /**
   * Get custom LOD levels for subgiants
   */
  protected getCustomLODs(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    const levels: LODLevel[] = [];
    const material = this.createAndRegisterMaterial(object);

    // High detail level (LOD 0) - Full subgiant with moderate corona
    const highDetailGroup = new THREE.Group();
    highDetailGroup.name = `${object.id}-subgiant-high`;

    // Create main star body
    const starSegments = GeometryUtilities.getOptimizedStarSegments("high", 64);
    const starGeometry = new THREE.SphereGeometry(
      1,
      starSegments,
      starSegments,
    );
    const starMesh = new THREE.Mesh(starGeometry, material);
    starMesh.name = `${object.id}-subgiant-body`;
    highDetailGroup.add(starMesh);

    // Create moderate corona system
    this._addCoronaToGroup(object, highDetailGroup);

    levels.push({ object: highDetailGroup, distance: 0 });

    // Medium detail level (LOD 1) - Simplified subgiant
    const mediumDetailGroup = new THREE.Group();
    mediumDetailGroup.name = `${object.id}-subgiant-medium`;

    const mediumStarMesh = new THREE.Mesh(starGeometry, material);
    mediumDetailGroup.add(mediumStarMesh);

    // Basic corona
    this._addCoronaToGroup(object, mediumDetailGroup);

    levels.push({ object: mediumDetailGroup, distance: 1500 });

    return levels;
  }

  protected getBillboardLODDistance(object: RenderableCelestialObject): number {
    // Subgiants are moderately bright
    return object.radius * 3000;
  }

  /**
   * Get star color for subgiants (typically yellow to orange)
   */
  protected getStarColor(object: RenderableCelestialObject): THREE.Color {
    // Subgiants are typically yellow to orange
    return new THREE.Color(0xffaa44); // Yellow-orange
  }

  /**
   * Enhanced update for subgiants
   */
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

    // Update subgiant material
    if (this.subgiantMaterial) {
      this.subgiantMaterial.update(
        time,
        timeScale,
        lightSources,
        camera,
        allObjects,
        allMeshes,
      );
    }
  }

  /**
   * Dispose of subgiant-specific resources
   */
  dispose(): void {
    if (this.subgiantMaterial) {
      this.subgiantMaterial.dispose();
      this.subgiantMaterial = null;
    }
    super.dispose();
  }
}
