import {
  J2000_EPOCH,
  createOrbitalElements,
  kmToM,
} from "@teskooano/core-physics";
import {
  CelestialStatus,
  CelestialType,
  GasGiantClass,
  RockyType,
  type CelestialObject,
  type GasGiantProperties,
  type RingProperties,
  type RingSystemConfiguration,
} from "@teskooano/data-types";

/**
 * Saturn configuration object for modular solar system initialization.
 *
 * Features enhanced ring system with axial inclination controls:
 * - 26.73° axial tilt (0.466 radians) - matches real Saturn
 * - All rings inherit Saturn's axial tilt for realistic seasonal changes
 * - Ring plane crossings every 13-15 years as seen from Earth
 * - Very slow precession for stability
 * - Comprehensive ring system from D Ring to E Ring
 */
export const saturn: CelestialObject<GasGiantProperties> = {
  id: "saturn",
  name: "Saturn",
  seed: "saturn",
  type: CelestialType.GAS_GIANT,
  status: CelestialStatus.ACTIVE,
  parentId: "sun", // Will be replaced during initialization
  realMass_kg: 5.6834e26,
  realRadius_m: kmToM(58232),
  temperature: 134,
  albedo: 0.47,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 9.5826,
    eccentricity: 0.0565,
    inclinationDeg: 2.485,
    longitudeOfAscendingNodeDeg: 113.665,
    argumentOfPeriapsisDeg: 339.392,
    meanAnomalyDeg: 317.02,
    period_s: 929292480,
    siderealRotationPeriod_s: 38018,
    axialTiltDeg: 26.73,
    epoch: J2000_EPOCH,
  }),
  properties: {
    type: CelestialType.GAS_GIANT,
    classType: GasGiantClass.CLASS_II,
    atmosphereColor: "#F0E68C",
    cloudColor: "#FFF8DC",
    cloudSpeed: 80,
    stormSpeed: 50,
    emissiveColor: "#F0E68C20",
    emissiveIntensity: 0.03,
    // Enhanced ring system configuration with axial inclination controls
    ringSystem: {
      rings: [
        // D Ring (innermost, very sparse)
        {
          innerRadius: kmToM(60268 + 7000),
          outerRadius: kmToM(60268 + 14600),
          density: 0.001,
          opacity: 0.01,
          color: "#BDB7AB",
          type: RockyType.DUST,
          texture: "textures/ring_dust_subtle.png",
          rotationRate: 0.002,
          composition: ["fine dust"],
          inheritParentTilt: true, // Inherit Saturn's 26.7° axial tilt
        } as RingProperties,
        // C Ring (sparse, ice and dust)
        {
          innerRadius: kmToM(60268 + 14600),
          outerRadius: kmToM(60268 + 32000),
          density: 0.05,
          opacity: 0.1,
          color: "#A9A190",
          type: RockyType.ICE_DUST,
          texture: "textures/ring_c_ring.png",
          rotationRate: 0.0018,
          composition: ["dirty ice", "dust"],
          inheritParentTilt: true,
        } as RingProperties,
        // B Ring (densest, bright ice particles)
        {
          innerRadius: kmToM(60268 + 32000),
          outerRadius: kmToM(60268 + 51800),
          density: 0.9,
          opacity: 0.8,
          color: "#E0DDCF",
          type: RockyType.ICE,
          texture: "textures/ring_b_ring.png",
          rotationRate: 0.0015,
          composition: ["water ice particles"],
          inheritParentTilt: true,
        } as RingProperties,
        // Cassini Division (gap - represented as very sparse ring)
        {
          innerRadius: kmToM(60268 + 51800),
          outerRadius: kmToM(60268 + 56200),
          density: 0.001,
          opacity: 0.02,
          color: "#555555",
          type: RockyType.DUST,
          texture: "textures/ring_dust_subtle.png",
          rotationRate: 0.0014,
          composition: ["sparse particles"],
          inheritParentTilt: true,
        } as RingProperties,
        // A Ring (bright, ice particles)
        {
          innerRadius: kmToM(60268 + 56200),
          outerRadius: kmToM(60268 + 80000),
          density: 0.6,
          opacity: 0.6,
          color: "#DAD4C5",
          type: RockyType.ICE,
          texture: "textures/ring_a_ring.png",
          rotationRate: 0.0012,
          composition: ["water ice"],
          inheritParentTilt: true,
        } as RingProperties,
        // F Ring (narrow, dynamic)
        {
          innerRadius: kmToM(60268 + 80200),
          outerRadius: kmToM(60268 + 80800),
          density: 0.1,
          opacity: 0.3,
          color: "#CCC5B8",
          type: RockyType.ICE_DUST,
          texture: "textures/ring_f_ring.png",
          rotationRate: 0.0011,
          composition: ["ice particles", "dust"],
          inheritParentTilt: true,
        } as RingProperties,
        // G Ring (very sparse)
        {
          innerRadius: kmToM(60268 + 166000),
          outerRadius: kmToM(60268 + 175000),
          density: 0.0001,
          opacity: 0.005,
          color: "#B8B0A2",
          type: RockyType.DUST,
          texture: "textures/ring_g_ring.png",
          rotationRate: 0.0009,
          composition: ["micrometer dust"],
          inheritParentTilt: true,
        } as RingProperties,
        // E Ring (extremely sparse, extends very far)
        {
          innerRadius: kmToM(60268 + 180000),
          outerRadius: kmToM(60268 + 480000),
          density: 0.00001,
          opacity: 0.001,
          color: "#95a0a8",
          type: RockyType.ICE_DUST,
          texture: "textures/ring_e_ring.png",
          rotationRate: 0.0005,
          composition: ["ice crystals", "dust"],
          inheritParentTilt: true,
        } as RingProperties,
      ],
      // Saturn's actual axial inclination: 26.73° = 0.466 radians
      systemAxialInclination: 0.466,
      // Rings inherit Saturn's axial tilt
      inheritParentTilt: true,
      // Very slow precession (Saturn's rings are quite stable)
      precessionRate: 0.00001,
      // Render as a unified system
      unifiedRendering: true,
    } as RingSystemConfiguration,

    // Legacy rings property for backward compatibility
    rings: [
      // D Ring (innermost, very sparse)
      {
        innerRadius: kmToM(60268 + 7000),
        outerRadius: kmToM(60268 + 14600),
        density: 0.001,
        opacity: 0.01,
        color: "#BDB7AB",
        type: RockyType.DUST,
        texture: "textures/ring_dust_subtle.png",
        rotationRate: 0.002,
        composition: ["fine dust"],
      } as RingProperties,
      // C Ring (sparse, ice and dust)
      {
        innerRadius: kmToM(60268 + 14600),
        outerRadius: kmToM(60268 + 32000),
        density: 0.05,
        opacity: 0.1,
        color: "#A9A190",
        type: RockyType.ICE_DUST,
        texture: "textures/ring_c_ring.png",
        rotationRate: 0.0018,
        composition: ["dirty ice", "dust"],
      } as RingProperties,
      // B Ring (densest, bright ice particles)
      {
        innerRadius: kmToM(60268 + 32000),
        outerRadius: kmToM(60268 + 51800),
        density: 0.9,
        opacity: 0.8,
        color: "#E0DDCF",
        type: RockyType.ICE,
        texture: "textures/ring_b_ring.png",
        rotationRate: 0.0015,
        composition: ["water ice particles"],
      } as RingProperties,
      // Cassini Division (gap - represented as very sparse ring)
      {
        innerRadius: kmToM(60268 + 51800),
        outerRadius: kmToM(60268 + 56200),
        density: 0.001,
        opacity: 0.02,
        color: "#555555",
        type: RockyType.DUST,
        texture: "textures/ring_dust_subtle.png",
        rotationRate: 0.0014,
        composition: ["sparse particles"],
      } as RingProperties,
      // A Ring (bright, ice particles)
      {
        innerRadius: kmToM(60268 + 56200),
        outerRadius: kmToM(60268 + 80000),
        density: 0.6,
        opacity: 0.6,
        color: "#DAD4C5",
        type: RockyType.ICE,
        texture: "textures/ring_a_ring.png",
        rotationRate: 0.0012,
        composition: ["water ice"],
      } as RingProperties,
      // F Ring (narrow, dynamic)
      {
        innerRadius: kmToM(60268 + 80200),
        outerRadius: kmToM(60268 + 80800),
        density: 0.1,
        opacity: 0.3,
        color: "#CCC5B8",
        type: RockyType.ICE_DUST,
        texture: "textures/ring_f_ring.png",
        rotationRate: 0.0011,
        composition: ["ice particles", "dust"],
      } as RingProperties,
      // G Ring (very sparse)
      {
        innerRadius: kmToM(60268 + 166000),
        outerRadius: kmToM(60268 + 175000),
        density: 0.0001,
        opacity: 0.005,
        color: "#B8B0A2",
        type: RockyType.DUST,
        texture: "textures/ring_g_ring.png",
        rotationRate: 0.0009,
        composition: ["micrometer dust"],
      } as RingProperties,
      // E Ring (extremely sparse, extends very far)
      {
        innerRadius: kmToM(60268 + 180000),
        outerRadius: kmToM(60268 + 480000),
        density: 0.00001,
        opacity: 0.001,
        color: "#95a0a8",
        type: RockyType.ICE_DUST,
        texture: "textures/ring_e_ring.png",
        rotationRate: 0.0005,
        composition: ["ice crystals", "dust"],
      } as RingProperties,
    ],
  },
};
