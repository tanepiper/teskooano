import type * as THREE from "three";
import type { OSVector3 } from "@teskooano/core-math";
import {
  CelestialType,
  GasGiantClass,
  PlanetType,
  StellarType,
  SpectralClass,
  SpecialSpectralClass,
  LuminosityClass,
  WhiteDwarfType,
  ExoticStellarType,
  SurfaceType,
  AtmosphereType,
} from "./common";

/**
 * Base interface for all type-specific descriptive detail objects.
 */
export interface CelestialDetailsBase {
  type: CelestialType;
  composition?: string[];
}

// --- Star Details ---
export interface StarDetails extends CelestialDetailsBase {
  type: CelestialType.STAR;
  isMainStar: boolean;
  spectralClass: string; // e.g. "GV", "M", "OBAFGKM" + Luminosity
  luminosity: number;
  color: string;
  stellarType?: StellarType;
  partnerStars?: string[];
  mainSpectralClass?: SpectralClass;
  specialSpectralClass?: SpecialSpectralClass;
  luminosityClass?: LuminosityClass;
  whiteDwarfType?: WhiteDwarfType;
  exoticType?: ExoticStellarType;
}

// --- Planet & Moon Details ---
export interface PlanetDetails extends CelestialDetailsBase {
  type: CelestialType.PLANET | CelestialType.MOON | CelestialType.DWARF_PLANET;
  planetType?: PlanetType;
  isMoon: boolean; // True if type is MOON
  // parentPlanet?: string; // Redundant, parentId is on CelestialObject
  composition: string[]; // Overrides CelestialDetailsBase.composition to be mandatory
  surfaceType?: SurfaceType;
  atmosphereComposition?: string[];
  atmospherePressure?: number; // Pascals or relative to Earth
  atmosphereType?: AtmosphereType;
}

// --- Gas Giant Details ---
export interface GasGiantDetails extends CelestialDetailsBase {
  type: CelestialType.GAS_GIANT;
  gasGiantClass: GasGiantClass;
  atmosphereComposition: string[];
  atmospherePressure: number;
  atmosphereType?: AtmosphereType;
}

// --- Comet Details ---
export interface CometDetails extends CelestialDetailsBase {
  type: CelestialType.COMET;
  composition: string[]; // Overrides CelestialDetailsBase.composition
  activity: number; // Comet's outgassing activity
}

// --- Asteroid Field Details ---
export interface AsteroidFieldDetails extends CelestialDetailsBase {
  type: CelestialType.ASTEROID_FIELD;
  innerRadiusAU: number;
  outerRadiusAU: number;
  heightAU: number;
  count: number; // Approximate number of asteroids
  composition: string[]; // Overrides CelestialDetailsBase.composition
}

// --- Oort Cloud Details ---
export interface OortCloudDetails extends CelestialDetailsBase {
  type: CelestialType.OORT_CLOUD;
  composition: string[]; // Overrides CelestialDetailsBase.composition
  innerRadiusAU: number;
  outerRadiusAU: number;
}

// --- Ring System Details ---
// RingSystem itself is primarily an appearance construct.
// Details here might be minimal, or could include composition if rings vary.
export interface RingSystemDetails extends CelestialDetailsBase {
  type: CelestialType.RING_SYSTEM;
  // parentId is on CelestialObject
  // Individual ring compositions could be part of RingProperties in Appearance if needed
}

// --- Specific Surface Details (if we need to discriminate beyond PlanetDetails.surfaceType) ---
// These are examples; we might simplify and use PlanetDetails.surfaceType and PlanetDetails.planetType more.

export interface DesertSurfaceDetails extends PlanetDetails {
  planetType: PlanetType.DESERT;
  surfaceType: SurfaceType.DUNES | SurfaceType.FLAT; // Example restriction
  dunePattern?: number;
  duneHeight?: number;
}

export interface IceSurfaceDetails extends PlanetDetails {
  planetType: PlanetType.ICE;
  surfaceType:
    | SurfaceType.ICE_FLATS
    | SurfaceType.ICE_CRACKED
    | SurfaceType.CRATERED;
  crackIntensity?: number;
  glossiness?: number;
  iceThickness?: number;
}

export interface LavaSurfaceDetails extends PlanetDetails {
  planetType: PlanetType.LAVA;
  surfaceType: SurfaceType.VOLCANIC | SurfaceType.FLAT;
  lavaActivity?: number;
  volcanicActivity?: number;
}

export interface OceanSurfaceDetails extends PlanetDetails {
  planetType: PlanetType.OCEAN;
  surfaceType: SurfaceType.OCEAN;
  landRatio?: number;
  waveHeight?: number;
  oceanDepth?: number;
}

export interface RockyTerrestrialSurfaceDetails extends PlanetDetails {
  planetType: PlanetType.ROCKY | PlanetType.TERRESTRIAL;
  // surfaceType could be any compatible type like CRATERED, MOUNTAINOUS, VARIED etc.
}

export interface BarrenSurfaceDetails extends PlanetDetails {
  planetType: PlanetType.BARREN;
  surfaceType: SurfaceType.CRATERED | SurfaceType.FLAT;
}

// Union type for all specific celestial detail properties
export type CelestialDetailsUnion =
  | StarDetails
  | PlanetDetails // This can cover most solid planets/moons
  | GasGiantDetails
  | CometDetails
  | AsteroidFieldDetails
  | OortCloudDetails
  | RingSystemDetails;
// Explicit surface details if needed for more complex discrimination, otherwise rely on PlanetDetails fields.
// | DesertSurfaceDetails
// | IceSurfaceDetails
// | LavaSurfaceDetails
// | OceanSurfaceDetails
// | RockyTerrestrialSurfaceDetails
// | BarrenSurfaceDetails
