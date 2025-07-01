import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { AU, KM } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  GasGiantClass,
  PlanetType,
  RockyType,
  SurfaceType,
  type IceSurfaceProperties,
  type GasGiantProperties,
  type PlanetAtmosphereProperties,
  type PlanetProperties,
  type RingProperties,
} from "@teskooano/data-types";

const URANUS_SIDEREAL_ROTATION_PERIOD_S = -0.71833 * 24 * 3600;
const URANUS_AXIAL_TILT_DEG = 97.77;
const URANUS_ORBITAL_PERIOD_S = 2.651e9;
const URANUS_REAL_RADIUS_M = 25362000;

const TITANIA_REAL_RADIUS_M = 788400;
const OBERON_REAL_RADIUS_M = 761400;
const UMBRIEL_REAL_RADIUS_M = 584700;
const ARIEL_REAL_RADIUS_M = 578900;
const MIRANDA_REAL_RADIUS_M = 235800;

/**
 * Creates Uranus and its major moons.
 * @param parentId The ID of the parent object (Sun).
 */
export function initializeUranus(parentId: string): void {
  const uranusId = "uranus";
  const uranusAxialTiltRad = URANUS_AXIAL_TILT_DEG * DEG_TO_RAD;
  const defaultMoonAxialTilt = new OSVector3(0, 1, 0).normalize();

  actions.addCelestial({
    id: uranusId,
    name: "Uranus",
    seed: "uranus_seed_84",
    type: CelestialType.GAS_GIANT,
    parentId: parentId,
    realMass_kg: 8.681e25,
    realRadius_m: URANUS_REAL_RADIUS_M,
    orbit: {
      realSemiMajorAxis_m: 19.2184 * AU,
      eccentricity: 0.046381,
      inclination: 0.7733 * DEG_TO_RAD,
      longitudeOfAscendingNode: 74.006 * DEG_TO_RAD,
      argumentOfPeriapsis: 96.999 * DEG_TO_RAD,
      meanAnomaly: 142.234 * DEG_TO_RAD,
      period_s: URANUS_ORBITAL_PERIOD_S,
    },
    temperature: 76,
    albedo: 0.51,
    siderealRotationPeriod_s: URANUS_SIDEREAL_ROTATION_PERIOD_S,
    axialTilt: new OSVector3(
      0,
      Math.cos(uranusAxialTiltRad),
      Math.sin(uranusAxialTiltRad),
    ).normalize(),
    properties: {
      type: CelestialType.GAS_GIANT,
      planetType: GasGiantClass.CLASS_III,
      gasGiantClass: GasGiantClass.CLASS_III,
      atmosphere: {
        atmosphereColor: "#B0E0E6",
        cloudColor: "#FFFFFF",
        cloudSpeed: 50,
        stormSpeed: 30,
        emissiveColor: "#B0E0E61A",
        emissiveIntensity: 0.05,
      },
      rings: [
        {
          innerRadius: URANUS_REAL_RADIUS_M * 1.64,
          outerRadius: URANUS_REAL_RADIUS_M * 1.641,
          density: 0.1,
          opacity: 0.4,
          color: "#A0A0A0",
          type: RockyType.DUST,
          texture: "textures/ring_dust_subtle.png",
          rotationRate: 0.003,
          composition: ["dark dust"],
        },
        {
          innerRadius: URANUS_REAL_RADIUS_M * 1.7,
          outerRadius: URANUS_REAL_RADIUS_M * 1.701,
          density: 0.15,
          opacity: 0.5,
          color: "#989898",
          type: RockyType.DUST,
          texture: "textures/ring_dust_subtle.png",
          rotationRate: 0.0028,
          composition: ["dark dust"],
        },
        {
          innerRadius: URANUS_REAL_RADIUS_M * 1.74,
          outerRadius: URANUS_REAL_RADIUS_M * 1.741,
          density: 0.15,
          opacity: 0.5,
          color: "#989898",
          type: RockyType.DUST,
          texture: "textures/ring_dust_subtle.png",
          rotationRate: 0.0027,
          composition: ["dark dust"],
        },
        {
          innerRadius: URANUS_REAL_RADIUS_M * 1.77,
          outerRadius: URANUS_REAL_RADIUS_M * 1.771,
          density: 0.15,
          opacity: 0.5,
          color: "#989898",
          type: RockyType.DUST,
          texture: "textures/ring_dust_subtle.png",
          rotationRate: 0.0026,
          composition: ["dark dust"],
        },
        {
          innerRadius: URANUS_REAL_RADIUS_M * 1.8,
          outerRadius: URANUS_REAL_RADIUS_M * 1.801,
          density: 0.15,
          opacity: 0.5,
          color: "#989898",
          type: RockyType.DUST,
          texture: "textures/ring_dust_subtle.png",
          rotationRate: 0.0025,
          composition: ["dark dust"],
        },
        {
          innerRadius: URANUS_REAL_RADIUS_M * 1.81,
          outerRadius: URANUS_REAL_RADIUS_M * 1.811,
          density: 0.2,
          opacity: 0.6,
          color: "#B0B0B0",
          type: RockyType.DUST,
          texture: "textures/ring_dust_subtle.png",
          rotationRate: 0.0024,
          composition: ["dark dust", "small ice particles"],
        },
        {
          innerRadius: URANUS_REAL_RADIUS_M * 1.95,
          outerRadius: URANUS_REAL_RADIUS_M * 1.96,
          density: 0.8,
          opacity: 0.8,
          color: "#C0C0C0",
          type: RockyType.ICE_DUST,
          texture: "textures/ring_epsilon.png",
          rotationRate: 0.0022,
          composition: ["ice boulders", "dust"],
        },
        {
          innerRadius: URANUS_REAL_RADIUS_M * 2.55,
          outerRadius: URANUS_REAL_RADIUS_M * 3.8,
          density: 0.05,
          opacity: 0.1,
          color: "#87CEEB",
          type: RockyType.DUST,
          texture: "textures/ring_mu.png",
          rotationRate: 0.0015,
          composition: ["blue dust"],
        },
        {
          innerRadius: URANUS_REAL_RADIUS_M * 3.8,
          outerRadius: URANUS_REAL_RADIUS_M * 3.86,
          density: 0.02,
          opacity: 0.05,
          color: "#D3D3D3",
          type: RockyType.DUST,
          texture: "textures/ring_nu.png",
          rotationRate: 0.001,
          composition: ["faint dust"],
        },
      ],
    } as GasGiantProperties,
  });

  actions.addCelestial({
    id: "titania",
    name: "Titania",
    seed: "titania_seed_8706",
    type: CelestialType.MOON,
    parentId: uranusId,
    realMass_kg: 3.527e21,
    realRadius_m: TITANIA_REAL_RADIUS_M,
    siderealRotationPeriod_s: 7.526e5,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: 436300 * KM,
      eccentricity: 0.0011,
      inclination: 0.34 * DEG_TO_RAD,
      longitudeOfAscendingNode: 0,
      argumentOfPeriapsis: 0,
      meanAnomaly: 15.9 * DEG_TO_RAD,
      period_s: 7.526e5,
    },
    temperature: 70,
    albedo: 0.27,
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.BARREN,
      isMoon: true,
      parentPlanet: uranusId,
      composition: ["water ice", "rock", "carbon dioxide ice"],
      atmosphere: {
        glowColor: "#444405",
        intensity: 0.01,
        power: 0.5,
        thickness: 0.005,
      },
      surface: {
        // Base surface properties
        type: SurfaceType.CRATERED,
        color: "#B0B0B8", // Gray-blue ice
        roughness: 0.7,
        planetType: PlanetType.BARREN,
        // Titania ice procedural properties
        persistence: 0.52,
        lacunarity: 2.1,
        simplePeriod: 2.3,
        octaves: 9,
        bumpScale: 2.8,
        color1: "#A0A8B0", // Dark gray
        color2: "#B0B0B8", // Gray-blue
        color3: "#C0C8D0", // Light gray
        color4: "#D0D8E0", // Very light
        color5: "#E0E8F0", // Brightest ice
        height1: 0.1,
        height2: 0.3,
        height3: 0.5,
        height4: 0.7,
        height5: 0.9,
        shininess: 18,
        specularStrength: 0.4,
        ambientLightIntensity: 0.35,
        undulation: 0.25,
        terrainType: 2,
        terrainAmplitude: 0.8,
        terrainSharpness: 1.5,
        terrainOffset: 0.0,
      },
    } as PlanetProperties,
  });

  actions.addCelestial({
    id: "oberon",
    name: "Oberon",
    seed: "oberon_seed_1346",
    type: CelestialType.MOON,
    parentId: uranusId,
    realMass_kg: 3.014e21,
    realRadius_m: OBERON_REAL_RADIUS_M,
    siderealRotationPeriod_s: 1.162e6,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: 583520 * KM,
      eccentricity: 0.0014,
      inclination: 0.058 * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 360 * DEG_TO_RAD,
      period_s: 1.162e6,
    },
    temperature: 75,
    albedo: 0.35,
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.BARREN,
      isMoon: true,
      parentPlanet: uranusId,
      composition: ["water ice", "rock", "dark carbonaceous material"],
      atmosphere: {
        glowColor: "#444405",
        intensity: 0.01,
        power: 0.5,
        thickness: 0.005,
      },
      surface: {
        // Base surface properties
        type: SurfaceType.CRATERED,
        color: "#9898A0", // Dark gray
        roughness: 0.8,
        planetType: PlanetType.BARREN,
        // Oberon dark surface procedural properties
        persistence: 0.55,
        lacunarity: 2.2,
        simplePeriod: 2.8,
        octaves: 10,
        bumpScale: 3.0,
        color1: "#603838", // Dark carbonaceous
        color2: "#808080", // Medium gray
        color3: "#9898A0", // Oberon's gray
        color4: "#B0B0B8", // Lighter areas
        color5: "#C8C8D0", // Brightest spots
        height1: 0.08,
        height2: 0.25,
        height3: 0.45,
        height4: 0.7,
        height5: 0.9,
        shininess: 12,
        specularStrength: 0.3,
        ambientLightIntensity: 0.32,
        undulation: 0.3,
        terrainType: 2,
        terrainAmplitude: 0.9,
        terrainSharpness: 1.6,
        terrainOffset: -0.1,
      },
    } as PlanetProperties,
  });

  actions.addCelestial({
    id: "umbriel",
    name: "Umbriel",
    seed: "umbriel_seed_4144",
    type: CelestialType.MOON,
    parentId: uranusId,
    realMass_kg: 1.172e21,
    realRadius_m: UMBRIEL_REAL_RADIUS_M,
    siderealRotationPeriod_s: 3.582e5,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: 266000 * KM,
      eccentricity: 0.0039,
      inclination: 0.128 * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 360 * DEG_TO_RAD,
      period_s: 3.582e5,
    },
    temperature: 75,
    albedo: 0.21,
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.BARREN,
      isMoon: true,
      parentPlanet: uranusId,
      composition: [
        "water ice",
        "rock",
        "methane ice?",
        "dark material coating",
      ],
      atmosphere: {
        glowColor: "#333333",
        intensity: 0.01,
        power: 0.5,
        thickness: 0.005,
      },
      surface: {
        // Base surface properties
        type: SurfaceType.CRATERED,
        color: "#50505A", // Very dark
        roughness: 0.85,
        planetType: PlanetType.BARREN,
        // Umbriel very dark procedural properties
        persistence: 0.58,
        lacunarity: 2.3,
        simplePeriod: 2.5,
        octaves: 11,
        bumpScale: 3.5,
        color1: "#303040", // Very dark base
        color2: "#404050", // Dark gray
        color3: "#50505A", // Umbriel's dark surface
        color4: "#606070", // Slightly lighter
        color5: "#707080", // Lightest areas
        height1: 0.05,
        height2: 0.2,
        height3: 0.4,
        height4: 0.65,
        height5: 0.85,
        shininess: 6,
        specularStrength: 0.15,
        ambientLightIntensity: 0.25,
        undulation: 0.4,
        terrainType: 2,
        terrainAmplitude: 1.2,
        terrainSharpness: 2.2,
        terrainOffset: -0.2,
      },
    } as PlanetProperties,
  });

  actions.addCelestial({
    id: "ariel",
    name: "Ariel",
    seed: "ariel_seed_2520",
    type: CelestialType.MOON,
    parentId: uranusId,
    realMass_kg: 1.353e21,
    realRadius_m: ARIEL_REAL_RADIUS_M,
    siderealRotationPeriod_s: 2.178e5,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: 191020 * KM,
      eccentricity: 0.0012,
      inclination: 0.26 * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 360 * DEG_TO_RAD,
      period_s: 2.178e5,
    },
    temperature: 60,
    albedo: 0.39,
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.BARREN,
      isMoon: true,
      parentPlanet: uranusId,
      composition: ["water ice", "rock", "possible ammonia"],
      atmosphere: {
        glowColor: "#FFFF08",
        intensity: 0.02,
        power: 0.6,
        thickness: 0.008,
      },
      surface: {
        // Base surface properties
        type: SurfaceType.VARIED,
        color: "#E8E8F0", // Light ice
        roughness: 0.4,
        planetType: PlanetType.BARREN,
        // Ariel bright fractured procedural properties
        persistence: 0.5,
        lacunarity: 2.0,
        simplePeriod: 1.8,
        octaves: 8,
        bumpScale: 2.2,
        color1: "#B0C4DE", // Light steel blue
        color2: "#D0D8E0", // Light gray
        color3: "#E8E8F0", // Very light
        color4: "#F0F0F8", // Almost white
        color5: "#F8F8FF", // Ghost white
        height1: 0.12,
        height2: 0.3,
        height3: 0.5,
        height4: 0.75,
        height5: 0.9,
        shininess: 22,
        specularStrength: 0.5,
        ambientLightIntensity: 0.4,
        undulation: 0.35,
        terrainType: 3,
        terrainAmplitude: 0.8,
        terrainSharpness: 1.4,
        terrainOffset: 0.1,
      },
    } as PlanetProperties,
  });

  actions.addCelestial({
    id: "miranda",
    name: "Miranda",
    seed: "miranda_seed_1413",
    type: CelestialType.MOON,
    parentId: uranusId,
    realMass_kg: 6.59e19,
    realRadius_m: MIRANDA_REAL_RADIUS_M,
    siderealRotationPeriod_s: 1.22e5,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: 129390 * KM,
      eccentricity: 0.0013,
      inclination: 4.232 * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 360 * DEG_TO_RAD,
      period_s: 1.22e5,
    },
    temperature: 60,
    albedo: 0.32,
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.BARREN,
      isMoon: true,
      parentPlanet: uranusId,
      composition: ["water ice", "silicates", "methane clathrates?"],
      atmosphere: {
        glowColor: "#AAAAAA",
        intensity: 0.01,
        power: 0.4,
        thickness: 0.003,
      },
      surface: {
        // Base surface properties
        type: SurfaceType.CANYONOUS,
        color: "#B8B8C0", // Light gray
        roughness: 0.75,
        planetType: PlanetType.BARREN,
        // Miranda bizarre terrain procedural properties
        persistence: 0.65,
        lacunarity: 2.5,
        simplePeriod: 1.5,
        octaves: 12,
        bumpScale: 4.0,
        color1: "#707078", // Dark areas
        color2: "#909098", // Medium gray
        color3: "#B8B8C0", // Miranda's surface
        color4: "#D0D0D8", // Lighter ridges
        color5: "#E8E8F0", // Brightest cliffs
        height1: 0.05,
        height2: 0.25,
        height3: 0.5,
        height4: 0.75,
        height5: 0.95,
        shininess: 15,
        specularStrength: 0.35,
        ambientLightIntensity: 0.35,
        undulation: 0.5,
        terrainType: 1,
        terrainAmplitude: 1.5,
        terrainSharpness: 2.5,
        terrainOffset: 0.0,
      },
    } as PlanetProperties,
  });
}
