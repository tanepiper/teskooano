
// Import creation/initialization functions for each system component
import { initializeAsteroidBelt } from "./asteroidBelt";
import { initializeEarth } from "./earth";
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


/**
 * Initializes the complete Solar System by calling creation functions
 * for the star, planets, asteroid belt, and Oort cloud.
 */
export function initializeSolarSystem() {
  // Create the central star and get its ID
  const sunId = initializeSun();

  // Create planets, passing the sun's ID and scale factor
  initializeMercury(sunId);
  initializeVenus(sunId);
  initializeEarth(sunId);
  initializeMars(sunId);
  initializeJupiter(sunId);
  initializeSaturn(sunId);
  initializeUranus(sunId);
  initializeNeptune(sunId);
  initializePluto(sunId);

  // Create other features
  initializeAsteroidBelt(sunId);
  initializeOortCloud(sunId);
}
