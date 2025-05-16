import { Vector3 } from "three";

/**
 * Default camera position offset relative to the target, normalized.
 * Used when focusing on an object.
 */
export const CAMERA_OFFSET = new Vector3(0.8, 0.4, 1.0).normalize();
/**
 * Default camera position if no specific initial position is provided.
 */
export const DEFAULT_CAMERA_POSITION = new Vector3(200, 200, 200);
/**
 * Default camera target point if no specific initial target is provided.
 */
export const DEFAULT_CAMERA_TARGET = new Vector3(0, 0, 0);
/**
 * Default distance multiplier used when calculating camera position based on object size or a default offset.
 */
export const DEFAULT_CAMERA_DISTANCE = 1;
/**
 * Default Field of View (FOV) in degrees.
 */
export const DEFAULT_FOV = 75;
