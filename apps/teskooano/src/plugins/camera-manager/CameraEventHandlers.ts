import * as THREE from "three";
import type { BehaviorSubject, Subscription } from "rxjs";
import type { ModularSpaceRenderer } from "@teskooano/renderer-threejs";
import type { CameraManagerState, CameraManagerOptions } from "./types";
import type { SimulationState } from "@teskooano/core-state";
import {
  DEFAULT_CAMERA_POSITION,
  DEFAULT_CAMERA_TARGET,
  CAMERA_OFFSET,
} from "./constants";

// Forward declaration for CameraManagerInternalStateAccess from CameraActions
// This is a simplified version for what EventHandlers might need directly or indirectly
interface CameraManagerInternalStateAccess {
  getIntendedFocusIdForTransition: () => string | null;
  setIntendedFocusIdForTransition: (id: string | null) => void;
  getLastKnownFollowOffset: () => THREE.Vector3 | null;
  setLastKnownFollowOffset: (offset: THREE.Vector3 | null) => void;
  getOnFocusChangeCallback: () =>
    | ((focusedObjectId: string | null) => void)
    | undefined;
  // Potentially add direct access to cameraStateSubject if needed by handlers,
  // though it's passed to constructor directly for now.
  // getCameraStateSubject: () => BehaviorSubject<CameraManagerState>;
}

export class CameraEventHandlers {
  private renderer: ModularSpaceRenderer;
  private cameraStateSubject: BehaviorSubject<CameraManagerState>;
  private internalStateAccess: CameraManagerInternalStateAccess;
  private onFocusChangeCallback?: (focusedObjectId: string | null) => void;

  constructor(
    renderer: ModularSpaceRenderer,
    cameraStateSubject: BehaviorSubject<CameraManagerState>,
    internalStateAccess: CameraManagerInternalStateAccess,
    onFocusChangeCallback?: (focusedObjectId: string | null) => void,
  ) {
    this.renderer = renderer;
    this.cameraStateSubject = cameraStateSubject;
    this.internalStateAccess = internalStateAccess;
    this.onFocusChangeCallback = onFocusChangeCallback; // Store this directly
  }

  public handleCameraTransitionComplete = (event: Event): void => {
    const detail = (event as CustomEvent).detail;
    const currentState = this.cameraStateSubject.getValue(); // State *before* this specific transition's finalization

    const eventEndPosition = detail.position?.clone() as
      | THREE.Vector3
      | undefined;
    const eventEndTarget = detail.target?.clone() as THREE.Vector3 | undefined;
    const eventMetadata = detail.metadata as
      | {
          focusedObjectId?: string | null;
          followedObjectId?: string | null;
          transitionType?: string | null;
        }
      | undefined;

    const newPosition =
      eventEndPosition ?? currentState.currentPosition.clone();
    const newTarget = eventEndTarget ?? currentState.currentTarget.clone();

    let finalNewFocusedId: string | null = null;
    let finalNewFollowedId: string | null = null;

    const intendedTransitionFocus =
      this.internalStateAccess.getIntendedFocusIdForTransition();

    if (eventMetadata?.transitionType === "follow") {
      finalNewFocusedId = eventMetadata.focusedObjectId ?? null;
      finalNewFollowedId = eventMetadata.focusedObjectId ?? null;
    } else if (eventMetadata?.transitionType === "lookAt") {
      finalNewFocusedId = eventMetadata.focusedObjectId ?? null;
      finalNewFollowedId = currentState.followedObjectId;
      console.log(
        `[CameraEventHandlers] 'lookAt' transition complete. Focused: ${finalNewFocusedId}, Preserved Follow: ${finalNewFollowedId}`,
      );
    } else if (eventMetadata?.transitionType === "follow-clear") {
      finalNewFocusedId = null;
      finalNewFollowedId = null;
    } else if (
      intendedTransitionFocus &&
      eventMetadata?.focusedObjectId === intendedTransitionFocus &&
      !eventMetadata.transitionType
    ) {
      finalNewFocusedId = intendedTransitionFocus;
      finalNewFollowedId = null;
    } else {
      finalNewFocusedId = intendedTransitionFocus ?? null;
      finalNewFollowedId = null;
      if (
        newTarget.equals(DEFAULT_CAMERA_TARGET) &&
        newPosition.equals(DEFAULT_CAMERA_POSITION)
      ) {
        finalNewFocusedId = null;
        finalNewFollowedId = null;
      }
    }

    let stateUpdateTarget = newTarget;
    if (eventMetadata?.transitionType === "lookAt") {
      stateUpdateTarget = currentState.currentTarget.clone();
    }

    if (
      currentState.focusedObjectId !== finalNewFocusedId ||
      currentState.followedObjectId !== finalNewFollowedId ||
      !currentState.currentPosition.equals(newPosition) ||
      !currentState.currentTarget.equals(stateUpdateTarget) ||
      currentState.fov !== this.cameraStateSubject.getValue().fov
    ) {
      this.cameraStateSubject.next({
        fov: this.cameraStateSubject.getValue().fov,
        focusedObjectId: finalNewFocusedId,
        followedObjectId: finalNewFollowedId,
        currentPosition: newPosition,
        currentTarget: stateUpdateTarget,
      });

      if (
        this.onFocusChangeCallback &&
        currentState.focusedObjectId !== finalNewFocusedId
      ) {
        this.onFocusChangeCallback(finalNewFocusedId);
      }
    }

    if (eventMetadata?.transitionType === "lookAt") {
    } else if (finalNewFollowedId === null) {
      this.renderer.controlsManager?.stopFollowing();
      this.internalStateAccess.setLastKnownFollowOffset(null);
    } else if (
      finalNewFollowedId &&
      this.renderer.controlsManager &&
      eventMetadata?.transitionType === "follow"
    ) {
      const objectToFollow = this.renderer.getObjectById(finalNewFollowedId);
      if (objectToFollow?.position) {
        const newOffset = newPosition.clone().sub(objectToFollow.position);
        this.internalStateAccess.setLastKnownFollowOffset(newOffset);
        this.renderer.controlsManager.startFollowing(
          objectToFollow,
          newOffset ?? undefined,
        );
      } else {
        console.warn(
          `[CameraEventHandlers] Object ${finalNewFollowedId} to follow not found or has no position. Stopping follow.`,
        );
        this.renderer.controlsManager.stopFollowing();
        this.internalStateAccess.setLastKnownFollowOffset(null);
        const currentFollowState = this.cameraStateSubject.getValue();
        if (currentFollowState.followedObjectId === finalNewFollowedId) {
          this.cameraStateSubject.next({
            ...currentFollowState,
            focusedObjectId:
              currentFollowState.focusedObjectId === finalNewFollowedId
                ? null
                : currentFollowState.focusedObjectId,
            followedObjectId: null,
          });
          if (
            this.onFocusChangeCallback &&
            currentFollowState.focusedObjectId === finalNewFollowedId
          )
            this.onFocusChangeCallback(null);
        }
      }
    }
    this.internalStateAccess.setIntendedFocusIdForTransition(null);
  };

  public handleUserCameraManipulation = (event: Event): void => {
    if (!this.renderer.controlsManager) return;

    const detail = (event as CustomEvent).detail;
    const newCameraPosition = detail.position.clone() as THREE.Vector3;
    const newOrbitControlsTarget = detail.target.clone() as THREE.Vector3;

    const currentState = this.cameraStateSubject.getValue();
    let newFocusedId = currentState.focusedObjectId;
    let newFollowedId = currentState.followedObjectId;
    let newCameraTargetForState = newOrbitControlsTarget.clone();

    if (currentState.followedObjectId) {
      const followedObject = this.renderer.getObjectById(
        currentState.followedObjectId,
      );
      if (followedObject?.position) {
        const offset = newCameraPosition.clone().sub(followedObject.position);
        this.internalStateAccess.setLastKnownFollowOffset(offset);
        this.renderer.controlsManager.startFollowing(
          followedObject,
          offset ?? undefined,
        );
        newFollowedId = currentState.followedObjectId;
        newFocusedId = currentState.followedObjectId;
        newCameraTargetForState = followedObject.position.clone();
      } else {
        this.renderer.controlsManager.stopFollowing();
        this.internalStateAccess.setLastKnownFollowOffset(null);
        newFollowedId = null;
        newFocusedId = null;
      }
    } else {
      this.renderer.controlsManager.stopFollowing();
      this.internalStateAccess.setLastKnownFollowOffset(null);
      newFollowedId = null;
      newFocusedId = null;
    }

    this.internalStateAccess.setIntendedFocusIdForTransition(null);

    if (
      !currentState.currentPosition.equals(newCameraPosition) ||
      !currentState.currentTarget.equals(newCameraTargetForState) ||
      currentState.focusedObjectId !== newFocusedId ||
      currentState.followedObjectId !== newFollowedId
    ) {
      this.cameraStateSubject.next({
        ...currentState,
        currentPosition: newCameraPosition,
        currentTarget: newCameraTargetForState,
        focusedObjectId: newFocusedId,
        followedObjectId: newFollowedId,
      });
      if (
        this.onFocusChangeCallback &&
        currentState.focusedObjectId !== newFocusedId
      ) {
        this.onFocusChangeCallback(newFocusedId);
      }
    }
  };

  public handleSimulationStateChange = (newState: SimulationState): void => {
    if (
      !this.renderer ||
      !this.renderer.controlsManager ||
      !this.renderer.camera
    )
      return;

    const cameraState = this.cameraStateSubject.getValue();
    const currentlyFollowedId = cameraState.followedObjectId;
    const lastKnownFollowOffset =
      this.internalStateAccess.getLastKnownFollowOffset();

    if (newState.paused) {
      if (currentlyFollowedId && this.renderer.camera?.position) {
        const objectToFollow = this.renderer.getObjectById(currentlyFollowedId);
        if (objectToFollow?.position) {
          const offset = this.renderer.camera.position
            .clone()
            .sub(objectToFollow.position);
          this.internalStateAccess.setLastKnownFollowOffset(offset);
        }
      }
    } else {
      // Unpausing
      if (currentlyFollowedId && lastKnownFollowOffset) {
        const objectToFollow = this.renderer.getObjectById(currentlyFollowedId);
        if (objectToFollow) {
          this.renderer.controlsManager.startFollowing(
            objectToFollow,
            lastKnownFollowOffset,
          );
        } else {
          this.renderer.controlsManager.stopFollowing();
          this.internalStateAccess.setLastKnownFollowOffset(null);
          if (
            this.cameraStateSubject.getValue().followedObjectId ===
            currentlyFollowedId
          ) {
            const updatedState = this.cameraStateSubject.getValue();
            this.cameraStateSubject.next({
              ...updatedState,
              focusedObjectId:
                updatedState.focusedObjectId === currentlyFollowedId
                  ? null
                  : updatedState.focusedObjectId,
              followedObjectId: null,
            });
            if (
              this.onFocusChangeCallback &&
              updatedState.focusedObjectId === currentlyFollowedId
            )
              this.onFocusChangeCallback(null);
          }
        }
      } else if (currentlyFollowedId && !lastKnownFollowOffset) {
        const objectToFollow = this.renderer.getObjectById(currentlyFollowedId);
        if (
          objectToFollow?.position &&
          typeof objectToFollow.userData.radius === "number" &&
          this.renderer.camera
        ) {
          const objectRadius = objectToFollow.userData.radius as number;
          const FOLLOW_RADIUS_OFFSET_FACTOR = 3.0;
          const offsetMagnitude = objectRadius * FOLLOW_RADIUS_OFFSET_FACTOR;
          const cameraOffsetVector = CAMERA_OFFSET.clone()
            .normalize()
            .multiplyScalar(offsetMagnitude);
          const desiredCameraPosition = objectToFollow.position
            .clone()
            .add(cameraOffsetVector);
          const newOffset = desiredCameraPosition
            .clone()
            .sub(objectToFollow.position);
          this.internalStateAccess.setLastKnownFollowOffset(newOffset);
          this.renderer.controlsManager.startFollowing(
            objectToFollow,
            newOffset,
          );

          const currentVal = this.cameraStateSubject.getValue();
          if (
            !currentVal.currentPosition.equals(this.renderer.camera.position)
          ) {
            this.cameraStateSubject.next({
              ...currentVal,
              currentPosition: this.renderer.camera.position.clone(),
              currentTarget: objectToFollow.position.clone(),
            });
          }
        } else {
          this.renderer.controlsManager.stopFollowing();
          this.internalStateAccess.setLastKnownFollowOffset(null);
          if (
            this.cameraStateSubject.getValue().followedObjectId ===
            currentlyFollowedId
          ) {
            const updatedState = this.cameraStateSubject.getValue();
            this.cameraStateSubject.next({
              ...updatedState,
              focusedObjectId:
                updatedState.focusedObjectId === currentlyFollowedId
                  ? null
                  : updatedState.focusedObjectId,
              followedObjectId: null,
            });
            if (
              this.onFocusChangeCallback &&
              updatedState.focusedObjectId === currentlyFollowedId
            )
              this.onFocusChangeCallback(null);
          }
        }
      }
    }
  };
}
