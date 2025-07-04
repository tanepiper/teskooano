import { initializeJupiterPlanet } from "./jupiter";
import { initializeIo } from "./io";
import { initializeEuropa } from "./europa";
import { initializeGanymede } from "./ganymede";
import { initializeCallisto } from "./callisto";
import { initializeMetis } from "./metis";
import { initializeAdrastea } from "./adrastea";
import { initializeAmalthea } from "./amalthea";
import { initializeThebe } from "./thebe";
import { initializeHimalia } from "./himalia";

/**
 * Initializes the complete Jupiter system: the planet and its moons.
 */
export function initializeJupiter(parentId: string): void {
  const jupiterId = initializeJupiterPlanet(parentId);

  // Inner moons
  initializeMetis(jupiterId);
  initializeAdrastea(jupiterId);
  initializeAmalthea(jupiterId);
  initializeThebe(jupiterId);
  initializeHimalia(jupiterId);

  // Galilean moons
  initializeIo(jupiterId);
  initializeEuropa(jupiterId);
  initializeGanymede(jupiterId);
  initializeCallisto(jupiterId);
}
