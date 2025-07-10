import { OSVector3 } from "@teskooano/core-math";
import {
  CelestialObject,
  CelestialSpecificPropertiesUnion,
  CelestialStatus,
  CelestialType,
  GasGiantClass,
  PhysicsStateReal,
  PlanetProperties,
  PlanetType,
  RingProperties,
  RockyType,
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
import { createProceduralSurfaceProperties } from "../../properties/creator";
import { calculateStellarLuminosity, estimateTemperature } from "../../utils";
import { CelestialZone } from "../../zones";

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
 * @param zone The dynamically-scaled celestial zone for this location.
 * @returns An `Observable<CelestialObject>` that emits the planet and then its
 *   ring system (if any), then completes.
 */
export function generatePlanet(
  random: () => number,
  parentStar: CelestialObject,
  bodyDistanceAU: number,
  systemSeed: string,
  zone: CelestialZone,
): Observable<CelestialObject> {
  return new Observable((subscriber: Subscriber<CelestialObject>) => {
    let planetName: string = "Unknown Planet";
    try {
      planetName = generateCelestialName(random);
      const planetId = `planet-${parentStar.id}-${planetName.toLowerCase()}`;

      const baseProps = determinePlanetTypeAndBaseProperties(
        random,
        parentStar,
        zone,
      );

      if (!baseProps) {
        subscriber.complete();
        return;
      }

      const massRangeMultiplier = Math.min(1 + bodyDistanceAU / 10, 5); // Cap at 5x to prevent unrealistic masses

      const planetMassMultiplier =
        (0.1 + random() * 10) *
        massRangeMultiplier *
        baseProps.massMultiplierFactor;
      const planetMass_kg = planetMassMultiplier * CONST.EARTH_MASS_KG;

      // Debug logging for mass generation
      // if (planetMass_kg > 1e24) { // If mass > 1 Earth mass
      //   console.warn(`[generatePlanet] High mass detected for ${planetName}:`, {
      //     planetName,
      //     bodyDistanceAU,
      //     massRangeMultiplier,
      //     planetMassMultiplier,
      //     baseProps_massMultiplierFactor: baseProps.massMultiplierFactor,
      //     planetMass_kg,
      //     mass_in_earth_masses: planetMass_kg / CONST.EARTH_MASS_KG,
      //   });
      // }

      const finalPlanetRadius_m = UTIL.calculateRadius(
        planetMass_kg,
        baseProps.targetDensity_kg_m3,
      );

      const specificProperties = generatePlanetSpecificProperties(
        random,
        baseProps,
        zone.minAU, // Pass the zone's minimum distance for temperature calcs
      );

      const visualPlanetRadius_m = scaleSize(
        finalPlanetRadius_m,
        baseProps.celestialType,
      );

      let generatedRings: RingProperties[] | undefined;
      if (baseProps.ringChance > 0 && baseProps.ringAllowedTypes.length > 0) {
        generatedRings = generateRings(
          random,
          baseProps.ringChance,
          baseProps.ringAllowedTypes,
          finalPlanetRadius_m,
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

      const planetAlbedo = UTIL.calculateAlbedo(
        baseProps.celestialType,
        baseProps.celestialClass,
        random,
      );

      let properties: CelestialSpecificPropertiesUnion = specificProperties;

      if (baseProps.celestialType === CelestialType.PLANET) {
        const proceduralSurface = createProceduralSurfaceProperties(
          random,
          baseProps.celestialClass,
        );
        properties = {
          ...properties,
          surface: proceduralSurface,
        } as PlanetProperties;
      }

      if (
        specificProperties.type === CelestialType.PLANET &&
        (specificProperties as PlanetProperties).atmosphere
      ) {
        properties = {
          ...specificProperties,
          atmosphere: {
            glowColor: UTIL.getRandomItem(
              specificProperties.classType === PlanetType.TERRESTRIAL
                ? ["#dfe0e7", "#e7e9eb", "#f2f4f7"]
                : specificProperties.classType === PlanetType.ICE
                  ? ["#aaccff", "#cceeff", "#ddeeff"]
                  : ["#ff9966", "#ffaa88", "#ffbb99"],
              random,
            ),
            intensity:
              specificProperties.classType === PlanetType.TERRESTRIAL
                ? 1.0
                : specificProperties.classType === PlanetType.ICE
                  ? 0.8
                  : 1.2,
            power:
              specificProperties.classType === PlanetType.TERRESTRIAL
                ? 2.0
                : specificProperties.classType === PlanetType.ICE
                  ? 1.8
                  : 2.2,
            thickness:
              specificProperties.classType === PlanetType.TERRESTRIAL
                ? 0.1
                : specificProperties.classType === PlanetType.ICE
                  ? 0.08
                  : 0.12,
          },
        } as PlanetProperties;
      }

      const planetData: CelestialObject = {
        id: planetId,
        name: planetName,
        status: CelestialStatus.ACTIVE,
        albedo: planetAlbedo,
        type: baseProps.celestialType,
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
          (planetData.properties as PlanetProperties).rings =
            generatedRings as RingProperties[];
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

/**
 * Creates an RxJS Observable that generates and emits data for a single rogue planet
 * that is not gravitationally bound to any star.
 *
 * Rogue planets are planetary objects that have been ejected from their original
 * stellar system and now drift freely through interstellar space.
 *
 * @param random The seeded pseudo-random number generator function.
 * @param distanceAU The distance from the system center where the rogue planet is located.
 * @param systemSeed The main system seed string.
 * @param slotIndex The slot index for unique naming.
 * @param zone The dynamically-scaled celestial zone for this location.
 * @returns An `Observable<CelestialObject>` that emits the rogue planet and then completes.
 */
export function generateRoguePlanet(
  random: () => number,
  distanceAU: number,
  systemSeed: string,
  slotIndex: number,
  zone: CelestialZone,
): Observable<CelestialObject> {
  return new Observable((subscriber: Subscriber<CelestialObject>) => {
    let planetName: string = "Unknown Rogue Planet";
    try {
      planetName = generateCelestialName(random);
      const planetId = `planet-rogue-${slotIndex}-${planetName.toLowerCase()}`;

      const baseProps = determinePlanetTypeAndBaseProperties(
        random,
        // For rogues, there is no parent star, but we use one as a placeholder
        // for the function signature. The zone is the critical part.
        { realMass_kg: CONST.SOLAR_MASS_KG } as CelestialObject,
        zone,
      );

      if (!baseProps) {
        subscriber.complete();
        return;
      }

      const planetMassMultiplier =
        (0.5 + random() * 5) * baseProps.massMultiplierFactor;
      const planetMass_kg = planetMassMultiplier * CONST.EARTH_MASS_KG;

      const finalPlanetRadius_m = UTIL.calculateRadius(
        planetMass_kg,
        baseProps.targetDensity_kg_m3,
      );

      // Create a dummy parent for property generation (won't be used as actual parent)
      const dummyParent = {
        id: "temp-parent",
        realRadius_m: 696340000, // Sun-like radius
        temperature: 5778, // Sun-like temperature
        realMass_kg: 1.989e30, // Sun-like mass
      } as CelestialObject;

      const specificProperties = generatePlanetSpecificProperties(
        random,
        baseProps as any,
        50, // Far distance for cold properties
      );

      const visualPlanetRadius_m = scaleSize(
        finalPlanetRadius_m,
        baseProps.celestialType,
      );

      let generatedRings: RingProperties[] | undefined;
      if (baseProps.ringChance > 0 && baseProps.ringAllowedTypes.length > 0) {
        generatedRings = generateRings(
          random,
          baseProps.ringChance,
          baseProps.ringAllowedTypes as any,
          finalPlanetRadius_m,
        );
      }

      // For rogue planets, we pass the distance information through the orbit parameters
      // The factory will detect this and create appropriate physics state

      const rotationPeriod_s = 18000 + random() * (172800 - 18000);
      const tilt_deg = random() * 45;
      const tilt_rad = tilt_deg * (Math.PI / 180);

      const tiltAxis = new OSVector3(
        0,
        Math.cos(tilt_rad),
        Math.sin(tilt_rad),
      ).normalize();

      const planetSeed = `${systemSeed}-rogue-${planetId}`;
      // Rogue planets are very cold - background temperature of space
      const planetTemp = 2.7 + random() * 10; // 2.7-12.7K

      const planetAlbedo = UTIL.calculateAlbedo(
        baseProps.celestialType,
        baseProps.celestialClass,
        random,
      );

      let properties: CelestialSpecificPropertiesUnion = specificProperties;

      if (baseProps.celestialType === CelestialType.PLANET) {
        const proceduralSurface = createProceduralSurfaceProperties(
          random,
          baseProps.celestialClass,
        );
        properties = {
          ...properties,
          surface: proceduralSurface,
        } as PlanetProperties;
      }

      // Rogue planets use zero orbital parameters with distance encoded in meanAnomaly
      const planetData: CelestialObject = {
        id: planetId,
        name: `Rogue ${planetName}`,
        status: CelestialStatus.ACTIVE,
        albedo: planetAlbedo,
        type: baseProps.celestialType,
        // No parentId - rogue planets don't orbit anything
        realMass_kg: planetMass_kg,
        realRadius_m: finalPlanetRadius_m,
        temperature: planetTemp,
        orbit: {
          realSemiMajorAxis_m: 0,
          eccentricity: 0,
          inclination: 0,
          longitudeOfAscendingNode: 0,
          argumentOfPeriapsis: 0,
          meanAnomaly: distanceAU, // Store distance here for factory to use
          period_s: 0,
        },
        properties,
        seed: planetSeed,
        siderealRotationPeriod_s: rotationPeriod_s,
        axialTilt: tiltAxis,
        // Physics state will be calculated by the factory
        physicsStateReal: {
          id: planetId,
          mass_kg: planetMass_kg,
          position_m: new OSVector3(0, 0, 0), // Placeholder - factory will set this
          velocity_mps: new OSVector3(0, 0, 0), // Placeholder - factory will set this
        },
      };

      if (generatedRings && generatedRings.length > 0) {
        if (planetData.properties) {
          (planetData.properties as PlanetProperties).rings =
            generatedRings as RingProperties[];
        }
      }

      subscriber.next(planetData);
      subscriber.complete();
    } catch (error) {
      console.error(`Error generating rogue planet ${planetName}:`, error);
      subscriber.error(error);
    }
  });
}
