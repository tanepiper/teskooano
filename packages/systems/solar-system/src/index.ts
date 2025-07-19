import { celestialManager } from "@teskooano/core-state";
import { earthSystemBodies } from "./earth";
import { jupiterSystemBodies } from "./jupiter";
import { marsSystemBodies } from "./mars";
import { mercury } from "./mercury/mercury";
import { minorBodies } from "./minor-bodies";
import { neptuneSystemBodies } from "./neptune";
import { pluto } from "./pluto/pluto";
import { saturnSystemBodies } from "./saturn";
import { sun } from "./sol";
import { uranusSystemBodies } from "./uranus";
import { venus } from "./venus/venus";
import { allSatellites } from "./satellites";
import { allComets } from "./comets";
import { type CelestialObject } from "@teskooano/data-types";

/**
 * Solar system bodies that can be initialized in any order.
 * Each object should have a parentId that references an existing body.
 */
const solarSystemBodies = [
  sun,
  mercury,
  venus,
  ...earthSystemBodies,
  ...marsSystemBodies,
  ...jupiterSystemBodies,
  ...saturnSystemBodies,
  ...uranusSystemBodies,
  ...neptuneSystemBodies,
  pluto,
  ...allSatellites,
  ...allComets,
  ...minorBodies,
];

/**
 * Initializes the complete Solar System by calling creation functions
 * for the star, planets, asteroid belt, and Oort cloud.
 */
export function initializeSolarSystem() {
  // Use addObjects to ensure proper dependency sorting
  celestialManager.addObjects(solarSystemBodies as any);
}
