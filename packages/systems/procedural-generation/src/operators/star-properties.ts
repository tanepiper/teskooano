import type { CelestialObject, StarProperties } from "@teskooano/data-types";

/**
 * Updates star properties for binary systems
 */
export function updateStarPropertiesForBinary(
  primary: CelestialObject,
  companion: CelestialObject,
): void {
  const primaryProps = primary.properties as StarProperties;
  const companionProps = companion.properties as StarProperties;

  // Set primary/secondary status
  primaryProps.isMainStar = true;
  companionProps.isMainStar = false;

  // Link the stars
  if (!primaryProps.partnerStars) {
    primaryProps.partnerStars = [];
  }
  if (!companionProps.partnerStars) {
    companionProps.partnerStars = [];
  }

  if (!primaryProps.partnerStars.includes(companion.id)) {
    primaryProps.partnerStars.push(companion.id);
  }
  if (!companionProps.partnerStars.includes(primary.id)) {
    companionProps.partnerStars.push(primary.id);
  }
}

/**
 * Updates star properties for multiple star systems
 */
export function updateStarPropertiesForMultiple(
  star: CelestialObject,
  companions: CelestialObject[],
): void {
  const starProps = star.properties as StarProperties;
  starProps.isMainStar = false; // Tertiary is never the main star
  starProps.partnerStars = companions.map((c) => c.id);

  // Update companions to include this star
  companions.forEach((companion) => {
    const companionProps = companion.properties as StarProperties;
    if (!companionProps.partnerStars) {
      companionProps.partnerStars = [];
    }
    companionProps.partnerStars.push(star.id);
  });
}

/**
 * Updates star properties for contact binary systems
 */
export function updateStarPropertiesForContact(
  random: () => number,
  primary: CelestialObject,
  companion: CelestialObject,
): void {
  updateStarPropertiesForBinary(primary, companion);

  // Contact binaries can have enhanced activity and mass transfer effects
  // This could affect temperature, luminosity, and stellar winds
  const primaryProps = primary.properties as StarProperties;
  const companionProps = companion.properties as StarProperties;

  // Slightly enhance luminosity due to interaction effects
  primaryProps.luminosity *= 1.0 + random() * 0.2;
  companionProps.luminosity *= 1.0 + random() * 0.2;
}
