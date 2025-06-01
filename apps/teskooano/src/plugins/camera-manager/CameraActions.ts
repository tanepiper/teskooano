import * as THREE from "three";
import type { BehaviorSubject } from "rxjs";
import type { ModularSpaceRenderer } from "@teskooano/renderer-threejs";
import type { CameraManagerState } from "./types";
import { renderableStore } from "@teskooano/core-state";
import {
  CAMERA_OFFSET,
  DEFAULT_CAMERA_POSITION,
  DEFAULT_CAMERA_TARGET,
} from "./constants";

// Forward declaration to avoid circular dependency issues at type level
interface CameraManagerInternalStateAccess {
  getIntendedFocusIdForTransition: () => string | null;
  setIntendedFocusIdForTransition: (id: string | null) => void;
  getLastKnownFollowOffset: () => THREE.Vector3 | null;
  setLastKnownFollowOffset: (offset: THREE.Vector3 | null) => void;
  getOnFocusChangeCallback: () =>
    | ((focusedObjectId: string | null) => void)
    | undefined;
}

export class CameraActions {
  private renderer: ModularSpaceRenderer;
  private cameraStateSubject: BehaviorSubject<CameraManagerState>;
  private internalStateAccess: CameraManagerInternalStateAccess;

  constructor(
    renderer: ModularSpaceRenderer,
    cameraStateSubject: BehaviorSubject<CameraManagerState>,
    internalStateAccess: CameraManagerInternalStateAccess,
  ) {
    this.renderer = renderer;
    this.cameraStateSubject = cameraStateSubject;
    this.internalStateAccess = internalStateAccess;
  }

  // Methods like moveToCelestial, lookAtCelestial, followCelestial, etc., will be moved here.
  // They will use this.renderer, this.cameraStateSubject, and this.internalStateAccess.

  /**
   * Instantly moves the camera to a calculated viewing position around the specified celestial object.
   * The camera will orbit this object, but it is not a persistent follow.
   *
   * @param {string} objectId - The unique ID of the object to move to.
   * @param {number} [distanceFactor] - Optional radius factor for calculating camera distance.
   */
  public moveToCelestial(objectId: string, distanceFactor?: number): void {
    if (
      !this.renderer.camera ||
      !this.renderer.controlsManager?.getOrbitControls()
    ) {
      console.warn(
        "[CameraActions] Cannot moveToCelestial: Renderer, camera, or controls not initialized.",
      );
      return;
    }
    // Ensure follow visuals are active if we are moving to a new target to orbit.
    this.renderer.controlsManager.resumeFollowVisuals();

    const renderables = renderableStore.getRenderableObjects();
    const renderableObject = renderables[objectId];

    if (
      !renderableObject?.position ||
      typeof renderableObject.radius !== "number"
    ) {
      console.error(
        `[CameraActions] moveToCelestial: Cannot move to ${objectId}. Object data not found, or missing position/radius.`,
      );
      return;
    }

    const objectPosition = renderableObject.position.clone();
    const objectRadius = renderableObject.radius;
    const FOLLOW_RADIUS_OFFSET_FACTOR = 3.0;
    const MIN_RADIUS_OFFSET_FACTOR = 1.5;

    let effectiveFactor = distanceFactor ?? FOLLOW_RADIUS_OFFSET_FACTOR;
    if (effectiveFactor < MIN_RADIUS_OFFSET_FACTOR) {
      effectiveFactor = MIN_RADIUS_OFFSET_FACTOR;
    }
    const offsetMagnitude = objectRadius * effectiveFactor;
    const cameraOffsetVector = CAMERA_OFFSET.clone()
      .normalize()
      .multiplyScalar(offsetMagnitude);
    const calculatedCameraPosition = objectPosition
      .clone()
      .add(cameraOffsetVector);

    this.renderer.controlsManager.stopFollowing();
    this.internalStateAccess.setLastKnownFollowOffset(null);

    this.renderer.camera.position.copy(calculatedCameraPosition);
    this.renderer.controlsManager
      .getOrbitControls()
      .target.copy(objectPosition);
    this.renderer.controlsManager.getOrbitControls().update();

    const currentState = this.cameraStateSubject.getValue();
    if (
      currentState.focusedObjectId !== objectId ||
      currentState.followedObjectId !== null ||
      !currentState.currentPosition.equals(calculatedCameraPosition) ||
      !currentState.currentTarget.equals(objectPosition)
    ) {
      this.cameraStateSubject.next({
        ...currentState,
        focusedObjectId: objectId,
        followedObjectId: null,
        currentPosition: calculatedCameraPosition.clone(),
        currentTarget: objectPosition.clone(),
      });
      const onFocusChangeCallback =
        this.internalStateAccess.getOnFocusChangeCallback();
      if (onFocusChangeCallback && currentState.focusedObjectId !== objectId) {
        onFocusChangeCallback(objectId);
      }
    }
    this.internalStateAccess.setIntendedFocusIdForTransition(null);
  }

  /**
   * Orients the camera to look at a specific celestial object from its current position.
   *
   * @param {string} objectId - The unique ID of the object to look at.
   */
  public lookAtCelestial(objectId: string): void {
    if (
      !this.renderer.camera ||
      !this.renderer.controlsManager?.getOrbitControls()
    ) {
      console.warn(
        "[CameraActions] Cannot lookAtCelestial: Renderer, camera, or controls not initialized.",
      );
      return;
    }

    const lookAtCurrentState = this.cameraStateSubject.getValue();
    if (lookAtCurrentState.followedObjectId && this.renderer.controlsManager) {
      // If currently following an object, pause the visual follow effect
      this.renderer.controlsManager.pauseFollowVisuals();
    }

    const renderables = renderableStore.getRenderableObjects();
    const renderableObject = renderables[objectId];

    if (!renderableObject?.position) {
      console.error(
        `[CameraActions] lookAtCelestial: Cannot look at ${objectId}. Object data not found or missing position.`,
      );
      return;
    }

    const targetLookAtPosition = renderableObject.position.clone();

    this.internalStateAccess.setIntendedFocusIdForTransition(objectId);

    this.renderer.controlsManager.transitionOrientationTo(
      targetLookAtPosition,
      { focusedObjectId: objectId, transitionType: "lookAt" },
    );

    if (lookAtCurrentState.focusedObjectId !== objectId) {
      this.cameraStateSubject.next({
        ...lookAtCurrentState,
        focusedObjectId: objectId,
      });
    }
  }

  /**
   * Moves and points the camera to follow a specific celestial object, or clears follow.
   *
   * @param {string | null} objectId - The unique ID of the object to follow. Pass \`null\` to clear follow.
   * @param {number} [distanceFactor] - Optional radius factor for camera offset.
   */
  public followCelestial(
    objectId: string | null,
    distanceFactor?: number,
  ): void {
    if (!this.renderer.controlsManager) {
      console.warn(
        "[CameraActions] Cannot followCelestial: Manager or renderer components not initialized.",
      );
      return;
    }

    // Whether starting a new follow or clearing, ensure visuals are active/reset.
    this.renderer.controlsManager.resumeFollowVisuals();

    const followCurrentState = this.cameraStateSubject.getValue();
    this.internalStateAccess.setIntendedFocusIdForTransition(objectId);

    if (objectId === null) {
      this.renderer.controlsManager.transitionTo(
        this.renderer.camera.position.clone(),
        this.renderer.controlsManager.getOrbitControls().target.clone(),
        DEFAULT_CAMERA_POSITION.clone(),
        DEFAULT_CAMERA_TARGET.clone(),
        {
          focusedObjectId: null,
          followedObjectId: null,
          transitionType: "follow-clear",
        },
      );
      if (
        followCurrentState.focusedObjectId !== null ||
        followCurrentState.followedObjectId !== null
      ) {
        this.cameraStateSubject.next({
          ...followCurrentState,
          focusedObjectId: null,
          followedObjectId: null,
        });
        const onFocusChangeCallback =
          this.internalStateAccess.getOnFocusChangeCallback();
        if (onFocusChangeCallback) {
          onFocusChangeCallback(null);
        }
      }
    } else {
      const renderables = renderableStore.getRenderableObjects();
      const renderableObject = renderables[objectId];

      if (
        !renderableObject?.position ||
        typeof renderableObject.radius !== "number"
      ) {
        console.error(
          `[CameraActions] followCelestial: Cannot follow ${objectId}. Object data not found, or missing position/radius.`,
        );
        this.cameraStateSubject.next({
          ...followCurrentState,
          focusedObjectId: null,
          followedObjectId: null,
        });
        const onFocusChangeCallback =
          this.internalStateAccess.getOnFocusChangeCallback();
        if (
          onFocusChangeCallback &&
          (followCurrentState.focusedObjectId !== null ||
            followCurrentState.followedObjectId !== null)
        ) {
          onFocusChangeCallback(null);
        }
        this.internalStateAccess.setIntendedFocusIdForTransition(null);
        return;
      }

      const targetPosition = renderableObject.position.clone();
      const objectRadius = renderableObject.radius;
      const FOLLOW_RADIUS_OFFSET_FACTOR = 3.0;
      const MIN_RADIUS_OFFSET_FACTOR = 1.5;

      let effectiveFactor = distanceFactor ?? FOLLOW_RADIUS_OFFSET_FACTOR;
      if (effectiveFactor < MIN_RADIUS_OFFSET_FACTOR) {
        effectiveFactor = MIN_RADIUS_OFFSET_FACTOR;
      }
      const offsetMagnitude = objectRadius * effectiveFactor;
      const cameraOffsetVector = CAMERA_OFFSET.clone()
        .normalize()
        .multiplyScalar(offsetMagnitude);
      const cameraPosition = targetPosition.clone().add(cameraOffsetVector);

      if (
        followCurrentState.focusedObjectId !== objectId ||
        followCurrentState.followedObjectId !== objectId
      ) {
        this.cameraStateSubject.next({
          ...followCurrentState,
          focusedObjectId: objectId,
          followedObjectId: objectId,
        });
      }

      this.renderer.controlsManager.transitionTo(
        this.renderer.camera.position.clone(),
        this.renderer.controlsManager.getOrbitControls().target.clone(),
        cameraPosition,
        targetPosition,
        {
          focusedObjectId: objectId,
          followedObjectId: objectId,
          transitionType: "follow",
        },
      );
    }
  }

  /**
   * Smoothly points the camera towards a specific target position without changing the camera's location.
   *
   * @param {THREE.Vector3} targetPosition - The world coordinates to point the camera towards.
   */
  public pointCameraAt(targetPosition: THREE.Vector3): void {
    if (
      !this.renderer.camera ||
      !this.renderer.controlsManager?.getOrbitControls()
    ) {
      console.warn(
        "[CameraActions] Cannot pointCameraAt: Renderer, camera, or controls not initialized.",
      );
      return;
    }
    this.renderer.controlsManager.transitionTargetTo(
      targetPosition.clone(),
      true,
    );
    // Metadata might be needed here if pointCameraAt should affect focusedObjectId via transition events
  }

  /**
   * Resets the camera to its default position and target, clearing any focus.
   */
  public resetCameraView(): void {
    if (
      !this.renderer.camera ||
      !this.renderer.controlsManager?.getOrbitControls()
    ) {
      console.warn(
        "[CameraActions] Cannot resetCameraView: Renderer, camera, or controls not initialized.",
      );
      return;
    }
    // Resetting view implies clearing any specific lookAt and resuming default behavior
    this.renderer.controlsManager.resumeFollowVisuals();
    this.followCelestial(null);
  }

  /**
   * Clears the current focus, returning the camera to the default view.
   */
  public clearFocus(): void {
    if (!this.renderer.controlsManager) {
      console.warn(
        "[CameraActions] Cannot clear focus: Manager or renderer components not initialized.",
      );
      return;
    }
    // Clearing focus implies clearing any specific lookAt and resuming default behavior
    this.renderer.controlsManager.resumeFollowVisuals();
    this.followCelestial(null);
  }

  /**
   * Sets the camera's vertical Field of View (FOV).
   *
   * @param {number} fov - The desired field of view in degrees.
   */
  public setFov(fov: number): void {
    if (!this.renderer.sceneManager) {
      console.warn(
        "[CameraActions] Cannot set FOV: Manager or renderer components not initialized.",
      );
      return;
    }

    const currentState = this.cameraStateSubject.getValue();
    if (fov === currentState.fov) {
      return;
    }

    this.cameraStateSubject.next({ ...currentState, fov: fov });
    this.renderer.sceneManager.setFov(fov);
  }
}
