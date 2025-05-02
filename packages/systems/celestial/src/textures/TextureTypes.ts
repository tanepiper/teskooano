import {
  GasGiantClass,
  PlanetType,
  RockyType,
  SpectralClass,
  SpecialSpectralClass,
  ExoticStellarType,
} from "@teskooano/data-types";
import * as THREE from "three";

/**
 * Standard texture result interface for all generators
 */
export interface TextureResult {
  colorMap: THREE.Texture;
  normalMap?: THREE.Texture;
  roughnessMap?: THREE.Texture;
  specularMap?: THREE.Texture;
  emissiveMap?: THREE.Texture;
  bumpMap?: THREE.Texture;
  displacementMap?: THREE.Texture;
  metalnessMap?: THREE.Texture;
}

/**
 * Interface for all texture generation options
 */
export interface TextureGeneratorOptions {
  /**
   * Size of the generated texture
   */
  textureSize?: number;

  /**
   * Seed for random pattern generation
   */
  seed?: number;

  /**
   * Generate mipmaps for the texture
   */
  generateMipmaps?: boolean;

  /**
   * Whether to generate a normal map
   */
  generateNormalMap?: boolean;
}

/**
 * Base options for all texture generation
 */
export interface BaseTextureOptions {
  textureSize?: number;
  seed?: number;
  baseColor?: THREE.ColorRepresentation;
  generateMipmaps?: boolean;
}

/**
 * Texture generation options for gas giants
 */
export interface GasGiantTextureOptions extends BaseTextureOptions {
  /**
   * Class of gas giant
   */
  class: GasGiantClass;

  /**
   * Secondary color for bands or clouds
   */
  secondaryColor?: THREE.ColorRepresentation;

  /**
   * Optional storm color (for Jupiter-like giants)
   */
  stormColor?: THREE.ColorRepresentation;
}

/**
 * Texture generation options for terrestrial planets
 */
export interface TerrestrialTextureOptions extends BaseTextureOptions {
  /**
   * Planet type from @teskooano/data-types
   */
  type: PlanetType;

  /**
   * Surface color of the planet
   */
  surfaceColor: THREE.ColorRepresentation;

  /**
   * Water color for oceanic areas
   */
  waterColor?: THREE.ColorRepresentation;

  /**
   * Cloud color and coverage
   */
  cloudColor?: THREE.ColorRepresentation;
  cloudCoverage?: number;

  /**
   * Surface roughness (affects mountain generation)
   */
  roughness?: number;

  /**
   * Whether the planet has vegetation
   */
  hasVegetation?: boolean;
  vegetationColor?: THREE.ColorRepresentation;
}

/**
 * Options specific to Star textures
 */
export interface StarTextureOptions extends BaseTextureOptions {
  /**
   * Main spectral class (O, B, A, F, G, K, M, etc.)
   */
  spectralClass?: SpectralClass;

  /**
   * Special spectral class for non-main sequence stars
   */
  specialSpectralClass?: SpecialSpectralClass;

  /**
   * Exotic stellar type (neutron star, white dwarf, etc.)
   */
  exoticType?: ExoticStellarType;

  /**
   * Surface intensity/brightness (0-1)
   */
  surfaceIntensity?: number;

  /**
   * Intensity/contrast of star spots/granulation (0-1)
   */
  spotIntensity?: number;
}

/**
 * Options specific to Space Rock textures (asteroids, comets, ring particles)
 */
export interface SpaceRockTextureOptions extends BaseTextureOptions {
  type: RockyType;
  featureColor?: THREE.ColorRepresentation;
  roughness?: number;
  metalness?: number;
}
