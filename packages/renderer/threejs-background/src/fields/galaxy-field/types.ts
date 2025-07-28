import * as THREE from "three";
import { FieldOptions } from "../core/Field";

/**
 * Defines the options for creating galaxies in the galaxy field.
 */
export interface GalaxyFieldOptions extends FieldOptions {
  /** The total number of galaxies to generate. */
  count: number;
  /**
   * The base distance from the origin where galaxies will be placed.
   */
  baseDistance: number;
  /**
   * The maximum random offset applied to each galaxy's distance from baseDistance.
   */
  distanceSpread: number;
  /** The minimum size of galaxy sprites. */
  minSize: number;
  /** The maximum size of galaxy sprites. */
  maxSize: number;
  /** The minimum opacity of galaxies (0 to 1). */
  minOpacity: number;
  /** The maximum opacity of galaxies (0 to 1). */
  maxOpacity: number;
  /**
   * The strength of the parallax effect. A higher value results in more
   * apparent movement relative to the camera.
   * @default 0.05
   */
  parallaxStrength?: number;
}
