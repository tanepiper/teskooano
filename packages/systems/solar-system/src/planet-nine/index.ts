import { planetNine } from "./planet-nine";

/**
 * Planet Nine system bodies that can be initialized in any order.
 * 
 * Currently only includes the planet itself, as no moons or other
 * companions have been theorized in the Batygin & Brown (2016) model.
 * 
 * Future discoveries may add additional objects to this system.
 */
export const planetNineSystemBodies = [
  planetNine,
];

/**
 * Legacy function for backward compatibility.
 * @deprecated Use the planetNineSystemBodies array instead.
 */
export function initializePlanetNine(parentId: string): void {
  // This function is now deprecated - use the modular approach instead
  // The planetNineSystemBodies array should be used with the main solar system initialization
}