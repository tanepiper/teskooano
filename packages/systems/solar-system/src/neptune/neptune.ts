import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
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
import { J2000_EPOCH } from "@teskooano/data-values";

/**
 * Neptune configuration object for modular solar system initialization.
 *
 * Features enhanced ring system with axial inclination controls:
 * - 28.32° axial tilt (0.494 radians) - moderate tilt
 * - All rings inherit Neptune's axial tilt for seasonal effects
 * - Very slow precession for stability
 * - Faint ring system with bright arcs in Adams ring
 */
export const neptune: CelestialObject<GasGiantProperties> = {
  id: "neptune",
  name: "Neptune",
  seed: "neptune",
  type: CelestialType.GAS_GIANT,
  status: CelestialStatus.ACTIVE,
  parentId: "sun",
  realMass_kg: 1.02409e26,
  realRadius_m: kmToM(24622),
  temperature: 72,
  albedo: 0.442,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 30.069923,
    eccentricity: 0.008678,
    inclinationDeg: 1.77004,
    longitudeOfAscendingNodeDeg: 131.783,
    argumentOfPeriapsisDeg: 273.187,
    meanAnomalyDeg: 259.883,
    period_s: 5.2e9,
    siderealRotationPeriod_s: 5.8e4,
    axialTiltDeg: 28.32,
    epoch: J2000_EPOCH,
  }),
  properties: {
    type: CelestialType.GAS_GIANT,
    classType: GasGiantClass.CLASS_III,
    atmosphereColor: "#4169E1",
    cloudColor: "#87CEEB",
    cloudSpeed: 120,
    stormSpeed: 80,
    emissiveColor: "#4169E120",
    emissiveIntensity: 0.05,
    // Enhanced ring system configuration with axial inclination controls
    ringSystem: {
      rings: [
        // Galle Ring (N42) - Broad faint ring
        {
          innerRadius: kmToM(24622 + 40900),
          outerRadius: kmToM(24622 + 42900),
          density: 0.1,
          opacity: 0.1, // Very faint
          color: "#4682B4",
          type: RockyType.ICE_DUST,
          texture: "textures/ring_galle.png",
          rotationRate: 0.0008,
          composition: ["ice particles", "dust"],
          inheritParentTilt: true, // Inherit Neptune's 28.32° axial tilt
        } as RingProperties,
        // Le Verrier Ring (N53) - Narrow ring
        {
          innerRadius: kmToM(24622 + 53180),
          outerRadius: kmToM(24622 + 53293),
          density: 0.6,
          opacity: 0.6,
          color: "#5F9EA0",
          type: RockyType.ICE,
          texture: "textures/ring_le_verrier.png",
          rotationRate: 0.0006,
          composition: ["water ice"],
          inheritParentTilt: true,
        } as RingProperties,
        // Lassell Ring - Faint sheet stretching from Le Verrier to Arago
        {
          innerRadius: kmToM(24622 + 53200),
          outerRadius: kmToM(24622 + 57200),
          density: 0.2,
          opacity: 0.15, // Faint
          color: "#6495ED",
          type: RockyType.ICE_DUST,
          texture: "textures/ring_lassell.png",
          rotationRate: 0.0005,
          composition: ["ice particles", "dust"],
          inheritParentTilt: true,
        } as RingProperties,
        // Arago Ring - Very narrow
        {
          innerRadius: kmToM(24622 + 57200),
          outerRadius: kmToM(24622 + 57300),
          density: 0.3,
          opacity: 0.2,
          color: "#87CEEB",
          type: RockyType.ICE,
          texture: "textures/ring_arago.png",
          rotationRate: 0.0004,
          composition: ["water ice"],
          inheritParentTilt: true,
        } as RingProperties,
        // Adams Ring (N63) - Five bright arcs
        {
          innerRadius: kmToM(24622 + 62930),
          outerRadius: kmToM(24622 + 62982),
          density: 0.8,
          opacity: 0.9, // Brightest
          color: "#B0C4DE",
          type: RockyType.ICE,
          texture: "textures/ring_adams.png",
          rotationRate: 0.0003,
          composition: ["water ice"],
          inheritParentTilt: true, // Inherit Neptune's 28.32° axial tilt
        } as RingProperties,
      ],
      // Neptune's axial inclination: 28.32° = 0.494 radians
      systemAxialInclination: 0.494,
      // Rings inherit Neptune's axial tilt
      inheritParentTilt: true,
      // Very slow precession (Neptune's rings are quite stable)
      precessionRate: 0.00001,
      // Render as a unified system
      unifiedRendering: true,
    } as RingSystemConfiguration,

    // Legacy rings property for backward compatibility
    rings: [
      // Galle Ring (N42) - Broad faint ring
      {
        innerRadius: kmToM(24622 + 40900),
        outerRadius: kmToM(24622 + 42900),
        density: 0.1,
        opacity: 0.1, // Very faint
        color: "#4682B4",
        type: RockyType.ICE_DUST,
        texture: "textures/ring_galle.png",
        rotationRate: 0.0008,
        composition: ["ice particles", "dust"],
      },
      // Le Verrier Ring (N53) - Narrow ring
      {
        innerRadius: kmToM(24622 + 53180),
        outerRadius: kmToM(24622 + 53293),
        density: 0.6,
        opacity: 0.6,
        color: "#5F9EA0",
        type: RockyType.ICE,
        texture: "textures/ring_le_verrier.png",
        rotationRate: 0.0006,
        composition: ["water ice"],
      },
      // Lassell Ring - Faint sheet stretching from Le Verrier to Arago
      {
        innerRadius: kmToM(24622 + 53200),
        outerRadius: kmToM(24622 + 57200),
        density: 0.2,
        opacity: 0.15, // Faint
        color: "#6495ED",
        type: RockyType.ICE_DUST,
        texture: "textures/ring_lassell.png",
        rotationRate: 0.0005,
        composition: ["ice particles", "dust"],
      },
      // Arago Ring - Very narrow
      {
        innerRadius: kmToM(24622 + 57200),
        outerRadius: kmToM(24622 + 57300),
        density: 0.3,
        opacity: 0.2,
        color: "#87CEEB",
        type: RockyType.ICE,
        texture: "textures/ring_arago.png",
        rotationRate: 0.0004,
        composition: ["water ice"],
      },
      // Adams Ring (N63) - Five bright arcs
      {
        innerRadius: kmToM(24622 + 62930),
        outerRadius: kmToM(24622 + 62982),
        density: 0.8,
        opacity: 0.9, // Brightest
        color: "#B0C4DE",
        type: RockyType.ICE,
        texture: "textures/ring_adams.png",
        rotationRate: 0.0003,
        composition: ["water ice"],
      },
    ],
  },
};
