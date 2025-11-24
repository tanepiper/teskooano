import * as THREE from "three";
import {
  uniform,
  texture,
  vec3,
  vec4,
  float,
  positionWorld,
  normalWorld,
  uv,
  cameraPosition,
  normalize,
  dot,
  mul,
  add,
  sub,
  clamp,
  smoothstep,
  pow,
  mix,
} from "three/tsl";
import { MeshStandardNodeMaterial } from "three/webgpu";

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

/**
 * TSL-based satellite material for WebGPU rendering.
 * Provides PBR-style lighting with texture support for loaded 3D models.
 */
export class SatelliteNodeMaterial extends MeshStandardNodeMaterial {
  private baseColorUniform: any;
  private metalnessUniform: any;
  private roughnessUniform: any;
  private maxEmissiveIntensityUniform: any;
  private emissiveIntensityUniform: any;

  private diffuseMapUniform: any;
  private normalMapUniform: any;
  private roughnessMapUniform: any;
  private metalnessMapUniform: any;
  private envMapUniform: any;

  private hasDiffuseMap: boolean;
  private hasNormalMapTexture: boolean;
  private hasRoughnessMapTexture: boolean;
  private hasMetalnessMapTexture: boolean;
  private hasEnvMapTexture: boolean;

  constructor(options: SatelliteMaterialOptions = {}) {
    super();

    console.log("[SatelliteNodeMaterial] Creating WebGPU TSL material");

    const baseColor = options.color ?? new THREE.Color(0xdddddd);
    const metalness = options.metalness ?? 0.7;
    const roughness = options.roughness ?? 0.3;
    const maxEmissiveIntensity = options.maxEmissiveIntensity ?? 0.6;

    // Extract textures from original material if available
    let diffuseMap: THREE.Texture | null = null;
    let normalMap: THREE.Texture | null = null;
    let roughnessMap: THREE.Texture | null = null;
    let metalnessMap: THREE.Texture | null = null;
    let originalEnvMap: THREE.Texture | null = null;

    if (options.originalMaterial) {
      if (options.originalMaterial instanceof THREE.MeshStandardMaterial) {
        diffuseMap = options.originalMaterial.map;
        normalMap = options.originalMaterial.normalMap;
        roughnessMap = options.originalMaterial.roughnessMap;
        metalnessMap = options.originalMaterial.metalnessMap;
        originalEnvMap = options.originalMaterial.envMap;
      } else if (options.originalMaterial instanceof THREE.MeshBasicMaterial) {
        diffuseMap = options.originalMaterial.map;
      } else if (options.originalMaterial instanceof THREE.MeshPhongMaterial) {
        diffuseMap = options.originalMaterial.map;
        normalMap = options.originalMaterial.normalMap;
        originalEnvMap = options.originalMaterial.envMap;
      }
    }

    // Use provided envMap or fall back to original material's envMap
    const finalEnvMap = options.envMap || originalEnvMap;

    // Store texture availability flags
    this.hasDiffuseMap = !!diffuseMap;
    this.hasNormalMapTexture = !!normalMap;
    this.hasRoughnessMapTexture = !!roughnessMap;
    this.hasMetalnessMapTexture = !!metalnessMap;
    this.hasEnvMapTexture = !!finalEnvMap;

    // Initialize uniforms
    this.baseColorUniform = uniform(baseColor);
    this.metalnessUniform = uniform(metalness);
    this.roughnessUniform = uniform(roughness);
    this.maxEmissiveIntensityUniform = uniform(maxEmissiveIntensity);
    this.emissiveIntensityUniform = uniform(0.0);

    // Initialize texture uniforms
    if (diffuseMap) {
      this.diffuseMapUniform = texture(diffuseMap, uv());
    }
    if (normalMap) {
      this.normalMapUniform = texture(normalMap, uv());
    }
    if (roughnessMap) {
      this.roughnessMapUniform = texture(roughnessMap, uv());
    }
    if (metalnessMap) {
      this.metalnessMapUniform = texture(metalnessMap, uv());
    }
    if (finalEnvMap) {
      // Environment maps need special handling in TSL
      // For now, we'll just store the reference
      this.envMapUniform = finalEnvMap;
    }

    // Build color node
    let finalColor = this.baseColorUniform;
    if (this.hasDiffuseMap) {
      // Sample diffuse texture and multiply with base color
      const texColor = this.diffuseMapUniform;
      finalColor = mul(texColor.rgb, this.baseColorUniform);
    }

    // Build material properties with texture sampling
    let finalMetalness = this.metalnessUniform;
    if (this.hasMetalnessMapTexture) {
      finalMetalness = this.metalnessMapUniform.r;
    }

    let finalRoughness = this.roughnessUniform;
    if (this.hasRoughnessMapTexture) {
      finalRoughness = this.roughnessMapUniform.r;
    }

    // Apply to material nodes
    this.colorNode = finalColor;
    this.metalnessNode = finalMetalness;
    this.roughnessNode = finalRoughness;

    // Emissive node (will be updated dynamically)
    this.emissiveNode = mul(
      this.baseColorUniform,
      this.emissiveIntensityUniform,
    );

    // Material settings
    this.side = THREE.FrontSide;
    this.transparent = false;
    this.depthWrite = true;
    this.depthTest = true;

    // Apply environment map if available
    if (finalEnvMap) {
      this.envMap = finalEnvMap;
      this.envMapIntensity = options.envMapIntensity ?? 1.0;
    }
  }

  /**
   * Update method for TSL material.
   * TSL materials handle most lighting automatically via MeshStandardNodeMaterial,
   * but we still need to update emissive intensity based on shadow conditions.
   */
  update(
    satellitePosition: THREE.Vector3,
    lightSources: Map<string, any>,
    shadowCasters?: { position: THREE.Vector3; radius: number }[],
  ): void {
    // Calculate emissive intensity based on lighting conditions
    // This is a simplified version since TSL handles most lighting automatically
    let emissiveIntensity = 0.0;
    let overallShadowFactor = 1.0;

    if (shadowCasters && shadowCasters.length > 0 && lightSources.size > 0) {
      // Get the primary light source (usually the Sun)
      const primaryLight = Array.from(lightSources.values())[0];
      if (primaryLight) {
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
              const penumbra = shadowCaster.radius * 0.3;
              const penumbraSq = penumbra * penumbra;
              const shadowIntensity =
                1.0 - Math.min(1.0, discriminant / penumbraSq);

              // Apply the darkest shadow
              overallShadowFactor = Math.min(
                overallShadowFactor,
                shadowIntensity * 0.5,
              );
            }
          }
        }
      }
    }

    // Calculate emissive intensity based on shadow conditions
    const maxEmissive = this.maxEmissiveIntensityUniform.value;
    if (overallShadowFactor < 0.3) {
      // In deep shadow - strong emissive for visibility
      emissiveIntensity = maxEmissive * (1.0 - overallShadowFactor) * 1.5;
    } else if (overallShadowFactor < 0.7) {
      // In partial shadow - moderate emissive
      emissiveIntensity = maxEmissive * (1.0 - overallShadowFactor) * 0.8;
    } else {
      // Well lit - minimal emissive
      emissiveIntensity = maxEmissive * 0.05;
    }

    this.emissiveIntensityUniform.value = Math.min(emissiveIntensity, 1.0);
  }

  /**
   * Update lighting uniforms - kept for API compatibility
   */
  updateLighting(lightSources: any): void {
    // TSL materials handle lighting automatically
    // This method is kept for API compatibility
  }

  dispose(): void {
    super.dispose();
  }
}
