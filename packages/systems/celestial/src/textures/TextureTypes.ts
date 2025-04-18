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
  textureSize?: number; // Size of the texture (e.g., 1024, 2048)
  seed?: number; // Seed for procedural generation
  baseColor?: THREE.ColorRepresentation; // Optional base color override
  generateMipmaps?: boolean; // Whether to generate mipmaps for the texture
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
  stormColor?: THREE.ColorRepresentation; // Color for prominent storms (e.g., Jupiter's Great Red Spot)
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
  surfaceColor: THREE.ColorRepresentation; // Base color for land/rock/ice

  /**
   * Water color for oceanic areas
   */
  waterColor?: THREE.ColorRepresentation; // Color for oceans/lakes

  /**
   * Cloud color and coverage
   */
  cloudColor?: THREE.ColorRepresentation; // Color for clouds
  cloudCoverage?: number; // 0-1 cloud coverage percentage

  /**
   * Surface roughness (affects mountain generation)
   */
  roughness?: number; // 0-1 surface roughness (mountains, etc.)

  /**
   * Whether the planet has vegetation
   */
  hasVegetation?: boolean; // Does it have vegetation?
  vegetationColor?: THREE.ColorRepresentation; // Color for vegetation
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
  type: RockyType; // Using RockyType from @teskooano/data-types
  featureColor?: THREE.ColorRepresentation; // Color for craters, darker areas
  roughness?: number; // 0-1 surface roughness
  metalness?: number; // 0-1 how metallic the rock appears (for METALLIC type)
}
