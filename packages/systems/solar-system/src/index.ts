import { celestialManager, actions } from "@teskooano/core-state";
import { earthSystemBodies } from "./earth";
import { jupiterSystemBodies } from "./jupiter";
import { marsSystemBodies } from "./mars";
import { mercurySystemBodies } from "./mercury";
import { minorBodies } from "./minor-bodies";
import { neptuneSystemBodies } from "./neptune";
import { plutoSystemBodies } from "./pluto";
import { saturnSystemBodies } from "./saturn";
import { systemCelestials } from "./sol";
import { uranusSystemBodies } from "./uranus";
import { venusSystemBodies } from "./venus";
import { allSatellites } from "./satellites";
import { allComets } from "./comets";
import { asteroids } from "./asteroids";
import { interstellarObjects } from "./intersteller";
import { planetNineSystemBodies } from "./planet-nine";
import { processSolarSystemToCurrentTime } from "./utils/dynamic-epoch-processor";
import type { CelestialObject } from "@teskooano/data-types";

/**
 * Fixes any solar system objects with empty/missing epochs by setting them to J2000.
 * This ensures hand-crafted objects use the standard astronomical epoch instead of defaulting to current time.
 */
function fixEmptyEpochs<T>(
  objects: CelestialObject<T>[],
): CelestialObject<T>[] {
  return objects.map((object) => {
    if (
      object.orbit &&
      (!object.orbit.epoch || object.orbit.epoch.trim() === "")
    ) {
      return {
        ...object,
        orbit: {
          ...object.orbit,
          epoch: "J2000",
        },
      };
    }
    return object;
  });
}

/**
 * Solar system bodies that can be initialized in any order.
 * Each object should have a parentId that references an existing body.
 */
const solarSystemBodies = [
  ...systemCelestials,
  ...mercurySystemBodies,
  ...venusSystemBodies,
  ...earthSystemBodies,
  ...marsSystemBodies,
  ...jupiterSystemBodies,
  ...saturnSystemBodies,
  ...uranusSystemBodies,
  ...neptuneSystemBodies,
  ...plutoSystemBodies,
  ...planetNineSystemBodies,
  ...allSatellites,
  ...allComets,
  ...minorBodies,
  ...interstellarObjects,
  ...asteroids,
];

/**
 * Initializes the complete Solar System by calling creation functions
 * for the star, planets (including hypothetical Planet Nine), asteroid belt, and Oort cloud.
 * All orbital elements are dynamically calculated to today's current positions.
 */
export function initializeSolarSystem() {
  // Fix any objects with empty epochs by setting them to J2000
  const fixedEpochBodies = fixEmptyEpochs(solarSystemBodies);

  // Process all objects to calculate their current positions based on the actual current time
  const currentPositionBodies =
    processSolarSystemToCurrentTime(fixedEpochBodies);

  // CRITICAL: Set simulation start date to actual current time to match processed objects
  // This ensures UI time calculations are synchronized with object positions
  actions.setStartDate(new Date());

  // Use addObjects to ensure proper dependency sorting
  celestialManager.addObjects(currentPositionBodies as any);
}
