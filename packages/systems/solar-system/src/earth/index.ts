import { initializeEarthPlanet } from "./earth";
import { initializeLuna } from "./moon";

/**
 * Initializes the complete Earth system: the planet and its moon.
 * @returns The Earth planet ID for satellite initialization.
 */
export function initializeEarth(parentId: string): string {
  const earthId = initializeEarthPlanet(parentId);
  initializeLuna(earthId);
  return earthId;
}
