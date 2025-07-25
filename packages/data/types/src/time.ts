import { OSVector3 } from "@teskooano/core-math";

/**
 * A single point in time for a celestial object
 */
export interface TimePoint {
  /**
   * The timestamp of the point in time
   */
  timestamp: number;
  /**
   * The position of the celestial object at the point in time
   */
  position: OSVector3;
  /**
   * The velocity of the celestial object at the point in time
   */
  velocityMagnitude: number;
}

/**
 * A history of time points for a celestial object
 */
export interface TimePointHistory {
  /**
   * The points in time for the celestial object
   */
  points: TimePoint[];
}
