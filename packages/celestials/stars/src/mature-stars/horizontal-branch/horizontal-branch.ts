import * as THREE from "three";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import { BaseStarRenderer } from "../../base/base-star";
import { EnhancedStarMaterial } from "../../materials/enhanced-star.material";
import type { LODLevel } from "@teskooano/renderer-threejs-lod";
import {
  BaseCelestialRendererOptions,
  CelestialMeshOptions,
  LightSourcesMap,
  GeometryUtilities,
} from "@teskooano/renderer-threejs-celestial";

/**
 * Material for Horizontal Branch stars
 * - Temperature: 4,500-7,500 K
 * - Color: Yellow to white
 * - Typical mass: 0.6-2.0 M☉
 * - Helium core burning
 * - Contracted from red giant phase
 * - Stable helium fusion
 * - Examples: RR Lyrae variables
 */
export class HorizontalBranchMaterial extends EnhancedStarMaterial {
  constructor(object: RenderableCelestialObject) {
    // Horizontal branch stars have contracted and are burning helium
    const horizontalBranchDefaults = {
      // Basic effects - contracted and stable
      noiseScale: 1.0, // Moderate scale
      noiseIntensity: 0.3, // Moderate intensity
      plasmaTurbulence: 0.2, // Low turbulence
      lightingIntensity: 1.2, // Bright due to helium fusion
    };

    super(object, new THREE.Color(0xffdd88), horizontalBranchDefaults);
  }

  /**
   * Update for horizontal branch stars with stable helium fusion
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

    // Stable helium fusion effect
    const heliumPhase = Math.sin(time * 0.0003) * 0.1 + 0.9;
    this.uniforms.uLightingIntensity.value = 1.2 * heliumPhase;
  }
}

/**
 * Renderer for Horizontal Branch stars
 * - Creates stable, bright coronas
 * - Shows helium fusion effects
 * - Contracted from red giant phase
 */
export class HorizontalBranchRenderer extends BaseStarRenderer<HorizontalBranchMaterial> {
  private horizontalBranchMaterial: HorizontalBranchMaterial | null = null;

  constructor(
    object: RenderableCelestialObject,
    options: BaseCelestialRendererOptions = {},
  ) {
    super(object, options);
  }

  /**
   * Create material for horizontal branch stars
   */
  protected createMaterial(
    object: RenderableCelestialObject,
  ): HorizontalBranchMaterial {
    if (!this.horizontalBranchMaterial) {
      this.horizontalBranchMaterial = new HorizontalBranchMaterial(object);
    }
    return this.horizontalBranchMaterial;
  }

  /**
   * Get custom LOD levels for horizontal branch stars
   */
  protected getCustomLODs(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    const levels: LODLevel[] = [];
    const material = this.createAndRegisterMaterial(object);

    // High detail level (LOD 0) - Full horizontal branch star
    const highDetailGroup = new THREE.Group();
    highDetailGroup.name = `${object.celestialObjectId}-horizontal-branch-high`;

    // Create main star body
    const starSegments = GeometryUtilities.getOptimizedStarSegments("high", 64);
    const starGeometry = new THREE.SphereGeometry(
      1,
      starSegments,
      starSegments,
    );
    const starMesh = new THREE.Mesh(starGeometry, material);
    starMesh.name = `${object.celestialObjectId}-horizontal-branch-body`;
    highDetailGroup.add(starMesh);

    // Create stable corona system
    this._addCoronaToGroup(object, highDetailGroup);

    levels.push({ object: highDetailGroup, distance: 0 });

    // Medium detail level (LOD 1) - Simplified horizontal branch star
    const mediumDetailGroup = new THREE.Group();
    mediumDetailGroup.name = `${object.celestialObjectId}-horizontal-branch-medium`;

    const mediumStarMesh = new THREE.Mesh(starGeometry, material);
    mediumDetailGroup.add(mediumStarMesh);

    // Basic corona
    this._addCoronaToGroup(object, mediumDetailGroup);

    levels.push({ object: mediumDetailGroup, distance: 1500 });

    return levels;
  }

  protected getBillboardLODDistance(object: RenderableCelestialObject): number {
    // Horizontal branch stars are bright
    return object.radius * 3000;
  }

  /**
   * Get star color for horizontal branch stars (typically yellow to white)
   */
  protected getStarColor(object: RenderableCelestialObject): THREE.Color {
    // Horizontal branch stars are typically yellow to white
    return new THREE.Color(0xffdd88); // Yellow-white
  }

  /**
   * Enhanced update for horizontal branch stars
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

    // Update horizontal branch material
    if (this.horizontalBranchMaterial) {
      this.horizontalBranchMaterial.update(
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
   * Dispose of horizontal branch-specific resources
   */
  dispose(): void {
    if (this.horizontalBranchMaterial) {
      this.horizontalBranchMaterial.dispose();
      this.horizontalBranchMaterial = null;
    }
    super.dispose();
  }
}
