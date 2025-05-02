import * as THREE from "three";
import { GasGiantTextureGenerator } from "./GasGiantTextureGenerator";
import { SpaceRockTextureGenerator } from "./SpaceRockTextureGenerator";
import { StarTextureGenerator } from "./StarTextureGenerator";
import { TerrestrialTextureGenerator } from "./TerrestrialTextureGenerator";
import { TextureResourceManager } from "./TextureGeneratorBase";
import {
  GasGiantTextureOptions,
  SpaceRockTextureOptions,
  StarTextureOptions,
  TerrestrialTextureOptions,
  TextureResult,
} from "./TextureTypes";

/**
 * Factory for creating textures for all types of celestial objects
 */
export class TextureFactory {
  private static gasGiantGenerator: GasGiantTextureGenerator;
  private static terrestrialGenerator: TerrestrialTextureGenerator;
  private static starGenerator: StarTextureGenerator;
  private static spaceRockGenerator: SpaceRockTextureGenerator;
  private static textureCache: Map<string, TextureResult> = new Map();

  /**
   * Get or create the generator instance
   */
  private static getGasGiantGenerator(): GasGiantTextureGenerator {
    if (!this.gasGiantGenerator) {
      this.gasGiantGenerator = new GasGiantTextureGenerator();
    }
    return this.gasGiantGenerator;
  }

  /**
   * Get or create the generator instance
   */
  private static getTerrestrialGenerator(): TerrestrialTextureGenerator {
    if (!this.terrestrialGenerator) {
      this.terrestrialGenerator = new TerrestrialTextureGenerator();
    }
    return this.terrestrialGenerator;
  }

  /**
   * Get or create the generator instance
   */
  private static getStarGenerator(): StarTextureGenerator {
    if (!this.starGenerator) {
      this.starGenerator = new StarTextureGenerator();
    }
    return this.starGenerator;
  }

  /**
   * Get or create the generator instance
   */
  private static getSpaceRockGenerator(): SpaceRockTextureGenerator {
    if (!this.spaceRockGenerator) {
      this.spaceRockGenerator = new SpaceRockTextureGenerator();
    }
    return this.spaceRockGenerator;
  }

  /**
   * Create a cache key from options
   */
  private static createCacheKey(type: string, options: any): string {
    return `${type}:${JSON.stringify(options, (key, value) => {
      if (value instanceof THREE.Color) {
        return `#${value.getHexString()}`;
      }
      return value;
    })}`;
  }

  /**
   * Generate a gas giant texture with improved, physically-based rendering
   *
   * @param options Gas giant texture generation options
   * @returns A high-quality texture for the gas giant
   */
  public static generateGasGiantTexture(
    options: GasGiantTextureOptions,
  ): TextureResult {
    const cacheKey = this.createCacheKey("gas-giant", options);

    if (this.textureCache.has(cacheKey)) {
      return this.textureCache.get(cacheKey)!;
    }

    let result: TextureResult;
    const generator = this.getGasGiantGenerator();

    result = generator.generateTexture(options);

    this.textureCache.set(cacheKey, result);

    return result;
  }

  /**
   * Generate a terrestrial planet texture
   *
   * @param options Terrestrial planet texture generation options
   * @returns The generated texture for the terrestrial planet
   */
  public static generateTerrestrialTexture(
    options: TerrestrialTextureOptions,
  ): TextureResult {
    const cacheKey = this.createCacheKey("terrestrial", options);

    if (this.textureCache.has(cacheKey)) {
      return this.textureCache.get(cacheKey)!;
    }

    let result: TextureResult;
    const generator = this.getTerrestrialGenerator();

    result = generator.generateTexture(options);

    this.textureCache.set(cacheKey, result);

    return result;
  }

  /**
   * Generate a star texture
   *
   * @param options Star texture generation options
   * @returns The generated texture for the star
   */
  public static generateStarTexture(
    options: StarTextureOptions,
  ): TextureResult {
    const cacheKey = this.createCacheKey("star", options);

    if (this.textureCache.has(cacheKey)) {
      return this.textureCache.get(cacheKey)!;
    }

    let result: TextureResult;
    const generator = this.getStarGenerator();

    result = generator.generateTexture(options);

    this.textureCache.set(cacheKey, result);

    return result;
  }

  /**
   * Generate a space rock texture (asteroid, comet nucleus, ring particle)
   *
   * @param options Space Rock texture generation options
   * @returns The generated texture for the space rock
   */
  public static generateSpaceRockTexture(
    options: SpaceRockTextureOptions,
  ): TextureResult {
    const cacheKey = this.createCacheKey("space-rock", options);

    if (this.textureCache.has(cacheKey)) {
      return this.textureCache.get(cacheKey)!;
    }

    let result: TextureResult;
    const generator = this.getSpaceRockGenerator();

    result = generator.generateTexture(options);

    this.textureCache.set(cacheKey, result);

    return result;
  }

  /**
   * Clear the texture cache
   */
  public static clearCache(): void {
    this.textureCache.forEach((result) => {
      Object.values(result).forEach((texture) => {
        if (texture) {
          texture.dispose();
        }
      });
    });

    this.textureCache.clear();
  }

  /**
   * Dispose of all texture generation resources to free memory
   */
  public static dispose(): void {
    this.clearCache();

    if (this.gasGiantGenerator) {
      this.gasGiantGenerator.dispose();
      this.gasGiantGenerator = null!;
    }

    if (this.terrestrialGenerator) {
      this.terrestrialGenerator.dispose();
      this.terrestrialGenerator = null!;
    }

    if (this.starGenerator) {
      this.starGenerator.dispose();
      this.starGenerator = null!;
    }

    if (this.spaceRockGenerator) {
      this.spaceRockGenerator.dispose();
      this.spaceRockGenerator = null!;
    }

    TextureResourceManager.getInstance().dispose();
  }
}
