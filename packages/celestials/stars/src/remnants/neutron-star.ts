import * as THREE from "three";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import { GravitationalLensingHelper } from "@teskooano/celestials-stars";
import { LODLevel } from "@teskooano/renderer-threejs-lod";
import { BaseStarRenderer, BaseStarMaterial } from "../base/base-star";
import {
  BaseCelestialRendererOptions,
  CelestialMeshOptions,
  LightSourcesMap,
} from "@teskooano/renderer-threejs-celestial";

/**
 * Material for neutron stars
 */
class NeutronStarMaterial extends BaseStarMaterial {
  constructor() {
    super(new THREE.Color(0xffffff), {
      coronaIntensity: 0.0,
      pulseSpeed: 0.0,
      glowIntensity: 0.1,
      temperatureVariation: 0.0,
      metallicEffect: 0.1,
    });
  }
}

/**
 * Renderer for neutron stars.
 *
 * A neutron star is not a "luminous" star in the traditional sense,
 * so it provides its own LOD implementation without a corona.
 * It uses a gravitational lensing effect.
 */
export class NeutronStarRenderer extends BaseStarRenderer<NeutronStarMaterial> {
  protected gravitationalLensingHelper: GravitationalLensingHelper | undefined;
  private material: NeutronStarMaterial;

  constructor(options?: BaseCelestialRendererOptions) {
    super(options);
    this.material = new NeutronStarMaterial();
    this.registerMaterial("neutron-star-material", this.material);
  }

  protected createMaterial(
    object: RenderableCelestialObject,
  ): NeutronStarMaterial {
    return this.material;
  }

  protected getCustomLODs(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    const highDetailGeometry = new THREE.SphereGeometry(object.radius, 32, 32);
    const highDetailMesh = new THREE.Mesh(highDetailGeometry, this.material);
    highDetailMesh.name = `${object.celestialObjectId}-high-lod`;
    return [{ object: highDetailMesh, distance: 0 }];
  }

  protected getBillboardLODDistance(object: RenderableCelestialObject): number {
    return object.radius * 2000;
  }

  update(
    object: RenderableCelestialObject,
    time: number,
    timeScale: number,
    lightSources: LightSourcesMap,
    camera: THREE.Camera,
  ): void {
    super.update(object, time, timeScale, lightSources, camera);
    // this.gravitationalLensingHelper?.update(this camera);
  }

  dispose(): void {
    super.dispose();
    this.gravitationalLensingHelper?.dispose();
  }
}
