import { initializeVenusPlanet } from "./planet";
// import { initializeVenusMoons } from "./moons"; // No moons for Venus

export function initializeVenus(parentId: string): void {
  initializeVenusPlanet(parentId);
  // initializeVenusMoons(parentId); // No moons for Venus
}
