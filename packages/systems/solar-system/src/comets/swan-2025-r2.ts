import { createOrbitalElements } from "@teskooano/core-physics";
import {
  CelestialObject,
  CelestialStatus,
  CelestialType,
  CometClass,
  type CometProperties,
} from "@teskooano/data-types";
import * as THREE from "three";

/**
 * C/2025 R2 (SWAN)
 *
 * A non-periodic comet discovered on 11 September 2025 by Vladimir Bezugly through SWAN imagery.
 * It came to perihelion on 12 September 2025 at a distance of 0.5036980 AU from the Sun.
 * The comet has an orbital period of 1421.06 years (MPEC 2025-S35).
 * Classification: Nearly isotropic; Returning (a < 10000 AU); External (P > 200 years)
 */
export const swan2025R2: CelestialObject<CometProperties> = {
  id: "swan-2025-r2",
  name: "C/2025 R2 (SWAN)",
  type: CelestialType.COMET,
  status: CelestialStatus.ACTIVE,
  parentId: "sun",
  realMass_kg: 5e12, // Estimated ~5 billion tons (typical for comets)
  realRadius_m: 1500, // Estimated ~1.5 km nucleus radius
  temperature: 180, // Cold when far from Sun
  orbit: createOrbitalElements({
    semiMajorAxisAU: 126.4, // Calculated from q/(1-e) = 0.5036980/(1-0.9960150) = 126.4 AU
    eccentricity: 0.996015, // From MPEC 2025-S35
    inclinationDeg: 4.4715, // From MPEC 2025-S35
    longitudeOfAscendingNodeDeg: 335.5476, // From MPEC 2025-S35
    argumentOfPeriapsisDeg: 307.9784, // From MPEC 2025-S35
    meanAnomalyDeg: 0, // At perihelion
    period_s: 1421.06 * 365.25 * 24 * 3600, // 1421.06 years from MPEC 2025-S35
    siderealRotationPeriod_s: 12.0 * 3600, // Estimated 12 hours
    axialTiltDeg: 0, // Tumbling object
    epoch: "JD 2460931.5", // 2025 Sep 17 from MPEC 2025-S35
    timeOfPerihelion: "2025-09-12T04:46:00.000Z", // JD 2460931.19860 from MPEC 2025-S35
  }),
  properties: {
    type: CelestialType.COMET,
    classType: CometClass.LONG_PERIOD,
    discoveredDate: "2025-09-11",
    composition: ["water ice", "dust", "CO2"],
    colors: ["#2a2a2a", "#404040", "#5a5a5a", "#757575"],
    heights: [0.0, 0.35, 0.6, 0.85],
    activity: 0.7, // Active near perihelion
    visualComaRadius: 60000, // 60 km coma radius
    visualComaColor: "#F0F8FF",
    visualComaOpacity: 0.7,
    visualMaxTailLength: 3000000, // 3 million km tail
    visualTailColor: "#E6F3FF",
    visualTailOpacity: 0.6,
    visuals: {
      noiseScale: 2.3,
      blendSharpness: 1.4,
      craterScale: 18.0,
      craterStrength: 0.8,
      simplePeriod: 2.6,
      undulation: 0.2,
      ambientStrength: 0.014,
      metallicFactor: 0.03,
      roughness: 0.88,
      specularColor: new THREE.Color("#d0d0d0"),
    },
  },
};
