import { initializeUranusPlanet } from "./uranus";
import { initializeTitania } from "./titania";
import { initializeOberon } from "./oberon";
import { initializeUmbriel } from "./umbriel";
import { initializeAriel } from "./ariel";
import { initializeMiranda } from "./miranda";

/**
 * Initializes the complete Uranus system: the planet and its five major moons.
 */
export function initializeUranus(parentId: string): void {
  const uranusId = initializeUranusPlanet(parentId);

  initializeTitania(uranusId);
  initializeOberon(uranusId);
  initializeUmbriel(uranusId);
  initializeAriel(uranusId);
  initializeMiranda(uranusId);
}
