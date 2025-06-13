import * as THREE from "three";
import { FieldOptions } from "../core/Field";

/**
 * Defines the options for creating a single layer within a star field.
 */
export interface StarFieldLayerOptions {
  count: number;
  distanceMultiplier: number;
  distanceSpread: number;
  minBrightness: number;
  maxBrightness: number;
  size?: number;
  colorTint?: THREE.Color;
}

/**
 * Defines the complete set of options for creating a StarField.
 */
export interface StarFieldOptions extends FieldOptions {
  layers: StarFieldLayerOptions[];
  rotationSpeed?: number;
  parallaxStrength?: number;
  baseDistance: number;
}
