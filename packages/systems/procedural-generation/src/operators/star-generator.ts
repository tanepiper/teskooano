import { OSVector3 } from "@teskooano/core-math";
import {
  calculateOrbitalPosition,
  calculateOrbitalVelocity,
  type PhysicsStateReal,
} from "@teskooano/core-physics";
import type {
  CelestialObject,
  OrbitalParameters,
  StarProperties,
} from "@teskooano/data-types";
import { CelestialType } from "@teskooano/data-types";
import * as CONST from "../constants";
import { generateStar } from "../generators/stars/star";
import * as UTIL from "../utils";

/**
 * Generates the star or stars for the system, handling single and multi-star
 * system physics. For multi-star systems, it calculates the barycentric orbits
 * for each star and updates their initial physics states accordingly.
 *
 * @param random The seeded pseudo-random number generator function.
 * @returns An array of `CelestialObject` representing the generated stars.
 */
export function generateStars(random: () => number): CelestialObject[] {
  const systemTypeRoll = random();
  let numberOfStars = 1;
  if (systemTypeRoll > 0.1) numberOfStars = 2;
  if (systemTypeRoll > 0.6) numberOfStars = 3;
  if (systemTypeRoll > 0.85) numberOfStars = 4;

  const stars: CelestialObject[] = [];
  let primaryStar: CelestialObject | null = null;

  for (let s = 0; s < numberOfStars; s++) {
    const starData = generateStar(random);
    if (s === 0) {
      primaryStar = starData;
      stars.push(starData);
    } else {
      if (!primaryStar) continue;

      starData.parentId = primaryStar.id;
      (starData.properties as StarProperties).isMainStar = false;
      (starData.properties as StarProperties).partnerStars = [primaryStar.id];

      const companionDistanceAU = 0.1 + random() * 10;
      const companionSMA_m = companionDistanceAU * CONST.AU_TO_METERS;
      const companionEcc = 0.1 + random() * 0.4;
      const companionInc = (random() - 0.5) * 0.2;
      const companionLAN = random() * 2 * Math.PI;
      const companionAOP = random() * 2 * Math.PI;
      const companionMA = random() * 2 * Math.PI;
      const companionPeriod_s = UTIL.calculateOrbitalPeriod_s(
        primaryStar.realMass_kg,
        companionSMA_m,
        starData.realMass_kg,
      );

      const companionOrbit: OrbitalParameters = {
        realSemiMajorAxis_m: companionSMA_m,
        eccentricity: companionEcc,
        inclination: companionInc,
        longitudeOfAscendingNode: companionLAN,
        argumentOfPeriapsis: companionAOP,
        meanAnomaly: companionMA,
        period_s: companionPeriod_s,
      };
      starData.orbit = companionOrbit;

      if (primaryStar.properties?.type === CelestialType.STAR) {
        const primaryStarProps = primaryStar.properties as StarProperties;
        if (!primaryStarProps.partnerStars) {
          primaryStarProps.partnerStars = [];
        }
        primaryStarProps.partnerStars.push(starData.id);
      }

      const M1 = primaryStar.realMass_kg;
      const M2 = starData.realMass_kg;
      const M_tot = M1 + M2;

      if (M_tot > 0) {
        const primarySMA_m = (M2 / M_tot) * companionSMA_m;

        const primaryOrbit: OrbitalParameters = {
          realSemiMajorAxis_m: primarySMA_m,
          eccentricity: companionEcc,
          inclination: companionInc,
          longitudeOfAscendingNode: companionLAN,
          argumentOfPeriapsis: (companionAOP + Math.PI) % (2 * Math.PI),
          meanAnomaly: (companionMA + Math.PI) % (2 * Math.PI),
          period_s: companionPeriod_s,
        };
        primaryStar.orbit = primaryOrbit;

        try {
          const primaryStateForCompanionCalc: PhysicsStateReal = {
            id: primaryStar.id,
            mass_kg: M1,
            position_m: new OSVector3(0, 0, 0),
            velocity_mps: new OSVector3(0, 0, 0),
          };
          const companionInitialRelPos = calculateOrbitalPosition(
            primaryStateForCompanionCalc,
            companionOrbit,
            0,
          );
          const companionInitialVel = calculateOrbitalVelocity(
            primaryStateForCompanionCalc,
            companionOrbit,
            0,
          );
          starData.physicsStateReal.position_m = companionInitialRelPos;
          starData.physicsStateReal.velocity_mps = companionInitialVel;

          const barycenterStateForPrimaryCalc: PhysicsStateReal = {
            id: "barycenter",
            mass_kg: M2,
            position_m: new OSVector3(0, 0, 0),
            velocity_mps: new OSVector3(0, 0, 0),
          };
          const primaryInitialRelPos = calculateOrbitalPosition(
            barycenterStateForPrimaryCalc,
            primaryOrbit,
            0,
          );
          const primaryInitialVel = calculateOrbitalVelocity(
            barycenterStateForPrimaryCalc,
            primaryOrbit,
            0,
          );
          primaryStar.physicsStateReal.position_m = primaryInitialRelPos;
          primaryStar.physicsStateReal.velocity_mps = primaryInitialVel;

          starData.physicsStateReal.velocity_mps.add(primaryInitialVel);
          starData.physicsStateReal.position_m.add(primaryInitialRelPos);
        } catch (error) {
          console.error(
            `[generateSystem] Error calculating initial binary star physics state:`,
            error,
          );
        }
      }

      stars.push(starData);
    }
  }
  return stars;
}
