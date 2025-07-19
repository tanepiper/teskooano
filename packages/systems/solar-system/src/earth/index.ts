import { earth } from "./earth";
import { luna } from "./moon";

/**
 * Earth system bodies that can be initialized in any order.
 * Each object should have a parentId that references an existing body.
 */
export const earthSystemBodies = [earth, luna];

/**
 * Legacy function for backward compatibility.
 * @deprecated Use the earthSystemBodies array instead.
 */
export function initializeEarth(parentId: string): string {
  // This function is now deprecated - use the modular approach instead
  // The earthSystemBodies array should be used with the main solar system initialization
  return earth.id;
}
