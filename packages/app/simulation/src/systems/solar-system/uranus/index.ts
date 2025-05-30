import { initializeUranusMoons } from "./moons";
import { initializeUranusPlanetAndRings } from "./planet";

export function initializeUranus(parentId: string): void {
  const uranusId = initializeUranusPlanetAndRings(parentId);
  initializeUranusMoons(uranusId);
}
