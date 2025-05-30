import { initializeEarthPlanet } from "./planet";
import { initializeEarthMoons } from "./moons";

export function initializeEarth(sunId: string): void {
  const earthId = initializeEarthPlanet(sunId);
  initializeEarthMoons(earthId);
}
