import { Observable, Subscriber } from "rxjs";
import { OSVector3 } from "@teskooano/core-math";
import type {
  CelestialObject,
  OrbitalParameters,
  PhysicsStateReal,
  RingProperties,
  RingSystemProperties,
} from "@teskooano/data-types";
import {
  CelestialStatus,
  CelestialType,
  scaleSize,
} from "@teskooano/data-types";
import * as CONST from "../constants";
import { generateCelestialName } from "../name-generator";
import * as UTIL from "../utils";
import { calculatePlanetOrbitAndInitialState } from "./planet-orbit";
import { generatePlanetSpecificProperties } from "./planet-properties";
import { generateRings } from "./planet-rings";
import { determinePlanetTypeAndBaseProperties } from "./planet-type";

import { calculateLuminosity, estimateTemperature } from "../utils";

/**
 * Orchestrates the generation of data for a planet and potentially its ring system
 * by calling specialized generator functions.
 *
 * @param random The seeded random function.
 * @param starId The ID of the parent star.
 * @param starMass_kg The mass of the parent star (kg).
 * @param starTemperature The temperature of the parent star (K).
 * @param starRadius The radius of the parent star (m).
 * @param bodyDistanceAU The distance of this planet from the star (AU).
 * @param systemSeed The main system seed.
 * @param parentStarState The state of the parent star for physics calculations.
 * @returns An Observable stream emitting the planet and its ring system (if any).
 */
export function generatePlanet(
  random: () => number,
  starId: string,
  starMass_kg: number,
  starTemperature: number,
  starRadius: number,
  bodyDistanceAU: number,
  systemSeed: string,
  parentStarState: PhysicsStateReal,
): Observable<CelestialObject> {
  return new Observable((subscriber: Subscriber<CelestialObject>) => {
    let planetName: string = "Unknown Planet";
    try {
      planetName = generateCelestialName(random);
      const planetId = `planet-${starId}-${planetName.toLowerCase()}`;

      const baseProps = determinePlanetTypeAndBaseProperties(
        random,
        bodyDistanceAU,
        starTemperature,
        starRadius,
      );

      const massRangeMultiplier = 1 + bodyDistanceAU / 5;

      const planetMassMultiplier =
        (0.1 + random() * 10) *
        massRangeMultiplier *
        baseProps.massMultiplierFactor;
      const planetMass_kg = planetMassMultiplier * CONST.EARTH_MASS_KG;

      const finalPlanetRadius_m = UTIL.calculateRadius(
        planetMass_kg,
        baseProps.targetDensity_kg_m3,
      );

      const specificProperties = generatePlanetSpecificProperties(
        random,
        baseProps,
        bodyDistanceAU,
      );

      const visualPlanetRadius_m = scaleSize(
        finalPlanetRadius_m,
        baseProps.planetType,
      );

      let generatedRings: RingProperties[] | undefined;
      if (baseProps.ringChance > 0 && baseProps.ringAllowedTypes.length > 0) {
        generatedRings = generateRings(
          random,
          baseProps.ringChance,
          baseProps.ringAllowedTypes,
          visualPlanetRadius_m,
        );
      }

      const { orbit, initialPhysicsState } =
        calculatePlanetOrbitAndInitialState(
          random,
          starMass_kg,
          planetMass_kg,
          bodyDistanceAU,
          parentStarState,
          planetId,
        );

      if (!initialPhysicsState) {
        console.error(
          `[generatePlanet] Failed to calculate initial state for ${planetId}, skipping object creation.`,
        );
        subscriber.complete();
        return;
      }

      const rotationPeriod_s = 18000 + random() * (172800 - 18000);
      const tilt_deg = random() * 45;
      const tilt_rad = tilt_deg * (Math.PI / 180);

      const tiltAxis = new OSVector3(
        0,
        Math.cos(tilt_rad),
        Math.sin(tilt_rad),
      ).normalize();

      const planetSeed = `${systemSeed}-${planetId}`;
      const starLuminosity = calculateLuminosity(starRadius, starTemperature);
      const planetTemp = estimateTemperature(starLuminosity, bodyDistanceAU);

      const planetData: CelestialObject = {
        id: planetId,
        name: planetName,
        status: CelestialStatus.ACTIVE,
        type: baseProps.planetType,
        parentId: starId,
        currentParentId: starId,
        realMass_kg: planetMass_kg,
        realRadius_m: finalPlanetRadius_m,
        temperature: planetTemp,
        orbit: orbit,
        properties: specificProperties,
        seed: planetSeed,
        siderealRotationPeriod_s: rotationPeriod_s,
        axialTilt: tiltAxis,
        physicsStateReal: initialPhysicsState,
      };
      subscriber.next(planetData);

      if (generatedRings && generatedRings.length > 0) {
        const ringSystemId = `ring-system-${planetId}`;
        const ringSystemName = `${planetName} Rings`;

        const ringSystemProperties: RingSystemProperties = {
          type: CelestialType.RING_SYSTEM,
          rings: generatedRings,
          parentId: planetId,
        };

        const ringSystemData: CelestialObject = {
          id: ringSystemId,
          name: ringSystemName,
          type: CelestialType.RING_SYSTEM,
          status: CelestialStatus.ACTIVE,
          parentId: planetId,
          currentParentId: planetId,
          properties: ringSystemProperties,
          axialTilt: tiltAxis.clone(),

          realMass_kg: 0,
          realRadius_m: 0,
          temperature: 0,
          orbit: {} as OrbitalParameters,

          physicsStateReal: {
            id: ringSystemId,
            mass_kg: 0,
            position_m: initialPhysicsState.position_m.clone(),
            velocity_mps: initialPhysicsState.velocity_mps.clone(),
          },
        };
        subscriber.next(ringSystemData);
      }

      subscriber.complete();
    } catch (error) {
      console.error(`Error generating planet ${planetName}:`, error);
      subscriber.error(error);
    }
  });
}
