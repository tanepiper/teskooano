import * as THREE from "three";
import type { LODLevel } from "./renderer.types"; // For Billboard.createLOD return type
import type { CelestialPhysicalProperties } from "./core.types"; // For Billboard.createLOD params

/**
 * Options for controlling the visual appearance of a billboard.
 */
export interface BillboardVisualOptions {
  /**
   * Screen-space size of the billboard.
   * If not provided, a default calculation (e.g., based on object radius) might be used.
   */
  size?: number;
  /**
   * Color tint for the billboard sprite.
   * Can be a THREE.Color instance, hex number, or CSS color string.
   * Defaults to white or the primary color of the celestial object.
   */
  color?: THREE.Color | number | string;
  /**
   * Opacity of the billboard sprite.
   * Value should be between 0 (fully transparent) and 1 (fully opaque).
   * Defaults to a predefined value (e.g., 0.85).
   */
  opacity?: number;
  /**
   * Optional texture for the billboard. If not provided, a default procedural texture may be generated.
   */
  texture?: THREE.Texture;
}

/**
 * Parameters for configuring the point light associated with a billboard.
 */
export interface BillboardLightParameters {
  /**
   * Intensity of the point light.
   * Set to 0 or undefined to disable the light.
   * Defaults to a predefined value if enabled.
   */
  intensity?: number;
  /**
   * Color of the point light.
   * Can be a THREE.Color instance, hex number, or CSS color string.
   * Defaults to the celestial object's color or billboard color if the light is enabled.
   */
  color?: THREE.Color | number | string;
  /**
   * Decay factor for the point light, affecting how its intensity diminishes with distance.
   * Refer to THREE.PointLight documentation (e.g., 2 for realistic decay).
   * Defaults to a predefined value.
   */
  decay?: number;
}

/**
 * Combined configuration for a celestial object's billboard, including visual and light aspects.
 */
export interface CelestialBillboardConfig {
  visuals?: BillboardVisualOptions;
  light?: BillboardLightParameters;
}

/**
 * Interface for a billboard generator.
 * Implementations of this interface are responsible for creating
 * all necessary Three.js objects for a billboard LOD level.
 */
export interface Billboard {
  /**
   * Creates the LODLevel object for the billboard.
   * @param celestialId - The ID of the celestial object, for naming purposes.
   * @param physicalProperties - Physical properties of the celestial object (e.g., radius).
   * @param billboardConfig - Specific configuration for the billboard's appearance and light.
   * @param baseObjectColor - The primary color of the celestial object, used as a default for billboard/light color.
   * @param lodDistance - The distance at which this billboard LOD becomes active.
   * @param starMaterial - Optional shader material of the main star object, used for effects like deriving glow intensity.
   * @returns An LODLevel object representing the billboard.
   */
  createLOD(
    celestialId: string,
    physicalProperties: CelestialPhysicalProperties,
    billboardConfig: CelestialBillboardConfig | undefined,
    baseObjectColor: THREE.Color,
    lodDistance: number,
    starMaterial?: THREE.ShaderMaterial,
  ): LODLevel;
}
