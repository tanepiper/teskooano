import { initializeMarsPlanet } from "./mars";
import { initializePhobos } from "./phobos";
import { initializeDeimos } from "./deimos";

/**
 * Initializes the complete Mars system: the planet and its two moons.
 */
export function initializeMars(parentId: string): void {
  const marsId = initializeMarsPlanet(parentId);
  initializePhobos(marsId);
  initializeDeimos(marsId);
}
