import { initializeNeptunePlanet } from "./neptune";
import { initializeTriton } from "./triton";
import { initializeNereid } from "./nereid";

/**
 * Initializes the complete Neptune system: the planet and its major moons.
 */
export function initializeNeptune(parentId: string): void {
  const neptuneId = initializeNeptunePlanet(parentId);

  initializeTriton(neptuneId);
  initializeNereid(neptuneId);
}
