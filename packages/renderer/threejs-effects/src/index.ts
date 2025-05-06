import { LightManager } from "./LightManager";
import { LODManager } from "./LODManager";
import * as THREE from "three";

export { LightManager } from "./LightManager";
export { LODManager } from "./LODManager";
export * from "./lod-manager";

export { LODManager as GravitationalLensingManager } from "./LODManager";

export class EffectsManager {
  lightManager: LightManager;
  lodManager: LODManager;

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    this.lightManager = new LightManager(scene);
    this.lodManager = new LODManager(camera);
  }

  applyLighting(): void {}

  applyLOD(): void {
    this.lodManager.update();
  }

  update(): void {
    this.applyLighting();
    this.applyLOD();
  }

  dispose(): void {
    this.lightManager.dispose?.();
  }
}
