import * as THREE from "three";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import { BaseStarRenderer } from "../base/base-star";
import { GravitationalLensingHelper } from "../../effects/gravitational-lensing";
import type {
  CelestialMeshOptions,
  LightSourcesMap,
} from "../../base/CelestialRenderer";
import { LODLevel } from "@teskooano/renderer-threejs-lod";

/**
 * Material for neutron stars
 */
class NeutronStarMaterial extends THREE.MeshBasicMaterial {
  constructor() {
    super({
      color: 0xffffff,
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
export class NeutronStarRenderer extends BaseStarRenderer {
  protected gravitationalLensingHelper: GravitationalLensingHelper | undefined;

  getLODLevels(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    const geometry = new THREE.SphereGeometry(object.radius, 32, 32);
    const material = new NeutronStarMaterial();
    const mesh = new THREE.Mesh(geometry, material);

    // Add gravitational lensing
    if (options?.camera && options.scene && options.renderer) {
      this.gravitationalLensingHelper = new GravitationalLensingHelper(
        options.renderer,
        options.scene,
        options.camera as THREE.PerspectiveCamera,
        mesh,
      );
    }

    return [{ object: mesh, distance: 0 }];
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
