/**
 * TerrainTextureGenerator - Main orchestrator for terrain texture generation.
 *
 * Coordinates the multi-pass terrain generation pipeline:
 * 1. Base terrain generation (FBM noise)
 * 2. Crater generation (SDF-based, atmosphere-aware)
 * 3. Erosion simulation (hydraulic + thermal)
 * 4. Derived map generation (normal, roughness, color)
 *
 * @module texture-generation/TerrainTextureGenerator
 */

import * as THREE from "three";
import type {
  CelestialObject,
  AtmosphereType,
  ProceduralSurfaceProperties,
} from "@teskooano/data-types";

import { OffscreenRenderer } from "./utils/OffscreenRenderer";
import { BaseTerrainPass } from "./passes/BaseTerrainPass";
import { CraterPass, generateCraterDistribution } from "./passes/CraterPass";
import { ErosionPass } from "./passes/ErosionPass";
import { NormalMapGenerator } from "./generators/NormalMapGenerator";
import { RoughnessMapGenerator } from "./generators/RoughnessMapGenerator";
import {
  ColorMapGenerator,
  type ColorPaletteConfig,
} from "./generators/ColorMapGenerator";

import {
  type TerrainGenerationInput,
  type GeneratedPlanetTextures,
  type TextureResolution,
  type ErosionPassConfig,
  TEXTURE_RESOLUTIONS,
  getDefaultErosionConfig,
} from "./types";

/**
 * Options for texture generation.
 */
export interface TextureGenerationOptions {
  /** Texture resolution (default: MEDIUM - 2048x1024) */
  resolution?: TextureResolution;
  /** Skip erosion pass for faster generation */
  skipErosion?: boolean;
  /** Skip crater pass */
  skipCraters?: boolean;
  /** Custom erosion configuration */
  erosionConfig?: Partial<ErosionPassConfig>;
  /** Normal map strength (default: 2.0) */
  normalStrength?: number;
  /** Base roughness (default: 0.5) */
  baseRoughness?: number;
  /** Existing WebGL renderer to use */
  renderer?: THREE.WebGLRenderer;
}

/**
 * Default generation options.
 *
 * Using VERY_LOW resolution by default for web-friendly memory usage.
 * Each planet uses ~3.5MB of GPU memory at VERY_LOW resolution.
 * This prevents crashes when loading multiple planets.
 */
const DEFAULT_OPTIONS: Required<
  Omit<TextureGenerationOptions, "erosionConfig" | "renderer">
> = {
  resolution: TEXTURE_RESOLUTIONS.VERY_LOW, // Web-friendly: 512x256 for minimal memory usage
  skipErosion: false,
  skipCraters: false,
  normalStrength: 2.0,
  baseRoughness: 0.5,
};

/**
 * Extracts atmosphere type from a CelestialObject.
 */
function getAtmosphereType(object: CelestialObject): AtmosphereType {
  // Check various places atmosphere info might be stored
  if (object.atmosphere) {
    // If atmosphere exists, determine type based on properties
    // This is a simplification - actual logic would check pressure, etc.
    return "NORMAL";
  }

  // Check properties for specific atmosphere info
  const props = object.properties as Record<string, unknown> | undefined;
  if (props?.atmosphereType) {
    return props.atmosphereType as AtmosphereType;
  }

  // Default based on planet type
  const planetProps = object.properties as { classType?: string } | undefined;
  if (planetProps?.classType) {
    switch (planetProps.classType) {
      case "ROCKY":
      case "BARREN":
        return "NONE";
      case "ICE":
        return "THIN";
      case "TERRESTRIAL":
      case "OCEAN":
        return "NORMAL";
      case "LAVA":
        return "THIN";
      case "DESERT":
        return "THIN";
      default:
        return "NONE";
    }
  }

  return "NONE";
}

/**
 * Extracts terrain generation input from a CelestialObject.
 */
function extractTerrainInput(object: CelestialObject): TerrainGenerationInput {
  const surface = (object as { surface?: ProceduralSurfaceProperties }).surface;
  const atmosphereType = getAtmosphereType(object);

  // Default values matching the procedural generation system
  const defaults: TerrainGenerationInput = {
    seed: object.id || object.name || "default",
    radiusMeters: object.realRadius_m || 6371000, // Earth radius default
    atmosphereType,
    terrainType: 3, // Sharp valleys (most interesting)
    terrainAmplitude: 0.9,
    terrainSharpness: 1.3,
    terrainOffset: -0.35,
    persistence: 0.6,
    lacunarity: 1.85,
    octaves: 8,
    simplePeriod: 1.5,
    undulation: 0.4,
    colors: ["#25244c", "#4d6780", "#7f683d", "#3e8334", "#FFFAFA"],
    heightThresholds: [0.08, 0.15, 0.25, 0.44, 0.97],
    bumpScale: 2.7,
    roughness: 0.7,
  };

  // Override with surface properties if available
  if (surface) {
    return {
      seed: object.id || object.name || "default",
      radiusMeters: object.realRadius_m || 6371000,
      atmosphereType,
      terrainType: surface.terrainType ?? defaults.terrainType,
      terrainAmplitude: surface.terrainAmplitude ?? defaults.terrainAmplitude,
      terrainSharpness: surface.terrainSharpness ?? defaults.terrainSharpness,
      terrainOffset: surface.terrainOffset ?? defaults.terrainOffset,
      persistence: surface.persistence ?? defaults.persistence,
      lacunarity: surface.lacunarity ?? defaults.lacunarity,
      octaves: surface.octaves ?? defaults.octaves,
      simplePeriod: surface.simplePeriod ?? defaults.simplePeriod,
      undulation: surface.undulation ?? defaults.undulation,
      colors: [
        surface.color1 ?? defaults.colors[0],
        surface.color2 ?? defaults.colors[1],
        surface.color3 ?? defaults.colors[2],
        surface.color4 ?? defaults.colors[3],
        surface.color5 ?? defaults.colors[4],
      ],
      heightThresholds: [
        surface.height1 ?? defaults.heightThresholds[0],
        surface.height2 ?? defaults.heightThresholds[1],
        surface.height3 ?? defaults.heightThresholds[2],
        surface.height4 ?? defaults.heightThresholds[3],
        surface.height5 ?? defaults.heightThresholds[4],
      ],
      bumpScale: surface.bumpScale ?? defaults.bumpScale,
      roughness: surface.roughness ?? defaults.roughness,
    };
  }

  return defaults;
}

/**
 * Maximum number of concurrent texture generations to prevent context loss.
 * Set to 1 to serialize generation and minimize memory usage.
 * Lower values = safer but slower generation.
 */
const MAX_CONCURRENT_GENERATIONS = 1; // Serialize to prevent memory exhaustion

/**
 * Queue for texture generation to limit concurrent operations.
 */
let generationQueue: Array<{
  generator: TerrainTextureGenerator;
  object: CelestialObject;
  options: TextureGenerationOptions;
  resolve: (textures: GeneratedPlanetTextures) => void;
  reject: (error: Error) => void;
}> = [];

let activeGenerations = 0;

/**
 * Processes the next item in the generation queue.
 *
 * Adds a small delay between generations to allow memory cleanup.
 */
async function processGenerationQueue(): Promise<void> {
  if (
    activeGenerations >= MAX_CONCURRENT_GENERATIONS ||
    generationQueue.length === 0
  ) {
    return;
  }

  const item = generationQueue.shift();
  if (!item) return;

  // Small delay to allow memory cleanup between generations
  if (activeGenerations > 0) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  activeGenerations++;
  try {
    const textures = await item.generator.generate(item.object, item.options);
    item.resolve(textures);
  } catch (error) {
    item.reject(
      error instanceof Error
        ? error
        : new Error(`Texture generation failed: ${String(error)}`),
    );
  } finally {
    activeGenerations--;
    // Process next item in queue (with delay)
    setTimeout(() => processGenerationQueue(), 50);
  }
}

/**
 * TerrainTextureGenerator orchestrates the multi-pass terrain generation.
 */
export class TerrainTextureGenerator {
  private offscreenRenderer: OffscreenRenderer;
  private baseTerrainPass: BaseTerrainPass;
  private craterPass: CraterPass;
  private erosionPass: ErosionPass;
  private normalGenerator: NormalMapGenerator;
  private roughnessGenerator: RoughnessMapGenerator;
  private colorGenerator: ColorMapGenerator;

  private resolution: TextureResolution;
  private isDisposed: boolean = false;
  private usingSharedRenderer: boolean = false; // Track if we're using shared instance

  /**
   * Creates a new TerrainTextureGenerator.
   *
   * @param options - Generation options
   */
  constructor(options: TextureGenerationOptions = {}) {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    this.resolution = opts.resolution;

    // Use shared offscreen renderer to avoid creating multiple WebGL contexts
    // This prevents context loss when generating textures for multiple planets
    this.offscreenRenderer = OffscreenRenderer.getSharedInstance(
      options.renderer,
    );
    this.usingSharedRenderer = true; // Mark that we're using the shared instance

    // Create passes
    this.baseTerrainPass = new BaseTerrainPass(
      this.offscreenRenderer,
      this.resolution,
    );
    this.craterPass = new CraterPass(this.offscreenRenderer, this.resolution);
    this.erosionPass = new ErosionPass(this.offscreenRenderer, this.resolution);

    // Create generators
    this.normalGenerator = new NormalMapGenerator(
      this.offscreenRenderer,
      this.resolution,
    );
    this.roughnessGenerator = new RoughnessMapGenerator(
      this.offscreenRenderer,
      this.resolution,
    );
    this.colorGenerator = new ColorMapGenerator(
      this.offscreenRenderer,
      this.resolution,
    );
  }

  /**
   * Generates textures for a celestial object.
   *
   * This is the main entry point for texture generation.
   * Uses a queue system to limit concurrent generations and prevent context loss.
   *
   * @param object - CelestialObject to generate textures for
   * @param options - Optional overrides for generation options
   * @returns Generated planet textures
   */
  async generate(
    object: CelestialObject,
    options: TextureGenerationOptions = {},
  ): Promise<GeneratedPlanetTextures> {
    if (this.isDisposed) {
      throw new Error("TerrainTextureGenerator has been disposed");
    }

    // Check if context is valid before starting
    if (!this.offscreenRenderer.isContextValid()) {
      throw new Error(
        "WebGL context is lost. Cannot generate textures. Please refresh the page.",
      );
    }

    // Queue generation if we're at the limit
    if (activeGenerations >= MAX_CONCURRENT_GENERATIONS) {
      return new Promise<GeneratedPlanetTextures>((resolve, reject) => {
        generationQueue.push({
          generator: this,
          object,
          options,
          resolve,
          reject,
        });
        // Start processing queue
        processGenerationQueue();
      });
    }

    // Generate immediately if under limit
    activeGenerations++;
    try {
      const textures = await this._generateInternal(object, options);
      return textures;
    } finally {
      activeGenerations--;
      // Process next item in queue
      processGenerationQueue();
    }
  }

  /**
   * Internal generation method (actual work).
   */
  private async _generateInternal(
    object: CelestialObject,
    options: TextureGenerationOptions = {},
  ): Promise<GeneratedPlanetTextures> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const input = extractTerrainInput(object);

    // Check context validity before each major operation
    if (!this.offscreenRenderer.isContextValid()) {
      throw new Error("WebGL context lost during texture generation");
    }

    // Pass 1: Generate base terrain
    console.log(
      `[TerrainTextureGenerator] Starting texture generation for ${object.id}`,
      {
        resolution: `${this.resolution.width}x${this.resolution.height}`,
        atmosphereType: input.atmosphereType,
        skipCraters: opts.skipCraters,
        skipErosion: opts.skipErosion,
      },
    );

    let heightTarget: THREE.WebGLRenderTarget;
    try {
      console.log(`[TerrainTextureGenerator] Generating base terrain...`);
      heightTarget = this.baseTerrainPass.generate(input);
      console.log(`[TerrainTextureGenerator] Base terrain pass completed`);
    } catch (error) {
      if (error instanceof Error && error.message.includes("context")) {
        throw new Error("WebGL context lost during base terrain generation");
      }
      throw error;
    }

    // Pass 2: Apply craters (if not skipped)
    if (!opts.skipCraters) {
      if (!this.offscreenRenderer.isContextValid()) {
        throw new Error("WebGL context lost before crater pass");
      }
      try {
        const craters = generateCraterDistribution(
          input.seed,
          input.atmosphereType,
        );
        console.log(
          `[TerrainTextureGenerator] Applying ${craters.length} craters (atmosphere: ${input.atmosphereType})`,
        );
        heightTarget = this.craterPass.apply(heightTarget, {
          craters,
          atmosphereType: input.atmosphereType,
        });
        console.log(`[TerrainTextureGenerator] Crater pass completed`);
      } catch (error) {
        if (error instanceof Error && error.message.includes("context")) {
          throw new Error("WebGL context lost during crater generation");
        }
        throw error;
      }
    } else {
      console.log(`[TerrainTextureGenerator] Crater pass skipped`);
    }

    // Pass 3: Apply erosion (if not skipped)
    if (!opts.skipErosion) {
      const erosionConfig = {
        ...getDefaultErosionConfig(input.atmosphereType, input.radiusMeters),
        ...options.erosionConfig,
      };

      console.log(
        `[TerrainTextureGenerator] Starting erosion pass (iterations: ${erosionConfig.iterations}, thermal: ${erosionConfig.enableThermalErosion})`,
      );

      // Run erosion asynchronously to avoid blocking
      try {
        heightTarget = await this.runErosionAsync(
          heightTarget,
          erosionConfig,
          input.seed,
        );
        console.log(`[TerrainTextureGenerator] Erosion pass completed`);
      } catch (error) {
        if (error instanceof Error && error.message.includes("context")) {
          throw new Error("WebGL context lost during erosion");
        }
        throw error;
      }
    } else {
      console.log(`[TerrainTextureGenerator] Erosion pass skipped`);
    }

    // Check context before generating derived maps
    if (!this.offscreenRenderer.isContextValid()) {
      throw new Error("WebGL context lost before derived map generation");
    }

    // Generate derived maps
    console.log(
      `[TerrainTextureGenerator] Generating derived maps (normal, roughness, color)...`,
    );
    let normalTarget: THREE.WebGLRenderTarget;
    let roughnessTarget: THREE.WebGLRenderTarget;
    let colorTarget: THREE.WebGLRenderTarget;

    try {
      normalTarget = this.normalGenerator.generate(
        heightTarget,
        opts.normalStrength,
      );

      if (!this.offscreenRenderer.isContextValid()) {
        throw new Error("WebGL context lost during normal map generation");
      }

      roughnessTarget = this.roughnessGenerator.generate(heightTarget, {
        baseRoughness: input.roughness,
        slopeInfluence: 0.3,
        variationInfluence: 0.2,
      });

      if (!this.offscreenRenderer.isContextValid()) {
        throw new Error("WebGL context lost during roughness map generation");
      }

      const colorConfig: ColorPaletteConfig = {
        colors: input.colors,
        heightThresholds: input.heightThresholds,
        slopeColorInfluence: 0.1,
        slopeColor: "#5c5044", // Rocky slope color
      };
      colorTarget = this.colorGenerator.generate(heightTarget, colorConfig);
    } catch (error) {
      if (error instanceof Error && error.message.includes("context")) {
        throw error;
      }
      throw new Error(
        `Failed to generate derived maps: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    // Detach textures so they persist after render targets are disposed
    console.log(
      `[TerrainTextureGenerator] Detaching textures from render targets...`,
    );
    const heightMap = this.offscreenRenderer.detachTexture(heightTarget);
    const normalMap = this.offscreenRenderer.detachTexture(normalTarget);
    const roughnessMap = this.offscreenRenderer.detachTexture(roughnessTarget);
    const colorMap = this.offscreenRenderer.detachTexture(colorTarget);

    console.log(
      `[TerrainTextureGenerator] Texture generation completed successfully for ${object.id}`,
      {
        hasHeightMap: !!heightMap,
        hasNormalMap: !!normalMap,
        hasRoughnessMap: !!roughnessMap,
        hasColorMap: !!colorMap,
      },
    );

    return {
      heightMap,
      normalMap,
      colorMap,
      roughnessMap,
      resolution: this.resolution,
      dispose: () => {
        heightMap.dispose();
        normalMap.dispose();
        colorMap.dispose();
        roughnessMap.dispose();
      },
    };
  }

  /**
   * Runs erosion asynchronously using requestIdleCallback.
   */
  private runErosionAsync(
    inputTarget: THREE.WebGLRenderTarget,
    config: ErosionPassConfig,
    seed: string,
  ): Promise<THREE.WebGLRenderTarget> {
    return new Promise((resolve) => {
      // Use requestIdleCallback if available, otherwise setTimeout
      const schedule =
        typeof requestIdleCallback !== "undefined"
          ? requestIdleCallback
          : (cb: () => void) => setTimeout(cb, 0);

      schedule(() => {
        const result = this.erosionPass.apply(inputTarget, config, seed);
        resolve(result);
      });
    });
  }

  /**
   * Static convenience method to generate textures.
   *
   * Creates a generator, generates textures, and disposes the generator.
   *
   * @param object - CelestialObject to generate textures for
   * @param options - Generation options
   * @returns Generated planet textures
   */
  static async generateTextures(
    object: CelestialObject,
    options: TextureGenerationOptions = {},
  ): Promise<GeneratedPlanetTextures> {
    const generator = new TerrainTextureGenerator(options);
    try {
      return await generator.generate(object, options);
    } finally {
      generator.dispose();
    }
  }

  /**
   * Disposes of all resources.
   *
   * NOTE: Does NOT dispose the shared OffscreenRenderer instance,
   * as it may be in use by other generators.
   */
  dispose(): void {
    if (this.isDisposed) return;

    this.isDisposed = true;

    this.baseTerrainPass.dispose();
    this.craterPass.dispose();
    this.erosionPass.dispose();
    this.normalGenerator.dispose();
    this.roughnessGenerator.dispose();
    this.colorGenerator.dispose();

    // Don't dispose shared renderer - it's used by other generators
    // The shared instance will be disposed when the application shuts down
    if (!this.usingSharedRenderer) {
      this.offscreenRenderer.dispose();
    }
  }
}
