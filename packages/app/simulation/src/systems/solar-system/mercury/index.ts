import { initializeMercuryPlanet } from "./planet";
// import { initializeMercuryMoons } from "./moons"; // No moons for Mercury

export function initializeMercury(parentId: string): void {
  initializeMercuryPlanet(parentId);
  // initializeMercuryMoons(parentId); // No moons for Mercury
}
