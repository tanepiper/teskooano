import type { CelestialObject } from "@teskooano/data-types";
import { AU_METERS, CelestialType } from "@teskooano/data-types";
import { Observable, Subscriber } from "rxjs";
import { getCelestialTypeForPlanet } from "../../utils/celestials";
import { generateMoon } from "./moon"; // Assuming generateMoon is in the same directory

/**
 * Creates an RxJS Observable that generates scientifically realistic numbers of moons
 * based on planet mass, type, and distance from the star.
 *
 * This system now supports:
 * - Gas giants with dozens to hundreds of moons (like Jupiter and Saturn)
 * - Terrestrial planets with 0-3 major moons
 * - Ice giants with moderate moon systems
 * - Distance-dependent moon formation probability
 * - Formation mechanism-based moon distribution
 *
 * @param random The seeded pseudo-random number generator function.
 * @param planetObject The parent `CelestialObject` (the planet).
 * @param planetMass_kg The mass of the parent planet in kilograms.
 * @param planetRadius_m The radius of the parent planet in meters.
 * @param seed The main system seed string.
 * @returns An `Observable<CelestialObject>` that emits each generated moon and then completes.
 */
export function generateMoonsObservable(
  random: () => number,
  planetObject: CelestialObject,
  planetMass_kg: number,
  planetRadius_m: number,
  seed: string,
): Observable<CelestialObject> {
  return new Observable((moonSubscriber: Subscriber<CelestialObject>) => {
    // Check if moon generation is appropriate based on distance
    const parentOrbit = planetObject.orbit;
    const parentDistanceAU =
      (parentOrbit?.realSemiMajorAxis_m ?? 0) / AU_METERS;

    // Very close planets (< 0.2 AU) have difficulty retaining moons due to stellar tides
    if (parentDistanceAU < 0.2) {
      moonSubscriber.complete();
      return;
    }

    try {
      const numberOfMoons = calculateRealisticMoonCount(
        random,
        planetObject,
        planetMass_kg,
        parentDistanceAU,
      );

      if (numberOfMoons === 0) {
        moonSubscriber.complete();
        return;
      }

      let lastMoonDistance_radii = calculateInitialMoonDistance(
        planetObject,
        planetMass_kg,
      );
      let moonsGenerated = 0;
      let consecutiveFailures = 0;

      for (let m = 0; m < numberOfMoons; m++) {
        const { moonData, nextLastMoonDistance_radii } = generateMoon(
          random,
          planetObject,
          planetMass_kg,
          planetRadius_m,
          lastMoonDistance_radii,
          seed,
        );

        if (moonData) {
          moonSubscriber.next(moonData);
          lastMoonDistance_radii = nextLastMoonDistance_radii;
          moonsGenerated++;
          consecutiveFailures = 0;
        } else {
          consecutiveFailures++;
          // Stop trying if we have too many failures (orbital constraints)
          if (consecutiveFailures >= 3) {
            break;
          }
          // Increase distance for next attempt
          lastMoonDistance_radii *= 1.5;
        }
      }

      moonSubscriber.complete();
    } catch (error) {
      moonSubscriber.error(error);
    }
  });
}

/**
 * Calculates realistic moon counts based on planet properties and astronomical observations
 */
function calculateRealisticMoonCount(
  random: () => number,
  planetObject: CelestialObject,
  planetMass_kg: number,
  distanceAU: number,
): number {
  const earthMass = 5.972e24;
  const planetMassRatio = planetMass_kg / earthMass;

  // Get planet type from properties
  const classType = getCelestialTypeForPlanet(planetObject);

  // Base moon count depends on planet type and mass
  let baseMoonCount: number;
  let variation: number;

  switch (classType) {
    case CelestialType.GAS_GIANT:
      // Gas giants can have many moons, but let's be more conservative
      if (planetMassRatio > 300) {
        // Saturn-class (95+ Earth masses) - reduced from 20-140 to 5-15
        baseMoonCount = 5;
        variation = 10; // 0-15 moons
      } else if (planetMassRatio > 250) {
        // Jupiter-class (318 Earth masses) - reduced from 20-100 to 3-12
        baseMoonCount = 3;
        variation = 9; // 0-12 moons
      } else if (planetMassRatio > 50) {
        // Neptune-class (17 Earth masses) - reduced from 0-25 to 0-8
        baseMoonCount = 0;
        variation = 8; // 0-8 moons
      } else {
        // Smaller gas giants - reduced from 0-13 to 0-5
        baseMoonCount = 0;
        variation = 5; // 0-5 moons
      }
      break;

    case CelestialType.PLANET:
      // Terrestrial planets typically have 0-3 major moons
      if (planetMassRatio > 0.8) {
        // Earth-class or larger
        baseMoonCount = 1;
        variation = 2; // 0-3 moons
      } else if (planetMassRatio > 0.1) {
        // Mars-class
        baseMoonCount = 0;
        variation = 2; // 0-2 moons
      } else {
        // Smaller terrestrial
        baseMoonCount = 0;
        variation = 1; // 0-1 moons
      }
      break;

    default:
      // Default case for other planet types
      baseMoonCount = 0;
      variation = 3; // Reduced from 5 to 3
  }

  // Distance factor - closer planets lose moons to stellar tides
  let distanceFactor = 1.0;
  if (distanceAU < 0.5) {
    distanceFactor = 0.3; // Very close planets have fewer moons
  } else if (distanceAU < 1.0) {
    distanceFactor = 0.7; // Close planets have somewhat fewer moons
  } else if (distanceAU > 10) {
    distanceFactor = 1.2; // Distant planets can have more moons
  }

  // Apply distance factor and random variation
  const adjustedBase = Math.floor(baseMoonCount * distanceFactor);
  const randomVariation = Math.floor(random() * variation);

  return Math.max(
    0,
    adjustedBase + randomVariation - Math.floor(variation / 2),
  );
}

/**
 * Calculates initial moon distance based on planet type and size
 */
function calculateInitialMoonDistance(
  planetObject: CelestialObject,
  planetMass_kg: number,
): number {
  const celestialType = getCelestialTypeForPlanet(planetObject);
  const earthMass = 5.972e24;
  const massRatio = planetMass_kg / earthMass;

  switch (celestialType) {
    case CelestialType.GAS_GIANT:
      // Gas giants can have moons at larger distances due to their size and gravity
      // Jupiter's moons range from ~6 to ~26 Jupiter radii
      return 8 + Math.log10(massRatio) * 2;

    case CelestialType.PLANET:
      // Terrestrial planets have moons at larger distances
      // Earth's Moon is ~60 Earth radii away
      return 20 + Math.log10(massRatio) * 10;

    default:
      return 15;
  }
}
