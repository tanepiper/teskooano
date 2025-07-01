import { initializeJupiterPlanet } from "./jupiter";
import { initializeIo } from "./io";
import { initializeEuropa } from "./europa";
import { initializeGanymede } from "./ganymede";
import { initializeCallisto } from "./callisto";

/**
 * Initializes the complete Jupiter system: the planet and its four Galilean moons.
 */
export function initializeJupiter(parentId: string): void {
  const jupiterId = initializeJupiterPlanet(parentId);
  
  initializeIo(jupiterId);
  initializeEuropa(jupiterId);
  initializeGanymede(jupiterId);
  initializeCallisto(jupiterId);
}