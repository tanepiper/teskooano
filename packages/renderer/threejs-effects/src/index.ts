import { LightManager } from './LightManager';
import { LODManager } from './LODManager';
import * as THREE from 'three';

export { LightManager } from './LightManager';
export { LODManager } from './LODManager';
export * from './lod-manager';

// Alias export to match the naming in the migration plan
export { LODManager as GravitationalLensingManager } from './LODManager';

// Effects module class will be implemented here
export class EffectsManager {
  lightManager: LightManager;
  lodManager: LODManager;
  
  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    this.lightManager = new LightManager(scene);
    this.lodManager = new LODManager(camera);
  }
  
  applyLighting(): void {
    // LightManager doesn't have an update method
  }
  
  applyLOD(): void {
    this.lodManager.update();
  }
  
  update(): void {
    this.applyLighting();
    this.applyLOD();
  }
  
  dispose(): void {
    // Implement proper disposal logic
    this.lightManager.dispose?.();
    // LODManager doesn't have a dispose method
  }
} 