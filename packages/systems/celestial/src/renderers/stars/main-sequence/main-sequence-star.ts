import * as THREE from "three";
import type { StarProperties } from "@teskooano/data-types";
import { BaseStarMaterial, BaseStarRenderer } from "../base/base-star";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import type { LODLevel } from "@teskooano/renderer-threejs-lod";
import type { CelestialMeshOptions } from "../../base/CelestialRenderer";

/**
 * Material for main sequence stars with shader effects
 */
export class MainSequenceStarMaterial extends BaseStarMaterial {
  constructor(
    color: THREE.Color = new THREE.Color(0xffff00),
    options: {
      coronaIntensity?: number;
      pulseSpeed?: number;
      glowIntensity?: number;
      temperatureVariation?: number;
      metallicEffect?: number;
    } = {},
  ) {
    super(color, options);
  }
}

/**
 * Main sequence star renderer
 */
export class MainSequenceStarRenderer extends BaseStarRenderer {
  /**
   * Returns the appropriate material for a main sequence star
   */
  getMaterial(object: RenderableCelestialObject): BaseStarMaterial {
    return new MainSequenceStarMaterial(this.getStarColor(object));
  }

  /**
   * Get the star color based on its properties
   */
  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    const properties = star.properties as StarProperties;

    if (properties && properties.color) {
      return new THREE.Color(properties.color);
    }

    return new THREE.Color(0xffcc00);
  }

  getLODLevels(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    const material = this.getMaterial(object);
    return this._createLuminousStarLODs(object, material, options);
  }
}
