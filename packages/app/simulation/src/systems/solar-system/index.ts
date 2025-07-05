import { initializeAsteroidBelt } from "./asteroidBelt";
import { initializeCeres } from "./ceres";
import { initializeEarth } from "./earth";
import { initializeEris } from "./eris";
import { initializeVesta } from "./vesta";
import { initializeJupiter } from "./jupiter";
import { initializeMars } from "./mars";
import { initializeMercury } from "./mercury";
import { initializeNeptune } from "./neptune";
import { initializeOortCloud } from "./oortCloud";
import { initializePluto } from "./pluto";
import { initializeSaturn } from "./saturn";
import { initializeSun } from "./star";
import { initializeUranus } from "./uranus";
import { initializeVenus } from "./venus";
import { initializeComets } from "./comets";

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
  initializeCeres(sunId);
  initializeVesta(sunId);
  initializeJupiter(sunId);
  initializeSaturn(sunId);
  initializeUranus(sunId);
  initializeNeptune(sunId);
  initializePluto(sunId);
  initializeEris(sunId);
  initializeComets(sunId);

  initializeAsteroidBelt(sunId);
  // initializeOortCloud(sunId);
}
