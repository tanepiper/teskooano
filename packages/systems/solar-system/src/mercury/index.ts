import { initializeMercury as initializeMercuryPlanet } from "./mercury";

/**
 * Initializes the complete Mercury system.
 * Mercury has no moons, so only the planet itself is initialized.
 */
export function initializeMercury(parentId: string): void {
  initializeMercuryPlanet(parentId);
}
