import type * as THREE from "three";
import type {
  CelestialObject,
  CelestialPhysicalProperties,
  CelestialObjectConstructorParams,
  BasicRendererOptions,
} from "@teskooano/celestial-object";
import { CelestialType } from "packages/data/types/src";

/**
 * Extends CelestialPhysicalProperties with properties specific to stars.
 */
export interface StarPhysicalProperties extends CelestialPhysicalProperties {
  /** Spectral class of the star (e.g., "G2V", "M5I"). */
  spectralClass: string;
  /** Luminosity of the star in Watts. */
  luminosity_Watts: number;
  /** Mass of the star in kilograms. */
  stellarMass_kg: number;
  /** Minimum distance of the habitable zone in Astronomical Units (AU). */
  habitableZoneMin_AU: number;
  /** Maximum distance of the habitable zone in Astronomical Units (AU). */
  habitableZoneMax_AU: number;
  /** Optional: Apparent visual magnitude of the star from Earth. */
  visualMagnitude?: number;
  /** Optional: Absolute magnitude of the star. */
  absoluteMagnitude?: number;
  /** Optional: Color index (e.g., B-V) of the star. */
  colorIndex?: number;
  /** Optional: Age of the star in years. */
  age_years?: number;
  /** Optional: Metallicity of the star (e.g., [Fe/H]). */
  metallicity?: number;
}

/**
 * Defines the uniforms for star shader materials (body and corona).
 * Each property is a THREE.IUniform, and the interface includes an index signature
 * for direct compatibility with Three.js shader material parameters.
 * All uniform names use the "u" prefix to clearly identify them as uniforms.
 */
export interface StarShaderUniforms {
  [key: string]: THREE.Uniform<any>; // Index signature for Three.js compatibility

  // Common
  uTime: THREE.Uniform<number>;
  uTextureSampler: THREE.Uniform<THREE.Texture | null>;

  // Star Surface / Body
  uStarColor: THREE.Uniform<THREE.Color>;
  uPulseSpeed: THREE.Uniform<number>;
  uGlowIntensity: THREE.Uniform<number>;
  uTemperatureVariation: THREE.Uniform<number>;
  uMetallicEffect: THREE.Uniform<number>;
  uNoiseEvolutionSpeed: THREE.Uniform<number>;
  uNoiseScale: THREE.Uniform<number>;

  // Star Corona
  uCoronaIntensity: THREE.Uniform<number>;
  uOpacity: THREE.Uniform<number>;
}

/**
 * Options for configuring a MainSequenceStarRenderer instance.
 * Extends BasicRendererOptions with star-specific shader uniforms.
 */
export interface MainSequenceStarRendererOptions
  extends BasicRendererOptions<Partial<StarShaderUniforms>> {
  // Uniforms are now Partial, as not all may be set initially
  // Additional star options that are NOT direct uniforms but help configure the star renderer.
  // These are kept minimal as per user request.

  /**
   * Corona scale factors to apply to the star radius.
   * Each value creates a corona layer at that multiple of the star radius.
   * Default is [1.15, 1.3] for two corona layers.
   */
  coronaDistances: number[]; // Not optional - all main sequence stars have coronas

  /**
   * Initial time offset for animations to create variation between stars
   */
  timeOffset?: number;
}

/**
 * Represents a Main Sequence Star object in the simulation.
 * Extends the base CelestialObject with star-specific physical properties.
 */
export interface MainSequenceStar extends CelestialObject {
  physicalProperties: StarPhysicalProperties;
}

/**
 * Constructor parameters for creating a main sequence star.
 * Ensures physicalProperties are of type StarPhysicalProperties.
 */
export interface MainSequenceStarConstructorParams
  extends Omit<CelestialObjectConstructorParams, "physicalProperties"> {
  physicalProperties: StarPhysicalProperties;
}
