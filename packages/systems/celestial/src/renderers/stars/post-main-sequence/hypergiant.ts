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
    // Hypergiants can be red, yellow, or blue - default to red
    return new THREE.Color(0xff4433);
  }

  protected getBillboardLODDistance(object: RenderableCelestialObject): number {
    const scale = typeof SCALE === "number" ? SCALE : 1;
    return 150000 * scale; // Retaining the original sprite distance
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
