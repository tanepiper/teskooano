import type { Color, Vector3 } from "three";

export interface ProceduralPlanetUniforms {
  uNumLights: { value: number };
  uLightPositions: { value: Vector3[] };
  uLightColors: { value: Color[] };
  uLightIntensities: { value: number[] };
  uAmbientLightColor: { value: Color };
  uAmbientLightIntensity: { value: number };
  uCameraPosition: { value: Vector3 };

  persistence: { value: number };
  lacunarity: { value: number };
  uSimplePeriod: { value: number };
  uOctaves: { value: number };
  uUndulation: { value: number };

  // Terrain generation parameters
  uTerrainType: { value: number }; // 1 = simple, 2 = sharp peaks, 3 = sharp valleys
  uTerrainAmplitude: { value: number }; // Controls overall height scale
  uTerrainSharpness: { value: number }; // Controls terrain feature definition
  uTerrainOffset: { value: number }; // Base height offset

  uColor1: { value: Color };
  uColor2: { value: Color };
  uColor3: { value: Color };
  uColor4: { value: Color };
  uColor5: { value: Color };

  uHeight1: { value: number };
  uHeight2: { value: number };
  uHeight3: { value: number };
  uHeight4: { value: number };
  uHeight5: { value: number };

  uBumpScale: { value: number };

  uShininess: { value: number };
  uSpecularStrength: { value: number };
  uRoughness: { value: number };

  uTime: { value: number };

  [key: string]: { value: any };
}
