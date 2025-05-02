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
  OortCloudProperties,
} from "@teskooano/data-types";
import {
  CelestialType,
  SCALE,
  SpectralClass,
  CelestialStatus,
} from "@teskooano/data-types";
import * as CONST from "./constants";
import { generateAsteroidBelt } from "./generators/asteroidBelt";
import { generateMoon } from "./generators/moon";
import { generatePlanet } from "./generators/planet";
import { generateOortCloud } from "./generators/oortCloud";
import { generateStar } from "./generators/star";
import { createSeededRandom } from "./seeded-random";
import * as UTIL from "./utils";

function generateSystemName(random: () => number): string {
  const prefixes = [
    "Andromeda",
    "Orion",
    "Cygnus",
    "Draco",
    "Lyra",
    "Aquila",
    "Pegasus",
    "Ursa",
    "Virgo",
    "Centaurus",
    "Kepler",
    "Gliese",
    "HD",
    "HIP",
    "Tau",
    "Epsilon",
    "Zeta",
  ];
  const separators = ["-", " ", ""];
  const suffixes = [
    "Prime",
    "Secundus",
    "Tertius",
    "Minor",
    "Major",
    "Alpha",
    "Beta",
    "Gamma",
    "Delta",
    "Epsilon",
    "Zeta",
    "Eta",
    "Theta",
    "Iota",
    "Kappa",
    "Lambda",
    "Mu",
    "Nu",
    "Xi",
    "Omicron",
    "Pi",
    "Rho",
    "Sigma",
    "Tau",
    "Upsilon",
    "Phi",
    "Chi",
    "Psi",
    "Omega",
  ];

  const prefix = prefixes[Math.floor(random() * prefixes.length)];
  const separator = separators[Math.floor(random() * separators.length)];

  let designation = "";

  if (random() < 0.7) {
    designation = String(Math.floor(random() * 999) + 1);

    if (random() < 0.3) {
      designation += String.fromCharCode(65 + Math.floor(random() * 6));
    }
  } else {
    designation = suffixes[Math.floor(random() * suffixes.length)];
  }

  return `${prefix}${separator}${designation}`;
}

/**
 * Generates the initial data for celestial objects and a name for a solar system based on a seed string.
 * @param seed The seed string to use for generation.
 * @returns A Promise resolving to an object containing the system name and an array of CelestialObjects.
 */
export async function generateSystem(
  seed: string,
): Promise<{ systemName: string; objects: CelestialObject[] }> {
  const random = await createSeededRandom(seed);

  const systemName = generateSystemName(random);

  const systemTypeRoll = random();
  let numberOfStars = 1;

  if (systemTypeRoll > 0.1) numberOfStars = 2;
  if (systemTypeRoll > 0.6) numberOfStars = 3;
  if (systemTypeRoll > 0.85) numberOfStars = 4;

  const stars: CelestialObject[] = [];
  for (let s = 0; s < numberOfStars; s++) {
    const starData = generateStar(random);
    if (s === 0) {
      stars.push(starData);
    } else {
      const primaryStar = stars[0];
      if (!primaryStar) continue;

      starData.parentId = primaryStar.id;
      (starData.properties as StarProperties).isMainStar = false;
      (starData.properties as StarProperties).partnerStars = [primaryStar.id];

      if (starData.properties?.type === CelestialType.STAR) {
        const starProps = starData.properties as StarProperties;
        if (starProps.spectralClass) {
          const spectralClass = starProps.spectralClass;
          let starRadius_Solar = starData.realRadius_m / CONST.SOLAR_RADIUS_M;
          let needsCorrection = false;

          const hasSpecialSuffix =
            typeof spectralClass === "string" &&
            (spectralClass.includes("D") || spectralClass.includes("P"));

          if (!hasSpecialSuffix) {
            const mainSpectralClass =
              starProps.mainSpectralClass ||
              (typeof spectralClass === "string"
                ? spectralClass.charAt(0)
                : spectralClass);

            const minRadii: Record<string, number> = {
              [SpectralClass.O]: 6.6,
              [SpectralClass.B]: 3.0,
              [SpectralClass.A]: 1.5,
              [SpectralClass.F]: 1.15,
              [SpectralClass.G]: 0.85,
              [SpectralClass.K]: 0.65,
              [SpectralClass.M]: 0.4,
              [SpectralClass.L]: 0.2,
              [SpectralClass.T]: 0.1,
              [SpectralClass.Y]: 0.05,
            };

            if (
              mainSpectralClass in minRadii &&
              starRadius_Solar < minRadii[mainSpectralClass as string]
            ) {
              const oldRadius = starData.realRadius_m;
              const correctedRadius_Solar =
                minRadii[mainSpectralClass as string];
              const correctedRadius =
                correctedRadius_Solar * CONST.SOLAR_RADIUS_M;

              console.warn(
                `Correcting undersized companion ${spectralClass}-type star radius: ` +
                  `${(oldRadius / 1000).toFixed(0)} km -> ${(
                    correctedRadius / 1000
                  ).toFixed(0)} km`,
              );

              starData.realRadius_m = correctedRadius;

              starData.realRadius_m = correctedRadius * SCALE.SIZE * 50.0;

              needsCorrection = true;
            }
          } else {
            console.warn(
              `-> Skipping radius validation for exotic companion star ${starData.name} with spectral class ${spectralClass}`,
            );
          }

          if (needsCorrection) {
            console.warn(
              `-> Applied radius correction to companion star ${starData.name}`,
            );
          }
        }
      }

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

  const celestialObjects: CelestialObject[] = [...stars];

  const minDistanceStepAU = 0.2;
  const maxDistanceStepAU = 20;

  const totalPotentialOrbits = Math.floor(random() * 10) + 5;

  let lastBodyDistanceAU = 0.3;
  const maxPlacementAU = 50;

  for (let i = 0; i < totalPotentialOrbits; i++) {
    const lambda = 0.25;
    let distanceStepAU = -Math.log(1 - random()) / lambda;

    distanceStepAU = Math.max(
      minDistanceStepAU,
      Math.min(maxDistanceStepAU, distanceStepAU),
    );

    if (lastBodyDistanceAU + distanceStepAU > maxPlacementAU) {
      console.warn(
        ` -> Reached max placement distance (${maxPlacementAU} AU). Stopping body generation.`,
      );
      break;
    }

    let closestStar = stars[0];
    let minDistanceDiff = Infinity;

    for (const star of stars) {
      const starOrbitRadiusAU =
        (star.orbit?.realSemiMajorAxis_m ?? 0) / CONST.AU_TO_METERS;
      const distanceDiff = Math.abs(
        lastBodyDistanceAU + distanceStepAU - starOrbitRadiusAU,
      );

      if (distanceDiff < minDistanceDiff) {
        minDistanceDiff = distanceDiff;
        closestStar = star;
      }
    }

    const parentStar = closestStar;
    const parentStarMass_kg = parentStar.realMass_kg;
    const parentStarTemp = parentStar.temperature;
    const parentStarRadius = parentStar.realRadius_m;
    const parentStarId = parentStar.id;

    const parentStarOrbitRadiusAU =
      (parentStar.orbit?.realSemiMajorAxis_m ?? 0) / CONST.AU_TO_METERS;
    const distanceRelativeToParentAU = Math.abs(
      lastBodyDistanceAU + distanceStepAU - parentStarOrbitRadiusAU,
    );

    if (
      distanceRelativeToParentAU * CONST.AU_TO_METERS <
      parentStarRadius * 1.5
    ) {
      console.warn(
        ` -> Skipping body at ${lastBodyDistanceAU.toFixed(
          2,
        )} AU - calculated position relative to parent ${
          parentStar.name
        } (${distanceRelativeToParentAU.toFixed(
          2,
        )} AU) is too close to star radius (${(
          parentStarRadius / CONST.AU_TO_METERS
        ).toFixed(4)} AU).`,
      );

      continue;
    }

    const parentStarState = parentStar.physicsStateReal;

    const bodyTypeRoll = random();
    if (bodyTypeRoll < 0.15) {
      if (
        distanceRelativeToParentAU < 2.0 ||
        distanceRelativeToParentAU > 10.0
      ) {
        lastBodyDistanceAU += distanceStepAU;
        continue;
      }

      const beltData = generateAsteroidBelt(
        random,
        parentStarId,
        parentStarMass_kg,
        i,
        distanceRelativeToParentAU,
      );
      if (beltData) {
        celestialObjects.push(beltData);
      }
    } else {
      const { generatedObjects, planetMass_kg, planetRadius_m } =
        generatePlanet(
          random,
          parentStarId,
          parentStarMass_kg,
          parentStarTemp,
          parentStarRadius,
          distanceRelativeToParentAU,
          seed,
          parentStarState,
        );

      if (generatedObjects && generatedObjects.length > 0) {
        const planetObject = generatedObjects.find(
          (obj) => obj && obj.type !== CelestialType.RING_SYSTEM,
        ) as CelestialObject | null;

        generatedObjects.forEach((obj) => {
          if (obj) {
            celestialObjects.push(obj);
          }
        });

        if (planetObject && distanceRelativeToParentAU > 0.3) {
          const numberOfMoons = Math.floor(random() * 5);
          let lastMoonDistance_radii = 2.5;

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
              celestialObjects.push(moonData);
              lastMoonDistance_radii = nextLastMoonDistance_radii;
            } else {
              break;
            }
          }
        }
      }
    }

    lastBodyDistanceAU += distanceStepAU;
  }

  const primaryStar = stars[0];

  const hasAsteroidBelt = celestialObjects.some(
    (obj) => obj.type === CelestialType.ASTEROID_FIELD,
  );
  if (!hasAsteroidBelt && primaryStar) {
    const guaranteedBeltDistanceAU = 2.0 + random() * 4.0;

    const beltData = generateAsteroidBelt(
      random,
      primaryStar.id,
      primaryStar.realMass_kg,
      totalPotentialOrbits,
      guaranteedBeltDistanceAU,
    );

    if (beltData) {
      celestialObjects.push(beltData);
    } else {
      console.error("Failed to generate guaranteed asteroid belt.");
    }
  }

  return { systemName, objects: celestialObjects };
}
