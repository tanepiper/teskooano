import * as THREE from "three";
import { FieldOptions } from "../core/Field";

/**
 * Defines the options for creating a single layer within a star field.
 */
export interface StarFieldLayerOptions {
  /** The total number of stars to generate for this layer. */
  count: number;
  /**
   * A multiplier applied to the `baseDistance` to set the average distance
   * of this layer from the origin.
   */
  distanceMultiplier: number;
  /**
   * The maximum random offset applied to each star's distance, creating
   * depth and variation within the layer.
   */
  distanceSpread: number;
  /** The minimum brightness (luminosity) of a star in this layer (0 to 1). */
  minBrightness: number;
  /** The maximum brightness (luminosity) of a star in this layer (0 to 1). */
  maxBrightness: number;
  /**
   * The base size of the points used to render the stars.
   * This is affected by `sizeAttenuation`.
   */
  size?: number;
  /** An optional color to tint all stars in this layer. */
  colorTint?: THREE.Color;
}

/**
 * Defines the complete set of options for creating a StarField.
 */
export interface StarFieldOptions extends FieldOptions {
  /** An array of layer configurations that make up the star field. */
  layers: StarFieldLayerOptions[];
  /**
   * The base speed at which the star layers rotate independently.
   * @default 0.00000002
   */
  rotationSpeed?: number;
  /**
   * The strength of the parallax effect. A higher value results in more
   * apparent movement relative to the camera.
   * @default 0.1
   */
  parallaxStrength?: number;
  /**
   * The base distance from which all layer `distanceMultiplier` values are
   * calculated. This acts as the anchor for the entire field's depth.
   */
  baseDistance: number;
}
