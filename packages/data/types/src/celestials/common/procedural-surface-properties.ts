/**
 * Interface defining properties for procedural surface generation and rendering.
 * These properties control the appearance and characteristics of procedurally generated surfaces
 * such as terrain, planets, or other celestial bodies.
 * This is the canonical definition.
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
