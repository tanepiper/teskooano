import * as THREE from "three";
import {
  PostMainSequenceStarRenderer,
  PostMainSequenceStarMaterial,
} from "./post-main-sequence-star-renderer";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import { LODLevel } from "../../index";
import { SCALE } from "@teskooano/data-types";
import type { CelestialMeshOptions } from "../../common/CelestialRenderer";

/**
 * Material for supergiant stars.
 * This class now primarily passes supergiant-specific parameters to the shared PostMainSequenceStarMaterial.
 */
export class SupergiantMaterial extends PostMainSequenceStarMaterial {
  constructor(color: THREE.Color = new THREE.Color(0xff8855)) {
    super({
      starColor: color,
      coronaIntensity: 1.0,
      pulseSpeed: 0.08, // Slower pulse for very large stars
      glowIntensity: 1.3, // Very luminous
      temperatureVariation: 0.6, // Significant surface turbulence and variation
      metallicEffect: 0.25,
    });
  }
}

/**
 * Renderer for supergiant stars - extremely large, luminous evolved stars
 * Characteristics:
 * - Enormous size and luminosity
 * - Variable colors (red, yellow, or blue depending on temperature)
 * - Strong stellar winds and mass loss
 * - Unstable and variable
 * - Short-lived, ending in supernovae
 */
export class SupergiantRenderer extends PostMainSequenceStarRenderer {
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
    return new SupergiantMaterial(color);
  }

  protected getStarColor(object: RenderableCelestialObject): THREE.Color {
    // Supergiants can be various colors (red, yellow, blue) - default to reddish-orange
    return new THREE.Color(0xff8855);
  }

  protected getBillboardLODDistance(object: RenderableCelestialObject): number {
    const scale = typeof SCALE === "number" ? SCALE : 1;
    return 15000 * scale; // Retaining the original sprite distance
  }

  protected getCustomLODs(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    const scale = typeof SCALE === "number" ? SCALE : 1;

    const highDetailGroup = this._createHighDetailGroup(object, {
      ...options,
      segments: 192, // Custom high detail for Supergiant
    });
    const level0: LODLevel = { object: highDetailGroup, distance: 0 };

    const mediumDetailGroup = this._createHighDetailGroup(object, {
      ...options,
      segments: 96, // Custom medium detail for Supergiant
    });
    mediumDetailGroup.name = `${object.celestialObjectId}-medium-lod`;
    const level1: LODLevel = {
      object: mediumDetailGroup,
      distance: 1500 * scale, // Adjusted medium detail distance (same as others for now)
    };

    return [level0, level1];
  }
}
