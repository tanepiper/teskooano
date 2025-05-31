import * as THREE from "three";
import type { OSVector3 } from "@teskooano/core-math";
import type { PhysicsStateReal } from "./physics";
import { StellarType as NewStellarType } from "./celestials/common/stellar-classification";
import type { ProceduralSurfaceProperties } from "./celestials/common/procedural-surface-properties";
import type { SurfaceProperties } from "./celestials/components";
import { SurfaceType } from "./celestials/common/physical-properties";

/**
 * Defines the primary classification of a celestial body.
 */
export enum CelestialType {
  /** A star, the central body of a system. */
  STAR = "STAR",
  /** A planet orbiting a star. */
  PLANET = "PLANET",
  /** A planet that meets some but not all criteria for a full planet. */
  DWARF_PLANET = "DWARF_PLANET",
  /** A moon orbiting a planet or gas giant. */
  MOON = "MOON",
  /** Individual space rock objects, used for asteroid fields or rings. */
  SPACE_ROCK = "SPACE_ROCK",
  /** A collection of space rocks, typically forming a belt. */
  ASTEROID_FIELD = "ASTEROID_FIELD",
  /** A large planet composed mostly of gases. */
  GAS_GIANT = "GAS_GIANT",
  /** An icy body that displays a coma and sometimes a tail when near a star. */
  COMET = "COMET",
  /** A theoretical cloud of icy planetesimals proposed to surround the sun at a great distance. */
  OORT_CLOUD = "OORT_CLOUD",
  /** A distinct system of rings orbiting a celestial body. */
  RING_SYSTEM = "RING_SYSTEM",
  /** Catch-all for other or undefined celestial types. */
  OTHER = "OTHER",
}

/**
 * Classification system for gas giants based on atmospheric properties.
 */
export enum GasGiantClass {
  /** Ammonia clouds, typical of Jupiter. */
  CLASS_I = "CLASS_I",
  /** Water clouds, typical of Saturn. */
  CLASS_II = "CLASS_II",
  /** Ice Giant - Cloudless, clear hydrogen atmosphere, typical of Uranus and Neptune. */
  CLASS_III = "CLASS_III",
  /** Alkali metal clouds, very hot. */
  CLASS_IV = "CLASS_IV",
  /** Silicate clouds, even hotter. */
  CLASS_V = "CLASS_V",
}

/**
 * Defines the primary type of a planet based on its composition and surface characteristics.
 */
export enum PlanetType {
  /** A very barren plane with lots of craters. */
  BARREN = "BARREN",
  /** Primarily composed of rock and metal, often cratered. */
  ROCKY = "ROCKY",
  /** Earth-like planet with potential for liquid water and complex atmospheres. */
  TERRESTRIAL = "TERRESTRIAL",
  /** Dry, arid surface, possibly with dunes. */
  DESERT = "DESERT",
  /** Covered primarily in ice. */
  ICE = "ICE",
  /** Surface dominated by molten lava flows. */
  LAVA = "LAVA",
  /** Surface predominantly covered by liquid oceans. */
  OCEAN = "OCEAN",
}

/**
 * Describes the general density of a celestial body's atmosphere.
 */
export enum AtmosphereType {
  /** No atmosphere. */
  NONE = "NONE",
  /** Very low pressure, minimal atmospheric effects. */
  THIN = "THIN",
  /** Earth-like atmospheric pressure. */
  NORMAL = "NORMAL",
  /** High pressure, significant atmospheric effects. */
  DENSE = "DENSE",
  /** A very dense atmosphere, potentially hazardous. */
  VERY_DENSE = "VERY_DENSE",
}

/**
 * Describes the primary composition type of rocky bodies like asteroids or ring particles.
 */
export enum RockyType {
  /** Composed primarily of ice (water, methane, ammonia). */
  ICE = "ICE",
  /** Rich in metallic elements. */
  METALLIC = "METALLIC",
  /** Composed of lighter silicate rocks. */
  LIGHT_ROCK = "LIGHT_ROCK",
  /** Composed of darker silicate rocks, possibly carbonaceous. */
  DARK_ROCK = "DARK_ROCK",
  /** Mixture of fine ice particles and dust. */
  ICE_DUST = "ICE_DUST",
  /** Composed primarily of fine dust particles. */
  DUST = "DUST",
}

/**
 * Defines the orbital elements required to describe the path of a celestial body around its parent.
 */
export interface OrbitalParameters {
  /** The average distance from the parent body (REAL METERS). */
  realSemiMajorAxis_m: number;
  /** The shape of the orbit (0 = circular, <1 = elliptical, 1 = parabolic). */
  eccentricity: number;
  /** The tilt of the orbital plane relative to a reference plane (RADIANS). */
  inclination: number;
  /** The angle where the orbit crosses the reference plane heading north (RADIANS). */
  longitudeOfAscendingNode: number;
  /** The angle from the ascending node to the point of closest approach (periapsis) (RADIANS). */
  argumentOfPeriapsis: number;
  /** The position in the orbit at a specific epoch (time) (RADIANS). */
  meanAnomaly: number;
  /** The time taken to complete one orbit (REAL SECONDS). */
  period_s: number;
}

/**
 * Common properties shared by all specific celestial object property types.
 * Renamed from BaseCelestialProperties for clarity.
 */
export interface SpecificPropertiesBase {
  /** The fundamental type classification of the celestial object (e.g., STAR, PLANET). */
  type: CelestialType;
}

/**
 * Properties specific to Stars.
 * Cleaned up for data-driven approach - classifications are computed from physics data.
 */
export interface StarProperties extends SpecificPropertiesBase {
  type: CelestialType.STAR;
  /** Whether this is the main star in the system, used for camera focus on startup. */
  isMainStar: boolean;
  /** The classification based on temperature and spectral lines (e.g., G2V, M3III, WN7). */
  spectralClass: string;
  /** The total energy output of the star, often relative to the Sun (L☉). */
  luminosity: number;
  /** The primary color tint of the star, usually represented as a hex string. */
  color: string;
  /** Core stellar type - drives physics simulation and rendering selection. */
  stellarType: NewStellarType;
  /** Optional array of partner star IDs, used for multi-star systems orbital calculations. */
  partnerStars?: string[];
  /** Optional stellar characteristics computed from physics data (variability, wind rates, etc.) */
  characteristics?: Record<string, any>;
  timeOffset?: number;

  /** NEW: Configuration for shader uniforms specific to this star's rendering materials. */
  shaderUniforms?: {
    baseStar?: {
      // color is handled by the root StarProperties.color for the main shader starColor
      coronaIntensity?: number;
      pulseSpeed?: number;
      glowIntensity?: number;
      temperatureVariation?: number;
      metallicEffect?: number;
      noiseEvolutionSpeed?: number;
      // timeOffset is already a root prop, but could be mirrored/sourced here if needed by specific logic
    };
    corona?: {
      // starColor for corona will also typically derive from root StarProperties.color
      opacity?: number;
      pulseSpeed?: number;
      noiseScale?: number;
      noiseEvolutionSpeed?: number;
    };
    // Future: Add configurations for other specific materials like pulsar jets, accretion disks etc.
    // neutronStarJet?: { ... };
    // accretionDisk?: { ... };
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
}

/**
 * Properties specific to Planets (including rocky, terrestrial, ice, etc.). Note: Moons use PlanetProperties.
 */
export interface PlanetProperties extends SpecificPropertiesBase {
  type: CelestialType.PLANET | CelestialType.MOON | CelestialType.DWARF_PLANET;
  /** The specific type classification of the planet (e.g., ROCKY, TERRESTRIAL). */
  planetType?: PlanetType;
  /** Indicates if this object orbits a planet rather than a star. */
  isMoon: boolean;
  /** The ID of the parent planet, required if isMoon is true. */
  parentPlanet?: string;
  /** Optional indicator for the desired 3D shape. Defaults to 'sphere' if omitted. */
  shapeModel?: "sphere" | "asteroid" | string;
  /** Array listing the primary chemical or geological composition (e.g., ["silicates", "iron"]). */
  composition: string[];
  /** Optional surface properties, including procedural data. */
  surface?: SurfaceProperties;
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
  gasGiantClass: GasGiantClass;
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
}

/**
 * Properties specific to Comets.
 */
export interface CometProperties extends SpecificPropertiesBase {
  type: CelestialType.COMET;
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

export enum CelestialStatus {
  ACTIVE = "active",
  DESTROYED = "destroyed",
  ANNIHILATED = "annihilated",
}

/**
 * Represents the complete state and definition of a celestial object within the simulation.
 */
export interface CelestialObject {
  /** Unique identifier for the celestial object. */
  id: string;
  /** The fundamental type of the object (e.g., STAR, PLANET, MOON). Now defined in BaseCelestialProperties as 'type'. */
  type: CelestialType;
  /** The display name of the celestial object. */
  name: string;
  /** Current status of the object in the simulation */
  status: CelestialStatus;

  /** The REAL physical radius of the object (in METERS). */
  realRadius_m: number;
  /** The REAL physical mass of the object (in KILOGRAMS). */
  realMass_kg: number;

  /** Orbital parameters defining the object's path around its parent. */
  orbit: OrbitalParameters;
  /** Average surface or effective temperature in Kelvin. */
  temperature: number;
  /** Optional surface reflectivity (albedo) (0.0 = absorbs all light, 1.0 = reflects all light). */
  albedo?: number;

  /** Optional: The time it takes for the object to rotate 360 degrees (in SECONDS). */
  siderealRotationPeriod_s?: number;

  /** Optional atmospheric properties common to many bodies */
  atmosphere?: PlanetAtmosphereProperties;

  /** Object containing properties specific to the `type` (or `class`) of celestial object. Optional for types like OTHER. */
  properties?: CelestialSpecificPropertiesUnion;

  /** Contains the object's state used by the physics engine (real units). */
  physicsStateReal: PhysicsStateReal;

  /** Optional: Reference to parent body ID */
  parentId?: string;

  /** Optional: Tracks the current dominant gravitational parent (can change in multi-star systems) */
  currentParentId?: string;

  /** Optional: The tilt of the object's rotational axis relative to its orbital plane, represented as a normalized vector. */
  axialTilt?: OSVector3;

  /** Optional seed value used for procedural generation (textures, etc.). */
  seed?: string;

  /** When true, this object will be excluded from physics calculations (no gravity interactions, collisions, etc.) */
  ignorePhysics?: boolean;

  /** Current visual rotation of the object in the scene. */
  rotation?: THREE.Quaternion;
}

export interface CelestialObjectProperties {
  planet?: PlanetProperties;
  star?: StarProperties;
  ringSystem?: RingSystemProperties;
  asteroidField?: AsteroidFieldProperties;
  proceduralSurface?: ProceduralSurfaceProperties;
}
