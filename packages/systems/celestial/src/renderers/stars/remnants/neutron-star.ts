import * as THREE from "three";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import { BaseStarRenderer } from "../base/base-star";
import { GravitationalLensingHelper } from "../../effects/gravitational-lensing";
import type {
  CelestialMeshOptions,
  LightSourcesMap,
} from "../../base/CelestialRenderer";
import { LODLevel } from "@teskooano/renderer-threejs-lod";
import { BaseCelestialRendererOptions } from "../../base/BaseCelestialRenderer";

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

  constructor(options?: BaseCelestialRendererOptions) {
    super(options);
  }

  getLODLevels(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    // --- High Detail: A small, bright mesh with gravitational lensing ---
    const highDetailGeometry = new THREE.SphereGeometry(object.radius, 32, 32);
    const highDetailMaterial = new NeutronStarMaterial();
    const highDetailMesh = new THREE.Mesh(
      highDetailGeometry,
      highDetailMaterial,
    );
    highDetailMesh.name = `${object.celestialObjectId}-high-lod`;

    // Add gravitational lensing
    if (options?.camera && options.scene && options.renderer) {
      this.gravitationalLensingHelper = new GravitationalLensingHelper(
        options.renderer,
        options.scene,
        options.camera as THREE.PerspectiveCamera,
        highDetailMesh,
      );
    }
    const level0: LODLevel = { object: highDetailMesh, distance: 0 };

    // --- Low Detail: A simple point light and billboard ---
    const lowDetailGroup = new THREE.Group();
    lowDetailGroup.name = `${object.celestialObjectId}-low-lod-group`;
    const color = new THREE.Color(0x99aaff); // Intense blue-white
    const lodLight = this._createLODLight(color, 3.0);
    const lodBillboard = this._createLODBillboard(color, 30);
    lowDetailGroup.add(lodLight);
    lowDetailGroup.add(lodBillboard);
    const level1: LODLevel = { object: lowDetailGroup, distance: 1000 };

    return [level0, level1];
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
