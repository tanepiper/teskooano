import * as THREE from "three";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import { BaseStarMaterial, BaseStarRenderer } from "../base/base-star";

import type { LODLevel } from "@teskooano/renderer-threejs-lod";
import {
  BaseCelestialRendererOptions,
  CelestialMeshOptions,
  LightSourcesMap,
} from "@teskooano/renderer-threejs-celestial";

/**
 * Material for Wolf-Rayet stars
 * - Temperature: 30,000-200,000 K
 * - Color: Blue-white
 * - Typical mass: 10-25 M☉
 * - Strong stellar winds
 * - Rapidly losing mass
 * - Helium-burning phase
 * - Strong emission lines
 * - Precursor to supernovae
 */
export class WolfRayetMaterial extends BaseStarMaterial {
  constructor(
    options: {
      coronaIntensity?: number;
      pulseSpeed?: number;
      glowIntensity?: number;
      temperatureVariation?: number;
      metallicEffect?: number;
    } = {},
  ) {
    const blueWhiteColor = new THREE.Color(0xa0c8ff);

    super(blueWhiteColor, {
      coronaIntensity: options.coronaIntensity ?? 1.2,

      pulseSpeed: options.pulseSpeed ?? 1.0,

      glowIntensity: options.glowIntensity ?? 1.0,

      temperatureVariation: options.temperatureVariation ?? 0.25,

      metallicEffect: options.metallicEffect ?? 0.5,
    });
  }

  update(
    time: number,
    timeScale: number,
    lightSources?: LightSourcesMap,
    camera?: THREE.Camera,
  ): void {
    super.update(time, timeScale, lightSources, camera);
  }
}

/**
 * Renderer for Wolf-Rayet stars
 */
export class WolfRayetRenderer extends BaseStarRenderer {
  constructor(options?: BaseCelestialRendererOptions) {
    super(options);
  }

  protected getCustomLODs(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    const material = this.getMaterial(object);
    const segments = this.getSegmentsForDetailLevel(options?.detailLevel, 64);
    const geometry = new THREE.SphereGeometry(
      object.radius,
      segments,
      segments,
    );
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `${object.celestialObjectId}-body`;

    const group = new THREE.Group();
    group.add(mesh);
    this._addCoronaToGroup(object, group);

    return [{ object: group, distance: 0 }];
  }

  /**
   * Returns the appropriate material for a Wolf-Rayet star
   */
  public getMaterial(object: RenderableCelestialObject): BaseStarMaterial {
    return new WolfRayetMaterial();
  }

  protected getBillboardLODDistance(object: RenderableCelestialObject): number {
    return object.radius * 2000;
  }

  /**
   * Wolf-Rayet stars are intense blue-white
   */
  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    return new THREE.Color(0xa0c8ff);
  }

  /**
   * Override to create more extensive corona for Wolf-Rayet stars
   */
  protected _addCoronaToGroup(
    object: RenderableCelestialObject,
    group: THREE.Group,
  ): void {
    super._addCoronaToGroup(object, group);

    const radius = object.radius || 1;
    const coronaScale = radius * 5;
    const color = this.getStarColor(object);

    const sphereGeometry = new THREE.SphereGeometry(coronaScale, 32, 32);

    const stellarWindMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const stellarWindSphere = new THREE.Mesh(
      sphereGeometry,
      stellarWindMaterial,
    );
    stellarWindSphere.name = `${object.celestialObjectId}-stellar-wind`;
    group.add(stellarWindSphere);
  }
}
