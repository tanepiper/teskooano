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
import {
  EMPTY,
  Observable,
  catchError,
  concat,
  concatMap,
  from,
  mergeMap,
  of,
  range,
  scan,
  toArray,
} from "rxjs";
import * as CONST from "./constants";
import {
  generateMoonsObservable,
  generatePlanet,
  generateStar,
  generateAsteroidBelt,
} from "./generators";
import { createSeededRandom } from "./seeded-random";
import * as UTIL from "./utils";
import { validateAndCorrectHierarchy } from "./validation";

/**
 * Generates the initial data for celestial objects in a solar system based on a seed string.
 * @param seed The seed string to use for generation.
 * @returns A Promise resolving to an Observable stream of CelestialObjects.
 */
export async function generateSystem(
  seed: string,
): Promise<{ objects$: Observable<CelestialObject> }> {
  const random = await createSeededRandom(seed);

  // Generate stars first (synchronously within the async function)
  const systemTypeRoll = random();
  let numberOfStars = 1;
  if (systemTypeRoll > 0.1) numberOfStars = 2;
  if (systemTypeRoll > 0.6) numberOfStars = 3;
  if (systemTypeRoll > 0.85) numberOfStars = 4;

  const stars: CelestialObject[] = [];
  let primaryStar: CelestialObject | null = null; // Track primary for binary adjustments

  // Generate all stars first
  const generatedStars: CelestialObject[] = [];
  for (let s = 0; s < numberOfStars; s++) {
    const starData = generateStar(random);
    generatedStars.push(starData);
  }

  // Sort by mass to ensure main star is most massive
  generatedStars.sort((a, b) => (b.realMass_kg || 0) - (a.realMass_kg || 0));

  // Process stars with correct hierarchy
  for (let s = 0; s < generatedStars.length; s++) {
    const starData = generatedStars[s];
    if (s === 0) {
      // This is the most massive star - make it the main star
      primaryStar = starData;
      (starData.properties as StarProperties).isMainStar = true;
      starData.parentId = undefined;
      starData.currentParentId = undefined;
      stars.push(starData);
    } else {
      if (!primaryStar) continue; // Should not happen if s > 0

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

  // Create the main Observable stream
  const objects$ = new Observable<CelestialObject>((subscriber) => {
    // Emit stars first
    stars.forEach((star) => subscriber.next(star));

    const minDistanceStepAU = 0.2;
    const maxDistanceStepAU = 20;
    const totalPotentialOrbits = Math.floor(random() * 10) + 5;
    const maxPlacementAU = 50;

    // Use RxJS stream for orbital bodies
    const bodyGenerationPipeline$ = range(0, totalPotentialOrbits).pipe(
      // Calculate state for each potential orbit slot (distance, parent star)
      scan(
        (acc, index) => {
          const lambda = 0.25;
          let distanceStepAU = -Math.log(1 - random()) / lambda;
          distanceStepAU = Math.max(
            minDistanceStepAU,
            Math.min(maxDistanceStepAU, distanceStepAU),
          );

          const nextDistanceAU = acc.lastBodyDistanceAU + distanceStepAU;

          if (nextDistanceAU > maxPlacementAU) {
            console.warn(
              ` -> Reached max placement distance (${maxPlacementAU} AU). Stopping body generation.`,
            );
            // How to stop the range early? Throwing an error or using takeWhile perhaps.
            // For now, just mark as invalid.
            return { ...acc, index, isValidSlot: false };
          }

          // Find closest star for parenting
          let closestStar = stars[0];
          let minDistanceDiff = Infinity;
          for (const star of stars) {
            const starOrbitRadiusAU =
              (star.orbit?.realSemiMajorAxis_m ?? 0) / CONST.AU_TO_METERS;
            const distanceDiff = Math.abs(nextDistanceAU - starOrbitRadiusAU);
            if (distanceDiff < minDistanceDiff) {
              minDistanceDiff = distanceDiff;
              closestStar = star;
            }
          }

          const parentStar = closestStar;
          const parentStarOrbitRadiusAU =
            (parentStar.orbit?.realSemiMajorAxis_m ?? 0) / CONST.AU_TO_METERS;
          const distanceRelativeToParentAU = Math.abs(
            nextDistanceAU - parentStarOrbitRadiusAU,
          );

          // Check proximity to parent star radius
          if (
            distanceRelativeToParentAU * CONST.AU_TO_METERS <
            parentStar.realRadius_m * 1.5
          ) {
            console.warn(
              ` -> Skipping body at ${nextDistanceAU.toFixed(2)} AU - too close to parent star ${parentStar.name}.`,
            );
            return {
              ...acc,
              index,
              lastBodyDistanceAU: nextDistanceAU,
              isValidSlot: false,
            }; // Update distance, but mark slot invalid
          }

          return {
            index,
            lastBodyDistanceAU: nextDistanceAU,
            parentStar,
            distanceRelativeToParentAU,
            isValidSlot: true,
          };
        },
        {
          index: -1,
          lastBodyDistanceAU: 0.3,
          parentStar: stars[0],
          distanceRelativeToParentAU: 0,
          isValidSlot: false,
        },
      ),
      // Generate bodies only for valid slots
      concatMap((slotState) => {
        if (!slotState.isValidSlot) {
          return EMPTY; // Skip invalid slots
        }

        const { index, parentStar, distanceRelativeToParentAU } = slotState;
        const parentStarId = parentStar.id;
        const parentStarMass_kg = parentStar.realMass_kg;
        const parentStarTemp = parentStar.temperature;
        const parentStarRadius = parentStar.realRadius_m;
        const parentStarState = parentStar.physicsStateReal;

        const bodyTypeRoll = random();

        // Asteroid Belt
        if (bodyTypeRoll < 0.15) {
          if (
            distanceRelativeToParentAU < 2.0 ||
            distanceRelativeToParentAU > 10.0
          ) {
            return EMPTY; // Invalid distance for belt
          }
          const beltData = generateAsteroidBelt(
            random,
            parentStarId,
            parentStarMass_kg,
            index, // Use index from range
            distanceRelativeToParentAU,
          );
          return beltData ? of(beltData) : EMPTY;
        }
        // Planet and Moons
        else {
          const planet$ = generatePlanet(
            random,
            parentStarId,
            parentStarMass_kg,
            parentStarTemp,
            parentStarRadius,
            distanceRelativeToParentAU,
            seed,
            parentStarState,
          );

          return planet$.pipe(
            // For each object emitted by generatePlanet (planet, then rings)
            mergeMap((planetOrRingObject) => {
              // If it's the planet object, generate moons for it
              if (planetOrRingObject.type !== CelestialType.RING_SYSTEM) {
                const moon$ = generateMoonsObservable(
                  random,
                  planetOrRingObject,
                  planetOrRingObject.realMass_kg,
                  planetOrRingObject.realRadius_m,
                  seed,
                );
                // Emit planet, then its moons
                return concat(of(planetOrRingObject), moon$);
              }
              // If it's the ring system, just emit it
              else {
                return of(planetOrRingObject);
              }
            }),
          );
        }
      }),
      // Collect all generated bodies into an array to check for asteroid belt
      toArray(),
      // Handle the guaranteed asteroid belt
      mergeMap((generatedBodies) => {
        const hasAsteroidBelt = generatedBodies.some(
          (obj) => obj.type === CelestialType.ASTEROID_FIELD,
        );
        let guaranteedBelt$: Observable<CelestialObject> = EMPTY;

        const effectivePrimaryStar =
          stars.find(
            (s) => (s.properties as StarProperties)?.isMainStar !== false,
          ) ?? stars[0];

        if (!hasAsteroidBelt && effectivePrimaryStar) {
          const guaranteedBeltDistanceAU = 2.0 + random() * 4.0;
          const beltData = generateAsteroidBelt(
            random,
            effectivePrimaryStar.id,
            effectivePrimaryStar.realMass_kg,
            totalPotentialOrbits, // Use a distinct index?
            guaranteedBeltDistanceAU,
          );
          if (beltData) {
            guaranteedBelt$ = of(beltData);
          } else {
            console.error("Failed to generate guaranteed asteroid belt.");
          }
        }

        // Emit the bodies generated in the loop, then the guaranteed belt (if any)
        return concat(from(generatedBodies), guaranteedBelt$);
      }),
      catchError((err) => {
        console.error("Error in body generation pipeline:", err);
        subscriber.error(err);
        return EMPTY;
      }),
    );

    // Subscribe the main subscriber to the pipeline
    const subscription = bodyGenerationPipeline$.subscribe({
      next: (obj) => subscriber.next(obj),
      error: (err) => subscriber.error(err),
      complete: () => subscriber.complete(),
    });

    // Return cleanup function
    return () => {
      subscription.unsubscribe();
    };
  });

  // Collect all objects, validate hierarchy, then emit validated objects
  const validatedObjects$ = objects$.pipe(
    toArray(),
    mergeMap((allObjects) => {
      console.log(
        `[generateSystem] Generated ${allObjects.length} objects. Validating hierarchy...`,
      );
      const validatedObjects = validateAndCorrectHierarchy(allObjects);
      console.log(
        `[generateSystem] Validation complete. Emitting ${validatedObjects.length} validated objects.`,
      );
      return from(validatedObjects);
    }),
    catchError((err) => {
      console.error("[generateSystem] Error during validation:", err);
      throw err;
    }),
  );

  // Return the validated observable stream
  return { objects$: validatedObjects$ };
}
