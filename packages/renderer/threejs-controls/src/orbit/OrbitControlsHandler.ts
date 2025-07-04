import { Subject } from "rxjs";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export type ControlsChangeEvent = {
  position: THREE.Vector3;
  target: THREE.Vector3;
};

/**
 * Manages the lifecycle and events of a Three.js OrbitControls instance.
 * Encapsulates setup, event handling, and state changes for the controls.
 */
export class OrbitControlsHandler {
  /** The underlying OrbitControls instance. */
  public readonly controls: OrbitControls;

  /** Emits when the user starts manipulating the controls. */
  public readonly onControlsStart$ = new Subject<void>();
  /** Emits when the user finishes manipulating the controls. */
  public readonly onControlsEnd$ = new Subject<ControlsChangeEvent>();

  /**
   * Creates an instance of OrbitControlsHandler.
   * @param camera The camera to control.
   * @param domElement The HTML element for event listeners.
   */
  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.controls = new OrbitControls(camera, domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.5;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 0.0001;
    this.controls.maxDistance = 1e7; // Adjust as needed
    this.controls.maxPolarAngle = Math.PI; // Allow looking from underneath

    this.controls.addEventListener("start", this.handleControlsStart);
    this.controls.addEventListener("end", this.handleControlsEnd);
  }

  private handleControlsStart = (): void => {
    this.onControlsStart$.next();
  };

  private handleControlsEnd = (): void => {
    this.onControlsEnd$.next({
      position: this.controls.object.position.clone(),
      target: this.controls.target.clone(),
    });
  };

  /**
   * Updates the controls. Should be called in the render loop.
   * @param delta Time delta since last frame.
   */
  public update(delta: number): void {
    if (this.controls.enabled) {
      this.controls.update(delta);
    }
  }

  /**
   * Enables or disables the controls.
   * @param enabled True to enable, false to disable.
   */
  public setEnabled(enabled: boolean): void {
    this.controls.enabled = enabled;
  }

  /**
   * Cleans up resources and event listeners.
   */
  public dispose(): void {
    this.controls.removeEventListener("start", this.handleControlsStart);
    this.controls.removeEventListener("end", this.handleControlsEnd);
    this.controls.dispose();
    this.onControlsStart$.complete();
    this.onControlsEnd$.complete();
  }
}
