import type {
  AtmosphereType,
  CelestialType,
  GasGiantClass,
  LuminosityClass,
  PlanetType,
  RockyType,
  SpectralClass,
  SpecialSpectralClass,
  StellarType,
  SurfaceType,
  NeutronStarSubtype,
  BlackHoleSubtype,
  WhiteDwarfSubtype,
  ProtostarSubtype,
  CometClass,
  AsteroidClass,
} from "./enums";
import * as THREE from "three";

/**
 * Common properties shared by all specific celestial object property types.
 * Renamed from BaseCelestialProperties for clarity.
 */
export interface SpecificPropertiesBase {
  /** The fundamental type classification of the celestial object (e.g., STAR, PLANET). */
  type: CelestialType;
}

/**
 * Defines the system-wide lighting properties, usually attached to the primary star.
 */
export interface SystemLightingProperties {
  /** The hex color of the ambient light in the system. */
  ambientLightColor: string;
  /** The intensity of the ambient light. */
  ambientLightIntensity: number;
  /** The intensity of the main star's light. */
  starLightIntensity: number;
}

/**
 * Properties specific to Stars.
 */
export interface StarProperties extends SpecificPropertiesBase {
  type: CelestialType.STAR;
  /** Whether this is the main star in the system, used for camera focus on startup. */
  isMainStar: boolean;
  /** The classification based on temperature and spectral lines (e.g., G, K, M). */
  spectralClass: string;
  /** The total energy output of the star, often relative to the Sun (L☉). */
  luminosity: number;
  /** The primary color tint of the star, usually represented as a hex string. */
  color: string;
  /** Hot zone color for plasma, flares, and convection centers */
  hotColor?: string;
  /** Normal surface color (fallback to main color if not specified) */
  surfaceColor?: string;
  /** Cool zone color for sunspots and darker regions */
  coolColor?: string;
  /** The primary stellar type (e.g., MAIN_SEQUENCE, NEUTRON_STAR, BLACK_HOLE). */
  stellarType?: StellarType;
  /** Optional array of partner star IDs, used for multi-star systems orbital calculations. */
  partnerStars?: string[];
  /** Main spectral class (O, B, A, F, G, K, M, etc.) */
  mainSpectralClass?: SpectralClass;
  /** Special spectral class for non-main sequence stars */
  specialSpectralClass?: SpecialSpectralClass;
  /** Luminosity class indicating the size/evolutionary state */
  luminosityClass?: LuminosityClass;
  /** Subtype for neutron stars (PULSAR, MAGNETAR, etc.) */
  neutronStarSubtype?: NeutronStarSubtype;
  /** Subtype for black holes (SCHWARZSCHILD, KERR) */
  blackHoleSubtype?: BlackHoleSubtype;
  /** Subtype for white dwarfs (DA, DB, DC, etc.) */
  whiteDwarfSubtype?: WhiteDwarfSubtype;
  /** Subtype for pre-main-sequence stars (T_TAURI, HERBIG_AE_BE) */
  protostarSubtype?: ProtostarSubtype;
  /** Optional system-wide lighting properties, only present on the primary star. */
  systemLighting?: SystemLightingProperties;
  /** Stellar age in years - affects planet formation and atmospheric evolution */
  age_years?: number;
  /** Metallicity [Fe/H] - affects rocky planet formation probability */
  metallicity?: number;
  /** Material parameters for star rendering - can be modified by uniform editor */
  materialParams?: {
    // Plasma noise parameters for simple effects
    noiseScale?: number;
    noiseIntensity?: number;
    plasmaTurbulence?: number;

    // Uniform lighting
    lightingIntensity?: number;
  };

  /** Enhanced visual effects configuration */
  visualEffects?: {
    // Dynamic surface features
    enableGranulation?: boolean;
    enableSunspots?: boolean;
    enableProminences?: boolean;
    enableSolarFlares?: boolean;
    enableCoronalMassEjections?: boolean;

    // Rotation and movement
    rotationPeriod?: number; // Hours
    differentialRotation?: boolean;
    poleEquatorRatio?: number;

    // Advanced effects
    stellarPulsation?: boolean;
    variableStarType?: "cepheid" | "rr_lyrae" | "delta_scuti" | "none";
    pulsationPeriod?: number; // Days
    pulsationAmplitude?: number;

    // Magnetic field visualization
    magneticFieldLines?: boolean;
    coronalHoles?: boolean;
    activeRegions?: boolean;
  };
}

export interface PlanetAtmosphereProperties {
  /** The color of the glow, usually a hex string. */
  glowColor: string;
  /** The intensity of the glow, usually a number between 0 and 1. */
  intensity: number;
  /** The power of the glow, usually a number between 0 and 1. */
  power: number;
  /** The thickness of the glow, usually a number between 0 and 1. */
  thickness: number;
  /** The opacity of the atmosphere, usually a number between 0 and 1. */
  opacity?: number;
}

/**
 * Represents the properties defining a single planetary ring or a segment of a ring system.
 */
export interface RingProperties {
  /** The inner boundary radius of the ring (SCALED relative to parent's center). */
  innerRadius: number;
  /** The outer boundary radius of the ring (SCALED relative to parent's center). */
  outerRadius: number;
  /** The density of particles within the ring, affecting visual appearance. */
  density: number;
  /** The opacity of the ring (0.0 = transparent, 1.0 = opaque). */
  opacity: number;
  /** The base color tint of the ring particles, usually a hex string. */
  color: string;
  /** The rate at which the ring particles orbit the parent body (e.g., radians per second). */
  rotationRate: number;
  /** Identifier or path for the texture used to render the ring. */
  texture: string;
  /** Array listing the main composition of the ring particles (e.g., ["ice", "rock"]). */
  composition: string[];
  /** The dominant type of rocky material composing the ring particles. */
  type: RockyType;

  // Enhanced Axial Inclination Control
  /** Axial inclination of the ring system relative to the parent's equatorial plane (in radians). This controls the overall tilt of the ring system. */
  axialInclination?: number;
  /** Individual ring tilt relative to the ring system's plane (in radians). Allows for warped or tilted individual rings. */
  ringTilt?: number;
  /** Whether this ring should inherit the parent body's axial tilt. Defaults to true for most rings. */
  inheritParentTilt?: boolean;

  // Accretion Disk Specific Properties
  /** Whether this ring represents an accretion disk (affects rendering and physics). */
  isAccretionDisk?: boolean;
  /** Temperature of the accretion disk material in Kelvin (for emission calculations). */
  temperature?: number;
  /** Accretion rate in solar masses per year (for luminosity calculations). */
  accretionRate?: number;
  /** Type of emission from the accretion disk (thermal, synchrotron, etc.). */
  emissionType?: "thermal" | "synchrotron" | "mixed";
  /** Whether the disk has relativistic effects (for black holes). */
  isRelativistic?: boolean;
  /** Inner edge of the accretion disk (in gravitational radii for black holes). */
  innerEdgeRadius?: number;

  // Ring Segmentation Controls
  /** Number of segments per ring for enhanced visual detail (default: 50.0). */
  segmentDensity?: number;
  /** Width of each segment (0.0-1.0, default: 0.8). */
  segmentWidth?: number;
  /** Intensity of particle detail within segments (0.0-1.0, default: 0.3). */
  particleDetail?: number;
  /** Intensity of density variations within segments (0.0-1.0, default: 0.4). */
  densityVariation?: number;
}

/**
 * Enhanced ring system configuration that can be attached to any celestial object.
 * This provides a more flexible and comprehensive approach to ring systems.
 */
export interface RingSystemConfiguration {
  /** Array defining the rings within this system. */
  rings: RingProperties[];
  /** Overall axial inclination of the entire ring system relative to the parent's equatorial plane (in radians). */
  systemAxialInclination?: number;
  /** Whether the ring system should inherit the parent body's axial tilt. Defaults to true. */
  inheritParentTilt?: boolean;
  /** Precession rate of the ring system (radians per second). */
  precessionRate?: number;
  /** Whether rings should be rendered as a unified system or individual components. */
  unifiedRendering?: boolean;
}

/**
 * Properties specific to Planets (including rocky, terrestrial, ice, etc.). Note: Moons use PlanetProperties.
 */
export interface PlanetProperties<
  T = ProceduralSurfaceProperties,
> extends SpecificPropertiesBase {
  type: CelestialType.PLANET | CelestialType.MOON | CelestialType.DWARF_PLANET;
  /** The specific type classification of the planet (e.g., ROCKY, TERRESTRIAL). */
  classType?: PlanetType;
  /** Indicates if this object orbits a planet rather than a star. */
  isMoon: boolean;
  /** Optional indicator for the desired 3D shape. Defaults to 'sphere' if omitted. */
  shapeModel?: "sphere" | "asteroid" | string;
  /** Array listing the primary chemical or geological composition (e.g., ["silicates", "iron"]). */
  composition: string[];
  /** Optional atmospheric properties. */
  atmosphere?: PlanetAtmosphereProperties;
  /** Optional cloud layer properties. */
  clouds?: {
    /** The visual color of the clouds, usually a hex string. */
    color?: string;
    /** Overall opacity of the cloud layer (0.0 to 1.0). */
    opacity?: number;
    /** Cloud coverage factor (0.0 = no clouds, 1.0 = full coverage). */
    coverage?: number;
    /** Speed of cloud movement/animation. */
    speed?: number;
  };
  /** Optional surface characteristics, specific structure depends on PlanetType. */
  surface?: T;
  /** Enhanced ring system configuration. */
  ringSystem?: RingSystemConfiguration;
  /** Legacy rings property for backward compatibility. */
  rings?: RingProperties[];
}

export interface AsteroidProperties extends SpecificPropertiesBase {
  type: CelestialType.ASTEROID;
  /** The specific type classification of the asteroid (e.g., ROCKY, TERRESTRIAL). */
  classType?: AsteroidClass;
  /** An array of up to 4 colors for the asteroid's procedural texture. */
  colors: string[];
  /** An array of height thresholds (0-1) corresponding to each color. Must have the same length as `colors`. */
  heights: number[];
  /** The composition of the asteroid, usually a string. */
  composition: string;
  /** The density of the asteroid, usually a number between 0 and 1. */
  density: number;
  /** The temperature of the asteroid, usually a number between 0 and 1. */
  temperature: number;

  /** A measure of the asteroid's activity, affecting how much it spins. */
  activity: number;

  visuals: {
    noiseScale?: number; // Scale for the base color layering noise
    blendSharpness?: number; // How sharp the transitions between layers are
    craterScale?: number; // Scale for the crater noise
    craterStrength?: number; // How dark and prominent the craters are
    simplePeriod?: number; // Base frequency for the noise generation
    undulation?: number; // Controls the amount of surface undulation/waviness
    ambientStrength?: number;
    metallicFactor?: number;
    roughness?: number;
    specularColor?: THREE.Color;
  };
}

/**
 * Interface defining properties for procedural surface generation and rendering.
 * These properties control the appearance and characteristics of procedurally generated surfaces
 * such as terrain, planets, or other celestial bodies.
 */
export interface ProceduralSurfaceProperties {
  /** Controls how quickly the noise amplitude decreases with each octave (0-1) */
  persistence: number;
  /** Controls how quickly the frequency increases with each octave (typically > 1) */
  lacunarity: number;
  /** Base frequency for the noise generation */
  simplePeriod: number;
  /** Number of noise layers to combine for detail */
  octaves: number;
  /** Scale factor for normal map/bump mapping effect */
  bumpScale: number;
  /** Base color for the surface (lowest elevation) */
  color1: string;
  /** Second color gradient point */
  color2: string;
  /** Third color gradient point */
  color3: string;
  /** Fourth color gradient point */
  color4: string;
  /** Final color for the surface (highest elevation) */
  color5: string;
  /** Height threshold for color1 transition */
  height1: number;
  /** Height threshold for color2 transition */
  height2: number;
  /** Height threshold for color3 transition */
  height3: number;
  /** Height threshold for color4 transition */
  height4: number;
  /** Height threshold for color5 transition */
  height5: number;
  /** Surface shininess factor (0-1) */
  shininess: number;
  /** Intensity of specular highlights (0-1) */
  specularStrength: number;
  /** Surface roughness factor (0-1) */
  roughness: number;
  /** Intensity of ambient lighting (0-1) */
  ambientLightIntensity: number;
  /** Controls the amount of surface undulation/waviness */
  undulation: number;

  // Terrain generation properties
  /** Type of terrain generation algorithm (1 = simple, 2 = sharp peaks, 3 = sharp valleys) */
  terrainType: number;
  /** Controls overall height scale of the terrain */
  terrainAmplitude: number;
  /** Controls how defined and sharp terrain features appear */
  terrainSharpness: number;
  /** Base height offset for the entire terrain */
  terrainOffset: number;
}

/**
 * Properties specific to Gas Giants.
 */
export interface GasGiantProperties extends SpecificPropertiesBase {
  type: CelestialType.GAS_GIANT;
  classType: GasGiantClass;
  atmosphereColor: string;
  cloudColor: string;
  cloudSpeed: number;

  atmosphere?: {
    composition: string[];
    pressure: number;
    type?: AtmosphereType;
  };

  stormColor?: string;
  stormSpeed?: number;
  ringTilt?: { x?: number; y?: number; z?: number };
  axialTiltDeg?: number;
  emissiveColor?: string;
  emissiveIntensity?: number;
  /** Enhanced ring system configuration. */
  ringSystem?: RingSystemConfiguration;
  /** Legacy rings property for backward compatibility. */
  rings?: RingProperties[];
}

/**
 * Properties specific to Comets.
 */
export interface CometProperties extends SpecificPropertiesBase {
  /** The type of celestial object. */
  type: CelestialType.COMET;

  /** The date the comet was discovered. */
  discoveredDate?: string;

  /**
   * The orbital classification of the comet.
   */
  classType: CometClass;
  /** Array listing the primary chemical components (e.g., ["water ice", "CO2"]). */
  composition: string[];
  /** An array of up to 4 colors for the comet's procedural texture. */
  colors: string[];
  /** An array of height thresholds (0-1) corresponding to each color. */
  heights: number[];
  /** A measure of the comet's outgassing activity, affecting tail and coma visibility (0.0 = extinct, 1.0 = highly active). */
  activity: number;
  /** Visual radius of the coma (in scaled units). */
  visualComaRadius?: number;
  /** Color of the coma, usually a hex string. */
  visualComaColor?: string;
  /** Opacity of the coma (0 to 1). */
  visualComaOpacity?: number;
  /** Optional visual maximum length of the comet's tail (in scaled units). */
  visualMaxTailLength?: number;
  /** Color of the comet's tail, usually a hex string. */
  visualTailColor?: string;
  /** Opacity of the tail (0 to 1). */
  visualTailOpacity?: number;
  /** Optional container for detailed visual parameters of the nucleus shader. */
  visuals?: {
    noiseScale?: number;
    blendSharpness?: number;
    craterScale?: number;
    craterStrength?: number;
    simplePeriod?: number;
    undulation?: number;
    ambientStrength?: number;
    metallicFactor?: number;
    roughness?: number;
    specularColor?: THREE.Color;
  };
}

/**
 * Properties specific to Asteroid Fields.
 */
export interface AsteroidFieldProperties extends SpecificPropertiesBase {
  type: CelestialType.ASTEROID_FIELD;
  /** The inner radius boundary of the field (REAL AU units). */
  innerRadiusAU: number;
  /** The outer radius boundary of the field (REAL AU units). */
  outerRadiusAU: number;
  /** The vertical thickness or height of the asteroid field (REAL AU units). */
  heightAU: number;
  /** The approximate number of individual asteroids to represent or render within the field. */
  count: number;
  /** The base color tint for the asteroids in the field, usually a hex string. */
  color: string;
  /** Array listing the primary chemical composition (e.g., ["iron", "silicates"]). */
  composition: string[];

  visualInnerRadius?: number;
  visualOuterRadius?: number;
  visualHeight?: number;
  visualDensity?: number;
  visualParticleColor?: string;
  /** Optional array of texture paths for asteroid rendering. If empty or not provided, fallback textures will be used. */
  texturePaths?: string[];
}

/**
 * Properties specific to the Oort Cloud.
 */
export interface OortCloudProperties extends SpecificPropertiesBase {
  type: CelestialType.OORT_CLOUD;
  /** Array listing the primary chemical composition (e.g., ["water ice", "ammonia ice"]). */
  composition: string[];
  /** The inner boundary radius of the cloud (REAL AU units). */
  innerRadiusAU: number;
  /** The outer boundary radius of the cloud (REAL AU units). */
  outerRadiusAU: number;

  /** Abstract density used for rendering. */
  visualDensity: number;
  /** Number of particles to use for visual representation. */
  visualParticleCount: number;
  /** Color of the visual particles. */
  visualParticleColor: string;
  /** Optional array of texture paths for Oort Cloud particle rendering. If empty or not provided, fallback textures will be used. */
  texturePaths?: string[];

  // Optional properties for consistency with AsteroidFieldProperties
  /** Optional visual override for inner radius (if different from physical innerRadiusAU). */
  visualInnerRadius?: number;
  /** Optional visual override for outer radius (if different from physical outerRadiusAU). */
  visualOuterRadius?: number;
  /** Alternative to visualParticleCount for consistency with asteroid field naming. */
  count?: number;
  /** Alternative to visualParticleColor for consistency with asteroid field naming. */
  color?: string;
}

/**
 * Properties specific to a Ring System object.
 * This represents the rings themselves as a separate entity.
 */
export interface RingSystemProperties extends SpecificPropertiesBase {
  type: CelestialType.RING_SYSTEM;
  /** Array defining the rings within this system. */
  rings: RingProperties[];
  /** The ID of the celestial object these rings orbit. */
  parentId: string;
}

/**
 * Properties specific to Satellite objects (man-made spacecraft and stations).
 */
export interface SatelliteProperties extends SpecificPropertiesBase {
  type: CelestialType.SATELLITE;
  /** Path to the 3D model file (e.g., FBX, GLB format). */
  modelPath: string;
  /** Optional scale factor for the model (default: 1.0). */
  modelScale?: number;
  /** Optional array listing the main components (e.g., ["solar panels", "communication array"]). */
  components?: string[];
  /** Optional mission type classification. */
  missionType?:
    | "communications"
    | "navigation"
    | "scientific"
    | "military"
    | "commercial"
    | "other";
  /** Optional operational status. */
  operationalStatus?: "active" | "inactive" | "deorbited" | "decommissioned";
  /** Optional launch date as ISO string. */
  launchDate?: string;
  /** Optional expected mission duration in years. */
  missionDuration?: number;
  /** Optional custom material properties for enhanced rendering */
  materialProperties?: {
    /** Metallic factor for PBR materials (0.0 - 1.0) */
    metalness?: number;
    /** Roughness factor for PBR materials (0.0 - 1.0) */
    roughness?: number;
    /** Environment map reflection intensity (0.0 - 2.0) */
    envMapIntensity?: number;
  };
}

/** Union type for all specific celestial properties */
export type CelestialSpecificPropertiesUnion =
  | StarProperties
  | PlanetProperties
  | GasGiantProperties
  | CometProperties
  | AsteroidFieldProperties
  | OortCloudProperties
  | RingSystemProperties
  | SatelliteProperties
  | AsteroidProperties;

export interface CelestialObjectProperties {
  planet?: PlanetProperties;
  star?: StarProperties;
  ringSystem?: RingSystemProperties;
  asteroidField?: AsteroidFieldProperties;
  oortCloud?: OortCloudProperties;
  proceduralSurface?: ProceduralSurfaceProperties;
}

export type CelestiaClassType =
  | PlanetType
  | GasGiantClass
  | StellarType
  | CometClass;
