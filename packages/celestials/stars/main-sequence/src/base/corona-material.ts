import * as THREE from "three";
import type { StarShaderUniforms } from "../types/star.types";

// Import shaders
import coronaVertexShader from "../shaders/vertex.glsl?raw";
import coronaFragmentShader from "../shaders/corona.glsl?raw";

/**
 * Options for creating a corona material
 */
export interface CoronaMaterialOptions {
  /**
   * Base color for the corona (typically derived from the star color)
   */
  starColor: THREE.Color;

  /**
   * Initial time offset for animations
   */
  timeOffset?: number;

  /**
   * Custom uniforms to override defaults
   */
  customUniforms?: Partial<StarShaderUniforms>;

  /**
   * Optional opacity multiplier for the corona
   * Controls the overall visibility/intensity of the corona effect
   */
  opacityMultiplier?: number;
}

/**
 * Default corona shader uniforms
 */
const DEFAULT_CORONA_UNIFORMS = {
  uTime: new THREE.Uniform(0.0),
  uStarColor: new THREE.Uniform(new THREE.Color(0xffffff)),
  uOpacity: new THREE.Uniform(0.7),
  uPulseSpeed: new THREE.Uniform(0.3),
  uNoiseScale: new THREE.Uniform(1.0),
};

/**
 * Dedicated material class for celestial object coronas.
 * Particularly useful for star coronas with specialized shaders.
 */
export class CelestialCoronaMaterial extends THREE.ShaderMaterial {
  constructor(options: CoronaMaterialOptions) {
    // Create uniforms
    const uniforms = { ...DEFAULT_CORONA_UNIFORMS };

    // Set the star color
    uniforms.uStarColor.value.copy(options.starColor);

    // Set time offset if provided
    if (options.timeOffset !== undefined) {
      uniforms.uTime.value = options.timeOffset;
    }

    // Set opacity multiplier if provided
    if (options.opacityMultiplier !== undefined) {
      uniforms.uOpacity.value = options.opacityMultiplier;
    }

    // Apply any custom uniforms
    if (options.customUniforms) {
      // Apply custom uniforms
      for (const key in options.customUniforms) {
        const uniformKey = key as keyof typeof uniforms;
        const customValue = options.customUniforms[uniformKey];

        if (customValue !== undefined && uniforms[uniformKey] !== undefined) {
          // If the custom value is a color and the base is a color, use copy()
          if (
            customValue.value instanceof THREE.Color &&
            uniforms[uniformKey]?.value instanceof THREE.Color
          ) {
            (uniforms[uniformKey] as THREE.Uniform<THREE.Color>).value.copy(
              customValue.value as THREE.Color,
            );
          } else {
            // Otherwise, just assign the value
            (uniforms[uniformKey] as any) = customValue;
          }
        }
      }
    }

    // Call the super constructor with the material settings
    super({
      uniforms,
      vertexShader: coronaVertexShader,
      fragmentShader: coronaFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }

  /**
   * Updates the time uniform for the corona material
   *
   * @param time - The current time value
   */
  public updateTime(time: number): void {
    this.uniforms.uTime.value = time;
  }

  /**
   * Set the opacity of the corona
   *
   * @param opacity - The opacity value (0-1)
   */
  public setOpacity(opacity: number): void {
    this.uniforms.uOpacity.value = Math.max(0, Math.min(1, opacity));
  }

  /**
   * Create a corona material specifically tuned for G-type stars
   *
   * @param options - Base material options
   * @returns The configured corona material
   */
  public static createGTypeCorona(
    options: CoronaMaterialOptions,
  ): CelestialCoronaMaterial {
    return new CelestialCoronaMaterial({
      ...options,
      customUniforms: {
        uNoiseScale: new THREE.Uniform(1.2),
        uPulseSpeed: new THREE.Uniform(0.4),
        ...(options.customUniforms || {}),
      },
    });
  }

  /**
   * Create a corona material specifically tuned for M-type stars (red dwarfs)
   *
   * @param options - Base material options
   * @returns The configured corona material
   */
  public static createMTypeCorona(
    options: CoronaMaterialOptions,
  ): CelestialCoronaMaterial {
    return new CelestialCoronaMaterial({
      ...options,
      customUniforms: {
        uNoiseScale: new THREE.Uniform(0.8),
        uPulseSpeed: new THREE.Uniform(0.2),
        ...(options.customUniforms || {}),
      },
    });
  }
}
