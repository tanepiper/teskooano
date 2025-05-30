import { initializeJupiterPlanet } from "./planet";
import { initializeJupiterMoons } from "./moons";

export function initializeJupiter(sunId: string): void {
  const jupiterId = initializeJupiterPlanet(sunId);
  initializeJupiterMoons(jupiterId);
}
