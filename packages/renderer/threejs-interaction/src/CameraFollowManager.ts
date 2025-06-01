import * as THREE from "three";
import { OrbitControlsHandler } from "./OrbitControlsHandler";
import { simulationStateService } from "@teskooano/core-state";

export class CameraFollowManager {
  private camera: THREE.PerspectiveCamera;
  private orbitControlsHandler: OrbitControlsHandler;

  private followingTargetObject: THREE.Object3D | null = null;
  private followOffset: THREE.Vector3 = new THREE.Vector3();
  private tempTargetPosition = new THREE.Vector3(); // Reusable vector
  private previousFollowTargetPos = new THREE.Vector3(); // For delta calculations if needed
  private isFollowVisuallyActive: boolean = true;

  // To be injected or passed if needed for programmatic transitions during follow
  private isProgrammaticTransitioningProvider: () => boolean = () => false;

  constructor(
    camera: THREE.PerspectiveCamera,
    orbitControlsHandler: OrbitControlsHandler,
    isProgrammaticTransitioningProvider: () => boolean,
  ) {
    this.camera = camera;
    this.orbitControlsHandler = orbitControlsHandler;
    this.isProgrammaticTransitioningProvider =
      isProgrammaticTransitioningProvider;
  }

  public startFollowing(
    object: THREE.Object3D | null,
    offset: THREE.Vector3 = new THREE.Vector3(0, 10, 20), // Default offset if not provided
  ): void {
    this.followingTargetObject = object;
    if (object) {
      this.followOffset.copy(offset);
      object.getWorldPosition(this.previousFollowTargetPos);
      // No need to copy to this.orbitControlsHandler.controls.target here,
      // that should be handled by a transition or initial setup.
      this.resumeFollowVisuals();
    } else {
      this.followOffset.set(0, 0, 0);
      this.previousFollowTargetPos.set(0, 0, 0);
      this.resumeFollowVisuals(); // Ensure visuals are active if explicitly stopped.
    }
  }

  public stopFollowing(): void {
    this.startFollowing(null); // Reuses the logic in startFollowing with null
  }

  public pauseFollowVisuals(): void {
    this.isFollowVisuallyActive = false;
  }

  public resumeFollowVisuals(): void {
    this.isFollowVisuallyActive = true;
  }

  public getFollowingTarget(): THREE.Object3D | null {
    return this.followingTargetObject;
  }

  public getFollowOffset(): THREE.Vector3 {
    return this.followOffset.clone();
  }

  public update(): void {
    if (
      this.followingTargetObject &&
      this.isFollowVisuallyActive &&
      !this.isProgrammaticTransitioningProvider() // Check transition state via provider
    ) {
      const simulationState = simulationStateService.getCurrentState();
      const isPaused = simulationState.paused;

      if (!isPaused) {
        this.followingTargetObject.getWorldPosition(this.tempTargetPosition);

        // Calculate the movement of the target since the last frame
        const targetMovementDelta = this.tempTargetPosition
          .clone()
          .sub(this.orbitControlsHandler.controls.target);

        // Update the controls target to the new object position
        this.orbitControlsHandler.controls.target.copy(this.tempTargetPosition);

        // Move the camera by the same delta to maintain relative position and offset
        this.camera.position.add(targetMovementDelta);

        // OrbitControls.update() will be called by the main ControlsManager or OrbitControlsHandler
        // so we don't call it here to avoid redundant updates.
      }
    }
  }
}
