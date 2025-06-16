import { OSVector3 } from "@teskooano/core-math";
import {
  CelestialObject,
  CelestialSpecificPropertiesUnion,
  CelestialStatus,
  CelestialType,
  PhysicsStateReal,
  PlanetProperties,
  PlanetType,
  RingProperties,
  scaleSize,
} from "@teskooano/data-types";
import { Observable, Subscriber } from "rxjs";
import * as CONST from "../../constants";
import { generateCelestialName } from "../../generators/names/celestial-name";
import * as UTIL from "../../utils";
import { calculatePlanetOrbitAndInitialState } from "./planet-orbit";
import { generatePlanetSpecificProperties } from "./planet-properties";
import { generateRings } from "./planet-rings";
import { determinePlanetTypeAndBaseProperties } from "./planet-type";

import { calculateStellarLuminosity, estimateTemperature } from "../../utils";

/**
 * Creates an RxJS Observable that generates and emits data for a single planet
 * and its potential ring system.
 *
 * This function acts as an orchestrator, calling specialized helper functions to:
 * 1. Determine the planet's base type (Rocky, Gas Giant, etc.).
 * 2. Calculate its physical properties (mass, radius).
 * 3. Generate specific characteristics (atmosphere, surface type).
 * 4. Generate a ring system based on probability.
 * 5. Calculate its final orbit and initial physics state.
 *
 * It emits the main planet `CelestialObject` first, followed by a
 * `CelestialObject` for the ring system if one was generated.
 *
 * @param random The seeded pseudo-random number generator function.
 * @param parentStar The parent star object.
 * @param bodyDistanceAU The orbital distance of the planet from the star in AU.
 * @param systemSeed The main system seed string.
 * @returns An `Observable<CelestialObject>` that emits the planet and then its
 *   ring system (if any), then completes.
 */
export function generatePlanet(
  random: () => number,
  parentStar: CelestialObject,
  bodyDistanceAU: number,
  systemSeed: string,
): Observable<CelestialObject> {
  return new Observable((subscriber: Subscriber<CelestialObject>) => {
    let planetName: string = "Unknown Planet";
    try {
      planetName = generateCelestialName(random);
      const planetId = `planet-${parentStar.id}-${planetName.toLowerCase()}`;

      const baseProps = determinePlanetTypeAndBaseProperties(
        random,
        bodyDistanceAU,
        parentStar,
      );

      if (!baseProps) {
        subscriber.complete();
        return;
      }

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
          parentStar.realMass_kg,
          planetMass_kg,
          bodyDistanceAU,
          parentStar.physicsStateReal as PhysicsStateReal,
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
      const starLuminosity = calculateStellarLuminosity(
        parentStar.realRadius_m,
        parentStar.temperature,
      );
      const planetTemp = estimateTemperature(starLuminosity, bodyDistanceAU);

      let properties: CelestialSpecificPropertiesUnion = specificProperties;
      if (
        specificProperties.type === CelestialType.PLANET &&
        (specificProperties as PlanetProperties).atmosphere
      ) {
        properties = {
          ...specificProperties,
          atmosphere: {
            glowColor: UTIL.getRandomItem(
              specificProperties.planetType === PlanetType.TERRESTRIAL
                ? ["#dfe0e7", "#e7e9eb", "#f2f4f7"]
                : specificProperties.planetType === PlanetType.ICE
                  ? ["#aaccff", "#cceeff", "#ddeeff"]
                  : ["#ff9966", "#ffaa88", "#ffbb99"],
              random,
            ),
            intensity:
              specificProperties.planetType === PlanetType.TERRESTRIAL
                ? 1.0
                : specificProperties.planetType === PlanetType.ICE
                  ? 0.8
                  : 1.2,
            power:
              specificProperties.planetType === PlanetType.TERRESTRIAL
                ? 2.0
                : specificProperties.planetType === PlanetType.ICE
                  ? 1.8
                  : 2.2,
            thickness:
              specificProperties.planetType === PlanetType.TERRESTRIAL
                ? 0.1
                : specificProperties.planetType === PlanetType.ICE
                  ? 0.08
                  : 0.12,
          },
        } as PlanetProperties;
      }

      const planetData: CelestialObject = {
        id: planetId,
        name: planetName,
        status: CelestialStatus.ACTIVE,
        type: baseProps.planetType,
        parentId: parentStar.id,
        currentParentId: parentStar.id,
        realMass_kg: planetMass_kg,
        realRadius_m: finalPlanetRadius_m,
        temperature: planetTemp,
        orbit: orbit,
        properties,
        seed: planetSeed,
        siderealRotationPeriod_s: rotationPeriod_s,
        axialTilt: tiltAxis,
        physicsStateReal: initialPhysicsState,
      };

      if (generatedRings && generatedRings.length > 0) {
        if (planetData.properties) {
          (planetData.properties as PlanetProperties).rings = generatedRings;
        }
      }

      subscriber.next(planetData);
      subscriber.complete();
    } catch (error) {
      console.error(`Error generating planet ${planetName}:`, error);
      subscriber.error(error);
    }
  });
}
