import * as THREE from "three";
import { FieldOptions } from "../core/Field";

/**
 * Defines the noise configuration for the nebula shader.
 */
export interface NebulaNoiseOptions {
  scale: number;
  octaves: number;
  persistence: number;
  lacunarity: number;
  seed: number;
}

/**
 * Defines the complete set of options for creating a NebulaField.
 */
export interface NebulaFieldOptions extends FieldOptions {
  baseDistance: number;
  size: number;
  colors: THREE.Color[];
  alpha: number;
  noiseConfig: NebulaNoiseOptions;
  rotationSpeed?: number;
}
