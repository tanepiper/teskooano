import type { CelestialObject, PlanetProperties, GasGiantProperties } from "@teskooano/data-types";
import { Observable, Subscriber } from "rxjs";
import { CelestialType, GasGiantClass, PlanetType } from "@teskooano/data-types";
import * as CONST_PROC_GEN from "../../constants"; // Aliasing to avoid conflict if CONST is used locally
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
    const parentDistanceAU = (parentOrbit?.realSemiMajorAxis_m ?? 0) / CONST_PROC_GEN.AU_TO_METERS;
    
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
        parentDistanceAU
      );

      if (numberOfMoons === 0) {
        moonSubscriber.complete();
        return;
      }

      let lastMoonDistance_radii = calculateInitialMoonDistance(planetObject, planetMass_kg);
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
      console.error(`Error generating moons for ${planetObject.name}:`, error);
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
  distanceAU: number
): number {
  const earthMass = 5.972e24;
  const planetMassRatio = planetMass_kg / earthMass;
  
  // Get planet type from properties
  const planetType = getPlanetType(planetObject);
  
  // Base moon count depends on planet type and mass
  let baseMoonCount: number;
  let variation: number;
  
  switch (planetType) {
    case 'gas_giant':
      // Gas giants can have many moons like Jupiter (95) and Saturn (146)
      if (planetMassRatio > 300) { // Saturn-class (95+ Earth masses)
        baseMoonCount = 80;
        variation = 60; // 20-140 moons
      } else if (planetMassRatio > 250) { // Jupiter-class (318 Earth masses)
        baseMoonCount = 60;
        variation = 40; // 20-100 moons
      } else if (planetMassRatio > 50) { // Neptune-class (17 Earth masses)
        baseMoonCount = 10;
        variation = 15; // 0-25 moons
      } else { // Smaller gas giants
        baseMoonCount = 5;
        variation = 8; // 0-13 moons
      }
      break;
      
    case 'ice_giant':
      // Ice giants like Uranus (27 moons) and Neptune (16 moons)
      if (planetMassRatio > 15) { // Uranus/Neptune class
        baseMoonCount = 15;
        variation = 12; // 3-27 moons
      } else {
        baseMoonCount = 5;
        variation = 7; // 0-12 moons
      }
      break;
      
    case 'terrestrial':
      // Terrestrial planets typically have 0-3 major moons
      if (planetMassRatio > 0.8) { // Earth-class or larger
        baseMoonCount = 1;
        variation = 2; // 0-3 moons
      } else if (planetMassRatio > 0.1) { // Mars-class
        baseMoonCount = 0;
        variation = 2; // 0-2 moons
      } else { // Smaller terrestrial
        baseMoonCount = 0;
        variation = 1; // 0-1 moons
      }
      break;
      
    default:
      // Default case for other planet types
      baseMoonCount = Math.floor(planetMassRatio * 0.1);
      variation = Math.max(1, Math.floor(planetMassRatio * 0.2));
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
  
  return Math.max(0, adjustedBase + randomVariation - Math.floor(variation / 2));
}

/**
 * Determines planet type from CelestialObject properties
 */
function getPlanetType(planetObject: CelestialObject): 'gas_giant' | 'ice_giant' | 'terrestrial' | 'other' {
  if (planetObject.type === CelestialType.GAS_GIANT) {
    return 'gas_giant';
  }
  
  const props = planetObject.properties as PlanetProperties;
  if (!props) return 'other';
  
  switch (props.planetType) {
    case PlanetType.TERRESTRIAL:
    case PlanetType.ROCKY:
    case PlanetType.DESERT:
    case PlanetType.LAVA:
    case PlanetType.BARREN:
      return 'terrestrial';
      
    case PlanetType.ICE:
      // Large ice planets are ice giants, small ones are terrestrial
      const planetMass = planetObject.realMass_kg;
      const earthMass = 5.972e24;
      return (planetMass / earthMass) > 10 ? 'ice_giant' : 'terrestrial';
      
    default:
      return 'other';
  }
}

/**
 * Calculates initial moon distance based on planet type and size
 */
function calculateInitialMoonDistance(planetObject: CelestialObject, planetMass_kg: number): number {
  const planetType = getPlanetType(planetObject);
  const earthMass = 5.972e24;
  const massRatio = planetMass_kg / earthMass;
  
  switch (planetType) {
    case 'gas_giant':
      // Gas giants start closer due to larger Roche limit
      return 2.5 + Math.log10(massRatio) * 0.5;
      
    case 'ice_giant':
      return 3.0 + Math.log10(massRatio) * 0.3;
      
    case 'terrestrial':
      // Terrestrial planets start further out
      return 3.5;
      
    default:
      return 3.0;
  }
}
