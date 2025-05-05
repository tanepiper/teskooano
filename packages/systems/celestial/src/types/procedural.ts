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

  uColorLow: { value: Color };
  uColorMid1: { value: Color };
  uColorMid2: { value: Color };
  uColorHigh: { value: Color };

  uBumpScale: { value: number };

  uTime: { value: number };

  [key: string]: { value: any };
}
