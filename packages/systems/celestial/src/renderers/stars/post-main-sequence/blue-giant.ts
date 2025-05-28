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
 * Material for blue giant stars.
 * This class now primarily passes blue-giant-specific parameters to the shared PostMainSequenceStarMaterial.
 */
export class BlueGiantMaterial extends PostMainSequenceStarMaterial {
  constructor(color: THREE.Color = new THREE.Color(0xaaccff)) {
    super({
      starColor: color,
      coronaIntensity: 0.9,
      pulseSpeed: 0.3,
      glowIntensity: 1.2,
      temperatureVariation: 0.2, // Less variation for hotter, more uniform stars
      metallicEffect: 0.4,
    });
  }
}

/**
 * Renderer for blue giant stars - hot, massive evolved stars
 * Characteristics:
 * - Very hot and bright
 * - Blue-white color
 * - Strong stellar winds
 * - High luminosity
 * - Relatively short lifespan compared to main-sequence stars
 */
export class BlueGiantRenderer extends PostMainSequenceStarRenderer {
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
    return new BlueGiantMaterial(color);
  }

  protected getStarColor(object: RenderableCelestialObject): THREE.Color {
    // Blue giants are hot and blue
    return new THREE.Color(0xaaccff);
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
      segments: 192, // Custom high detail for Blue Giant
    });
    const level0: LODLevel = { object: highDetailGroup, distance: 0 };

    const mediumDetailGroup = this._createHighDetailGroup(object, {
      ...options,
      segments: 96, // Custom medium detail for Blue Giant
    });
    mediumDetailGroup.name = `${object.celestialObjectId}-medium-lod`;
    const level1: LODLevel = {
      object: mediumDetailGroup,
      distance: 1500 * scale, // Adjusted medium detail distance (same as RedGiant for now)
    };

    return [level0, level1];
  }
}
