import { OSVector3 } from "@teskooano/core-math";
import type { CelestialObject, StarProperties } from "@teskooano/data-types";
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
  filter,
  take,
} from "rxjs";
import * as CONST from "../constants";
import {
  generateMoonsObservable,
  generatePlanet,
  generateAsteroidBelt,
} from "../celestials";

/**
 * Generates planetary bodies (planets, moons, asteroid belts) for the system.
 * @param random The seeded random function.
 * @param stars The array of already generated stars.
 * @param seed The original seed string for the system.
 * @param maxOrbitalSystemsToGenerate Max number of primary orbital systems around stars.
 * @returns An Observable stream of generated planetary CelestialObjects.
 */
export function generatePlanetaryBodiesObservable(
  random: () => number,
  stars: CelestialObject[],
  seed: string,
  maxOrbitalSystemsToGenerate: number,
): Observable<CelestialObject> {
  const minDistanceStepAU = 0.2;
  const maxDistanceStepAU = 20;
  const totalPotentialOrbits = 300;
  const maxPlacementAU = 500;

  const PARENT_STAR_PROXIMITY_MULTIPLIER = 1.5;
  const OTHER_STAR_PROXIMITY_MULTIPLIER = 1.2;

  return range(0, totalPotentialOrbits).pipe(
    scan(
      (acc, index) => {
        const lambda = 0.8;
        let distanceStepAU = -Math.log(1 - random()) / lambda;
        distanceStepAU = Math.max(
          minDistanceStepAU,
          Math.min(maxDistanceStepAU, distanceStepAU),
        );

        const nextDistanceAU = acc.lastBodyDistanceAU + distanceStepAU;

        if (nextDistanceAU > maxPlacementAU) {
          console.warn(
            ` -> Slot at ${nextDistanceAU.toFixed(2)} AU is beyond max placement distance (${maxPlacementAU} AU). Marking slot invalid.`,
          );
          return {
            ...acc,
            index,
            lastBodyDistanceAU: nextDistanceAU,
            isValidSlot: false,
          };
        }

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

        if (
          distanceRelativeToParentAU * CONST.AU_TO_METERS <
          parentStar.realRadius_m * PARENT_STAR_PROXIMITY_MULTIPLIER
        ) {
          console.warn(
            ` -> Slot at ${nextDistanceAU.toFixed(2)} AU (rel: ${distanceRelativeToParentAU.toFixed(2)} AU from ${parentStar.name}) too close to parent. Skipping. Parent radius: ${(parentStar.realRadius_m / CONST.AU_TO_METERS).toFixed(2)} AU.`,
          );
          return {
            ...acc,
            index,
            lastBodyDistanceAU: nextDistanceAU,
            isValidSlot: false,
          };
        }

        for (const otherStar of stars) {
          if (otherStar.id === parentStar.id) {
            continue;
          }

          const parentPosVec =
            parentStar.physicsStateReal?.position_m || new OSVector3(0, 0, 0);
          const otherPosVec =
            otherStar.physicsStateReal?.position_m || new OSVector3(0, 0, 0);
          const vecOtherToParent = parentPosVec.clone().sub(otherPosVec);
          const distOtherToParent_m = vecOtherToParent.length();
          const planetOrbitRadius_m =
            distanceRelativeToParentAU * CONST.AU_TO_METERS;
          const minPlanetToOtherStarCenter_m = Math.abs(
            distOtherToParent_m - planetOrbitRadius_m,
          );

          if (
            minPlanetToOtherStarCenter_m <
            otherStar.realRadius_m * OTHER_STAR_PROXIMITY_MULTIPLIER
          ) {
            console.warn(
              ` -> Slot at ${nextDistanceAU.toFixed(2)} AU (orbiting ${parentStar.name} at ${distanceRelativeToParentAU.toFixed(2)} AU) potentially too close to OTHER star ${otherStar.name}. Min separation to other star center: ${(minPlanetToOtherStarCenter_m / CONST.AU_TO_METERS).toFixed(2)} AU. Other star radius: ${(otherStar.realRadius_m / CONST.AU_TO_METERS).toFixed(2)} AU. Dist Parent-Other: ${(distOtherToParent_m / CONST.AU_TO_METERS).toFixed(2)} AU. Skipping.`,
            );
            return {
              ...acc,
              index,
              lastBodyDistanceAU: nextDistanceAU,
              isValidSlot: false,
            };
          }
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
        lastBodyDistanceAU: 0.3, // Initial offset from system center
        parentStar: stars[0], // Default parent
        distanceRelativeToParentAU: 0,
        isValidSlot: false,
      },
    ),
    filter((slotState) => slotState.isValidSlot),
    take(maxOrbitalSystemsToGenerate),
    concatMap((slotState) => {
      const { index, parentStar, distanceRelativeToParentAU } = slotState;
      const parentStarId = parentStar.id;
      const parentStarMass_kg = parentStar.realMass_kg;
      const parentStarTemp = parentStar.temperature;
      const parentStarRadius = parentStar.realRadius_m;
      const parentStarState = parentStar.physicsStateReal;

      const bodyTypeRoll = random();

      if (bodyTypeRoll < 0.15) {
        if (
          distanceRelativeToParentAU < 2.0 ||
          distanceRelativeToParentAU > 10.0
        ) {
          return EMPTY;
        }
        const beltData = generateAsteroidBelt(
          random,
          parentStarId,
          parentStarMass_kg,
          index,
          distanceRelativeToParentAU,
        );
        return beltData ? of(beltData) : EMPTY;
      } else {
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
          mergeMap((planetOrRingObject) => {
            if (planetOrRingObject.type !== CelestialType.RING_SYSTEM) {
              const moon$ = generateMoonsObservable(
                random,
                planetOrRingObject,
                planetOrRingObject.realMass_kg,
                planetOrRingObject.realRadius_m,
                seed,
              );
              return concat(of(planetOrRingObject), moon$);
            } else {
              return of(planetOrRingObject);
            }
          }),
        );
      }
    }),
    toArray(),
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
          totalPotentialOrbits, // Unique index
          guaranteedBeltDistanceAU,
        );
        if (beltData) {
          guaranteedBelt$ = of(beltData);
        } else {
          console.error("Failed to generate guaranteed asteroid belt.");
        }
      }
      return concat(from(generatedBodies), guaranteedBelt$);
    }),
    catchError((err) => {
      console.error("Error in planetary body generation pipeline:", err);
      // Rethrow or return an error observable if needed by the caller
      throw err;
    }),
  );
}
