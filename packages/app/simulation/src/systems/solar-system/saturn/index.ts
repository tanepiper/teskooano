import { initializeSaturnPlanet } from "./saturn";
import { initializeTitan } from "./titan";
import { initializeEnceladus } from "./enceladus";
import { initializeRhea } from "./rhea";
import { initializeIapetus } from "./iapetus";
import { initializeDione } from "./dione";
import { initializeTethys } from "./tethys";

/**
 * Initializes the complete Saturn system: the planet and its major moons.
 */
export function initializeSaturn(parentId: string): void {
  const saturnId = initializeSaturnPlanet(parentId);
  
  initializeTitan(saturnId);
  initializeEnceladus(saturnId);
  initializeRhea(saturnId);
  initializeIapetus(saturnId);
  initializeDione(saturnId);
  initializeTethys(saturnId);
}