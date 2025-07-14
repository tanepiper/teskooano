import { PerspectiveCamera, Vector3 } from "three";
import { Object3D } from "three";
import { OrbitControlsHandler } from "../orbit/OrbitControlsHandler";

/**
 * Manages the state and logic for making the camera follow a target object.
 */
export class ObjectFollower {
  private camera: PerspectiveCamera;
  private orbitControlsHandler: OrbitControlsHandler;

  /** The Object3D instance the camera is currently following, or null. */
  private followingTargetObject: Object3D | null = null;
  /** The offset to maintain from the followed object's world position relative to the object itself. */
  private followOffset: Vector3 = new Vector3();
  /** Reusable vector to store the target object's world position. */
  private tempTargetPosition = new Vector3();
  /** Stores the world position of the followed object from the previous frame for delta calculations. */
  private previousFollowTargetPos = new Vector3();

  /** A flag to indicate if a follow transition is active, to be controlled externally. */
  public isFollowingTransitioning: boolean = false;

  constructor(
    camera: PerspectiveCamera,
    orbitControlsHandler: OrbitControlsHandler,
  ) {
    this.camera = camera;
    this.orbitControlsHandler = orbitControlsHandler;
  }

  /**
   * Sets a target THREE.Object3D for the camera to follow, and the relative offset.
   * The actual transition to the initial follow position should be handled separately.
   *
   * @param object The object to follow, or null to stop.
   * @param offset The desired camera offset FROM the object's center.
   */
  public startFollowing(
    object: Object3D | null,
    offset: Vector3 = new Vector3(),
  ): void {
    this.followingTargetObject = object;
    if (object) {
      this.followOffset.copy(offset);
      object.getWorldPosition(this.previousFollowTargetPos);
    } else {
      this.followOffset.set(0, 0, 0);
      this.previousFollowTargetPos.set(0, 0, 0);
    }
  }

  /**
   * Stops the camera from following an object.
   */
  public stopFollowing(): void {
    this.startFollowing(null);
  }

  /**
   * Returns true if the camera is currently following an object.
   */
  public isFollowing(): boolean {
    return this.followingTargetObject !== null;
  }

  /**
   * Returns the current following offset.
   */
  public getFollowOffset(): Vector3 {
    return this.followOffset;
  }

  /**
   * Returns the world position of the object being followed.
   * If not following, returns a zero vector.
   */
  public getFollowedObjectWorldPosition(): Vector3 {
    if (this.followingTargetObject) {
      return this.followingTargetObject.getWorldPosition(new Vector3());
    }
    return new Vector3();
  }

  /**
   * Updates the camera position to maintain the follow offset.
   * This should be called every frame in the render loop.
   */
  public update(): void {
    if (this.followingTargetObject && !this.isFollowingTransitioning) {
      this.followingTargetObject.getWorldPosition(this.tempTargetPosition);
      const targetDelta = this.tempTargetPosition
        .clone()
        .sub(this.previousFollowTargetPos);

      // This logic keeps the camera's offset constant relative to the moving target.
      this.camera.position.add(targetDelta);
      this.orbitControlsHandler.controls.target.add(targetDelta);

      this.previousFollowTargetPos.copy(this.tempTargetPosition);
    }
  }

  /**
   * Recalculates the follow offset based on the current camera and target positions.
   * This is called after the user manually manipulates the camera while following an object.
   */
  public updateFollowOffset(): void {
    if (this.followingTargetObject) {
      const targetPosition = this.followingTargetObject.getWorldPosition(
        new Vector3(),
      );
      this.followOffset.copy(this.camera.position).sub(targetPosition);
    }
  }

  public syncPositionsAfterTransition() {
    if (this.followingTargetObject) {
      this.followingTargetObject.getWorldPosition(this.tempTargetPosition);

      const desiredCameraPosition = this.tempTargetPosition
        .clone()
        .add(this.followOffset);
      this.camera.position.copy(desiredCameraPosition);
      this.orbitControlsHandler.controls.target.copy(this.tempTargetPosition);
      this.orbitControlsHandler.controls.update();
      this.previousFollowTargetPos.copy(this.tempTargetPosition);
    }
  }
}
