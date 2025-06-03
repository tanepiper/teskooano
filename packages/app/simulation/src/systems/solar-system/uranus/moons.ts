import { DEG_TO_RAD, OSVector3 } from "@teskooano/core-math";
import { KM } from "@teskooano/core-physics";
import { actions } from "@teskooano/core-state";
import {
  CelestialType,
  PlanetType,
  SurfaceType,
  type PlanetProperties,
  type ProceduralSurfaceProperties,
} from "@teskooano/data-types";

const TITANIA_REAL_RADIUS_M = 788400;
const TITANIA_MASS_KG = 3.42e21;
const TITANIA_RADIUS_M = TITANIA_REAL_RADIUS_M;
const TITANIA_TEMP_K = 70;
const TITANIA_ALBEDO = 0.22;
const TITANIA_SMA_M = 435910 * KM;
const TITANIA_ECC = 0.0011;
const TITANIA_INC_DEG = 0.34;
const TITANIA_SIDEREAL_PERIOD_S = 8.706e5;

const OBERON_REAL_RADIUS_M = 761400;
const OBERON_MASS_KG = 2.88e21;
const OBERON_RADIUS_M = OBERON_REAL_RADIUS_M;
const OBERON_TEMP_K = 61;
const OBERON_ALBEDO = 0.23;
const OBERON_SMA_M = 583520 * KM;
const OBERON_ECC = 0.0014;
const OBERON_INC_DEG = 0.058;
const OBERON_SIDEREAL_PERIOD_S = 1.377e6;

const UMBRIEL_REAL_RADIUS_M = 584700;
const UMBRIEL_MASS_KG = 1.28e21;
const UMBRIEL_RADIUS_M = UMBRIEL_REAL_RADIUS_M;
const UMBRIEL_TEMP_K = 75;
const UMBRIEL_ALBEDO = 0.18;
const UMBRIEL_SMA_M = 266000 * KM;
const UMBRIEL_ECC = 0.0039;
const UMBRIEL_INC_DEG = 0.128;
const UMBRIEL_SIDEREAL_PERIOD_S = 3.58e5;

const ARIEL_REAL_RADIUS_M = 578900;
const ARIEL_MASS_KG = 1.29e21;
const ARIEL_RADIUS_M = ARIEL_REAL_RADIUS_M;
const ARIEL_TEMP_K = 76;
const ARIEL_ALBEDO = 0.39;
const ARIEL_SMA_M = 190900 * KM;
const ARIEL_ECC = 0.0012;
const ARIEL_INC_DEG = 0.041;
const ARIEL_SIDEREAL_PERIOD_S = 2.156e5;

const MIRANDA_REAL_RADIUS_M = 235800;
const MIRANDA_MASS_KG = 6.6e19;
const MIRANDA_RADIUS_M = MIRANDA_REAL_RADIUS_M;
const MIRANDA_TEMP_K = 77;
const MIRANDA_ALBEDO = 0.32;
const MIRANDA_SMA_M = 129900 * KM;
const MIRANDA_ECC = 0.0013;
const MIRANDA_INC_DEG = 4.232;
const MIRANDA_SIDEREAL_PERIOD_S = 1.236e5;

export function initializeUranusMoons(parentId: string): void {
  // Miranda procedural surface data (bizarre patchwork terrain)
  const mirandaProceduralSurface: ProceduralSurfaceProperties = {
    persistence: 0.7,
    lacunarity: 2.5,
    simplePeriod: 3.0,
    octaves: 8,
    bumpScale: 0.4,
    color1: "#808080", // Dark grayish terrain
    color2: "#A0A0A0", // Medium gray
    color3: "#C0C0C0", // Light gray
    color4: "#D0D0D8", // Very light gray
    color5: "#E0E0E8", // Bright patches
    height1: 0.0,
    height2: 0.2,
    height3: 0.5,
    height4: 0.7,
    height5: 0.9,
    shininess: 0.3,
    specularStrength: 0.2,
    roughness: 0.8,
    ambientLightIntensity: 0.1,
    undulation: 0.2,
    terrainType: 1,
    terrainAmplitude: 0.4,
    terrainSharpness: 0.8,
    terrainOffset: 0.0,
  };

  actions.addCelestial({
    id: "miranda",
    name: "Miranda",
    seed: "miranda",
    type: CelestialType.MOON,
    parentId: parentId,
    realMass_kg: MIRANDA_MASS_KG,
    realRadius_m: MIRANDA_RADIUS_M,
    temperature: MIRANDA_TEMP_K,
    albedo: MIRANDA_ALBEDO,
    siderealRotationPeriod_s: MIRANDA_SIDEREAL_PERIOD_S,
    axialTilt: new OSVector3(0, 1, 0),
    orbit: {
      realSemiMajorAxis_m: MIRANDA_SMA_M,
      eccentricity: MIRANDA_ECC,
      inclination: MIRANDA_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: MIRANDA_SIDEREAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE_WORLD,
      isMoon: true,
      parentPlanet: parentId,
      composition: ["water ice", "silicates", "organic"],
      atmosphere: undefined, // Miranda has no atmosphere
      surface: {
        surfaceType: SurfaceType.VARIED,
        proceduralData: {
          ...mirandaProceduralSurface,
          planetType: PlanetType.ICE_WORLD,
          color: "#D0D0D8",
        },
      },
    } as PlanetProperties,
  });

  // Ariel procedural surface data (bright icy surface with valleys)
  const arielProceduralSurface: ProceduralSurfaceProperties = {
    persistence: 0.5,
    lacunarity: 2.2,
    simplePeriod: 4.0,
    octaves: 6,
    bumpScale: 0.25,
    color1: "#C0C0C8", // Light gray ice
    color2: "#D0D0D8", // Bright ice
    color3: "#E0E0E8", // Very bright ice
    color4: "#F0F0F8", // Brilliant ice
    color5: "#FFFFFF", // Pure white ice
    height1: 0.0,
    height2: 0.3,
    height3: 0.5,
    height4: 0.7,
    height5: 0.9,
    shininess: 0.5,
    specularStrength: 0.4,
    roughness: 0.7,
    ambientLightIntensity: 0.12,
    undulation: 0.1,
    terrainType: 1,
    terrainAmplitude: 0.3,
    terrainSharpness: 0.6,
    terrainOffset: 0.0,
  };

  actions.addCelestial({
    id: "ariel",
    name: "Ariel",
    seed: "ariel",
    type: CelestialType.MOON,
    parentId: parentId,
    realMass_kg: ARIEL_MASS_KG,
    realRadius_m: ARIEL_RADIUS_M,
    temperature: ARIEL_TEMP_K,
    albedo: ARIEL_ALBEDO,
    siderealRotationPeriod_s: ARIEL_SIDEREAL_PERIOD_S,
    axialTilt: new OSVector3(0, 1, 0),
    orbit: {
      realSemiMajorAxis_m: ARIEL_SMA_M,
      eccentricity: ARIEL_ECC,
      inclination: ARIEL_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: ARIEL_SIDEREAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE_WORLD,
      isMoon: true,
      parentPlanet: parentId,
      composition: ["water ice", "silicates", "carbon dioxide ice"],
      atmosphere: undefined, // Ariel has no atmosphere
      surface: {
        surfaceType: SurfaceType.VARIED,
        proceduralData: {
          ...arielProceduralSurface,
          planetType: PlanetType.ICE_WORLD,
          color: "#E0E0E8",
        },
      },
    } as PlanetProperties,
  });

  // Umbriel procedural surface data (dark, heavily cratered)
  const umbreilProceduralSurface: ProceduralSurfaceProperties = {
    persistence: 0.45,
    lacunarity: 2.0,
    simplePeriod: 5.0,
    octaves: 5,
    bumpScale: 0.3,
    color1: "#404040", // Very dark surface
    color2: "#606060", // Dark gray
    color3: "#808080", // Medium gray
    color4: "#A0A0A0", // Light gray
    color5: "#C0C0C0", // Bright spots
    height1: 0.0,
    height2: 0.25,
    height3: 0.5,
    height4: 0.75,
    height5: 0.9,
    shininess: 0.15,
    specularStrength: 0.1,
    roughness: 0.8,
    ambientLightIntensity: 0.08,
    undulation: 0.15,
    terrainType: 1,
    terrainAmplitude: 0.35,
    terrainSharpness: 0.7,
    terrainOffset: 0.0,
  };

  actions.addCelestial({
    id: "umbriel",
    name: "Umbriel",
    seed: "umbriel",
    type: CelestialType.MOON,
    parentId: parentId,
    realMass_kg: UMBRIEL_MASS_KG,
    realRadius_m: UMBRIEL_RADIUS_M,
    temperature: UMBRIEL_TEMP_K,
    albedo: UMBRIEL_ALBEDO,
    siderealRotationPeriod_s: UMBRIEL_SIDEREAL_PERIOD_S,
    axialTilt: new OSVector3(0, 1, 0),
    orbit: {
      realSemiMajorAxis_m: UMBRIEL_SMA_M,
      eccentricity: UMBRIEL_ECC,
      inclination: UMBRIEL_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: UMBRIEL_SIDEREAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE_WORLD,
      isMoon: true,
      parentPlanet: parentId,
      composition: ["water ice", "silicates", "organic"],
      atmosphere: undefined, // Umbriel has no atmosphere
      surface: {
        surfaceType: SurfaceType.CRATERED,
        proceduralData: {
          ...umbreilProceduralSurface,
          planetType: PlanetType.ICE_WORLD,
          color: "#808090",
        },
      },
    } as PlanetProperties,
  });

  // Titania procedural surface data (largest moon, mixed terrain)
  const titaniaProceduralSurface: ProceduralSurfaceProperties = {
    persistence: 0.5,
    lacunarity: 2.1,
    simplePeriod: 6.0,
    octaves: 6,
    bumpScale: 0.2,
    color1: "#A0A0A8", // Medium gray ice
    color2: "#B0B0B8", // Light gray
    color3: "#C0C0C8", // Bright gray
    color4: "#D0D0D8", // Very bright
    color5: "#E0E0E8", // Brilliant white areas
    height1: 0.0,
    height2: 0.3,
    height3: 0.5,
    height4: 0.7,
    height5: 0.9,
    shininess: 0.3,
    specularStrength: 0.25,
    roughness: 0.7,
    ambientLightIntensity: 0.1,
    undulation: 0.1,
    terrainType: 1,
    terrainAmplitude: 0.25,
    terrainSharpness: 0.6,
    terrainOffset: 0.0,
  };

  actions.addCelestial({
    id: "titania",
    name: "Titania",
    seed: "titania",
    type: CelestialType.MOON,
    parentId: parentId,
    realMass_kg: TITANIA_MASS_KG,
    realRadius_m: TITANIA_RADIUS_M,
    temperature: TITANIA_TEMP_K,
    albedo: TITANIA_ALBEDO,
    siderealRotationPeriod_s: TITANIA_SIDEREAL_PERIOD_S,
    axialTilt: new OSVector3(0, 1, 0),
    orbit: {
      realSemiMajorAxis_m: TITANIA_SMA_M,
      eccentricity: TITANIA_ECC,
      inclination: TITANIA_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: TITANIA_SIDEREAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE_WORLD,
      isMoon: true,
      parentPlanet: parentId,
      composition: ["water ice", "silicates", "water ice"],
      atmosphere: undefined, // Titania has no significant atmosphere
      surface: {
        surfaceType: SurfaceType.VARIED,
        proceduralData: {
          ...titaniaProceduralSurface,
          planetType: PlanetType.ICE_WORLD,
          color: "#C0C0C8",
        },
      },
    } as PlanetProperties,
  });

  // Oberon procedural surface data (second largest, heavily cratered)
  const oberonProceduralSurface: ProceduralSurfaceProperties = {
    persistence: 0.45,
    lacunarity: 2.0,
    simplePeriod: 5.5,
    octaves: 6,
    bumpScale: 0.25,
    color1: "#909098", // Dark grayish
    color2: "#A0A0A8", // Medium gray
    color3: "#B0B0B8", // Light gray
    color4: "#C0C0C8", // Bright areas
    color5: "#D0D0D8", // Very bright spots
    height1: 0.0,
    height2: 0.25,
    height3: 0.5,
    height4: 0.75,
    height5: 0.9,
    shininess: 0.25,
    specularStrength: 0.2,
    roughness: 0.8,
    ambientLightIntensity: 0.09,
    undulation: 0.12,
    terrainType: 1,
    terrainAmplitude: 0.3,
    terrainSharpness: 0.7,
    terrainOffset: 0.0,
  };

  actions.addCelestial({
    id: "oberon",
    name: "Oberon",
    seed: "oberon",
    type: CelestialType.MOON,
    parentId: parentId,
    realMass_kg: OBERON_MASS_KG,
    realRadius_m: OBERON_RADIUS_M,
    temperature: OBERON_TEMP_K,
    albedo: OBERON_ALBEDO,
    siderealRotationPeriod_s: OBERON_SIDEREAL_PERIOD_S,
    axialTilt: new OSVector3(0, 1, 0),
    orbit: {
      realSemiMajorAxis_m: OBERON_SMA_M,
      eccentricity: OBERON_ECC,
      inclination: OBERON_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: OBERON_SIDEREAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE_WORLD,
      isMoon: true,
      parentPlanet: parentId,
      composition: ["water ice", "silicates", "organic"],
      atmosphere: undefined, // Oberon has no atmosphere
      surface: {
        surfaceType: SurfaceType.CRATERED,
        proceduralData: {
          ...oberonProceduralSurface,
          planetType: PlanetType.ICE_WORLD,
          color: "#A0A0A8",
        },
      },
    } as PlanetProperties,
  });

  // --- BEGIN: Additional Major Moons (NASA/JPL data, see https://ssd.jpl.nasa.gov/sats/elem/) ---
  // Puck
  actions.addCelestial({
    id: "puck",
    name: "Puck",
    seed: "puck",
    type: CelestialType.MOON,
    parentId: parentId,
    realMass_kg: 2.9e18,
    realRadius_m: 81000,
    temperature: 65,
    albedo: 0.1,
    siderealRotationPeriod_s: 0.761476 * 86400,
    axialTilt: new OSVector3(0, 1, 0),
    orbit: {
      realSemiMajorAxis_m: 86000 * KM,
      eccentricity: 0.0,
      inclination: 0.4 * DEG_TO_RAD,
      longitudeOfAscendingNode: 216.0 * DEG_TO_RAD,
      argumentOfPeriapsis: 0.0,
      meanAnomaly: 50.1 * DEG_TO_RAD,
      period_s: 0.761476 * 86400,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE_WORLD,
      isMoon: true,
      parentPlanet: parentId,
      composition: ["water ice", "silicates"],
      surface: {
        surfaceType: SurfaceType.CRATERED,
        proceduralData: {
          color1: "#B0C4DE",
          color2: "#B0C4DE",
          color3: "#B0C4DE",
          color4: "#B0C4DE",
          color5: "#B0C4DE",
          planetType: PlanetType.ICE_WORLD,
          persistence: 0.5,
          lacunarity: 2.0,
          simplePeriod: 5.0,
          octaves: 5,
          bumpScale: 0.3,
          height1: 0,
          height2: 0.25,
          height3: 0.5,
          height4: 0.75,
          height5: 1,
          shininess: 0.1,
          specularStrength: 0.1,
          roughness: 0.8,
          ambientLightIntensity: 0.1,
          undulation: 0.1,
          terrainType: 1,
          terrainAmplitude: 0.3,
          terrainSharpness: 0.7,
          terrainOffset: 0,
        },
      },
    } as PlanetProperties,
  });

  // Portia
  actions.addCelestial({
    id: "portia",
    name: "Portia",
    seed: "portia",
    type: CelestialType.MOON,
    parentId: parentId,
    realMass_kg: 1.7e17,
    realRadius_m: 70100,
    temperature: 65,
    albedo: 0.07,
    siderealRotationPeriod_s: 0.513196 * 86400,
    axialTilt: new OSVector3(0, 1, 0),
    orbit: {
      realSemiMajorAxis_m: 66100 * KM,
      eccentricity: 0.0,
      inclination: 0.0,
      longitudeOfAscendingNode: 0.0,
      argumentOfPeriapsis: 343.7 * DEG_TO_RAD,
      meanAnomaly: 343.7 * DEG_TO_RAD,
      period_s: 0.513196 * 86400,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE_WORLD,
      isMoon: true,
      parentPlanet: parentId,
      composition: ["water ice", "silicates"],
      surface: {
        surfaceType: SurfaceType.CRATERED,
        proceduralData: {
          color1: "#B0C4DE",
          color2: "#B0C4DE",
          color3: "#B0C4DE",
          color4: "#B0C4DE",
          color5: "#B0C4DE",
          planetType: PlanetType.ICE_WORLD,
          persistence: 0.5,
          lacunarity: 2.0,
          simplePeriod: 5.0,
          octaves: 5,
          bumpScale: 0.3,
          height1: 0,
          height2: 0.25,
          height3: 0.5,
          height4: 0.75,
          height5: 1,
          shininess: 0.1,
          specularStrength: 0.1,
          roughness: 0.8,
          ambientLightIntensity: 0.1,
          undulation: 0.1,
          terrainType: 1,
          terrainAmplitude: 0.3,
          terrainSharpness: 0.7,
          terrainOffset: 0,
        },
      },
    } as PlanetProperties,
  });

  // Cressida
  actions.addCelestial({
    id: "cressida",
    name: "Cressida",
    seed: "cressida",
    type: CelestialType.MOON,
    parentId: parentId,
    realMass_kg: 3.4e16,
    realRadius_m: 41000,
    temperature: 65,
    albedo: 0.07,
    siderealRotationPeriod_s: 0.463154 * 86400,
    axialTilt: new OSVector3(0, 1, 0),
    orbit: {
      realSemiMajorAxis_m: 61800 * KM,
      eccentricity: 0.0,
      inclination: 0.1 * DEG_TO_RAD,
      longitudeOfAscendingNode: 304.0 * DEG_TO_RAD,
      argumentOfPeriapsis: 0.0,
      meanAnomaly: 332.8 * DEG_TO_RAD,
      period_s: 0.463154 * 86400,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE_WORLD,
      isMoon: true,
      parentPlanet: parentId,
      composition: ["water ice", "silicates"],
      surface: {
        surfaceType: SurfaceType.CRATERED,
        proceduralData: {
          color1: "#B0C4DE",
          color2: "#B0C4DE",
          color3: "#B0C4DE",
          color4: "#B0C4DE",
          color5: "#B0C4DE",
          planetType: PlanetType.ICE_WORLD,
          persistence: 0.5,
          lacunarity: 2.0,
          simplePeriod: 5.0,
          octaves: 5,
          bumpScale: 0.3,
          height1: 0,
          height2: 0.25,
          height3: 0.5,
          height4: 0.75,
          height5: 1,
          shininess: 0.1,
          specularStrength: 0.1,
          roughness: 0.8,
          ambientLightIntensity: 0.1,
          undulation: 0.1,
          terrainType: 1,
          terrainAmplitude: 0.3,
          terrainSharpness: 0.7,
          terrainOffset: 0,
        },
      },
    } as PlanetProperties,
  });

  // Desdemona
  actions.addCelestial({
    id: "desdemona",
    name: "Desdemona",
    seed: "desdemona",
    type: CelestialType.MOON,
    parentId: parentId,
    realMass_kg: 2.1e16,
    realRadius_m: 35000,
    temperature: 65,
    albedo: 0.08,
    siderealRotationPeriod_s: 0.473228 * 86400,
    axialTilt: new OSVector3(0, 1, 0),
    orbit: {
      realSemiMajorAxis_m: 62700 * KM,
      eccentricity: 0.0,
      inclination: 0.1 * DEG_TO_RAD,
      longitudeOfAscendingNode: 96.3 * DEG_TO_RAD,
      argumentOfPeriapsis: 0.0,
      meanAnomaly: 160.4 * DEG_TO_RAD,
      period_s: 0.473228 * 86400,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE_WORLD,
      isMoon: true,
      parentPlanet: parentId,
      composition: ["water ice", "silicates"],
      surface: {
        surfaceType: SurfaceType.CRATERED,
        proceduralData: {
          color1: "#B0C4DE",
          color2: "#B0C4DE",
          color3: "#B0C4DE",
          color4: "#B0C4DE",
          color5: "#B0C4DE",
          planetType: PlanetType.ICE_WORLD,
          persistence: 0.5,
          lacunarity: 2.0,
          simplePeriod: 5.0,
          octaves: 5,
          bumpScale: 0.3,
          height1: 0,
          height2: 0.25,
          height3: 0.5,
          height4: 0.75,
          height5: 1,
          shininess: 0.1,
          specularStrength: 0.1,
          roughness: 0.8,
          ambientLightIntensity: 0.1,
          undulation: 0.1,
          terrainType: 1,
          terrainAmplitude: 0.3,
          terrainSharpness: 0.7,
          terrainOffset: 0,
        },
      },
    } as PlanetProperties,
  });

  // Juliet
  actions.addCelestial({
    id: "juliet",
    name: "Juliet",
    seed: "juliet",
    type: CelestialType.MOON,
    parentId: parentId,
    realMass_kg: 5.6e16,
    realRadius_m: 53000,
    temperature: 65,
    albedo: 0.08,
    siderealRotationPeriod_s: 0.493479 * 86400,
    axialTilt: new OSVector3(0, 1, 0),
    orbit: {
      realSemiMajorAxis_m: 64400 * KM,
      eccentricity: 0.001,
      inclination: 0.0,
      longitudeOfAscendingNode: 0.0,
      argumentOfPeriapsis: 291.5 * DEG_TO_RAD,
      meanAnomaly: 124.8 * DEG_TO_RAD,
      period_s: 0.493479 * 86400,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE_WORLD,
      isMoon: true,
      parentPlanet: parentId,
      composition: ["water ice", "silicates"],
      surface: {
        surfaceType: SurfaceType.CRATERED,
        proceduralData: {
          color1: "#B0C4DE",
          color2: "#B0C4DE",
          color3: "#B0C4DE",
          color4: "#B0C4DE",
          color5: "#B0C4DE",
          planetType: PlanetType.ICE_WORLD,
          persistence: 0.5,
          lacunarity: 2.0,
          simplePeriod: 5.0,
          octaves: 5,
          bumpScale: 0.3,
          height1: 0,
          height2: 0.25,
          height3: 0.5,
          height4: 0.75,
          height5: 1,
          shininess: 0.1,
          specularStrength: 0.1,
          roughness: 0.8,
          ambientLightIntensity: 0.1,
          undulation: 0.1,
          terrainType: 1,
          terrainAmplitude: 0.3,
          terrainSharpness: 0.7,
          terrainOffset: 0,
        },
      },
    } as PlanetProperties,
  });

  // Ophelia
  actions.addCelestial({
    id: "ophelia",
    name: "Ophelia",
    seed: "ophelia",
    type: CelestialType.MOON,
    parentId: parentId,
    realMass_kg: 5.3e16,
    realRadius_m: 21000,
    temperature: 65,
    albedo: 0.07,
    siderealRotationPeriod_s: 0.376855 * 86400,
    axialTilt: new OSVector3(0, 1, 0),
    orbit: {
      realSemiMajorAxis_m: 53800 * KM,
      eccentricity: 0.011,
      inclination: 0.1 * DEG_TO_RAD,
      longitudeOfAscendingNode: 266.5 * DEG_TO_RAD,
      argumentOfPeriapsis: 344.3 * DEG_TO_RAD,
      meanAnomaly: 280.5 * DEG_TO_RAD,
      period_s: 0.376855 * 86400,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE_WORLD,
      isMoon: true,
      parentPlanet: parentId,
      composition: ["water ice", "silicates"],
      surface: {
        surfaceType: SurfaceType.CRATERED,
        proceduralData: {
          color1: "#B0C4DE",
          color2: "#B0C4DE",
          color3: "#B0C4DE",
          color4: "#B0C4DE",
          color5: "#B0C4DE",
          planetType: PlanetType.ICE_WORLD,
          persistence: 0.5,
          lacunarity: 2.0,
          simplePeriod: 5.0,
          octaves: 5,
          bumpScale: 0.3,
          height1: 0,
          height2: 0.25,
          height3: 0.5,
          height4: 0.75,
          height5: 1,
          shininess: 0.1,
          specularStrength: 0.1,
          roughness: 0.8,
          ambientLightIntensity: 0.1,
          undulation: 0.1,
          terrainType: 1,
          terrainAmplitude: 0.3,
          terrainSharpness: 0.7,
          terrainOffset: 0,
        },
      },
    } as PlanetProperties,
  });

  // Bianca
  actions.addCelestial({
    id: "bianca",
    name: "Bianca",
    seed: "bianca",
    type: CelestialType.MOON,
    parentId: parentId,
    realMass_kg: 9.2e16,
    realRadius_m: 27000,
    temperature: 65,
    albedo: 0.07,
    siderealRotationPeriod_s: 0.435007 * 86400,
    axialTilt: new OSVector3(0, 1, 0),
    orbit: {
      realSemiMajorAxis_m: 59200 * KM,
      eccentricity: 0.001,
      inclination: 0.1 * DEG_TO_RAD,
      longitudeOfAscendingNode: 209.5 * DEG_TO_RAD,
      argumentOfPeriapsis: 97.0 * DEG_TO_RAD,
      meanAnomaly: 236.2 * DEG_TO_RAD,
      period_s: 0.435007 * 86400,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE_WORLD,
      isMoon: true,
      parentPlanet: parentId,
      composition: ["water ice", "silicates"],
      surface: {
        surfaceType: SurfaceType.CRATERED,
        proceduralData: {
          color1: "#B0C4DE",
          color2: "#B0C4DE",
          color3: "#B0C4DE",
          color4: "#B0C4DE",
          color5: "#B0C4DE",
          planetType: PlanetType.ICE_WORLD,
          persistence: 0.5,
          lacunarity: 2.0,
          simplePeriod: 5.0,
          octaves: 5,
          bumpScale: 0.3,
          height1: 0,
          height2: 0.25,
          height3: 0.5,
          height4: 0.75,
          height5: 1,
          shininess: 0.1,
          specularStrength: 0.1,
          roughness: 0.8,
          ambientLightIntensity: 0.1,
          undulation: 0.1,
          terrainType: 1,
          terrainAmplitude: 0.3,
          terrainSharpness: 0.7,
          terrainOffset: 0,
        },
      },
    } as PlanetProperties,
  });

  // Rosalind
  actions.addCelestial({
    id: "rosalind",
    name: "Rosalind",
    seed: "rosalind",
    type: CelestialType.MOON,
    parentId: parentId,
    realMass_kg: 2.5e16,
    realRadius_m: 36000,
    temperature: 65,
    albedo: 0.07,
    siderealRotationPeriod_s: 0.558459 * 86400,
    axialTilt: new OSVector3(0, 1, 0),
    orbit: {
      realSemiMajorAxis_m: 69900 * KM,
      eccentricity: 0.0,
      inclination: 0.0,
      longitudeOfAscendingNode: 0.0,
      argumentOfPeriapsis: 0.0,
      meanAnomaly: 79.4 * DEG_TO_RAD,
      period_s: 0.558459 * 86400,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE_WORLD,
      isMoon: true,
      parentPlanet: parentId,
      composition: ["water ice", "silicates"],
      surface: {
        surfaceType: SurfaceType.CRATERED,
        proceduralData: {
          color1: "#B0C4DE",
          color2: "#B0C4DE",
          color3: "#B0C4DE",
          color4: "#B0C4DE",
          color5: "#B0C4DE",
          planetType: PlanetType.ICE_WORLD,
          persistence: 0.5,
          lacunarity: 2.0,
          simplePeriod: 5.0,
          octaves: 5,
          bumpScale: 0.3,
          height1: 0,
          height2: 0.25,
          height3: 0.5,
          height4: 0.75,
          height5: 1,
          shininess: 0.1,
          specularStrength: 0.1,
          roughness: 0.8,
          ambientLightIntensity: 0.1,
          undulation: 0.1,
          terrainType: 1,
          terrainAmplitude: 0.3,
          terrainSharpness: 0.7,
          terrainOffset: 0,
        },
      },
    } as PlanetProperties,
  });

  // Belinda
  actions.addCelestial({
    id: "belinda",
    name: "Belinda",
    seed: "belinda",
    type: CelestialType.MOON,
    parentId: parentId,
    realMass_kg: 7.5e16,
    realRadius_m: 45000,
    temperature: 65,
    albedo: 0.07,
    siderealRotationPeriod_s: 0.623527 * 86400,
    axialTilt: new OSVector3(0, 1, 0),
    orbit: {
      realSemiMajorAxis_m: 75300 * KM,
      eccentricity: 0.0,
      inclination: 0.0,
      longitudeOfAscendingNode: 0.0,
      argumentOfPeriapsis: 121.3 * DEG_TO_RAD,
      meanAnomaly: 121.3 * DEG_TO_RAD,
      period_s: 0.623527 * 86400,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE_WORLD,
      isMoon: true,
      parentPlanet: parentId,
      composition: ["water ice", "silicates"],
      surface: {
        surfaceType: SurfaceType.CRATERED,
        proceduralData: {
          color1: "#B0C4DE",
          color2: "#B0C4DE",
          color3: "#B0C4DE",
          color4: "#B0C4DE",
          color5: "#B0C4DE",
          planetType: PlanetType.ICE_WORLD,
          persistence: 0.5,
          lacunarity: 2.0,
          simplePeriod: 5.0,
          octaves: 5,
          bumpScale: 0.3,
          height1: 0,
          height2: 0.25,
          height3: 0.5,
          height4: 0.75,
          height5: 1,
          shininess: 0.1,
          specularStrength: 0.1,
          roughness: 0.8,
          ambientLightIntensity: 0.1,
          undulation: 0.1,
          terrainType: 1,
          terrainAmplitude: 0.3,
          terrainSharpness: 0.7,
          terrainOffset: 0,
        },
      },
    } as PlanetProperties,
  });

  // Perdita
  actions.addCelestial({
    id: "perdita",
    name: "Perdita",
    seed: "perdita",
    type: CelestialType.MOON,
    parentId: parentId,
    realMass_kg: 5.0e15,
    realRadius_m: 13000,
    temperature: 65,
    albedo: 0.07,
    siderealRotationPeriod_s: 0.638411 * 86400,
    axialTilt: new OSVector3(0, 1, 0),
    orbit: {
      realSemiMajorAxis_m: 76400 * KM,
      eccentricity: 0.002,
      inclination: 0.0,
      longitudeOfAscendingNode: 0.0,
      argumentOfPeriapsis: 310.4 * DEG_TO_RAD,
      meanAnomaly: 32.2 * DEG_TO_RAD,
      period_s: 0.638411 * 86400,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE_WORLD,
      isMoon: true,
      parentPlanet: parentId,
      composition: ["water ice", "silicates"],
      surface: {
        surfaceType: SurfaceType.CRATERED,
        proceduralData: {
          color1: "#B0C4DE",
          color2: "#B0C4DE",
          color3: "#B0C4DE",
          color4: "#B0C4DE",
          color5: "#B0C4DE",
          planetType: PlanetType.ICE_WORLD,
          persistence: 0.5,
          lacunarity: 2.0,
          simplePeriod: 5.0,
          octaves: 5,
          bumpScale: 0.3,
          height1: 0,
          height2: 0.25,
          height3: 0.5,
          height4: 0.75,
          height5: 1,
          shininess: 0.1,
          specularStrength: 0.1,
          roughness: 0.8,
          ambientLightIntensity: 0.1,
          undulation: 0.1,
          terrainType: 1,
          terrainAmplitude: 0.3,
          terrainSharpness: 0.7,
          terrainOffset: 0,
        },
      },
    } as PlanetProperties,
  });

  // Mab
  actions.addCelestial({
    id: "mab",
    name: "Mab",
    seed: "mab",
    type: CelestialType.MOON,
    parentId: parentId,
    realMass_kg: 3.0e15,
    realRadius_m: 12000,
    temperature: 65,
    albedo: 0.1,
    siderealRotationPeriod_s: 0.923293 * 86400,
    axialTilt: new OSVector3(0, 1, 0),
    orbit: {
      realSemiMajorAxis_m: 97700 * KM,
      eccentricity: 0.003,
      inclination: 0.1 * DEG_TO_RAD,
      longitudeOfAscendingNode: 188.2 * DEG_TO_RAD,
      argumentOfPeriapsis: 237.9 * DEG_TO_RAD,
      meanAnomaly: 348.0 * DEG_TO_RAD,
      period_s: 0.923293 * 86400,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE_WORLD,
      isMoon: true,
      parentPlanet: parentId,
      composition: ["water ice", "silicates"],
      surface: {
        surfaceType: SurfaceType.CRATERED,
        proceduralData: {
          color1: "#B0C4DE",
          color2: "#B0C4DE",
          color3: "#B0C4DE",
          color4: "#B0C4DE",
          color5: "#B0C4DE",
          planetType: PlanetType.ICE_WORLD,
          persistence: 0.5,
          lacunarity: 2.0,
          simplePeriod: 5.0,
          octaves: 5,
          bumpScale: 0.3,
          height1: 0,
          height2: 0.25,
          height3: 0.5,
          height4: 0.75,
          height5: 1,
          shininess: 0.1,
          specularStrength: 0.1,
          roughness: 0.8,
          ambientLightIntensity: 0.1,
          undulation: 0.1,
          terrainType: 1,
          terrainAmplitude: 0.3,
          terrainSharpness: 0.7,
          terrainOffset: 0,
        },
      },
    } as PlanetProperties,
  });

  // Cupid
  actions.addCelestial({
    id: "cupid",
    name: "Cupid",
    seed: "cupid",
    type: CelestialType.MOON,
    parentId: parentId,
    realMass_kg: 3.0e15,
    realRadius_m: 9000,
    temperature: 65,
    albedo: 0.07,
    siderealRotationPeriod_s: 0.613168 * 86400,
    axialTilt: new OSVector3(0, 1, 0),
    orbit: {
      realSemiMajorAxis_m: 74400 * KM,
      eccentricity: 0.005,
      inclination: 0.1 * DEG_TO_RAD,
      longitudeOfAscendingNode: 206.6 * DEG_TO_RAD,
      argumentOfPeriapsis: 13.5 * DEG_TO_RAD,
      meanAnomaly: 160.6 * DEG_TO_RAD,
      period_s: 0.613168 * 86400,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE_WORLD,
      isMoon: true,
      parentPlanet: parentId,
      composition: ["water ice", "silicates"],
      surface: {
        surfaceType: SurfaceType.CRATERED,
        proceduralData: {
          color1: "#B0C4DE",
          color2: "#B0C4DE",
          color3: "#B0C4DE",
          color4: "#B0C4DE",
          color5: "#B0C4DE",
          planetType: PlanetType.ICE_WORLD,
          persistence: 0.5,
          lacunarity: 2.0,
          simplePeriod: 5.0,
          octaves: 5,
          bumpScale: 0.3,
          height1: 0,
          height2: 0.25,
          height3: 0.5,
          height4: 0.75,
          height5: 1,
          shininess: 0.1,
          specularStrength: 0.1,
          roughness: 0.8,
          ambientLightIntensity: 0.1,
          undulation: 0.1,
          terrainType: 1,
          terrainAmplitude: 0.3,
          terrainSharpness: 0.7,
          terrainOffset: 0,
        },
      },
    } as PlanetProperties,
  });
  // --- END: Additional Major Moons ---
}
