import type { Color, Uniform, Vector3 } from "three";

/**
 * Defines the structure for shader uniforms used in procedural planet generation.
 * These uniforms control everything from lighting and noise functions to terrain shape,
 * color palettes, and surface characteristics.
 */
export interface ProceduralPlanetUniforms {
  // --- Lighting ---
  /** The number of active light sources affecting the planet. */
  uNumLights: Uniform<number>;
  /** An array of world-space positions for each light source. */
  uLightPositions: Uniform<Vector3[]>;
  /** An array of colors for each light source. */
  uLightColors: Uniform<Color[]>;
  /** An array of intensities for each light source. */
  uLightIntensities: Uniform<number[]>;
  /** The color of the ambient light in the scene. */
  uAmbientLightColor: Uniform<Color>;
  /** The intensity of the ambient light. */
  uAmbientLightIntensity: Uniform<number>;
  /** The world-space position of the camera, used for specular calculations. */
  uCameraPosition: Uniform<Vector3>;

  // --- Noise Generation ---
  /** The persistence value for noise, affecting detail contribution of successive octaves. */
  persistence: Uniform<number>;
  /** The lacunarity value for noise, affecting frequency of successive octaves. */
  lacunarity: Uniform<number>;
  /** The period for the simple noise function. */
  uSimplePeriod: Uniform<number>;
  /** The number of octaves for multi-layered noise, controlling complexity. */
  uOctaves: Uniform<number>;
  /** A factor to add wave-like undulation to the noise pattern. */
  uUndulation: Uniform<number>;

  // --- Terrain Generation ---
  /** A flag to select the terrain generation algorithm (e.g., 1=simple, 2=sharp peaks). */
  uTerrainType: Uniform<number>;
  /** The overall height scale (amplitude) of the generated terrain. */
  uTerrainAmplitude: Uniform<number>;
  /** Defines the sharpness or smoothness of terrain features. */
  uTerrainSharpness: Uniform<number>;
  /** A base height offset for the entire terrain surface. */
  uTerrainOffset: Uniform<number>;

  // --- Color Palette ---
  /** The first color in the terrain's height-based gradient. */
  uColor1: Uniform<Color>;
  /** The second color in the terrain's height-based gradient. */
  uColor2: Uniform<Color>;
  /** The third color in the terrain's height-based gradient. */
  uColor3: Uniform<Color>;
  /** The fourth color in the terrain's height-based gradient. */
  uColor4: Uniform<Color>;
  /** The fifth color in the terrain's height-based gradient. */
  uColor5: Uniform<Color>;

  // --- Color Height Thresholds ---
  /** The normalized height threshold at which `uColor1` is fully applied. */
  uHeight1: Uniform<number>;
  /** The normalized height threshold at which `uColor2` is fully applied. */
  uHeight2: Uniform<number>;
  /** The normalized height threshold at which `uColor3` is fully applied. */
  uHeight3: Uniform<number>;
  /** The normalized height threshold at which `uColor4` is fully applied. */
  uHeight4: Uniform<number>;
  /** The normalized height threshold at which `uColor5` is fully applied. */
  uHeight5: Uniform<number>;

  // --- Surface & Material Properties ---
  /** The scale of the bump map effect, adding fine, simulated surface detail. */
  uBumpScale: Uniform<number>;
  /** The shininess factor for specular highlights. */
  uShininess: Uniform<number>;
  /** The overall strength of specular highlights. */
  uSpecularStrength: Uniform<number>;
  /** The roughness of the material surface, affecting how light scatters. */
  uRoughness: Uniform<number>;

  // --- Animation ---
  /** The elapsed time, used for animations like lava flow or cloud movement. */
  uTime: Uniform<number>;

  /** Index signature to allow for additional, non-standard uniforms. */
  [key: string]: Uniform<any>;
}
