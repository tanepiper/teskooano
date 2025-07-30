import * as THREE from "three";
import {
  LightArrayUtils,
  LightSourcesMap,
} from "@teskooano/renderer-threejs-celestial";

// Import shader source code
import satelliteVertexShader from "./shaders/satellite.vertex.glsl";
import satelliteFragmentShader from "./shaders/satellite.fragment.glsl";

export interface SatelliteMaterialOptions {
  /** Base color multiplier for the satellite */
  color?: THREE.Color;
  /** Metallic factor for PBR materials */
  metalness?: number;
  /** Roughness factor for PBR materials */
  roughness?: number;
  /** Maximum emissive intensity when fully lit */
  maxEmissiveIntensity?: number;
  /** Original material to preserve textures from */
  originalMaterial?: THREE.Material;
  /** Environment map for reflections */
  envMap?: THREE.Texture;
  /** Environment map intensity */
  envMapIntensity?: number;
}

const MAX_LIGHTS = 4;
const MAX_SHADOW_CASTERS = 4;

/**
 * Custom shader material for satellite rendering that integrates with our engine's lighting system
 */
export class SatelliteMaterial extends THREE.ShaderMaterial {
  private maxEmissiveIntensity: number;
  private currentNumLights: number = 0;
  private currentNumShadowCasters: number = 0;

  constructor(options: SatelliteMaterialOptions = {}) {
    const baseColor = options.color ?? new THREE.Color(0xdddddd);
    const metalness = options.metalness ?? 0.7;
    const roughness = options.roughness ?? 0.3;
    const maxEmissiveIntensity = options.maxEmissiveIntensity ?? 0.6;
    const originalMaterial = options.originalMaterial;
    const envMap = options.envMap;
    const envMapIntensity = options.envMapIntensity ?? 1.0;

    // Extract textures from original material if available
    let diffuseMap: THREE.Texture | null = null;
    let normalMap: THREE.Texture | null = null;
    let roughnessMap: THREE.Texture | null = null;
    let metalnessMap: THREE.Texture | null = null;
    let originalEnvMap: THREE.Texture | null = null;

    if (originalMaterial) {
      // Handle different material types
      if (originalMaterial instanceof THREE.MeshStandardMaterial) {
        diffuseMap = originalMaterial.map;
        normalMap = originalMaterial.normalMap;
        roughnessMap = originalMaterial.roughnessMap;
        metalnessMap = originalMaterial.metalnessMap;
        originalEnvMap = originalMaterial.envMap;
      } else if (originalMaterial instanceof THREE.MeshBasicMaterial) {
        diffuseMap = originalMaterial.map;
      } else if (originalMaterial instanceof THREE.MeshPhongMaterial) {
        diffuseMap = originalMaterial.map;
        normalMap = originalMaterial.normalMap;
        originalEnvMap = originalMaterial.envMap;
      }
    }

    // Use provided envMap or fall back to original material's envMap
    const finalEnvMap = envMap || originalEnvMap;

    super({
      uniforms: {
        baseColor: { value: baseColor },
        metalness: { value: metalness },
        roughness: { value: roughness },
        maxEmissiveIntensity: { value: maxEmissiveIntensity },
        uDynamicAmbientIntensity: { value: 1.0 },
        uEmissiveIntensity: { value: 0.0 },
        uEmissiveColor: { value: new THREE.Color(0x111111) },
        // Dynamic lighting and shadow arrays
        uNumLights: { value: 0 },
        uLightSources: {
          value: LightArrayUtils.createLightSourceArray(MAX_LIGHTS),
        },
        uNumShadowCasters: { value: 0 },
        uShadowCasters: {
          value: LightArrayUtils.createShadowCasterArray(MAX_SHADOW_CASTERS),
        },
        // Texture uniforms
        map: { value: diffuseMap },
        normalMap: { value: normalMap },
        roughnessMap: { value: roughnessMap },
        metalnessMap: { value: metalnessMap },
        hasMap: { value: !!diffuseMap },
        hasNormalMap: { value: !!normalMap },
        hasRoughnessMap: { value: !!roughnessMap },
        hasMetalnessMap: { value: !!metalnessMap },
        // Environment map uniforms
        envMap: { value: finalEnvMap },
        hasEnvMap: { value: !!finalEnvMap },
        envMapIntensity: { value: envMapIntensity },
      },
      defines: {
        MAX_LIGHTS: MAX_LIGHTS,
        MAX_SHADOW_CASTERS: MAX_SHADOW_CASTERS,
      },
      vertexShader: satelliteVertexShader,
      fragmentShader: satelliteFragmentShader,
      side: THREE.FrontSide,
      transparent: false,
      depthWrite: true,
      depthTest: true,
    });

    this.maxEmissiveIntensity = maxEmissiveIntensity;
    this.currentNumLights = MAX_LIGHTS;
    this.currentNumShadowCasters = MAX_SHADOW_CASTERS;
  }

  private resizeLightArrays(newSize: number): void {
    this.uniforms.uLightSources.value = LightArrayUtils.resizeLightArray(
      this,
      newSize,
      this.uniforms.uLightSources.value,
    );
    this.currentNumLights = newSize;
  }

  private resizeShadowCasterArrays(newSize: number): void {
    this.uniforms.uShadowCasters.value =
      LightArrayUtils.resizeShadowCasterArray(
        this,
        newSize,
        this.uniforms.uShadowCasters.value,
      );
    this.currentNumShadowCasters = newSize;
  }

  /**
   * Updates the material with current lighting information
   * This ensures the material responds to changes in light sources and shadow casters
   */
  update(
    satellitePosition: THREE.Vector3,
    lightSources: LightSourcesMap,
    shadowCasters?: { position: THREE.Vector3; radius: number }[],
  ): void {
    const numLights = Math.min(lightSources.size, MAX_LIGHTS);

    // Resize light arrays if needed
    if (numLights !== this.currentNumLights) {
      this.resizeLightArrays(numLights);
    }

    this.uniforms.uNumLights.value = numLights;

    // Update light uniforms
    let i = 0;
    for (const lightData of lightSources.values()) {
      if (i >= MAX_LIGHTS) break; // Max MAX_LIGHTS lights

      this.uniforms.uLightSources.value[i].position.copy(lightData.position);
      this.uniforms.uLightSources.value[i].color.copy(lightData.color);
      this.uniforms.uLightSources.value[i].intensity =
        lightData.intensity ?? 1.0;
      i++;
    }

    // Update shadow casters
    const numShadowCasters = shadowCasters?.length ?? 0;
    if (numShadowCasters !== this.currentNumShadowCasters) {
      this.resizeShadowCasterArrays(numShadowCasters);
    }

    this.uniforms.uNumShadowCasters.value = numShadowCasters;
    if (shadowCasters) {
      for (let i = 0; i < numShadowCasters; i++) {
        const uniformCaster = this.uniforms.uShadowCasters.value[i];
        uniformCaster.position.copy(shadowCasters[i].position);
        uniformCaster.radius = shadowCasters[i].radius;
      }
    }

    // Calculate emissive intensity based on lighting conditions
    // When in shadow, increase emissive to maintain visibility
    // When fully lit, reduce emissive to avoid over-brightness
    let emissiveIntensity = 0.0;

    // Calculate overall shadow factor for emissive calculation
    let overallShadowFactor = 1.0;
    if (shadowCasters && shadowCasters.length > 0 && lightSources.size > 0) {
      // Get the primary light source (usually the Sun)
      const primaryLight = Array.from(lightSources.values())[0];
      const lightDirection = primaryLight.position
        .clone()
        .sub(satellitePosition)
        .normalize();

      // Check if any shadow caster is blocking the light
      for (const shadowCaster of shadowCasters) {
        const oc = satellitePosition.clone().sub(shadowCaster.position);
        const b = oc.dot(lightDirection);
        const c = oc.dot(oc) - shadowCaster.radius * shadowCaster.radius;
        const discriminant = b * b - c;

        // If the satellite is in the shadow cone
        if (discriminant > 0.0) {
          const t = -b - Math.sqrt(discriminant);
          if (t > 0.001) {
            // Calculate shadow intensity (0.0 = full shadow, 1.0 = fully lit)
            // Use a smaller penumbra for more aggressive shadowing
            const penumbra = shadowCaster.radius * 0.3; // Reduced from 0.8 to 0.3
            const penumbraSq = penumbra * penumbra;
            const shadowIntensity =
              1.0 - Math.min(1.0, discriminant / penumbraSq);

            // Apply the darkest shadow with more aggressive falloff
            overallShadowFactor = Math.min(
              overallShadowFactor,
              shadowIntensity * 0.5,
            );
          }
        }
      }
    }

    if (overallShadowFactor < 0.3) {
      // In deep shadow - strong emissive for visibility
      emissiveIntensity =
        this.maxEmissiveIntensity * (1.0 - overallShadowFactor) * 1.5;
    } else if (overallShadowFactor < 0.7) {
      // In partial shadow - moderate emissive
      emissiveIntensity =
        this.maxEmissiveIntensity * (1.0 - overallShadowFactor) * 0.8;
    } else {
      // Well lit - minimal emissive
      emissiveIntensity = this.maxEmissiveIntensity * 0.05;
    }

    this.uniforms.uEmissiveIntensity.value = emissiveIntensity;
  }

  /**
   * Updates lighting uniforms - not needed for custom shader materials
   * This method is kept for API compatibility
   */
  updateLighting(lightSources: any): void {
    // Custom shader handles lighting automatically
    // This method is here for API compatibility
  }
}
