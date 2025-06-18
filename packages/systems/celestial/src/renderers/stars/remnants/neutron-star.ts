import * as THREE from "three";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import { GravitationalLensingHelper } from "../../effects/gravitational-lensing";
import type {
  CelestialMeshOptions,
  LightSourcesMap,
} from "../../base/CelestialRenderer";
import { LODLevel } from "@teskooano/renderer-threejs-lod";
import { BaseCelestialRendererOptions } from "../../base/BaseCelestialRenderer";
import {
  calculateDistantSpriteSize,
  createBillboardSprite,
} from "../../billboards";
import { BaseCelestialRenderer } from "../../base/BaseCelestialRenderer";

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
export class NeutronStarRenderer extends BaseCelestialRenderer {
  protected gravitationalLensingHelper: GravitationalLensingHelper | undefined;
  private material: NeutronStarMaterial;

  constructor(options?: BaseCelestialRendererOptions) {
    super(options);
    this.material = new NeutronStarMaterial();
    this.registerMaterial("neutron-star-material", this.material);
  }

  getLODLevels(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    // --- High Detail: A small, bright mesh ---
    const highDetailGeometry = new THREE.SphereGeometry(object.radius, 32, 32);
    const highDetailMesh = new THREE.Mesh(highDetailGeometry, this.material);
    highDetailMesh.name = `${object.celestialObjectId}-high-lod`;

    // TODO: Gravitational lensing needs to be re-integrated
    const level0: LODLevel = { object: highDetailMesh, distance: 0 };

    // --- Low Detail: A simple point light and billboard ---
    const color = new THREE.Color(0x99aaff); // Intense blue-white
    const billboardDistance = 1000;
    const size = calculateDistantSpriteSize(object);
    const light = new THREE.PointLight(color, 3.0, 0, 2);

    const level1 = this._createBillboardLOD(object, {
      distance: billboardDistance,
      size: size,
      color: color,
      light: light,
    });

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
