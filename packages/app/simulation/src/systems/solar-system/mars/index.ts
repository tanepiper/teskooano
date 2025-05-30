import { initializeMarsPlanet } from "./planet";
import { initializeMarsMoons } from "./moons";

export function initializeMars(sunId: string): void {
  const marsId = initializeMarsPlanet(sunId);
  initializeMarsMoons(marsId);
}
