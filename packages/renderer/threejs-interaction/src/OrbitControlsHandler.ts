import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { CustomEvents } from "@teskooano/data-types";
import { simulationStateService } from "@teskooano/core-state";
import { OSVector3 } from "@teskooano/core-math";

export class OrbitControlsHandler {
  public controls: OrbitControls;
  private camera: THREE.PerspectiveCamera;
  private rendererElement: HTMLElement;

  // Store original damping settings
  public originalDampingEnabled: boolean = true; // Default to true
  public originalDampingFactor: number = 0.05; // Default to OrbitControls default

  constructor(camera: THREE.PerspectiveCamera, rendererElement: HTMLElement) {
    this.camera = camera;
    this.rendererElement = rendererElement;
    this.controls = new OrbitControls(camera, rendererElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 0.001;
    this.controls.maxDistance = 1e7;
    this.controls.maxPolarAngle = Math.PI;

    this.originalDampingEnabled = this.controls.enableDamping;
    this.originalDampingFactor = this.controls.dampingFactor;

    const initialState = simulationStateService.getCurrentState();
    if (initialState && initialState.camera) {
      this.camera.position.set(
        initialState.camera.position.x,
        initialState.camera.position.y,
        initialState.camera.position.z,
      );
      this.controls.target.set(
        initialState.camera.target.x,
        initialState.camera.target.y,
        initialState.camera.target.z,
      );
    }

    this.controls.addEventListener("start", this.onControlsStart);
    this.controls.addEventListener("end", this.onControlsEnd);
    this.controls.addEventListener("change", this.onControlsChange);
  }

  private onControlsStart = () => {
    // Logic related to user starting interaction.
    // This might signal cancellation of semantic intent of programmatic transitions if not fully disabled.
  };

  private onControlsEnd = () => {
    const userManipulationEvent = new CustomEvent(
      CustomEvents.USER_CAMERA_MANIPULATION,
      {
        detail: {
          position: this.camera.position.clone(),
          target: this.controls.target.clone(),
        },
        bubbles: true,
        composed: true,
      },
    );
    this.rendererElement.dispatchEvent(userManipulationEvent);

    // Potentially update simulation state if needed after user manipulation
    // simulationStateService.updateCamera(
    //   new OSVector3(this.camera.position.x, this.camera.position.y, this.camera.position.z),
    //   new OSVector3(this.controls.target.x, this.controls.target.y, this.controls.target.z)
    // );
  };

  private onControlsChange = () => {
    // Continuous firing during drag.
    // Currently, major logic is in onControlsEnd.
  };

  public setEnabled(enabled: boolean): void {
    this.controls.enabled = enabled;
  }

  public update(): void {
    if (this.controls.enabled) {
      this.controls.update();
    }
  }

  public dispose(): void {
    this.controls.removeEventListener("start", this.onControlsStart);
    this.controls.removeEventListener("end", this.onControlsEnd);
    this.controls.removeEventListener("change", this.onControlsChange);
    this.controls.dispose();
  }

  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  public getRendererElement(): HTMLElement {
    return this.rendererElement;
  }
}
