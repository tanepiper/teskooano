import { OSVector3 } from "packages/core/math/src";

/**
 * Camera state interface
 */
export interface CameraState {
  position: OSVector3;
  target: OSVector3;
  fov: number;
  selectedObject: string | null;
  focusedObjectId: string | null;
}
