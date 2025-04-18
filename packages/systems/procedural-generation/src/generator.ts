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

/**
 * Generates the initial data for celestial objects in a solar system based on a seed string.
 * @param seed The seed string to use for generation.
 * @returns A Promise resolving to an array of CelestialObject.
 */
export async function generateSystem(seed: string): Promise<CelestialObject[]> {
  const random = await createSeededRandom(seed);

  // 1. Determine System Type & Generate Star(s)
  const systemTypeRoll = random();
  let numberOfStars = 1;
  // Target: 10% Single, 50% Binary, 25% Trinary, 15% Quaternary
  if (systemTypeRoll > 0.1) numberOfStars = 2; // 90% chance of 2+
  if (systemTypeRoll > 0.6) numberOfStars = 3; // 40% chance of 3+
  if (systemTypeRoll > 0.85) numberOfStars = 4; // 15% chance of 4

  const stars: CelestialObject[] = [];
  for (let s = 0; s < numberOfStars; s++) {
    const starData = generateStar(random);
    if (s === 0) {
      // Primary star - store it and continue
      stars.push(starData);
    } else {
      // Companion star
      const primaryStar = stars[0];
      if (!primaryStar) continue; // Should not happen, but safety check

      starData.parentId = primaryStar.id; // Orbit the primary
      (starData.properties as StarProperties).isMainStar = false;
      (starData.properties as StarProperties).partnerStars = [primaryStar.id]; // Link to primary

      // VALIDATION: Ensure companion star has correct radius for its spectral class
      if (starData.properties?.type === CelestialType.STAR) {
        const starProps = starData.properties as StarProperties;
        if (starProps.spectralClass) {
          const spectralClass = starProps.spectralClass;
          let starRadius_Solar = starData.realRadius_m / CONST.SOLAR_RADIUS_M;
          let needsCorrection = false;

          // Handle spectral class as string for legacy code support
          // This approach allows flexibility with both the new enum approach and the old string format
          const hasSpecialSuffix =
            typeof spectralClass === "string" &&
            (spectralClass.includes("D") || spectralClass.includes("P"));

          if (!hasSpecialSuffix) {
            // Extract the main spectral class value (either directly from property or from string)
            const mainSpectralClass =
              starProps.mainSpectralClass ||
              (typeof spectralClass === "string"
                ? spectralClass.charAt(0)
                : spectralClass);

            // Set minimum radii for each spectral class (in solar radii)
            const minRadii: Record<string, number> = {
              [SpectralClass.O]: 6.6, // O-type stars: 6.6+ solar radii
              [SpectralClass.B]: 3.0, // B-type stars: 3.0+ solar radii
              [SpectralClass.A]: 1.5, // A-type stars: 1.5+ solar radii
              [SpectralClass.F]: 1.15, // F-type stars: 1.15+ solar radii
              [SpectralClass.G]: 0.85, // G-type stars: 0.85+ solar radii
              [SpectralClass.K]: 0.65, // K-type stars: 0.65+ solar radii
              [SpectralClass.M]: 0.4, // M-type stars: 0.4+ solar radii
              [SpectralClass.L]: 0.2, // Brown dwarfs
              [SpectralClass.T]: 0.1, // Brown dwarfs
              [SpectralClass.Y]: 0.05, // Brown dwarfs
            };

            // If radius is too small for spectral class, correct it
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

              // Update the radius
              starData.realRadius_m = correctedRadius;
              // Update visual radius
              starData.realRadius_m = correctedRadius * SCALE.SIZE * 50.0; // Match star.ts STAR_VISUAL_SCALE_MULTIPLIER

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

      // Assign wide, somewhat eccentric orbit around primary
      const companionDistanceAU = 0.1 + random() * 10; // 10-50 AU (Reduced range)
      const companionSMA_m = companionDistanceAU * CONST.AU_TO_METERS;
      const companionEcc = 0.1 + random() * 0.4; // 0.1 - 0.5
      const companionInc = (random() - 0.5) * 0.2; // +/- 0.1 rad (~5.7 deg)
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

      // Add partner ID to primary star too
      if (primaryStar.properties?.type === CelestialType.STAR) {
        const primaryStarProps = primaryStar.properties as StarProperties;
        if (!primaryStarProps.partnerStars) {
          primaryStarProps.partnerStars = [];
        }
        primaryStarProps.partnerStars.push(starData.id);
      }

      // --- Calculate and assign orbit for the PRIMARY star around the barycenter ---
      const M1 = primaryStar.realMass_kg;
      const M2 = starData.realMass_kg;
      const M_tot = M1 + M2;

      if (M_tot > 0) {
        // Avoid division by zero if masses are somehow zero
        const primarySMA_m = (M2 / M_tot) * companionSMA_m;

        const primaryOrbit: OrbitalParameters = {
          realSemiMajorAxis_m: primarySMA_m,
          eccentricity: companionEcc, // Same eccentricity
          inclination: companionInc, // Same inclination plane
          longitudeOfAscendingNode: companionLAN, // Same node line
          argumentOfPeriapsis: (companionAOP + Math.PI) % (2 * Math.PI), // 180 deg offset
          meanAnomaly: (companionMA + Math.PI) % (2 * Math.PI), // 180 deg offset
          period_s: companionPeriod_s, // Same period
          // parentId remains undefined for the primary star
        };
        primaryStar.orbit = primaryOrbit; // Use orbit field
        console.warn(
          `-> Updated primary star ${primaryStar.name} orbit for barycenter motion.`,
        );

        // --- Calculate INITIAL STATE VECTORS for BOTH stars from orbits ---
        try {
          // Companion state (relative to primary at origin)
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
          starData.physicsStateReal.position_m = companionInitialRelPos; // Starts relative to primary at 0,0,0
          starData.physicsStateReal.velocity_mps = companionInitialVel;

          // Primary state (relative to barycenter at origin, uses companion mass as central body mass)
          const barycenterStateForPrimaryCalc: PhysicsStateReal = {
            id: "barycenter",
            mass_kg: M2, // Use Companion mass here
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

          // Add primary's velocity to companion's velocity (since companion was relative to primary)
          starData.physicsStateReal.velocity_mps.add(primaryInitialVel);
          // Add primary's position to companion's position
          starData.physicsStateReal.position_m.add(primaryInitialRelPos);
        } catch (error) {
          console.error(
            `[generateSystem] Error calculating initial binary star physics state:`,
            error,
          );
          // Decide how to handle - skip companion? continue with 0 velocity?
          // For now, we'll proceed but physics will be wrong.
        }
        // --- End initial state calculation ---
      }
      // --- End primary star orbit calculation (Moved state calculation inside this block) ---

      stars.push(starData); // Add companion to the list
    }
  }

  const celestialObjects: CelestialObject[] = [...stars]; // Initialize with all stars

  const minDistanceStepAU = 0.2; // Minimum distance between bodies
  const maxDistanceStepAU = 20; // Maximum distance can jump further out // Tweak: Reduced from 30

  const totalPotentialOrbits = Math.floor(random() * 10) + 5; // 5-14 potential orbits

  let lastBodyDistanceAU = 0.3; // Start placing bodies further out
  const maxPlacementAU = 50; // Don't place things ridiculously far out initially

  for (let i = 0; i < totalPotentialOrbits; i++) {
    // Determine distance for the next body/belt
    // Use an exponential distribution to have more bodies closer to the star
    // Scale factor 'lambda' influences density: higher lambda = denser near star
    const lambda = 0.25; // Adjust this to control clustering (e.g., 0.05 for sparser, 0.2 for denser) // Tweak: Increased from 0.1
    let distanceStepAU = -Math.log(1 - random()) / lambda;

    // Clamp the step to avoid tiny or huge jumps
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

    // --- Find the closest star to this distance ---
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
    // --- End find closest star ---

    const parentStar = closestStar; // Use the determined closest star
    const parentStarMass_kg = parentStar.realMass_kg;
    const parentStarTemp = parentStar.temperature;
    const parentStarRadius = parentStar.realRadius_m;
    const parentStarId = parentStar.id;

    // Calculate distance relative to the PARENT star's average orbit
    const parentStarOrbitRadiusAU =
      (parentStar.orbit?.realSemiMajorAxis_m ?? 0) / CONST.AU_TO_METERS;
    const distanceRelativeToParentAU = Math.abs(
      lastBodyDistanceAU + distanceStepAU - parentStarOrbitRadiusAU,
    );

    // Basic check: Don't place body inside the parent star radius
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
      // Don't update lastBodyDistanceAU here, try placing the *next* body further out
      continue; // Skip this body generation attempt
    }

    // Determine parent star state for physics calculations
    const parentStarState = parentStar.physicsStateReal;

    // Decide whether to generate a planet or an asteroid belt
    const bodyTypeRoll = random();
    if (bodyTypeRoll < 0.15) {
      // Generate Asteroid Belt
      // Clamp distance to 2-10 AU for belts
      if (
        distanceRelativeToParentAU < 2.0 ||
        distanceRelativeToParentAU > 10.0
      ) {
        console.log(
          ` -> Skipping asteroid belt generation at ${distanceRelativeToParentAU.toFixed(2)} AU (outside 2-10 AU range).`,
        );
        // Update lastBodyDistanceAU anyway to prevent getting stuck trying to place belt here
        lastBodyDistanceAU += distanceStepAU;
        continue; // Skip to next potential orbit slot
      }

      const beltData = generateAsteroidBelt(
        random,
        parentStarId,
        parentStarMass_kg, // Pass parent mass
        i, // Use loop index for naming
        distanceRelativeToParentAU, // Use distance relative to parent star
      );
      if (beltData) {
        celestialObjects.push(beltData);
      }
    } else {
      // Generate Planet
      const { generatedObjects, planetMass_kg, planetRadius_m } =
        generatePlanet(
          random,
          parentStarId,
          parentStarMass_kg,
          parentStarTemp,
          parentStarRadius,
          distanceRelativeToParentAU, // Use distance relative to parent star
          seed,
          parentStarState, // Pass the parent state
        );

      // --- MODIFIED: Handle the array of generated objects ---
      if (generatedObjects && generatedObjects.length > 0) {
        // Find the actual planet object (should be the first non-null one that's not a ring system)
        const planetObject = generatedObjects.find(
          (obj) => obj && obj.type !== CelestialType.RING_SYSTEM,
        ) as CelestialObject | null;

        // Add all generated objects (planet + potential ring system) to the main list
        generatedObjects.forEach((obj) => {
          if (obj) {
            celestialObjects.push(obj);
          }
        });

        // 3. Generate Moons for this Planet (only if it's not too close to the star)
        // Make sure we have a valid planet object before generating moons
        if (planetObject && distanceRelativeToParentAU > 0.3) {
          // Use the found planetObject
          const numberOfMoons = Math.floor(random() * 5); // 0 to 4 moons
          let lastMoonDistance_radii = 2.5; // Start placing moons outside Roche limit approximation

          for (let m = 0; m < numberOfMoons; m++) {
            const { moonData, nextLastMoonDistance_radii } = generateMoon(
              random,
              planetObject, // Pass the actual planet object
              planetMass_kg,
              planetRadius_m,
              lastMoonDistance_radii,
              seed,
            );
            if (moonData) {
              celestialObjects.push(moonData);
              lastMoonDistance_radii = nextLastMoonDistance_radii;
            } else {
              // Stop trying to add moons if one fails (e.g., orbit too close)
              break;
            }
          }
        }
        // --- End Moon Generation ---
      }
      // --- End Handling Generated Objects ---
    }
    // Update lastBodyDistanceAU based on the original intended distance for the next placement step
    lastBodyDistanceAU += distanceStepAU;
  }

  // --- Generate Oort Cloud ---
  const primaryStar = stars[0]; // Assuming the first star is the primary parent
  // TODO: Add Oort Cloud generation back in - at the moment it's a
  // performance issue and doesn't look good.
  // if (primaryStar) {
  //     const oortCloud = generateOortCloud(random, primaryStar);
  //     if (oortCloud) {
  //         celestialObjects.push(oortCloud);
  //     } else {
  //         console.error("Failed to generate Oort Cloud.");
  //     }
  // }
  // --- End Oort Cloud Generation ---

  // --- Ensure at least one asteroid belt ---
  const hasAsteroidBelt = celestialObjects.some(
    (obj) => obj.type === CelestialType.ASTEROID_FIELD,
  );
  if (!hasAsteroidBelt && primaryStar) {
    // Place guaranteed asteroid belt between 2-6 AU from primary star
    const guaranteedBeltDistanceAU = 2.0 + random() * 4.0;
    console.log(
      ` -> Adding guaranteed asteroid belt at ${guaranteedBeltDistanceAU.toFixed(2)} AU`,
    );

    const beltData = generateAsteroidBelt(
      random,
      primaryStar.id,
      primaryStar.realMass_kg,
      totalPotentialOrbits, // Use totalPotentialOrbits as index for naming
      guaranteedBeltDistanceAU,
    );

    if (beltData) {
      celestialObjects.push(beltData);
    } else {
      console.error("Failed to generate guaranteed asteroid belt.");
    }
  }
  // --- End ensure asteroid belt ---

  return celestialObjects;
}
