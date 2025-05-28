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
 * Material for subgiant stars.
 * This class now primarily passes subgiant-specific parameters to the shared PostMainSequenceStarMaterial.
 */
export class SubgiantMaterial extends PostMainSequenceStarMaterial {
  constructor(color: THREE.Color = new THREE.Color(0xffddaa)) {
    super({
      starColor: color,
      coronaIntensity: 0.4,
      pulseSpeed: 0.2,
      glowIntensity: 0.8,
      temperatureVariation: 0.3, // Moderate variation as they are evolving
      metallicEffect: 0.3,
    });
  }
}

/**
 * Renderer for subgiant stars - evolved stars between main sequence and giant phase
 * Characteristics:
 * - Slightly larger and cooler than main sequence
 * - Beginning to expand as hydrogen in core depletes
 * - More stable than giants but showing signs of evolution
 * - Brighter than main-sequence stars of similar mass
 */
export class SubgiantRenderer extends PostMainSequenceStarRenderer {
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
    return new SubgiantMaterial(color);
  }

  protected getStarColor(object: RenderableCelestialObject): THREE.Color {
    // Subgiants are typically yellowish to orange
    return new THREE.Color(0xffddaa);
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
      segments: 192, // Custom high detail for Subgiant
    });
    const level0: LODLevel = { object: highDetailGroup, distance: 0 };

    const mediumDetailGroup = this._createHighDetailGroup(object, {
      ...options,
      segments: 96, // Custom medium detail for Subgiant
    });
    mediumDetailGroup.name = `${object.celestialObjectId}-medium-lod`;
    const level1: LODLevel = {
      object: mediumDetailGroup,
      distance: 1500 * scale, // Adjusted medium detail distance (same as others for now)
    };

    return [level0, level1];
  }
}
