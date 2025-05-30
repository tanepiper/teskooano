import { ModularSpaceRenderer } from "@teskooano/renderer-threejs";
import * as THREE from "three";

/**
 * The current state of the CameraManager.
 */
export interface CameraManagerState {
  /**
   * The current position of the camera in world coordinates.
   */
  currentPosition: THREE.Vector3;
  /**
   * The current target point the camera is looking at in world coordinates.
   */
  currentTarget: THREE.Vector3;
  /**
   * The camera's current vertical Field of View (FOV) in degrees.
   */
  fov: number;
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
  renderer: ModularSpaceRenderer;
  /**
   * Optional initial Field of View (FOV) for the camera.
   */
  initialFov?: number;
  /**
   * Optional ID of an object to focus on initially.
   * Note: If the camera always calculates its position based on the main star,
   * this might be overridden or primarily used if main star calculation fails.
   */
  initialFocusedObjectId?: string | null;
  /**
   * Optional initial target point for the camera.
   * Note: Similar to initialFocusedObjectId, this may be overridden by main star logic.
   */
  initialCameraTarget?: THREE.Vector3;
  /**
   * Optional callback function to be executed when the focused object ID changes
   * *after* a camera transition completes.
   */
  onFocusChangeCallback?: (focusedObjectId: string | null) => void;
}
