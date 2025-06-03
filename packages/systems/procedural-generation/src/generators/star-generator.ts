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
import { AU_METERS, CelestialType } from "@teskooano/data-types";
import { generateStar } from "../celestials";
import * as CONST from "../constants";
import * as UTIL from "../utils";

/**
 * Generates the stars for the system.
 * @param random The seeded random function.
 * @returns An array of generated star CelestialObjects.
 */
export function generateStarsInSystem(random: () => number): CelestialObject[] {
  const systemTypeRoll = random();
  let numberOfStars = 1;
  if (systemTypeRoll > 0.1) numberOfStars = 2;
  if (systemTypeRoll > 0.4) numberOfStars = 3;
  if (systemTypeRoll > 0.6) numberOfStars = 4;
  if (systemTypeRoll > 0.75) numberOfStars = 5;
  if (systemTypeRoll > 0.85) numberOfStars = 6;
  if (systemTypeRoll > 0.92) numberOfStars = 7;
  if (systemTypeRoll > 0.97) numberOfStars = 8;

  const stars: CelestialObject[] = [];
  let primaryStar: CelestialObject | null = null;

  const generatedStars: CelestialObject[] = [];
  for (let s = 0; s < numberOfStars; s++) {
    const starData = generateStar(random);
    generatedStars.push(starData);
  }

  generatedStars.sort((a, b) => (b.realMass_kg || 0) - (a.realMass_kg || 0));

  for (let s = 0; s < generatedStars.length; s++) {
    const starData = generatedStars[s];
    if (s === 0) {
      primaryStar = starData;
      (starData.properties as StarProperties).isMainStar = true;
      starData.parentId = undefined;
      starData.currentParentId = undefined;
      stars.push(starData);
    } else {
      if (!primaryStar) continue;

      starData.parentId = primaryStar.id;
      (starData.properties as StarProperties).isMainStar = false;
      (starData.properties as StarProperties).partnerStars = [primaryStar.id];

      // Allow companion stars to be placed much further out, with a skew towards closer distances
      const companionDistanceAU = 0.1 + Math.pow(random(), 3) * 199.9; // Range: 0.1 to 200 AU
      const companionSMA_m = companionDistanceAU * AU_METERS;
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
        console.warn(
          `-> Updated primary star ${primaryStar.name} orbit for barycenter motion.`,
        );

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

          // Adjust companion's state to be relative to the primary's new motion
          starData.physicsStateReal.velocity_mps.add(primaryInitialVel);
          starData.physicsStateReal.position_m.add(primaryInitialRelPos);
        } catch (error) {
          console.error(
            `[generateStarsInSystem] Error calculating initial binary star physics state:`,
            error,
          );
        }
      }
      stars.push(starData);
    }
  }
  return stars;
}
