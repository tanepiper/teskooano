import { initializeEarth } from "./earth";
import { initializeJupiter } from "./jupiter";
import { initializeMars } from "./mars";
import { initializeMercury } from "./mercury/mercury";
import { initializeMinorBodies } from "./minor-bodies";
import { initializeComets } from "./comets";
import { initializeNeptune } from "./neptune";
import { initializePluto } from "./pluto";
import { initializeSaturn } from "./saturn";
import { initializeSun } from "./sol";
import { initializeUranus } from "./uranus";
import { initializeVenus } from "./venus";

/**
 * Initializes the complete Solar System by calling creation functions
 * for the star, planets, asteroid belt, and Oort cloud.
 */
export function initializeSolarSystem() {
  const sunId = initializeSun();

  initializeMercury(sunId);
  initializeVenus(sunId);
  initializeEarth(sunId);
  initializeMars(sunId);
  initializeJupiter(sunId);
  initializeSaturn(sunId);
  initializeUranus(sunId);
  initializeNeptune(sunId);
  initializePluto(sunId);
  initializeComets(sunId);
  initializeMinorBodies(sunId);
}
