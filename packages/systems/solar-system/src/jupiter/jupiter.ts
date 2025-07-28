import {
  J2000_EPOCH,
  createOrbitalElements,
  kmToM,
} from "@teskooano/core-physics";
import {
  CelestialObject,
  CelestialStatus,
  CelestialType,
  GasGiantClass,
  RockyType,
  type GasGiantProperties,
  type RingProperties,
  type RingSystemConfiguration,
} from "@teskooano/data-types";

const JUPITER_MASS_KG = 1.898e27;
const JUPITER_REAL_RADIUS_KM = 69911; // Equatorial radius
const JUPITER_TEMP_K = 165; // Effective temperature
const JUPITER_ALBEDO = 0.503; // Bond albedo

/**
 * Jupiter configuration object for modular solar system initialization.
 *
 * Features enhanced ring system with axial inclination controls:
 * - 3.13° axial tilt (0.055 radians) - very small tilt
 * - All rings inherit Jupiter's minimal axial tilt
 * - Very slow precession for stability
 * - Faint, dusty ring system
 */
export const jupiter: CelestialObject<GasGiantProperties> = {
  id: "jupiter",
  name: "Jupiter",
  seed: "jupiter",
  type: CelestialType.GAS_GIANT,
  status: CelestialStatus.ACTIVE,
  parentId: "sun", // Will be replaced during initialization
  realMass_kg: JUPITER_MASS_KG,
  realRadius_m: kmToM(JUPITER_REAL_RADIUS_KM),
  temperature: JUPITER_TEMP_K,
  albedo: JUPITER_ALBEDO,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 5.202887,
    eccentricity: 0.048498,
    inclinationDeg: 1.3053,
    longitudeOfAscendingNodeDeg: 100.55615,
    argumentOfPeriapsisDeg: 275.066,
    meanAnomalyDeg: 34.404,
    period_s: 3.743e8, // 11.86 Earth years
    siderealRotationPeriod_s: 3.573e4, // 9.925 hours
    axialTiltDeg: 3.13,
    epoch: J2000_EPOCH,
  }),
  properties: {
    type: CelestialType.GAS_GIANT,
    classType: GasGiantClass.CLASS_I,
    atmosphereColor: "#DAA520",
    cloudColor: "#F5DEB3",
    cloudSpeed: 100,
    stormSpeed: 60,
    emissiveColor: "#DAA52020",
    emissiveIntensity: 0.05,
    // Enhanced ring system configuration with axial inclination controls
    ringSystem: {
      rings: [
        // Halo Ring (innermost, very faint)
        {
          innerRadius: kmToM(JUPITER_REAL_RADIUS_KM) + kmToM(92000),
          outerRadius: kmToM(JUPITER_REAL_RADIUS_KM) + kmToM(122500),
          density: 0.001,
          opacity: 0.3,
          color: "#8B7355",
          type: RockyType.DUST,
          texture: "textures/ring_dust_subtle.png",
          rotationRate: 0.001,
          composition: ["fine dust"],
          inheritParentTilt: true, // Inherit Jupiter's 3.13° axial tilt
        } as RingProperties,
        // Main Ring (brightest)
        {
          innerRadius: kmToM(JUPITER_REAL_RADIUS_KM) + kmToM(122500),
          outerRadius: kmToM(JUPITER_REAL_RADIUS_KM) + kmToM(129000),
          density: 0.3,
          opacity: 0.3,
          color: "#DAA520",
          type: RockyType.ICE_DUST,
          texture: "textures/ring_main.png",
          rotationRate: 0.0008,
          composition: ["ice particles", "dust"],
          inheritParentTilt: true,
        } as RingProperties,
        // Gossamer Ring (outer, very faint)
        {
          innerRadius: kmToM(JUPITER_REAL_RADIUS_KM) + kmToM(129000),
          outerRadius: kmToM(JUPITER_REAL_RADIUS_KM) + kmToM(226000),
          density: 0.0001,
          opacity: 0.001,
          color: "#1c1410",
          type: RockyType.DUST,
          texture: "textures/ring_dust_subtle.png",
          rotationRate: 0.0005,
          composition: ["micrometer dust"],
          inheritParentTilt: true, // Inherit Jupiter's 3.13° axial tilt
        } as RingProperties,
      ],
      // Jupiter's axial inclination: 3.13° = 0.055 radians
      systemAxialInclination: 0.055,
      // Rings inherit Jupiter's axial tilt
      inheritParentTilt: true,
      // Very slow precession (Jupiter's rings are quite stable)
      precessionRate: 0.00001,
      // Render as a unified system
      unifiedRendering: true,
    } as RingSystemConfiguration,

    // Legacy rings property for backward compatibility
    rings: [
      // Halo Ring (innermost, very faint)
      {
        innerRadius: kmToM(JUPITER_REAL_RADIUS_KM) + kmToM(92000),
        outerRadius: kmToM(JUPITER_REAL_RADIUS_KM) + kmToM(122500),
        density: 0.001,
        opacity: 0.005,
        color: "#8B7355",
        type: RockyType.DUST,
        texture: "textures/ring_dust_subtle.png",
        rotationRate: 0.001,
        composition: ["fine dust"],
      },
      // Main Ring (brightest)
      {
        innerRadius: kmToM(JUPITER_REAL_RADIUS_KM) + kmToM(122500),
        outerRadius: kmToM(JUPITER_REAL_RADIUS_KM) + kmToM(129000),
        density: 0.3,
        opacity: 0.4,
        color: "#DAA520",
        type: RockyType.ICE_DUST,
        texture: "textures/ring_main.png",
        rotationRate: 0.0008,
        composition: ["ice particles", "dust"],
      },
      // Gossamer Ring (outer, very faint)
      {
        innerRadius: kmToM(JUPITER_REAL_RADIUS_KM) + kmToM(129000),
        outerRadius: kmToM(JUPITER_REAL_RADIUS_KM) + kmToM(226000),
        density: 0.0001,
        opacity: 0.001,
        color: "#A0522D",
        type: RockyType.DUST,
        texture: "textures/ring_dust_subtle.png",
        rotationRate: 0.0005,
        composition: ["micrometer dust"],
      },
    ],
  },
};
