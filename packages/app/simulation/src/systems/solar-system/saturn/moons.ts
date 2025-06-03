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

const TITAN_MASS_KG = 1.3452e23;
const TITAN_RADIUS_M = 2574700;
const TITAN_SMA_M = 1221870 * KM;
const TITAN_ECC = 0.0288;
const TITAN_INC_DEG = 0.3485;
const TITAN_SIDEREAL_PERIOD_S = 1377700;
const TITAN_ALBEDO = 0.22;

const RHEA_MASS_KG = 2.306e21;
const RHEA_RADIUS_M = 763800;
const RHEA_SMA_M = 527108 * KM;
const RHEA_ECC = 0.001;
const RHEA_INC_DEG = 0.345;
const RHEA_SIDEREAL_PERIOD_S = 390262;
const RHEA_ALBEDO = 0.949;

const IAPETUS_MASS_KG = 1.806e21;
const IAPETUS_RADIUS_M = 734500;
const IAPETUS_SMA_M = 3560820 * KM;
const IAPETUS_ECC = 0.0283;
const IAPETUS_INC_DEG = 15.47;
const IAPETUS_SIDEREAL_PERIOD_S = 6855300;
const IAPETUS_ALBEDO = 0.04;

const DIONE_MASS_KG = 1.095e21;
const DIONE_RADIUS_M = 561400;
const DIONE_SMA_M = 377396 * KM;
const DIONE_ECC = 0.0022;
const DIONE_INC_DEG = 0.019;
const DIONE_SIDEREAL_PERIOD_S = 236518;
const DIONE_ALBEDO = 0.998;

const TETHYS_MASS_KG = 6.174e20;
const TETHYS_RADIUS_M = 531100;
const TETHYS_SMA_M = 294619 * KM;
const TETHYS_ECC = 0.0001;
const TETHYS_INC_DEG = 1.12;
const TETHYS_SIDEREAL_PERIOD_S = 163475;
const TETHYS_ALBEDO = 1.229;

/**
 * Initializes Saturn's major moons using accurate data.
 * @param saturnId The ID of Saturn.
 */
export function initializeSaturnMoons(saturnId: string): void {
  const defaultMoonAxialTilt = new OSVector3(0, 1, 0);

  // Titan procedural surface data (orange hazy surface)
  const titanProceduralSurface: ProceduralSurfaceProperties = {
    persistence: 0.45,
    lacunarity: 2.1,
    simplePeriod: 5.0,
    octaves: 5,
    bumpScale: 0.8,
    color1: "#606070", // Dark terrain
    color2: "#808090", // Mid terrain
    color3: "#B0B0C0", // Light terrain
    color4: "#D0D0E0", // Bright terrain
    color5: "#F0F0F8", // Very bright areas
    height1: 0.0,
    height2: 0.3,
    height3: 0.5,
    height4: 0.7,
    height5: 0.85,
    shininess: 0.2,
    specularStrength: 0.1,
    roughness: 0.2,
    ambientLightIntensity: 0.15,
    undulation: 0.05,
    terrainType: 2,
    terrainAmplitude: 0.3,
    terrainSharpness: 0.6,
    terrainOffset: 0.0,
  };

  actions.addCelestial({
    id: "titan",
    name: "Titan",
    seed: "titan",
    type: CelestialType.MOON,
    parentId: saturnId,
    realMass_kg: TITAN_MASS_KG,
    realRadius_m: TITAN_RADIUS_M,
    temperature: 94,
    albedo: TITAN_ALBEDO,
    siderealRotationPeriod_s: TITAN_SIDEREAL_PERIOD_S,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: TITAN_SMA_M,
      eccentricity: TITAN_ECC,
      inclination: TITAN_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: TITAN_SIDEREAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE_WORLD,
      isMoon: true,
      parentPlanet: saturnId,
      composition: [
        "nitrogen atmosphere",
        "methane clouds",
        "water ice mantle",
        "rocky core",
        "liquid methane/ethane lakes",
      ],
      atmosphere: {
        glowColor: "#FFA500",
        intensity: 0.7,
        power: 1.3,
        thickness: 0.35,
        composition: ["N2", "CH4"], // Added for completeness
        pressure: 146700, // Titan's surface pressure in Pa
      },
      surface: {
        surfaceType: SurfaceType.VARIED,

        proceduralData: {
          ...titanProceduralSurface,
          planetType: PlanetType.ICE_WORLD,
        },
      },
    } as PlanetProperties,
  });

  // Rhea procedural surface data (bright icy surface)
  const rheaProceduralSurface: ProceduralSurfaceProperties = {
    persistence: 0.45,
    lacunarity: 2.1,
    simplePeriod: 5.0,
    octaves: 5,
    bumpScale: 0.8,
    color1: "#C0C0C8", // Light grayish ice
    color2: "#D0D0D8", // Lighter ice
    color3: "#E0E0E8", // Bright ice
    color4: "#F0F0F8", // Very bright ice
    color5: "#FFFFFF", // Pure white ice
    height1: 0.0,
    height2: 0.3,
    height3: 0.5,
    height4: 0.7,
    height5: 0.85,
    shininess: 0.6,
    specularStrength: 0.5,
    roughness: 0.7,
    ambientLightIntensity: 0.15,
    undulation: 0.05,
    terrainType: 2,
    terrainAmplitude: 0.3,
    terrainSharpness: 0.6,
    terrainOffset: 0.0,
  };

  actions.addCelestial({
    id: "rhea",
    name: "Rhea",
    seed: "rhea",
    type: CelestialType.MOON,
    parentId: saturnId,
    realMass_kg: RHEA_MASS_KG,
    realRadius_m: RHEA_RADIUS_M,
    temperature: 73,
    albedo: RHEA_ALBEDO,
    siderealRotationPeriod_s: RHEA_SIDEREAL_PERIOD_S,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: RHEA_SMA_M,
      eccentricity: RHEA_ECC,
      inclination: RHEA_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: RHEA_SIDEREAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE_WORLD,
      isMoon: true,
      parentPlanet: saturnId,
      composition: ["water ice", "rocky core"],
      atmosphere: undefined, // Rhea has essentially no atmosphere
      surface: {
        surfaceType: SurfaceType.VARIED,

        proceduralData: {
          ...rheaProceduralSurface,
          planetType: PlanetType.ICE_WORLD,
        },
      },
    } as PlanetProperties,
  });

  // Iapetus procedural surface data (two-toned surface)
  const iapetusProceduralSurface: ProceduralSurfaceProperties = {
    persistence: 0.45,
    lacunarity: 2.1,
    simplePeriod: 5.0,
    octaves: 5,
    bumpScale: 0.8,
    color1: "#201008", // Very dark carbonaceous material
    color2: "#404028", // Dark terrain
    color3: "#808080", // Mixed terrain
    color4: "#C0C0C0", // Bright ice
    color5: "#F0F0F8", // Very bright ice
    height1: 0.0,
    height2: 0.3,
    height3: 0.5,
    height4: 0.7,
    height5: 0.85,
    shininess: 0.2,
    specularStrength: 0.1,
    roughness: 0.7,
    ambientLightIntensity: 0.15,
    undulation: 0.05,
    terrainType: 2,
    terrainAmplitude: 0.3,
    terrainSharpness: 0.6,
    terrainOffset: 0.0,
  };

  actions.addCelestial({
    id: "iapetus",
    name: "Iapetus",
    seed: "iapetus",
    type: CelestialType.MOON,
    parentId: saturnId,
    realMass_kg: IAPETUS_MASS_KG,
    realRadius_m: IAPETUS_RADIUS_M,
    temperature: 110,
    albedo: IAPETUS_ALBEDO,
    siderealRotationPeriod_s: IAPETUS_SIDEREAL_PERIOD_S,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: IAPETUS_SMA_M,
      eccentricity: IAPETUS_ECC,
      inclination: IAPETUS_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: IAPETUS_SIDEREAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE_WORLD,
      isMoon: true,
      parentPlanet: saturnId,
      composition: ["water ice", "rock", "carbonaceous material on one side"],
      atmosphere: undefined, // Iapetus has no significant atmosphere
      surface: {
        surfaceType: SurfaceType.VARIED,

        proceduralData: {
          ...iapetusProceduralSurface,
          planetType: PlanetType.ICE_WORLD,
        },
      },
    } as PlanetProperties,
  });

  // Dione procedural surface data (bright icy surface with some features)
  const dioneProceduralSurface: ProceduralSurfaceProperties = {
    persistence: 0.45,
    lacunarity: 2.1,
    simplePeriod: 5.0,
    octaves: 5,
    bumpScale: 0.8,
    color1: "#B0B0B8", // Gray-white ice
    color2: "#C0C0C8", // Light ice
    color3: "#D0D0D8", // Bright ice
    color4: "#E0E0E8", // Very bright ice
    color5: "#F0F0F8", // Brilliant white ice
    height1: 0.0,
    height2: 0.3,
    height3: 0.5,
    height4: 0.7,
    height5: 0.85,
    shininess: 0.7,
    specularStrength: 0.6,
    roughness: 0.5,
    ambientLightIntensity: 0.15,
    undulation: 0.05,
    terrainType: 2,
    terrainAmplitude: 0.3,
    terrainSharpness: 0.6,
    terrainOffset: 0.0,
  };

  actions.addCelestial({
    id: "dione",
    name: "Dione",
    seed: "dione",
    type: CelestialType.MOON,
    parentId: saturnId,
    realMass_kg: DIONE_MASS_KG,
    realRadius_m: DIONE_RADIUS_M,
    temperature: 87,
    albedo: DIONE_ALBEDO,
    siderealRotationPeriod_s: DIONE_SIDEREAL_PERIOD_S,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: DIONE_SMA_M,
      eccentricity: DIONE_ECC,
      inclination: DIONE_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: DIONE_SIDEREAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE_WORLD,
      isMoon: true,
      parentPlanet: saturnId,
      composition: ["water ice", "rocky core"],
      atmosphere: undefined, // Dione has no significant atmosphere
      surface: {
        surfaceType: SurfaceType.VARIED,

        proceduralData: {
          ...dioneProceduralSurface,
          planetType: PlanetType.ICE_WORLD,
        },
      },
    } as PlanetProperties,
  });

  // Tethys procedural surface data (very bright icy surface)
  const tethysProceduralSurface: ProceduralSurfaceProperties = {
    persistence: 0.45,
    lacunarity: 2.1,
    simplePeriod: 5.0,
    octaves: 5,
    bumpScale: 0.8,
    color1: "#D0D0D8", // Bright ice
    color2: "#E0E0E8", // Very bright ice
    color3: "#F0F0F8", // Brilliant ice
    color4: "#F8F8FC", // Near white ice
    color5: "#FFFFFF", // Pure white ice
    height1: 0.0,
    height2: 0.3,
    height3: 0.5,
    height4: 0.7,
    height5: 0.85,
    shininess: 0.8,
    specularStrength: 0.7,
    roughness: 0.4,
    ambientLightIntensity: 0.15,
    undulation: 0.05,
    terrainType: 2,
    terrainAmplitude: 0.3,
    terrainSharpness: 0.6,
    terrainOffset: 0.0,
  };

  actions.addCelestial({
    id: "tethys",
    name: "Tethys",
    seed: "tethys",
    type: CelestialType.MOON,
    parentId: saturnId,
    realMass_kg: TETHYS_MASS_KG,
    realRadius_m: TETHYS_RADIUS_M,
    temperature: 86,
    albedo: TETHYS_ALBEDO,
    siderealRotationPeriod_s: TETHYS_SIDEREAL_PERIOD_S,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: TETHYS_SMA_M,
      eccentricity: TETHYS_ECC,
      inclination: TETHYS_INC_DEG * DEG_TO_RAD,
      longitudeOfAscendingNode: Math.random() * 2 * Math.PI,
      argumentOfPeriapsis: Math.random() * 2 * Math.PI,
      meanAnomaly: Math.random() * 2 * Math.PI,
      period_s: TETHYS_SIDEREAL_PERIOD_S,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE_WORLD,
      isMoon: true,
      parentPlanet: saturnId,
      composition: ["water ice", "rocky core"],
      atmosphere: undefined, // Tethys has no significant atmosphere
      surface: {
        surfaceType: SurfaceType.VARIED,

        proceduralData: {
          ...tethysProceduralSurface,
          planetType: PlanetType.ICE_WORLD,
        },
      },
    } as PlanetProperties,
  });

  // Mimas
  actions.addCelestial({
    id: "mimas",
    name: "Mimas",
    seed: "mimas",
    type: CelestialType.MOON,
    parentId: saturnId,
    realMass_kg: 3.7493e19,
    realRadius_m: 198200,
    temperature: 64,
    albedo: 0.96,
    siderealRotationPeriod_s: 0.942422 * 86400,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: 186000 * KM,
      eccentricity: 0.02,
      inclination: 1.6 * DEG_TO_RAD,
      longitudeOfAscendingNode: 66.2 * DEG_TO_RAD,
      argumentOfPeriapsis: 160.4 * DEG_TO_RAD,
      meanAnomaly: 275.3 * DEG_TO_RAD,
      period_s: 0.942422 * 86400,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE_WORLD,
      isMoon: true,
      parentPlanet: saturnId,
      composition: ["water ice", "silicates"],
      surface: {
        surfaceType: SurfaceType.CRATERED,
        composition: ["water ice", "silicates"],
        proceduralData: {
          color1: "#E0E0E0",
          color2: "#E0E0E0",
          color3: "#E0E0E0",
          color4: "#E0E0E0",
          color5: "#E0E0E0",
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

  // Enceladus
  actions.addCelestial({
    id: "enceladus",
    name: "Enceladus",
    seed: "enceladus",
    type: CelestialType.MOON,
    parentId: saturnId,
    realMass_kg: 1.0802e20,
    realRadius_m: 252100,
    temperature: 75,
    albedo: 1.0,
    siderealRotationPeriod_s: 1.370218 * 86400,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: 238400 * KM,
      eccentricity: 0.005,
      inclination: 0.0,
      longitudeOfAscendingNode: 0.0,
      argumentOfPeriapsis: 119.5 * DEG_TO_RAD,
      meanAnomaly: 57.0 * DEG_TO_RAD,
      period_s: 1.370218 * 86400,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE_WORLD,
      isMoon: true,
      parentPlanet: saturnId,
      composition: ["water ice", "unknown"],
      surface: {
        surfaceType: SurfaceType.ICE_CRACKED,
        proceduralData: {
          color1: "#F8F8FF",
          color2: "#F8F8FF",
          color3: "#F8F8FF",
          color4: "#F8F8FF",
          color5: "#F8F8FF",
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

  // Hyperion
  actions.addCelestial({
    id: "hyperion",
    name: "Hyperion",
    seed: "hyperion",
    type: CelestialType.MOON,
    parentId: saturnId,
    realMass_kg: 5.6e18,
    realRadius_m: 135000,
    temperature: 70,
    albedo: 0.3,
    siderealRotationPeriod_s: 21.276658 * 86400, // Note: Hyperion has chaotic rotation
    axialTilt: defaultMoonAxialTilt, // Simplified, actual axial tilt is chaotic
    orbit: {
      realSemiMajorAxis_m: 1481500 * KM,
      eccentricity: 0.105,
      inclination: 0.6 * DEG_TO_RAD,
      longitudeOfAscendingNode: 87.1 * DEG_TO_RAD,
      argumentOfPeriapsis: 214.0 * DEG_TO_RAD,
      meanAnomaly: 122.9 * DEG_TO_RAD,
      period_s: 21.276658 * 86400,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ICE_WORLD, // Primarily icy, but irregular
      isMoon: true,
      parentPlanet: saturnId,
      composition: ["water ice", "silicates"],
      surface: {
        surfaceType: SurfaceType.CRATERED, // Highly cratered and irregular
        proceduralData: {
          color1: "#D2B48C",
          color2: "#D2B48C",
          color3: "#D2B48C",
          color4: "#D2B48C",
          color5: "#D2B48C",
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

  // Phoebe
  actions.addCelestial({
    id: "phoebe",
    name: "Phoebe",
    seed: "phoebe",
    type: CelestialType.MOON,
    parentId: saturnId,
    realMass_kg: 8.292e18,
    realRadius_m: 106500,
    temperature: 75,
    albedo: 0.08,
    siderealRotationPeriod_s: 0.40379 * 86400, // Roughly 9.7 hours
    axialTilt: defaultMoonAxialTilt, // Assuming synchronous rotation, axial tilt is complex for irregulars
    orbit: {
      realSemiMajorAxis_m: 12929400 * KM,
      eccentricity: 0.164,
      inclination: 175.2 * DEG_TO_RAD, // Retrograde orbit
      longitudeOfAscendingNode: 192.7 * DEG_TO_RAD,
      argumentOfPeriapsis: 240.3 * DEG_TO_RAD,
      meanAnomaly: 308.0 * DEG_TO_RAD,
      period_s: 550.30391 * 86400, // Retrograde, hence negative could be used if system supports it.
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ROCKY_WORLD, // Dark, carbonaceous object, likely captured asteroid
      isMoon: true,
      parentPlanet: saturnId,
      composition: ["silicates", "water ice", "carbon"],
      surface: {
        surfaceType: SurfaceType.CRATERED,
        proceduralData: {
          color1: "#808080",
          color2: "#808080",
          color3: "#808080",
          color4: "#808080",
          color5: "#808080",
          planetType: PlanetType.ROCKY_WORLD,
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

  // Janus
  actions.addCelestial({
    id: "janus",
    name: "Janus",
    seed: "janus",
    type: CelestialType.MOON,
    parentId: saturnId,
    realMass_kg: 1.897e18,
    realRadius_m: 89200,
    temperature: 75,
    albedo: 0.2,
    siderealRotationPeriod_s: 0.697353 * 86400,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: 151500 * KM,
      eccentricity: 0.007,
      inclination: 0.2 * DEG_TO_RAD,
      longitudeOfAscendingNode: 159.9 * DEG_TO_RAD,
      argumentOfPeriapsis: 11.1 * DEG_TO_RAD,
      meanAnomaly: 111.7 * DEG_TO_RAD,
      period_s: 0.697353 * 86400,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ROCKY_WORLD, // Porous, icy/rocky body
      isMoon: true,
      parentPlanet: saturnId,
      composition: ["silicates", "water ice"],
      surface: {
        surfaceType: SurfaceType.CRATERED,
        proceduralData: {
          color1: "#C2B280",
          color2: "#C2B280",
          color3: "#C2B280",
          color4: "#C2B280",
          color5: "#C2B280",
          planetType: PlanetType.ROCKY_WORLD,
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

  // Epimetheus
  actions.addCelestial({
    id: "epimetheus",
    name: "Epimetheus",
    seed: "epimetheus",
    type: CelestialType.MOON,
    parentId: saturnId,
    realMass_kg: 5.3e17,
    realRadius_m: 58200,
    temperature: 75,
    albedo: 0.2,
    siderealRotationPeriod_s: 0.697012 * 86400,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: 151400 * KM, // Note: Co-orbital with Janus
      eccentricity: 0.02,
      inclination: 0.3 * DEG_TO_RAD,
      longitudeOfAscendingNode: 189.8 * DEG_TO_RAD,
      argumentOfPeriapsis: 96.3 * DEG_TO_RAD,
      meanAnomaly: 197.2 * DEG_TO_RAD,
      period_s: 0.697012 * 86400,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ROCKY_WORLD, // Porous, icy/rocky body
      isMoon: true,
      parentPlanet: saturnId,
      composition: ["silicates", "water ice"],
      surface: {
        surfaceType: SurfaceType.CRATERED,
        proceduralData: {
          color1: "#C2B280",
          color2: "#C2B280",
          color3: "#C2B280",
          color4: "#C2B280",
          color5: "#C2B280",
          planetType: PlanetType.ROCKY_WORLD,
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

  // Pandora
  actions.addCelestial({
    id: "pandora",
    name: "Pandora",
    seed: "pandora",
    type: CelestialType.MOON,
    parentId: saturnId,
    realMass_kg: 1.37e17,
    realRadius_m: 40600,
    temperature: 75,
    albedo: 0.2,
    siderealRotationPeriod_s: 0.631369 * 86400,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: 141700 * KM, // Shepherd moon of the F Ring
      eccentricity: 0.004,
      inclination: 0.0,
      longitudeOfAscendingNode: 0.0, // Relative to Saturn's equatorial plane
      argumentOfPeriapsis: 217.9 * DEG_TO_RAD,
      meanAnomaly: 123.9 * DEG_TO_RAD,
      period_s: 0.631369 * 86400,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ROCKY_WORLD, // Icy/rocky
      isMoon: true,
      parentPlanet: saturnId,
      composition: ["silicates", "water ice"],
      surface: {
        surfaceType: SurfaceType.CRATERED,
        proceduralData: {
          color1: "#C2B280",
          color2: "#C2B280",
          color3: "#C2B280",
          color4: "#C2B280",
          color5: "#C2B280",
          planetType: PlanetType.ROCKY_WORLD,
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

  // Prometheus
  actions.addCelestial({
    id: "prometheus",
    name: "Prometheus",
    seed: "prometheus",
    type: CelestialType.MOON,
    parentId: saturnId,
    realMass_kg: 1.59e17,
    realRadius_m: 43100,
    temperature: 75,
    albedo: 0.2,
    siderealRotationPeriod_s: 0.615878 * 86400,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: 139400 * KM, // Shepherd moon of the F Ring
      eccentricity: 0.002,
      inclination: 0.0,
      longitudeOfAscendingNode: 0.0,
      argumentOfPeriapsis: 341.9 * DEG_TO_RAD,
      meanAnomaly: 135.4 * DEG_TO_RAD,
      period_s: 0.615878 * 86400,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ROCKY_WORLD, // Icy/rocky
      isMoon: true,
      parentPlanet: saturnId,
      composition: ["silicates", "water ice"],
      surface: {
        surfaceType: SurfaceType.CRATERED,
        proceduralData: {
          color1: "#C2B280",
          color2: "#C2B280",
          color3: "#C2B280",
          color4: "#C2B280",
          color5: "#C2B280",
          planetType: PlanetType.ROCKY_WORLD,
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

  // Pan
  actions.addCelestial({
    id: "pan",
    name: "Pan",
    seed: "pan",
    type: CelestialType.MOON,
    parentId: saturnId,
    realMass_kg: 4.95e15,
    realRadius_m: 14000,
    temperature: 75,
    albedo: 0.2,
    siderealRotationPeriod_s: 0.575051 * 86400,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: 133600 * KM, // Orbits within Encke Gap in A Ring
      eccentricity: 0.0,
      inclination: 0.0,
      longitudeOfAscendingNode: 0.0,
      argumentOfPeriapsis: 0.0,
      meanAnomaly: 146.6 * DEG_TO_RAD,
      period_s: 0.575051 * 86400,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ROCKY_WORLD, // Icy/rocky, unique "walnut" shape
      isMoon: true,
      parentPlanet: saturnId,
      composition: ["silicates", "water ice"],
      surface: {
        surfaceType: SurfaceType.CRATERED, // Has an equatorial ridge
        proceduralData: {
          color1: "#C2B280",
          color2: "#C2B280",
          color3: "#C2B280",
          color4: "#C2B280",
          color5: "#C2B280",
          planetType: PlanetType.ROCKY_WORLD,
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

  // Atlas
  actions.addCelestial({
    id: "atlas",
    name: "Atlas",
    seed: "atlas",
    type: CelestialType.MOON,
    parentId: saturnId,
    realMass_kg: 6.6e15,
    realRadius_m: 15100,
    temperature: 75,
    albedo: 0.2,
    siderealRotationPeriod_s: 0.604602 * 86400,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: 137700 * KM, // Orbits at outer edge of A Ring
      eccentricity: 0.001,
      inclination: 0.0,
      longitudeOfAscendingNode: 0.0,
      argumentOfPeriapsis: 82.3 * DEG_TO_RAD,
      meanAnomaly: 289.1 * DEG_TO_RAD,
      period_s: 0.604602 * 86400,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ROCKY_WORLD, // Icy/rocky, "flying saucer" shape
      isMoon: true,
      parentPlanet: saturnId,
      composition: ["silicates", "water ice"],
      surface: {
        surfaceType: SurfaceType.SMOOTH_PLAINS, // Smooth equatorial ridge
        proceduralData: {
          color1: "#C2B280",
          color2: "#C2B280",
          color3: "#C2B280",
          color4: "#C2B280",
          color5: "#C2B280",
          planetType: PlanetType.ROCKY_WORLD,
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

  // Daphnis
  actions.addCelestial({
    id: "daphnis",
    name: "Daphnis",
    seed: "daphnis",
    type: CelestialType.MOON,
    parentId: saturnId,
    realMass_kg: 6.8e13, // Very small mass
    realRadius_m: 4000, // Small radius
    temperature: 75,
    albedo: 0.2,
    siderealRotationPeriod_s: 0.59408 * 86400,
    axialTilt: defaultMoonAxialTilt,
    orbit: {
      realSemiMajorAxis_m: 136500 * KM, // Orbits within Keeler Gap in A Ring
      eccentricity: 0.0,
      inclination: 0.0,
      longitudeOfAscendingNode: 0.0,
      argumentOfPeriapsis: 0.0,
      meanAnomaly: 153.6 * DEG_TO_RAD,
      period_s: 0.59408 * 86400,
    },
    properties: {
      type: CelestialType.MOON,
      planetType: PlanetType.ROCKY_WORLD, // Icy/rocky
      isMoon: true,
      parentPlanet: saturnId,
      composition: ["silicates", "water ice"],
      surface: {
        surfaceType: SurfaceType.CRATERED, // Creates waves in ring edges
        proceduralData: {
          color1: "#C2B280",
          color2: "#C2B280",
          color3: "#C2B280",
          color4: "#C2B280",
          color5: "#C2B280",
          planetType: PlanetType.ROCKY_WORLD,
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
}
