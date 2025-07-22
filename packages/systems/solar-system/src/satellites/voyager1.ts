import {
  createOrbitalElements,
  kmToM,
  distanceAUToHyperbolicSemiMajorAxis,
} from "@teskooano/core-physics";
import {
  CelestialType,
  CelestialStatus,
  SatelliteProperties,
  type CelestialObject,
} from "@teskooano/data-types";

export const voyager1: CelestialObject<SatelliteProperties> = {
  id: "voyager-1",
  name: "Voyager 1",
  seed: "voyager_1_golden_record",
  type: CelestialType.SATELLITE,
  status: CelestialStatus.ACTIVE,
  realMass_kg: 815,
  realRadius_m: 2.0,
  temperature: 300,
  albedo: 0.3,
  parentId: "sun",
  orbit: createOrbitalElements({
    semiMajorAxisAU: distanceAUToHyperbolicSemiMajorAxis(167.019, 1.5), // Convert current distance to hyperbolic semi-major axis
    eccentricity: 1.5, // More realistic hyperbolic eccentricity
    inclinationDeg: 35.7,
    longitudeOfAscendingNodeDeg: 0,
    argumentOfPeriapsisDeg: 0,
    meanAnomalyDeg: 0, // Start at periapsis
    period_s: 0, // No orbital period for hyperbolic trajectories
    siderealRotationPeriod_s: 24 * 3600,
    axialTiltDeg: 0,
  }),
  ignorePhysics: false,
  ignoreCollisions: true,
  properties: {
    type: CelestialType.SATELLITE,
    modelPath: "models/satellite/voyager.glb",
    modelScale: 1.0,
    missionType: "scientific",
    operationalStatus: "active",
    launchDate: "1977-09-05",
    components: [
      "High-gain antenna (3.7m dish)",
      "Magnetometer boom",
      "Science instruments platform",
      "Nuclear thermoelectric generators (RTGs)",
      "Golden Record",
      "Plasma wave antenna",
    ],
  },
};
