/**
 * Uniforms for procedural solid surface generation, primarily for shaders.
 */
export interface SolidSurfaceShaderUniforms {
  persistence: number; // (0-1)
  lacunarity: number; // (typically > 1)
  simplePeriod: number;
  octaves: number;
  bumpScale: number;
  color1: string; // Hex - Base color for the surface (lowest elevation)
  color2: string; // Hex - Second color gradient point
  color3: string; // Hex - Third color gradient point
  color4: string; // Hex - Fourth color gradient point
  color5: string; // Hex - Final color for the surface (highest elevation)
  height1: number; // (0-1) threshold for color1 transition
  height2: number; // (0-1) threshold for color2 transition
  height3: number; // (0-1) threshold for color3 transition
  height4: number; // (0-1) threshold for color4 transition
  height5: number; // (0-1) threshold for color5 transition
  shininess: number; // (e.g. 0-100 for Phong/Blinn-Phong)
  specularStrength: number; // (0-1)
  roughness: number; // (0-1, for PBR materials)
  ambientLightIntensity: number; // (0-1)
  undulation: number;
  terrainType: number; // (1=simple, 2=sharp peaks, 3=sharp valleys) - controls noise interpretation
  terrainAmplitude: number;
  terrainSharpness: number;
  terrainOffset: number;
  // Add specific uniforms for lava/ocean effects if controlled by the same shader
  // e.g., lavaFlowSpeed?: number; oceanWaveFrequency?: number;
  // emissiveColor?: string; // For lava, etc.
  // emissiveIntensity?: number;
}

/** Generic surface with a base color, roughness, and optional texture - for non-procedural objects. */
export interface SimpleSurfaceAppearance {
  type: "simple";
  baseColor: string; // Hex
  roughness: number; // (0-1)
  texture?: string; // Path or identifier
  secondaryColor?: string; // Hex, for variations
}

/** Surface rendered using procedural noise data and shader uniforms. */
export interface ProceduralSurfaceAppearance
  extends SolidSurfaceShaderUniforms {
  type: "procedural";
  // All properties from SolidSurfaceShaderUniforms are directly embedded here.
}

/** Union of all possible surface appearance types for solid bodies. */
export type SurfaceAppearanceUnion =
  | SimpleSurfaceAppearance // For basic, non-procedural surfaces
  | ProceduralSurfaceAppearance; // For all procedurally rendered solid surfaces (planets, moons)
