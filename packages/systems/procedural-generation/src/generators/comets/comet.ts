import { createOrbitalElements } from "@teskooano/core-physics";
import {
  CelestialObject,
  CelestialStatus,
  CelestialType,
  CometClass,
  type CometProperties,
  type OrbitalParameters,
  type StarProperties,
} from "@teskooano/data-types";
import { OSVector3 } from "@teskooano/core-math";
import * as CONST from "../../constants";
import * as UTIL from "../../utils";
import { generateCelestialName } from "../names/celestial-name";

/**
 * Generates data for a single comet with a highly elliptical and inclined orbit,
 * typical of long-period comets originating from the outer system.
 *
 * @param random The seeded pseudo-random number generator function.
 * @param parentStar The parent star `CelestialObject`.
 * @param distanceAU The perihelion distance for the comet's orbit in AU.
 * @param index The index in the generation loop for deterministic naming.
 * @returns A `CelestialObject` for the comet, or `null` if parameters are invalid.
 */
export function generateComet(
  random: () => number,
  parentStar: CelestialObject,
  distanceAU: number, // This will be used as the basis for the orbit
  index: number,
): CelestialObject | null {
  // For comets with highly elliptical orbits, we need to check if the aphelion
  // stays within the system boundary. If the provided distance would result in
  // an orbit that exceeds the boundary, we need to adjust it.

  // First, generate a sample eccentricity to check the orbit
  const sampleEccentricity = 0.8 + random() * 0.199; // 0.8 - 0.999

  // Check if this orbit would exceed the boundary
  if (!UTIL.isOrbitWithinSystemBoundary(distanceAU, sampleEccentricity)) {
    // Calculate the maximum distance that would keep the aphelion within bounds
    // For a given eccentricity: maxSemiMajorAxis = BOUNDARY / (1 + eccentricity)
    const maxSemiMajorAxisAU =
      CONST.SYSTEM_MAX_DISTANCE_AU / (1 + sampleEccentricity);

    if (maxSemiMajorAxisAU < 10) {
      // If the maximum semi-major axis is too small for a meaningful comet orbit, skip
      return null;
    }

    // Use the adjusted distance instead
    distanceAU = Math.min(distanceAU, maxSemiMajorAxisAU);
  }

  // Validate final distance is within system boundary
  if (distanceAU > CONST.SYSTEM_MAX_DISTANCE_AU) {
    return null;
  }

  const starId = parentStar.id;
  const starMass_kg = parentStar.realMass_kg;

  if (starMass_kg <= 0 || !Number.isFinite(starMass_kg)) {
    return null;
  }

  const cometName = generateCelestialName(random);
  const cometId = `comet-${starId}-${cometName.toLowerCase().replace(/\s+/g, "-")}`;

  // Comets are small, icy bodies with low density
  const nucleusRadius_km = 1 + random() * 20; // 1-21 km radius
  const nucleusRadius_m = nucleusRadius_km * 1000;
  const density = 600; // Low density for comets (kg/m^3)
  const mass_kg = (4 / 3) * Math.PI * Math.pow(nucleusRadius_m, 3) * density;

  // Generate a highly elliptical and inclined orbit
  const orbit = generateCometOrbit(random, distanceAU, starMass_kg, mass_kg);

  const cometProperties: CometProperties = {
    type: CelestialType.COMET,
    classType: CometClass.ACTIVE,
    composition: CONST.ICE_COMPOSITION,
    activity: 0.5 + random() * 0.5, // Active comets
    visualComaRadius: nucleusRadius_m * (50 + random() * 50), // Scale factor for visual representation
    visualComaColor: "#C8DCFF",
    visualComaOpacity: 0.5,
    visualMaxTailLength: orbit.realSemiMajorAxis_m * 0.1, // Tail can be 10% of SMA
    visualTailColor: "#DCE6FF",
    visualTailOpacity: 0.6,
  };

  // Calculate realistic temperature based on the parent star's properties
  const cometTemperature = calculateCometTemperature(distanceAU, parentStar);

  const comet: CelestialObject = {
    id: cometId,
    name: cometName,
    type: CelestialType.COMET,
    status: CelestialStatus.ACTIVE,
    parentId: starId,
    realMass_kg: mass_kg,
    realRadius_m: nucleusRadius_m,
    temperature: cometTemperature,
    orbit: orbit,
    properties: cometProperties,
    ignorePhysics: false,
    ignoreCollisions: false,
  };

  return comet;
}

/**
 * Generates realistic orbital parameters for a long-period comet.
 *
 * @param random The seeded pseudo-random number generator function.
 * @param distanceAU The average distance from the star, used to calculate semi-major axis.
 * @param starMass_kg The mass of the parent star.
 * @param cometMass_kg The mass of the comet.
 * @returns A populated `OrbitalParameters` object.
 */
function generateCometOrbit(
  random: () => number,
  distanceAU: number,
  starMass_kg: number,
  cometMass_kg: number,
): OrbitalParameters {
  // Comets have very high eccentricity
  let eccentricity = 0.8 + random() * 0.199; // 0.8 - 0.999

  // Ensure the orbit stays within system boundary by checking aphelion
  while (!UTIL.isOrbitWithinSystemBoundary(distanceAU, eccentricity)) {
    eccentricity *= 0.95; // Reduce eccentricity by 5% (more conservative for comets)
    if (eccentricity < 0.5) {
      // If we've reduced it too much, set a minimum for comet-like behavior
      eccentricity = 0.5;
      break;
    }
  }

  // Use the provided distance as the semi-major axis for long-period comets
  const period_s = UTIL.calculateOrbitalPeriod_s(
    starMass_kg,
    distanceAU * CONST.AU_TO_METERS,
    cometMass_kg,
  );

  // High inclination, can be retrograde
  const inclinationDeg = (random() - 0.5) * 180; // +/- 90 degrees

  // Generate axial tilt (comets don't have meaningful axial tilt)
  const axialTiltDeg = 0;

  return createOrbitalElements({
    semiMajorAxisAU: distanceAU,
    eccentricity: eccentricity,
    inclinationDeg: inclinationDeg,
    longitudeOfAscendingNodeDeg: random() * 360,
    argumentOfPeriapsisDeg: random() * 360,
    meanAnomalyDeg: random() * 360, // Start at random point in orbit
    period_s: period_s,
    siderealRotationPeriod_s: period_s, // Comets don't have meaningful rotation
    axialTiltDeg: axialTiltDeg,
  });
}

/**
 * Calculates comet temperature based on distance from star
 */
function calculateCometTemperature(
  distanceAU: number,
  parentStar: CelestialObject,
): number {
  // Use the star's actual luminosity from its properties if available
  let starLuminosity: number;

  if (
    parentStar.properties &&
    parentStar.properties.type === CelestialType.STAR
  ) {
    const starProps = parentStar.properties as StarProperties;
    if (starProps.luminosity && starProps.luminosity > 0) {
      starLuminosity = starProps.luminosity * CONST.SOLAR_LUMINOSITY;
    } else {
      // Fallback to mass-based calculation if luminosity is missing or invalid
      const massRatio = Math.max(
        0.01,
        parentStar.realMass_kg / CONST.SOLAR_MASS_KG,
      );
      starLuminosity = CONST.SOLAR_LUMINOSITY * Math.pow(massRatio, 3.5);
    }
  } else {
    // Fallback to mass-based calculation if star properties aren't available
    const massRatio = Math.max(
      0.01,
      parentStar.realMass_kg / CONST.SOLAR_MASS_KG,
    );
    starLuminosity = CONST.SOLAR_LUMINOSITY * Math.pow(massRatio, 3.5);
  }

  // Ensure we have a valid luminosity
  if (!Number.isFinite(starLuminosity) || starLuminosity <= 0) {
    starLuminosity = CONST.SOLAR_LUMINOSITY; // Default to solar luminosity
  }

  // Calculate equilibrium temperature at distance
  const distanceM = distanceAU * CONST.AU_TO_METERS;

  // T = (L / (16π σ d²))^(1/4) for a gray body with albedo ~0.1
  const temperature = Math.pow(
    starLuminosity /
      (16 * Math.PI * CONST.STEFAN_BOLTZMANN * distanceM * distanceM),
    0.25,
  );

  // Ensure we have a valid temperature
  if (!Number.isFinite(temperature) || temperature <= 0) {
    return 200; // Default temperature for comets
  }

  return Math.max(2.7, temperature); // Not colder than cosmic background
}
