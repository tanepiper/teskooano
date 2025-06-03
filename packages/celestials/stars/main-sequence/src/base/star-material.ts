import * as THREE from "three";
import { StarShaderUniforms } from "../types/star.types";

// Import shaders
import starVertexShader from "../shaders/vertex.glsl?raw";
import starFragmentShader from "../shaders/fragment.glsl?raw";

/**
 * Options for creating star materials
 */
export interface MainSequenceStarMaterialOptions {
  /**
   * Base color of the star
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
}

/**
 * Result of creating star materials
 */
export interface MainSequenceStarMaterials {
  /**
   * Material for the star body
   */
  bodyMaterial: THREE.ShaderMaterial;

  /**
   * The uniforms used by the materials
   */
  uniforms: StarShaderUniforms;

  /**
   * Update the material time
   */
  update: (time: number) => void;

  /**
   * Dispose of all materials
   */
  dispose: () => void;
}

// Define baseline default values for ALL StarShaderUniforms fields
const DEFAULT_SHADER_UNIFORMS: Partial<StarShaderUniforms> = {
  uTime: new THREE.Uniform(0.0),
  uStarColor: new THREE.Uniform(new THREE.Color(0xffffff)),
  uPulseSpeed: new THREE.Uniform(0.5),
  uGlowIntensity: new THREE.Uniform(1.0),
  uTemperatureVariation: new THREE.Uniform(0.1),
  uMetallicEffect: new THREE.Uniform(0.3),
  uNoiseEvolutionSpeed: new THREE.Uniform(0.1),
  uNoiseScale: new THREE.Uniform(1.0),
  uCoronaIntensity: new THREE.Uniform(1.0),
  uTextureSampler: new THREE.Uniform(null),
};

/**
 * Creates materials for main sequence stars with appropriate shader uniforms
 */
export class MainSequenceStarMaterial {
  /**
   * Create materials for a main sequence star
   *
   * @param options - Configuration options for the materials
   * @returns Object containing the created materials and utility functions
   */
  public static createMaterials(
    options: MainSequenceStarMaterialOptions,
  ): MainSequenceStarMaterials {
    // Create a deep clone of the default uniforms
    const uniforms = this.cloneDefaultUniforms();

    // Set the star color
    uniforms.uStarColor.value.copy(options.starColor);

    // Set time offset if provided
    if (options.timeOffset !== undefined) {
      uniforms.uTime.value = options.timeOffset;
    }

    // Apply any custom uniforms
    if (options.customUniforms) {
      this.applyCustomUniforms(uniforms, options.customUniforms);
    }

    // Create the body material
    const bodyMaterial = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: starVertexShader,
      fragmentShader: starFragmentShader,
      transparent: false,
    });

    // Create the result object
    const result: MainSequenceStarMaterials = {
      bodyMaterial,
      uniforms,

      // Update function to advance time
      update: (time: number) => {
        bodyMaterial.uniforms.uTime.value = time;
      },

      // Dispose function to clean up materials
      dispose: () => {
        bodyMaterial.dispose();
      },
    };

    return result;
  }

  /**
   * Create a deep clone of the default uniforms
   */
  private static cloneDefaultUniforms(): StarShaderUniforms {
    // Create a shallow copy first
    const uniforms = { ...DEFAULT_SHADER_UNIFORMS } as StarShaderUniforms;

    // Deep clone the complex values (like THREE.Color)
    if (uniforms.uStarColor && DEFAULT_SHADER_UNIFORMS.uStarColor) {
      uniforms.uStarColor = new THREE.Uniform(
        DEFAULT_SHADER_UNIFORMS.uStarColor.value.clone(),
      );
    }

    return uniforms;
  }

  /**
   * Apply custom uniforms to the base uniforms
   */
  private static applyCustomUniforms(
    baseUniforms: StarShaderUniforms,
    customUniforms: Partial<StarShaderUniforms>,
  ): void {
    for (const key in customUniforms) {
      const uniformKey = key as keyof StarShaderUniforms;
      const customValue = customUniforms[uniformKey];

      if (customValue !== undefined && baseUniforms[uniformKey] !== undefined) {
        // If the custom value is a color and the base is a color, use copy()
        if (
          customValue.value instanceof THREE.Color &&
          baseUniforms[uniformKey]?.value instanceof THREE.Color
        ) {
          (baseUniforms[uniformKey] as THREE.Uniform<THREE.Color>).value.copy(
            customValue.value as THREE.Color,
          );
        } else {
          // Otherwise, just assign the value
          (baseUniforms[uniformKey] as any) = customValue;
        }
      }
    }
  }

  /**
   * Create a material specifically optimized for G-type stars
   */
  public static createGTypeMaterial(
    options: MainSequenceStarMaterialOptions,
  ): MainSequenceStarMaterials {
    // Start with a G-type specific base color if not provided
    if (!options.starColor) {
      options.starColor = new THREE.Color(0xfff4e0); // G-type yellowish color
    }

    // G-type specific custom uniforms
    const gTypeCustomUniforms: Partial<StarShaderUniforms> = {
      uNoiseScale: new THREE.Uniform(1.2),
      uTemperatureVariation: new THREE.Uniform(0.12),
      ...options.customUniforms,
    };

    // Create the materials with G-type specific options
    return this.createMaterials({
      ...options,
      customUniforms: gTypeCustomUniforms,
    });
  }
}
