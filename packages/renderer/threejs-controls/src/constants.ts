import { OSVector3 } from "@teskooano/core-math";

/**
 * Default camera position offset relative to the target, normalized.
 * Used when focusing on an object.
 */
export const CAMERA_OFFSET = new OSVector3()
  .setFromArray([0.8, 0.4, 1.0])
  .normalize();
/**
 * Default camera position if no specific initial position is provided.
 */
export const DEFAULT_CAMERA_POSITION = new OSVector3().setFromArray([
  200, 200, 200,
]);
/**
 * Default camera target point if no specific initial target is provided.
 */
export const DEFAULT_CAMERA_TARGET = new OSVector3().setZero();
/**
 * Default distance multiplier used when calculating camera position based on object size or a default offset.
 */
export const DEFAULT_CAMERA_DISTANCE = 1;
/**
 * Default Field of View (FOV) in degrees.
 */
export const DEFAULT_FOV = 75;
