import { initializeNeptunePlanet } from "./planet";
import { initializeNeptuneMoons } from "./moons";

export function initializeNeptune(sunId: string): void {
  const neptuneId = initializeNeptunePlanet(sunId);
  initializeNeptuneMoons(neptuneId);
}
