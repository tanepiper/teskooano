import { OSVector3 } from "@teskooano/core-math";

/** Threshold for mass difference to trigger inelastic collision (e.g., obj1 is < 10% mass of obj2) */
export const MASS_DIFF_THRESHOLD = 0.1;
/** Special identifier for mutual destruction events */
export const MUTUAL_DESTRUCTION_ID = "MUTUAL_DESTRUCTION";

/**
 * Represents detailed information about a detected collision between two physical bodies.
 * All units are in the SI system (meters, kg, seconds).
 */
export interface Collision {
  /** Unique identifier of the first body involved in the collision. */
  body1Id: string | number;
  /** Unique identifier of the second body involved in the collision. */
  body2Id: string | number;
  /** Estimated point of collision in world space (meters). */
  point: OSVector3;
  /**
   * Collision normal vector (unit vector).
   * Points from the center of body2 towards the center of body1 at the moment of collision.
   */
  normal: OSVector3;
  /** Estimated depth of penetration between the two bodies (meters). */
  penetrationDepth: number;
  /** Relative velocity between the two bodies at the point of contact (body1.velocity - body2.velocity, in m/s). */
  relativeVelocity: OSVector3;
  /** Time of collision (currently unused, intended for future continuous collision detection). */
  time?: number;
}

/**
 * Details about a collision event that resulted in the destruction
 * of one body by another.
 */
export interface DestructionEvent {
  /** ID of the object that survived and absorbed the other. */
  survivorId: string | number;
  /** ID of the object that was destroyed. */
  destroyedId: string | number;
  /** Approximate position where the destruction occurred (center of destroyed body). */
  impactPosition: OSVector3;
  /** Relative velocity between the two bodies at the point of contact (survivor.velocity - destroyed.velocity, in m/s). */
  relativeVelocity: OSVector3;
  /** Approximate radius of the destroyed object, useful for scaling effects. */
  destroyedRadius: number;
}
