import * as THREE from "three";
import {
  PostMainSequenceStarRenderer,
  PostMainSequenceStarMaterial,
} from "./post-main-sequence-star-renderer";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import { LODLevel } from "../../index";
import { AU_METERS, SCALE } from "@teskooano/data-types";
import type { CelestialMeshOptions } from "../../common/types";

/**
 * Material for hypergiant stars.
 * This class now primarily passes hypergiant-specific parameters to the shared PostMainSequenceStarMaterial.
 */
export class HypergiantMaterial extends PostMainSequenceStarMaterial {
  constructor(color: THREE.Color = new THREE.Color(0xff4433)) {
    super({
      starColor: color,
      coronaIntensity: 1.2, // Hypergiants are very active
      pulseSpeed: 0.1,
      glowIntensity: 1.5,
      temperatureVariation: 0.7, // High variation due to instability
      metallicEffect: 0.2, // Effect might be obscured by sheer luminosity and turbulence
    });
  }
}

/**
 * Renderer for hypergiant stars - the most massive and luminous stars
 * Characteristics:
 * - Extreme size and luminosity
 * - Highly unstable and variable
 * - Massive stellar winds and eruptions
 * - Short-lived and rare
 */
export class HypergiantRenderer extends PostMainSequenceStarRenderer {
  constructor(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ) {
    super(object, options);
  }

  protected getMaterial(
    object: RenderableCelestialObject,
  ): PostMainSequenceStarMaterial {
    const color = this.getStarColor(object);
    return new HypergiantMaterial(color);
  }

  protected getStarColor(object: RenderableCelestialObject): THREE.Color {
    // Hypergiants can be various colors - default to bright yellowish-white
    return new THREE.Color(0xffffcc);
  }

  /**
   * Override billboard size calculation for hypergiants.
   * Hypergiants are among the largest stars, so their billboards should reflect this.
   *
   * @param object The renderable celestial object
   * @returns The calculated sprite size for billboard rendering
   */
  protected override calculateBillboardSize(
    object: RenderableCelestialObject,
  ): number {
    const starRadius_AU = object.radius / AU_METERS;

    // Hypergiants are even larger than supergiants
    const minSpriteSize = 0.2;
    const maxSpriteSize = 1.5; // Higher max size for hypergiants

    // Quadratic scaling with higher factor for these extremely large stars
    const calculatedSpriteSize = 0.25 + starRadius_AU * starRadius_AU * 0.06;

    return Math.max(
      minSpriteSize,
      Math.min(maxSpriteSize, calculatedSpriteSize),
    );
  }

  protected getBillboardLODDistance(object: RenderableCelestialObject): number {
    const scale = typeof SCALE === "number" ? SCALE : 1;
    // Hypergiants should be visible from very far away
    const starRadius_AU = object.radius / AU_METERS;
    const sizeBasedDistance = 50000 + starRadius_AU * 3000;
    return Math.min(80000, sizeBasedDistance) * scale;
  }

  protected getCustomLODs(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    const scale = typeof SCALE === "number" ? SCALE : 1;

    const highDetailGroup = this._createHighDetailGroup(object, {
      ...options,
      segments: 192, // Custom high detail for Hypergiant
    });
    const level0: LODLevel = { object: highDetailGroup, distance: 0 };

    const mediumDetailGroup = this._createHighDetailGroup(object, {
      ...options,
      segments: 96, // Custom medium detail for Hypergiant
    });
    mediumDetailGroup.name = `${object.celestialObjectId}-medium-lod`;
    const level1: LODLevel = {
      object: mediumDetailGroup,
      distance: 1500 * scale, // Adjusted medium detail distance (same as others for now)
    };

    return [level0, level1];
  }
}
