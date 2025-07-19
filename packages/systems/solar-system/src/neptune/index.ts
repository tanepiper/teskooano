import { neptune } from "./neptune";
import { triton } from "./triton";
import { nereid } from "./nereid";
import { galatea } from "./galatea";
import { despina } from "./despina";
import { thalassa } from "./thalassa";
import { naiad } from "./naiad";

/**
 * Neptune system bodies that can be initialized in any order.
 * Each object should have a parentId that references an existing body.
 */
export const neptuneSystemBodies = [
  neptune,
  triton,
  nereid,
  galatea,
  despina,
  thalassa,
  naiad,
];

/**
 * Legacy function for backward compatibility.
 * @deprecated Use the neptuneSystemBodies array instead.
 */
export function initializeNeptune(parentId: string): void {
  // This function is now deprecated - use the modular approach instead
  // The neptuneSystemBodies array should be used with the main solar system initialization
}
