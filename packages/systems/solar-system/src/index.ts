import { celestialManager } from "@teskooano/core-state";
import { earthSystemBodies } from "./earth";
import { jupiterSystemBodies } from "./jupiter";
import { marsSystemBodies } from "./mars";
import { mercury } from "./mercury/mercury";
import { minorBodies } from "./minor-bodies";
import { neptuneSystemBodies } from "./neptune";
import { plutoSystemBodies } from "./pluto";
import { saturnSystemBodies } from "./saturn";
import { systemCelestials } from "./sol";
import { uranusSystemBodies } from "./uranus";
import { venus } from "./venus/venus";
import { allSatellites } from "./satellites";
import { allComets } from "./comets";
import { asteroids } from "./asteroids";
import { interstellarObjects } from "./intersteller";
import { processSolarSystemToCurrentTime } from "./utils/dynamic-epoch-processor";

/**
 * Solar system bodies that can be initialized in any order.
 * Each object should have a parentId that references an existing body.
 */
const solarSystemBodies = [
  ...systemCelestials,
  mercury,
  venus,
  ...earthSystemBodies,
  ...marsSystemBodies,
  ...jupiterSystemBodies,
  ...saturnSystemBodies,
  ...uranusSystemBodies,
  ...neptuneSystemBodies,
  ...plutoSystemBodies,
  ...allSatellites,
  ...allComets,
  ...minorBodies,
  ...interstellarObjects,
  ...asteroids,
];

/**
 * Initializes the complete Solar System by calling creation functions
 * for the star, planets, asteroid belt, and Oort cloud.
 * All orbital elements are dynamically calculated to today's current positions.
 */
export function initializeSolarSystem() {
  // Process all objects to calculate their current positions based on the actual current time
  const currentPositionBodies = processSolarSystemToCurrentTime(
    solarSystemBodies as any,
  );

  // Use addObjects to ensure proper dependency sorting
  celestialManager.addObjects(currentPositionBodies as any);
}
