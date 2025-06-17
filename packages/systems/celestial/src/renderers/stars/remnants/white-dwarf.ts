import * as THREE from "three";
import { BaseStarMaterial, BaseStarRenderer } from "../base/base-star";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import type { LODLevel } from "@teskooano/renderer-threejs-lod";
import type { CelestialMeshOptions } from "../../base/CelestialRenderer";
import { BaseCelestialRendererOptions } from "../../base/BaseCelestialRenderer";

/**
 * Material for white dwarf stars
 * - Temperature: 8,000-40,000 K
 * - Color: White to pale blue
 * - Typical mass: 0.5-0.7 M☉
 * - Typical radius: ~0.01 R☉ (Earth-sized)
 * - Very high density
 * - No fusion - cooling remnant of a star
 * - Electron-degenerate matter
 */
export class WhiteDwarfMaterial extends BaseStarMaterial {
  constructor(
    options: {
      coronaIntensity?: number;
      pulseSpeed?: number;
      glowIntensity?: number;
      temperatureVariation?: number;
      metallicEffect?: number;
    } = {},
  ) {
    const whiteColor = new THREE.Color(0xf8fcff);

    super(whiteColor, {
      coronaIntensity: options.coronaIntensity ?? 0.4,

      pulseSpeed: options.pulseSpeed ?? 0.2,

      glowIntensity: options.glowIntensity ?? 0.7,

      temperatureVariation: options.temperatureVariation ?? 0.05,

      metallicEffect: options.metallicEffect ?? 0.8,
    });
  }
}

/**
 * Renderer for white dwarf stars
 */
export class WhiteDwarfRenderer extends BaseStarRenderer {
  private material: WhiteDwarfMaterial;

  constructor(options?: BaseCelestialRendererOptions) {
    super(options);
    this.material = new WhiteDwarfMaterial();
  }

  public getMaterial(object: RenderableCelestialObject): BaseStarMaterial {
    return this.material;
  }

  protected getCustomLODs(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    const segments = this.getSegmentsForDetailLevel(options?.detailLevel, 32);
    const geometry = new THREE.SphereGeometry(
      object.radius,
      segments,
      segments,
    );
    const mesh = new THREE.Mesh(geometry, this.material);
    mesh.name = `${object.celestialObjectId}-body`;

    const group = new THREE.Group();
    group.add(mesh);
    this._addCoronaToGroup(object, group);

    return [{ object: group, distance: 0 }];
  }

  protected getBillboardLODDistance(object: RenderableCelestialObject): number {
    // White dwarfs are small but very bright, so their billboard should appear from further away
    return object.radius * 500;
  }

  /**
   * White dwarfs are white with slight blue tint
   */
  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    return new THREE.Color(0xf8fcff);
  }
}
