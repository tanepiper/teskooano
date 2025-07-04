import type {
  AtmosphereType,
  CelestialType,
  ExoticStellarType,
  GasGiantClass,
  LuminosityClass,
  PlanetType,
  RockyType,
  SpectralClass,
  SpecialSpectralClass,
  StellarType,
  SurfaceType,
  WhiteDwarfType,
} from "./enums";

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
  /** Optional classification for exotic star types like Neutron Stars, Black Holes, etc. */
  classType?: StellarType;
  /** Optional array of partner star IDs, used for multi-star systems orbital calculations. */
  partnerStars?: string[];
  /** Main spectral class (O, B, A, F, G, K, M, etc.) */
  mainSpectralClass?: SpectralClass;
  /** Special spectral class for non-main sequence stars */
  specialSpectralClass?: SpecialSpectralClass;
  /** Luminosity class indicating the size/evolutionary state */
  luminosityClass?: LuminosityClass;
  /** White dwarf specific classification */
  whiteDwarfType?: WhiteDwarfType;
  /** Type for exotic stellar objects like neutron stars */
  exoticType?: ExoticStellarType;
  /** Optional system-wide lighting properties, only present on the primary star. */
  systemLighting?: SystemLightingProperties;
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
}

/**
 * Properties specific to Planets (including rocky, terrestrial, ice, etc.). Note: Moons use PlanetProperties.
 */
export interface PlanetProperties<T = ProceduralSurfaceProperties>
  extends SpecificPropertiesBase {
  type: CelestialType.PLANET | CelestialType.MOON | CelestialType.DWARF_PLANET;
  /** The specific type classification of the planet (e.g., ROCKY, TERRESTRIAL). */
  classType?: PlanetType;
  /** Indicates if this object orbits a planet rather than a star. */
  isMoon: boolean;
  /** The ID of the parent planet, required if isMoon is true. */
  parentPlanet?: string;
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
  /** Optional array defining planetary rings. */
  rings?: RingProperties[];
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
  /** Optional tilt of this specific ring relative to the parent's equatorial plane (in radians). If part of a system, the tilt of the first ring is often used for all unless specified. */
  tilt?: number;
  /** The rate at which the ring particles orbit the parent body (e.g., radians per second). */
  rotationRate: number;
  /** Identifier or path for the texture used to render the ring. */
  texture: string;
  /** Array listing the main composition of the ring particles (e.g., ["ice", "rock"]). */
  composition: string[];
  /** The dominant type of rocky material composing the ring particles. */
  type: RockyType;
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
  rings?: RingProperties[];
}

/**
 * The class of comet.
 */
export enum CometClass {
  /** Icey comet. */
  ICE = "ICE",
  /** Carbonaceous comet. */
  CARBONACEOUS = "CARBONACEOUS",
  /** Metallic comet. */
  METALLIC = "METALLIC",
  /** Silicate comet. */
  SILICATE = "SILICATE",
}

/**
 * Properties specific to Comets.
 */
export interface CometProperties extends SpecificPropertiesBase {
  type: CelestialType.COMET;

  /**
   * The class of comet.
   */
  classType: CometClass;

  /** Array listing the primary chemical components (e.g., ["water ice", "CO2"]). */
  composition: string[];
  /** A measure of the comet's outgassing activity, affecting tail and coma visibility (e.g., 0.0 - 1.0). */
  activity: number;

  /** Visual radius of the coma (in scaled units). */
  visualComaRadius?: number;
  /** Color of the coma, usually a hex string with alpha. */
  visualComaColor?: string;
  /** Maximum visual length of the tail (in scaled units). */
  visualMaxTailLength?: number;
  /** Color of the comet's tail, usually a hex string with alpha. */
  visualTailColor?: string;
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

/** Union type for all specific celestial properties */
export type CelestialSpecificPropertiesUnion =
  | StarProperties
  | PlanetProperties
  | GasGiantProperties
  | CometProperties
  | AsteroidFieldProperties
  | OortCloudProperties
  | RingSystemProperties;

export interface CelestialObjectProperties {
  planet?: PlanetProperties;
  star?: StarProperties;
  ringSystem?: RingSystemProperties;
  asteroidField?: AsteroidFieldProperties;
  proceduralSurface?: ProceduralSurfaceProperties;
}

export type CelestiaClassType =
  | PlanetType
  | GasGiantClass
  | StellarType
  | ExoticStellarType
  | CometClass;
