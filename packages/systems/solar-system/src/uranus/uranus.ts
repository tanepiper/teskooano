import { createOrbitalElements, kmToM } from "@teskooano/core-physics";
import {
  CelestialType,
  GasGiantClass,
  RockyType,
  CelestialStatus,
  type GasGiantProperties,
  CelestialObject,
} from "@teskooano/data-types";

const URANUS_MASS_KG = 8.681e25;
const URANUS_RADIUS_KM = 25362; // Mean radius
const URANUS_TEMP_K = 76;
const URANUS_ALBEDO = 0.3; // Bond albedo

/**
 * Uranus configuration object for modular solar system initialization.
 */
export const uranus: CelestialObject<GasGiantProperties> = {
  id: "uranus",
  name: "Uranus",
  seed: "uranus_seed_84",
  type: CelestialType.GAS_GIANT,
  status: CelestialStatus.ACTIVE,
  parentId: "sun", // Will be replaced during initialization
  realMass_kg: URANUS_MASS_KG,
  realRadius_m: kmToM(URANUS_RADIUS_KM),
  orbit: createOrbitalElements({
    semiMajorAxisAU: 19.19126, // Uranus's semi-major axis
    eccentricity: 0.04717,
    inclinationDeg: 0.773,
    longitudeOfAscendingNodeDeg: 74.006,
    argumentOfPeriapsisDeg: 96.998857,
    meanAnomalyDeg: 142.2386,
    period_s: 2651486832, // 84.0205 years = 30,688.5 days
    siderealRotationPeriod_s: -62092.5104, // -0.718661 days (retrograde)
    axialTiltDeg: 97.77,
  }),
  temperature: URANUS_TEMP_K,
  albedo: URANUS_ALBEDO,
  properties: {
    type: CelestialType.GAS_GIANT,
    classType: GasGiantClass.CLASS_III,
    atmosphereColor: "#B0E0E6",
    cloudColor: "#FFFFFF",
    cloudSpeed: 50,
    stormSpeed: 30,
    emissiveColor: "#B0E0E61A",
    emissiveIntensity: 0.05,
    rings: [
      {
        innerRadius: kmToM(URANUS_RADIUS_KM) * 1.64,
        outerRadius: kmToM(URANUS_RADIUS_KM) * 1.641,
        density: 0.1,
        opacity: 0.4,
        color: "#A0A0A0",
        type: RockyType.DUST,
        texture: "textures/ring_dust_subtle.png",
        rotationRate: 0.003,
        composition: ["dark dust"],
      },
      {
        innerRadius: kmToM(URANUS_RADIUS_KM) * 1.7,
        outerRadius: kmToM(URANUS_RADIUS_KM) * 1.701,
        density: 0.15,
        opacity: 0.5,
        color: "#989898",
        type: RockyType.DUST,
        texture: "textures/ring_dust_subtle.png",
        rotationRate: 0.0028,
        composition: ["dark dust"],
      },
      {
        innerRadius: kmToM(URANUS_RADIUS_KM) * 1.74,
        outerRadius: kmToM(URANUS_RADIUS_KM) * 1.741,
        density: 0.15,
        opacity: 0.5,
        color: "#989898",
        type: RockyType.DUST,
        texture: "textures/ring_dust_subtle.png",
        rotationRate: 0.0027,
        composition: ["dark dust"],
      },
      {
        innerRadius: kmToM(URANUS_RADIUS_KM) * 1.77,
        outerRadius: kmToM(URANUS_RADIUS_KM) * 1.771,
        density: 0.15,
        opacity: 0.5,
        color: "#989898",
        type: RockyType.DUST,
        texture: "textures/ring_dust_subtle.png",
        rotationRate: 0.0026,
        composition: ["dark dust"],
      },
      {
        innerRadius: kmToM(URANUS_RADIUS_KM) * 1.8,
        outerRadius: kmToM(URANUS_RADIUS_KM) * 1.801,
        density: 0.15,
        opacity: 0.5,
        color: "#989898",
        type: RockyType.DUST,
        texture: "textures/ring_dust_subtle.png",
        rotationRate: 0.0025,
        composition: ["dark dust"],
      },
      {
        innerRadius: kmToM(URANUS_RADIUS_KM) * 1.81,
        outerRadius: kmToM(URANUS_RADIUS_KM) * 1.811,
        density: 0.2,
        opacity: 0.6,
        color: "#B0B0B0",
        type: RockyType.DUST,
        texture: "textures/ring_dust_subtle.png",
        rotationRate: 0.0024,
        composition: ["dark dust", "small ice particles"],
      },
      {
        innerRadius: kmToM(URANUS_RADIUS_KM) * 1.95,
        outerRadius: kmToM(URANUS_RADIUS_KM) * 1.96,
        density: 0.8,
        opacity: 0.8,
        color: "#C0C0C0",
        type: RockyType.ICE_DUST,
        texture: "textures/ring_epsilon.png",
        rotationRate: 0.0022,
        composition: ["ice boulders", "dust"],
      },
      {
        innerRadius: kmToM(URANUS_RADIUS_KM) * 2.55,
        outerRadius: kmToM(URANUS_RADIUS_KM) * 3.8,
        density: 0.05,
        opacity: 0.1,
        color: "#87CEEB",
        type: RockyType.DUST,
        texture: "textures/ring_mu.png",
        rotationRate: 0.0015,
        composition: ["blue dust"],
      },
      {
        innerRadius: kmToM(URANUS_RADIUS_KM) * 3.8,
        outerRadius: kmToM(URANUS_RADIUS_KM) * 3.86,
        density: 0.02,
        opacity: 0.05,
        color: "#D3D3D3",
        type: RockyType.DUST,
        texture: "textures/ring_nu.png",
        rotationRate: 0.001,
        composition: ["faint dust"],
      },
    ],
  },
};
