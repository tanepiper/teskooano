import { ControlsManager } from "./ControlsManager";
import * as THREE from "three";
import { CSS2DManager, CSS2DLayerType } from "./CSS2DManager";

export { ControlsManager } from "./ControlsManager";
export { CSS2DManager, CSS2DLayerType } from "./CSS2DManager";

// Alias export to match the naming in the migration plan
export { ControlsManager as CameraManager } from "./ControlsManager";

// Interaction module class will be implemented here
export class InteractionManager {
  controlsManager: ControlsManager;

  constructor(container: HTMLElement, camera: THREE.PerspectiveCamera) {
    this.controlsManager = new ControlsManager(camera, container);
    this.uiManager = new UIManager(container);
  }

  handleInput(event: Event): void {
    // Forward event to managers if they have handleInput
    // The ControlsManager doesn't have a handleInput method
  }

  updateUI(): void {
    // UIManager doesn't have an update method
  }

  updateCamera(): void {
    this.controlsManager.update();
  }

  update(): void {
    this.updateCamera();
    this.updateUI();
  }

  dispose(): void {
    this.controlsManager.dispose();
    this.uiManager.dispose();
  }
}
