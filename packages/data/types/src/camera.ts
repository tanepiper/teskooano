import { OSVector3 } from "@teskooano/core-math";
import type * as THREE from "three";

/**
 * Generic interface for a renderer that provides camera control capabilities.
 * This interface allows camera managers to work with any renderer implementation
 * without creating circular dependencies.
 */
export interface ICameraRenderer {
  /**
   * Gets the camera instance from the renderer.
   */
  camera: THREE.PerspectiveCamera;

  /**
   * Gets the controls manager from the renderer.
   */
  interactionOrchestrator: {
    getControlsManager(): {
      dispose(): void;
      controls?: {
        target: THREE.Vector3;
        update(): void;
      };
      updateMinDistance(minDistance: number): void;
      stopFollowing(): void;
      moveToPosition(
        position: any,
        target: any,
        withTransition: boolean,
        options?: any,
      ): void;
      calculateTransitionDuration(startPos: any, endPos: any): number;
      startFollowing(
        object: THREE.Object3D | null,
        offset: THREE.Vector3,
      ): void;
      transitionToWithLookAtFirst(
        position: any,
        target: any,
        options?: any,
      ): void;
      transitionTargetTo(
        target: any,
        withTransition: boolean,
        options?: any,
      ): void;
    } | null;
  };

  /**
   * Gets the rendering orchestrator from the renderer.
   */
  renderingOrchestrator: {
    sceneManager: {
      camera: THREE.PerspectiveCamera;
      setFov(fov: number): void;
    };
    orbitManager: {
      highlightPrediction(objectId: string | null): void;
    };
    objectManager: {
      getObject(objectId: string): THREE.Object3D | null;
    };
  };
}

/**
 * The current state of the CameraManager.
 * This interface matches the CameraState from @teskooano/core-state for consistency.
 */
export interface CameraManagerState {
  /**
   * The current position of the camera in world coordinates.
   */
  position: OSVector3;
  /**
   * The current target point the camera is looking at in world coordinates.
   */
  target: OSVector3;
  /**
   * The camera's current vertical Field of View (FOV) in degrees.
   */
  fov: number;
  /**
   * The unique ID of the object currently being selected, or null if no object is selected.
   */
  selectedObject: string | null;
  /**
   * The unique ID of the object currently being focused on, or null if no object is focused.
   */
  focusedObjectId: string | null;
}

/**
 * Configuration options for initializing the CameraManager.
 */
export interface CameraManagerOptions {
  /**
   * The instance of the renderer that the camera manager will interact with.
   */
  renderer: ICameraRenderer;
  /**
   * The unique identifier for the panel this camera belongs to.
   * Required for per-panel camera state management.
   */
  panelId: string;
  /**
   * Optional initial Field of View (FOV) for the camera.
   */
  initialFov?: number;
  /**
   * Optional ID of an object to focus on initially.
   */
  initialFocusedObjectId?: string | null;
  /**
   * Optional initial position for the camera.
   */
  initialCameraPosition?: OSVector3;
  /**
   * Optional initial target point for the camera.
   */
  initialCameraTarget?: OSVector3;
  /**
   * Optional callback function to be executed when the focused object ID changes
   * *after* a camera transition completes.
   */
  onFocusChangeCallback?: (focusedObjectId: string | null) => void;
}
