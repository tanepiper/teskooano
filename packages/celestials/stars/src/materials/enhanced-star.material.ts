import * as THREE from "three";
import type {
  RenderableCelestialObject,
  StarProperties,
} from "@teskooano/data-types";
import type { LightSourcesMap } from "@teskooano/renderer-threejs-celestial";
import enhancedStarVertexShader from "../shaders/enhanced-star.vertex.glsl?raw";
import enhancedStarFragmentShader from "../shaders/enhanced-star.fragment.glsl?raw";

/**
 * Enhanced Star Material with simple 3-color plasma effects
 * Clean, elegant approach focusing on core stellar appearance
 */
export class EnhancedStarMaterial extends THREE.ShaderMaterial {
  private object: RenderableCelestialObject;

  constructor(
    object: RenderableCelestialObject,
    color: THREE.Color = new THREE.Color(0xffff00),
    options: {
      // Basic plasma noise parameters
      noiseScale?: number;
      noiseIntensity?: number;
      plasmaTurbulence?: number;

      // Uniform lighting
      lightingIntensity?: number;
    } = {},
  ) {
    // Get star properties for intelligent defaults
    const starProps = object.properties as StarProperties;

    // Set up colors with fallbacks
    const hotColor = starProps?.hotColor
      ? new THREE.Color(starProps.hotColor)
      : color.clone().multiplyScalar(1.4);
    const surfaceColor = starProps?.surfaceColor
      ? new THREE.Color(starProps.surfaceColor)
      : color;
    const coolColor = starProps?.coolColor
      ? new THREE.Color(starProps.coolColor)
      : color.clone().multiplyScalar(0.3);

    super({
      vertexShader: enhancedStarVertexShader,
      fragmentShader: enhancedStarFragmentShader,
      uniforms: {
        uTime: { value: 0.0 },

        // Colors
        uStarColor: { value: color },
        uHotColor: { value: hotColor },
        uSurfaceColor: { value: surfaceColor },
        uCoolColor: { value: coolColor },

        // Plasma noise parameters
        uNoiseScale: { value: options.noiseScale ?? 1.0 },
        uNoiseIntensity: { value: options.noiseIntensity ?? 0.2 },
        uPlasmaTurbulence: { value: options.plasmaTurbulence ?? 0.1 },

        // Uniform lighting
        uLightingIntensity: { value: options.lightingIntensity ?? 1.0 },
      },
      transparent: false,
      side: THREE.FrontSide,
      depthTest: true,
      depthWrite: true, // Ensure stars write to depth buffer for proper occlusion
      blending: THREE.NormalBlending, // Use normal blending for opaque stars
    });

    this.object = object;
  }

  /**
   * Update the material with current time and state
   */
  update(
    time: number,
    timeScale: number,
    lightSources: LightSourcesMap,
    camera: THREE.PerspectiveCamera,
    allObjects?: Record<string, RenderableCelestialObject>,
    allMeshes?: Record<string, THREE.Object3D>,
  ): void {
    // Update time uniform for animation
    // Use the directly passed time, which is already scaled
    this.uniforms.uTime.value = time;

    // Update star colors from object properties
    this.updateStarColors(this.object.properties as StarProperties);

    // Update from state if available
    const starProps = this.object.properties as StarProperties;
    if (starProps?.materialParams) {
      this.updateFromState(starProps.materialParams);
    }
  }

  /**
   * Update star colors from properties
   */
  private updateStarColors(starProps: StarProperties): void {
    // Update main star color
    if (starProps.color && this.uniforms.uStarColor) {
      this.uniforms.uStarColor.value.set(starProps.color);
    }

    // Update hot color (for plasma, flares, convection centers)
    if (starProps.hotColor && this.uniforms.uHotColor) {
      this.uniforms.uHotColor.value.set(starProps.hotColor);
    } else if (starProps.color && this.uniforms.uHotColor) {
      // Fallback to brighter version of main color
      const hotColor = new THREE.Color(starProps.color);
      hotColor.multiplyScalar(1.4); // Make it brighter
      this.uniforms.uHotColor.value.copy(hotColor);
    }

    // Update surface color (normal surface areas)
    if (starProps.surfaceColor && this.uniforms.uSurfaceColor) {
      this.uniforms.uSurfaceColor.value.set(starProps.surfaceColor);
    } else if (starProps.color && this.uniforms.uSurfaceColor) {
      // Fallback to main color
      this.uniforms.uSurfaceColor.value.set(starProps.color);
    }

    // Update cool color (for sunspots, darker regions)
    if (starProps.coolColor && this.uniforms.uCoolColor) {
      this.uniforms.uCoolColor.value.set(starProps.coolColor);
    } else if (starProps.color && this.uniforms.uCoolColor) {
      // Fallback to darker version of main color
      const coolColor = new THREE.Color(starProps.color);
      coolColor.multiplyScalar(0.3); // Make it much darker
      this.uniforms.uCoolColor.value.copy(coolColor);
    }
  }

  /**
   * Update noise parameters from state
   */
  private updateFromState(materialParams: any): void {
    const updateUniform = (uniformName: string, value: any) => {
      if (this.uniforms[uniformName] && value !== undefined) {
        this.uniforms[uniformName].value = value;
      }
    };

    // Update noise parameters
    updateUniform("uNoiseScale", materialParams.noiseScale);
    updateUniform("uNoiseIntensity", materialParams.noiseIntensity);
    updateUniform("uPlasmaTurbulence", materialParams.plasmaTurbulence);

    // Update lighting
    updateUniform("uLightingIntensity", materialParams.lightingIntensity);
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    // Clean up any resources if needed
    super.dispose();
  }
}
