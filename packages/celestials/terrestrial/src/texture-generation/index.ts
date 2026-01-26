/**
 * Texture Generation Module
 *
 * Multi-pass terrain texture generation system for terrestrial planets.
 * Generates height maps, applies craters, runs erosion simulation,
 * and produces derived maps (normal, roughness, color).
 *
 * @module texture-generation
 */

// Main orchestrator
export {
  TerrainTextureGenerator,
  type TextureGenerationOptions,
} from "./TerrainTextureGenerator";

// Types
export {
  type TextureResolution,
  type TerrainTextureConfig,
  type TerrainGenerationInput,
  type GeneratedPlanetTextures,
  type CraterDefinition,
  type CraterPassConfig,
  type ErosionPassConfig,
  TEXTURE_RESOLUTIONS,
  getDefaultErosionConfig,
  getCraterCountRange,
} from "./types";

// Passes (for advanced usage)
export { BaseTerrainPass } from "./passes/BaseTerrainPass";
export { CraterPass, generateCraterDistribution } from "./passes/CraterPass";
export {
  ErosionPass,
  hydraulicErosion,
  thermalErosion,
} from "./passes/ErosionPass";

// Generators (for advanced usage)
export { NormalMapGenerator } from "./generators/NormalMapGenerator";
export {
  RoughnessMapGenerator,
  type RoughnessConfig,
  DEFAULT_ROUGHNESS_CONFIG,
} from "./generators/RoughnessMapGenerator";
export {
  ColorMapGenerator,
  type ColorPaletteConfig,
} from "./generators/ColorMapGenerator";

// Utilities
export {
  OffscreenRenderer,
  type RenderTargetOptions,
} from "./utils/OffscreenRenderer";
