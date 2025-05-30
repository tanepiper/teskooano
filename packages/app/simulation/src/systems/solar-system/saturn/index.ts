import { initializeSaturnPlanet } from "./planet";
import { initializeSaturnMoons } from "./moons";

export function initializeSaturn(sunId: string): void {
  const saturnId = initializeSaturnPlanet(sunId);
  initializeSaturnMoons(saturnId);
}
