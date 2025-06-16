import { utils } from "@teskooano/core-math";
import { type CelestialObject, AU_METERS } from "@teskooano/data-types";
import type { CelestialZone } from "../zones";

export interface BodyPlacement {
  distanceAU: number;
  parentStar: CelestialObject;
  distanceRelativeToParentAU: number;
}

export function generateBodyDistances(
  random: () => number,
  zones: CelestialZone[],
  stars: CelestialObject[],
): BodyPlacement[] {
  const placements: { distanceAU: number }[] = [];

  zones.forEach((zone) => {
    const numBodies =
      zone.minBodies + Math.floor(random() * (zone.maxAdditionalBodies + 1));

    for (let i = 0; i < numBodies; i++) {
      const distance = utils.lerp(zone.minAU, zone.maxAU, random());
      placements.push({ distanceAU: distance });
    }
  });

  const finalPlacements = placements
    .sort((a, b) => a.distanceAU - b.distanceAU)
    .map((placement) => {
      let closestStar = stars[0];
      let minDistanceDiff = Infinity;

      for (const star of stars) {
        const starOrbitRadiusAU =
          (star.orbit?.realSemiMajorAxis_m ?? 0) / AU_METERS;
        const distanceDiff = Math.abs(placement.distanceAU - starOrbitRadiusAU);
        if (distanceDiff < minDistanceDiff) {
          minDistanceDiff = distanceDiff;
          closestStar = star;
        }
      }

      const parentStarOrbitRadiusAU =
        (closestStar.orbit?.realSemiMajorAxis_m ?? 0) / AU_METERS;
      const distanceRelativeToParentAU = Math.abs(
        placement.distanceAU - parentStarOrbitRadiusAU,
      );

      // Filter out bodies too close to their parent star
      if (
        distanceRelativeToParentAU * AU_METERS <
        closestStar.realRadius_m * 1.5
      ) {
        return null;
      }

      return {
        distanceAU: placement.distanceAU,
        parentStar: closestStar,
        distanceRelativeToParentAU: distanceRelativeToParentAU,
      };
    })
    .filter((p): p is BodyPlacement => p !== null);

  return finalPlacements;
}
