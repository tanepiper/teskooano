import { initializeSaturnPlanet } from "./saturn";
import { initializeTitan } from "./titan";
import { initializeEnceladus } from "./enceladus";
import { initializeRhea } from "./rhea";
import { initializeIapetus } from "./iapetus";
import { initializeDione } from "./dione";
import { initializeTethys } from "./tethys";
import { initializeMimas } from "./mimas";
import { initializeHyperion } from "./hyperion";
import { initializePhoebe } from "./phoebe";

/**
 * Initializes the complete Saturn system: the planet and its major moons.
 */
export function initializeSaturn(parentId: string): void {
  const saturnId = initializeSaturnPlanet(parentId);

  // Major inner moons
  initializeMimas(saturnId);
  initializeEnceladus(saturnId);
  initializeTethys(saturnId);
  initializeDione(saturnId);
  initializeRhea(saturnId);

  // Major outer moons
  initializeTitan(saturnId);
  initializeHyperion(saturnId);
  initializeIapetus(saturnId);

  // Irregular captured moon
  initializePhoebe(saturnId);
}
