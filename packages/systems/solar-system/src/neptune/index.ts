import { initializeNeptunePlanet } from "./neptune";
import { initializeTriton } from "./triton";
import { initializeNereid } from "./nereid";
import { initializeGalatea } from "./galatea";
import { initializeDespina } from "./despina";
import { initializeThalassa } from "./thalassa";
import { initializeNaiad } from "./naiad";

/**
 * Initializes the complete Neptune system: the planet and its major moons.
 */
export function initializeNeptune(parentId: string): void {
  const neptuneId = initializeNeptunePlanet(parentId);

  initializeTriton(neptuneId);
  initializeNereid(neptuneId);
  initializeGalatea(neptuneId);
  initializeDespina(neptuneId);
  initializeThalassa(neptuneId);
  initializeNaiad(neptuneId);
}
