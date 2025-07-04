import { initializeEarthPlanet } from "./earth";
import { initializeLuna } from "./moon";

/**
 * Initializes the complete Earth system: the planet and its moon.
 */
export function initializeEarth(parentId: string): void {
  const earthId = initializeEarthPlanet(parentId);
  initializeLuna(earthId);
}
