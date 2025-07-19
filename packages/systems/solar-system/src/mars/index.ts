import { mars } from "./mars";
import { phobos } from "./phobos";
import { deimos } from "./deimos";

/**
 * Mars system bodies that can be initialized in any order.
 * Each object should have a parentId that references an existing body.
 */
export const marsSystemBodies = [mars, phobos, deimos];

/**
 * Legacy function for backward compatibility.
 * @deprecated Use the marsSystemBodies array instead.
 */
export function initializeMars(parentId: string): void {
  // This function is now deprecated - use the modular approach instead
  // The marsSystemBodies array should be used with the main solar system initialization
}
