import * as THREE from "three";
import {
  LightArrayUtils,
  LightSourcesMap,
} from "@teskooano/renderer-threejs-celestial";

export interface SatelliteMaterialOptions {
  /** Base color multiplier for the satellite */
  color?: THREE.Color;
  /** Metallic factor for PBR materials */
  metalness?: number;
  /** Roughness factor for PBR materials */
  roughness?: number;
  /** Maximum emissive intensity when fully lit */
  maxEmissiveIntensity?: number;
}

// Vertex shader for satellite materials
const satelliteVertexShader = `
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec3 vViewDirection;

void main() {
  vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
  vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
  vViewDirection = normalize(cameraPosition - vWorldPosition);
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// Fragment shader for satellite materials
const satelliteFragmentShader = `
precision highp float;

struct Light {
  vec3 position;
  vec3 color;
  float intensity;
};

uniform vec3 baseColor;
uniform float metalness;
uniform float roughness;
uniform float maxEmissiveIntensity;
uniform float uDynamicAmbientIntensity;
uniform float uShadowFactor; // Precalculated shadow factor (0.0 = full shadow, 1.0 = fully lit)
uniform float uEmissiveIntensity; // Calculated emissive intensity
uniform vec3 uEmissiveColor; // Emissive color

uniform Light uLights[MAX_LIGHTS];
uniform int uNumLights;

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec3 vViewDirection;

void main() {
  vec3 normal = normalize(vWorldNormal);
  vec3 viewDir = normalize(vViewDirection);
  
  // Start with ambient lighting - also affected by shadow factor
  vec3 ambient = baseColor * uDynamicAmbientIntensity * uShadowFactor;
  
  // Calculate lighting from all light sources
  vec3 totalDiffuse = vec3(0.0);
  vec3 totalSpecular = vec3(0.0);
  
  for (int i = 0; i < MAX_LIGHTS; i++) {
    if (i >= uNumLights) break;
    
    Light light = uLights[i];
    if (light.intensity <= 0.0) continue;
    
    vec3 lightDir = normalize(light.position - vWorldPosition);
    
    // Apply shadow factor to light intensity
    float effectiveIntensity = light.intensity * uShadowFactor;
    
    // Diffuse lighting
    float diff = max(dot(normal, lightDir), 0.0);
    totalDiffuse += light.color * diff * effectiveIntensity;
    
    // Specular lighting (Blinn-Phong)
    vec3 halfwayDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(normal, halfwayDir), 0.0), 32.0);
    totalSpecular += light.color * spec * effectiveIntensity * 0.3;
  }
  
  // Combine lighting components
  vec3 diffuse = baseColor * totalDiffuse;
  vec3 specular = totalSpecular;
  
  // Add emissive lighting
  vec3 emissive = uEmissiveColor * uEmissiveIntensity;
  
  // Final color
  vec3 finalColor = ambient + diffuse + specular + emissive;
  
  // Apply gamma correction
  finalColor = pow(finalColor, vec3(1.0 / 2.2));
  
  gl_FragColor = vec4(finalColor, 1.0);
}
`;

/**
 * Custom shader material for satellite rendering that integrates with our engine's lighting system
 */
export class SatelliteMaterial extends THREE.ShaderMaterial {
  private maxEmissiveIntensity: number;
  private currentNumLights: number = 0;

  constructor(options: SatelliteMaterialOptions = {}) {
    const baseColor = options.color ?? new THREE.Color(0xdddddd);
    const metalness = options.metalness ?? 0.7;
    const roughness = options.roughness ?? 0.3;
    const maxEmissiveIntensity = options.maxEmissiveIntensity ?? 0.6;

    super({
      uniforms: {
        baseColor: { value: baseColor },
        metalness: { value: metalness },
        roughness: { value: roughness },
        maxEmissiveIntensity: { value: maxEmissiveIntensity },
        uDynamicAmbientIntensity: { value: 1.0 },
        uShadowFactor: { value: 1.0 },
        uEmissiveIntensity: { value: 0.0 },
        uEmissiveColor: { value: new THREE.Color(0x111111) },
        uLights: { value: LightArrayUtils.createLightSourceArray(4) },
        uNumLights: { value: 0 },
      },
      defines: {
        MAX_LIGHTS: 4,
      },
      vertexShader: satelliteVertexShader,
      fragmentShader: satelliteFragmentShader,
      side: THREE.FrontSide,
      transparent: false,
      depthWrite: true,
      depthTest: true,
    });

    this.maxEmissiveIntensity = maxEmissiveIntensity;
  }

  /**
   * Updates the material with current lighting information
   * This ensures the material responds to changes in light sources
   */
  update(
    satellitePosition: THREE.Vector3,
    lightSources: LightSourcesMap,
    shadowCasters?: { position: THREE.Vector3; radius: number }[],
  ): void {
    const numLights = Math.min(lightSources.size, 4);

    // Resize light arrays if needed
    if (numLights !== this.currentNumLights) {
      this.uniforms.uLights.value = LightArrayUtils.createLightSourceArray(4);
      this.currentNumLights = numLights;
    }

    this.uniforms.uNumLights.value = numLights;

    // Update light uniforms
    let i = 0;
    for (const lightData of lightSources.values()) {
      if (i >= 4) break; // Max 4 lights

      this.uniforms.uLights.value[i].position.copy(lightData.position);
      this.uniforms.uLights.value[i].color.copy(lightData.color);
      this.uniforms.uLights.value[i].intensity = lightData.intensity ?? 1.0;
      i++;
    }

    // Calculate shadow factor (0.0 = full shadow, 1.0 = fully lit)
    let shadowFactor = 1.0;

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
            shadowFactor = Math.min(shadowFactor, shadowIntensity * 0.5);
          }
        }
      }
    }

    this.uniforms.uShadowFactor.value = shadowFactor;

    // Calculate emissive intensity based on lighting conditions
    // When in shadow, increase emissive to maintain visibility
    // When fully lit, reduce emissive to avoid over-brightness
    let emissiveIntensity = 0.0;

    if (shadowFactor < 0.3) {
      // In deep shadow - strong emissive for visibility
      emissiveIntensity =
        this.maxEmissiveIntensity * (1.0 - shadowFactor) * 1.5;
    } else if (shadowFactor < 0.7) {
      // In partial shadow - moderate emissive
      emissiveIntensity =
        this.maxEmissiveIntensity * (1.0 - shadowFactor) * 0.8;
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
