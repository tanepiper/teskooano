import * as THREE from "three";
import type { CelestialObject, StarProperties } from "@teskooano/data-types";
import { CelestialRenderer, LODLevel } from "../index";
import { SCALE } from "@teskooano/data-types";
import type { CelestialMeshOptions } from "../common/CelestialRenderer";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";

/**
 * Vertex shader for stars
 */
export const starVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * Fragment shader for stars with corona effect
 */
export const starFragmentShader = `
  uniform float time;
  uniform vec3 starColor;
  uniform float coronaIntensity;
  uniform float pulseSpeed;
  uniform float glowIntensity;
  uniform float temperatureVariation;
  uniform float metallicEffect;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  // Noise function for corona effect
  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }
  
  // Turbulence function for more realistic sun surface
  float turbulence(vec2 p) {
    float t = 0.0;
    float f = 1.0;
    for(int i = 0; i < 4; i++) {
      t += abs(noise(p * f) / f);
      f *= 2.0;
      p = p * 1.4 + vec2(3.2, 1.7);
    }
    return t;
  }
  
  // Metallic fluid effect
  vec3 metallicFluid(vec2 uv, float time) {
    // Enhanced flowing patterns with multi-layered movement
    float flowSpeed = time * 0.1; // Slowed down for more subtle movement
    
    // Create primary wave movement
    vec2 flowUv = uv + vec2(
      sin(uv.y * 8.0 + flowSpeed) * 0.05 + cos(uv.x * 4.0 + flowSpeed * 0.7) * 0.03,
      cos(uv.x * 6.0 + flowSpeed * 0.8) * 0.05 + sin(uv.y * 5.0 + flowSpeed * 0.9) * 0.03
    );
    
    // Create secondary smaller scale movement
    flowUv += vec2(
      sin(uv.y * 20.0 + flowSpeed * 1.2) * 0.02,
      cos(uv.x * 15.0 + flowSpeed * 1.1) * 0.02
    );
    
    // Multiple layers of turbulence at different scales
    float largeScaleTurbulence = turbulence(flowUv * 1.5 + vec2(0.0, flowSpeed * 0.5));
    float smallScaleTurbulence = turbulence(flowUv * 3.0 + vec2(flowSpeed * 0.3, 0.0));
    float microTurbulence = turbulence(flowUv * 6.0 - vec2(flowSpeed * 0.2, flowSpeed * 0.1));
    
    // Combine turbulence layers
    float combinedTurbulence = largeScaleTurbulence * 0.5 + smallScaleTurbulence * 0.3 + microTurbulence * 0.2;
    
    // More detailed color variation
    vec3 highlight = mix(starColor * 1.3, vec3(1.0, 1.0, 0.9), 0.35);
    vec3 midtone = mix(starColor * 1.1, vec3(1.0, 0.9, 0.5), 0.2);
    vec3 shadow = mix(starColor * 0.8, vec3(0.9, 0.7, 0.3), 0.15);
    
    // Create cell-like patterns with soft edges
    float cellPattern = smoothstep(0.4, 0.6, combinedTurbulence);
    
    // Mix colors for a more dynamic liquid metal look
    vec3 metalColor = mix(shadow, midtone, smoothstep(0.3, 0.5, combinedTurbulence));
    metalColor = mix(metalColor, highlight, smoothstep(0.6, 0.8, combinedTurbulence));
    
    return metalColor;
  }
  
  void main() {
    // Base star color
    vec3 color = starColor;
    
    // Calculate distance from center for limb darkening
    float dist = length(vPosition);
    
    // Surface detail with turbulence - enhanced for better visibility
    float turb = turbulence(vUv * 3.0 + time * 0.1);
    // Make surface detail more visible at all distances
    float surfaceDetail = smoothstep(0.2, 0.7, turb);
    
    // Modified view direction calculation that works at all distances
    vec3 viewDir = normalize(cameraPosition - vPosition);
    float viewDot = dot(normalize(vNormal), viewDir);
    
    // Greatly reduced view angle influence to maintain texture visibility
    // Now ranges from 0.8 to 1.0 to ensure texture is always visible
    float limbFactor = 0.8 + 0.2 * viewDot;
    
    // Corona effect that's consistent at all distances
    float corona = min(1.0, 1.3 - smoothstep(0.5, 1.0, dist));
    
    // Pulsing with slightly more variation
    float pulse = sin(time * pulseSpeed) * 0.08 + 0.92;
    
    // More pronounced temperature variation
    float tempVar = sin(time * 0.15 + turb * 3.0) * temperatureVariation * 1.2;
    vec3 finalColor = mix(color, color * (1.0 + tempVar), surfaceDetail);
    
    // Apply metallic liquid effect - significantly more pronounced
    vec3 metalColor = metallicFluid(vUv, time);
    // Increase metallic effect to ensure texture visibility
    finalColor = mix(finalColor, metalColor, metallicEffect * 1.5 * surfaceDetail * pulse);
    
    // Apply very mild limb darkening - just enough for 3D appearance but not enough to hide texture
    finalColor = mix(finalColor * 0.9, finalColor * 1.2, limbFactor);
    
    // Ensure high minimum brightness
    finalColor = max(finalColor, color * 0.75);
    
    // Combine with corona - more pronounced
    finalColor = mix(finalColor, vec3(1.0, 0.9, 0.7), corona * coronaIntensity * 0.8);
    
    // Add stronger outer glow with less distance falloff
    float glow = 1.0 - smoothstep(0.4, 1.3, dist);
    glow = pow(glow, 1.2); // Even less steep falloff
    finalColor += color * glow * glowIntensity * 1.0;
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

/**
 * Fragment shader for corona effect
 */
export const coronaFragmentShader = `
  uniform float time;
  uniform vec3 starColor;
  uniform float opacity;
  uniform float pulseSpeed;
  uniform float noiseScale;
  
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }
  
  float fbm(vec2 p) {
    float sum = 0.0;
    float amp = 1.0;
    float freq = 1.0;
    for(int i = 0; i < 4; i++) {
      sum += noise(p * freq) * amp;
      amp *= 0.5;
      freq *= 2.0;
      p = p * 1.1 + vec2(0.5, 0.8);
    }
    return sum;
  }
  
  void main() {
    // For billboard planes, use UV coordinates for radial gradient
    vec2 centeredUV = vUv * 2.0 - 1.0;
    float dist = length(centeredUV);
    
    // Improved radial gradient with slower falloff
    float edgeFade = smoothstep(0.8, 1.05, dist);
    
    // Enhanced noise pattern with multiple layers
    float basePattern = fbm((centeredUV * 0.5 + 0.5) * noiseScale + time * 0.03);
    float detailPattern = fbm((centeredUV * 1.2 + 0.5) * noiseScale * 2.0 + time * 0.05);
    float pattern = basePattern * 0.7 + detailPattern * 0.3;
    
    // More pronounced pulsing
    float pulse = 0.9 + sin(time * pulseSpeed) * 0.1;
    
    // Stronger alpha that maintains visibility
    float alpha = (1.0 - edgeFade) * opacity * pulse * 1.2;
    
    // Use noise to create more varied corona
    alpha *= (0.6 + pattern * 0.4);
    
    // Ensure minimum opacity for better visibility
    alpha = max(alpha, 0.05 * opacity * (1.0 - edgeFade));
    
    // Enhanced color gradient with more saturation
    vec3 innerColor = mix(starColor * 1.3, vec3(1.0, 0.95, 0.8), 0.15);
    vec3 outerColor = mix(starColor * 0.9, vec3(1.0, 0.8, 0.5), 0.25);
    vec3 finalColor = mix(innerColor, outerColor, smoothstep(0.0, 0.75, dist));
    
    // Add subtle color variation based on noise
    finalColor = mix(finalColor, finalColor * (1.0 + pattern * 0.3), 0.4);
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

/**
 * Base material for stars with shader effects
 */
export abstract class BaseStarMaterial extends THREE.ShaderMaterial {
  constructor(
    color: THREE.Color = new THREE.Color(0xffff00),
    options: {
      coronaIntensity?: number;
      pulseSpeed?: number;
      glowIntensity?: number;
      temperatureVariation?: number;
      metallicEffect?: number;
    } = {},
  ) {
    super({
      uniforms: {
        time: { value: 0 },
        starColor: { value: color },
        coronaIntensity: { value: options.coronaIntensity ?? 0.3 },
        pulseSpeed: { value: options.pulseSpeed ?? 0.5 },
        glowIntensity: { value: options.glowIntensity ?? 0.4 },
        temperatureVariation: { value: options.temperatureVariation ?? 0.1 },
        metallicEffect: { value: options.metallicEffect ?? 0.6 },
      },
      vertexShader: starVertexShader,
      fragmentShader: starFragmentShader,
      transparent: true,
      side: THREE.FrontSide,
    });
  }

  /**
   * Update the material with the current time
   */
  update(time: number): void {
    this.uniforms.time.value = time;
  }

  /**
   * Dispose of any resources
   */
  dispose(): void {
    // No textures to dispose in this material by default
    // Child classes can override if needed
  }
}

/**
 * Material for corona effect around stars
 */
export class CoronaMaterial extends THREE.ShaderMaterial {
  constructor(
    color: THREE.Color = new THREE.Color(0xffff00),
    options: {
      scale?: number;
      opacity?: number;
      pulseSpeed?: number;
      noiseScale?: number;
    } = {},
  ) {
    super({
      uniforms: {
        time: { value: 0 },
        starColor: { value: color },
        opacity: { value: options.opacity ?? 0.6 },
        pulseSpeed: { value: options.pulseSpeed ?? 0.3 },
        noiseScale: { value: options.noiseScale ?? 3.0 },
      },
      vertexShader: starVertexShader,
      fragmentShader: coronaFragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }

  /**
   * Update the material with the current time
   */
  update(time: number): void {
    this.uniforms.time.value = time;
  }

  /**
   * Dispose of any resources
   */
  dispose(): void {
    // No textures to dispose in this material
  }
}

/**
 * Abstract base class for star renderers, implementing the LOD system.
 */
export abstract class BaseStarRenderer implements CelestialRenderer {
  protected materials: Map<string, BaseStarMaterial> = new Map();
  protected coronaMaterials: Map<string, CoronaMaterial[]> = new Map();
  protected startTime: number = Date.now() / 1000;
  protected elapsedTime: number = 0;

  /**
   * Creates and returns an array of LOD levels for the star object.
   */
  getLODLevels(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    const scale = typeof SCALE === "number" ? SCALE : 1;

    // --- Level 0: High Detail (Star Mesh) ---
    const highDetailGroup = this._createHighDetailGroup(object, options);
    const level0: LODLevel = { object: highDetailGroup, distance: 0 };

    // --- Level 1: Medium Detail (Simplified Material/Geometry?) ---
    const mediumDetailGroup = this._createHighDetailGroup(object, {
      ...options,
      segments: 32,
    });
    mediumDetailGroup.name = `${object.celestialObjectId}-medium-lod`;
    const level1: LODLevel = {
      object: mediumDetailGroup,
      distance: 200 * scale,
    };

    // --- Level 2: Low Detail (Billboard/Sprite?) ---
    const lowDetailMesh = new THREE.Mesh(
      new THREE.SphereGeometry(object.radius * 0.8, 8, 8),
      new THREE.MeshBasicMaterial({ color: this.getStarColor(object) }),
    );
    lowDetailMesh.name = `${object.celestialObjectId}-low-lod`;
    const level2Group = new THREE.Group();
    level2Group.add(lowDetailMesh);
    const level2: LODLevel = { object: level2Group, distance: 1500 * scale };

    return [level0, level1, level2];
  }

  /**
   * Helper to create the high-detail group (Level 0 LOD).
   * Contains the logic previously in createMesh.
   * @internal
   */
  protected _createHighDetailGroup(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): THREE.Group {
    const group = new THREE.Group();
    group.name = `${object.celestialObjectId}-high-lod-group`;

    // Set position and rotation (LOD object itself should handle this ideally)
    // But setting it here ensures the group content is positioned correctly initially.
    // group.position.set(object.position.x, object.position.y, object.position.z);
    // group.quaternion.set(object.rotation.x, object.rotation.y, object.rotation.z, object.rotation.w);

    const segments = options?.detailLevel === "high" ? 64 : 48;
    const geometry = new THREE.SphereGeometry(
      object.radius,
      segments,
      segments,
    );
    const material = this.getMaterial(object);
    this.materials.set(object.celestialObjectId, material);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `${object.celestialObjectId}-body`;
    group.add(mesh);
    this.addCorona(object, group);
    return group;
  }

  /**
   * Add corona effect to the star
   */
  protected addCorona(
    object: RenderableCelestialObject,
    group: THREE.Group,
  ): void {
    const starColor = this.getStarColor(object);
    const coronaMaterials: CoronaMaterial[] = [];

    this.coronaMaterials.set(object.celestialObjectId, coronaMaterials);

    const coronaScales = [1.1, 1.2];
    const opacities = [0.1, 0.05];

    coronaScales.forEach((scale, index) => {
      const coronaRadius = object.radius * scale;
      const coronaGeometry = new THREE.SphereGeometry(coronaRadius, 24, 24);
      const coronaMaterial = new CoronaMaterial(starColor, {
        scale: scale,
        opacity: opacities[index],
        pulseSpeed: 0.12 + index * 0.03,
        noiseScale: 1.2 + index * 0.3,
      });
      coronaMaterials.push(coronaMaterial);
      const coronaMesh = new THREE.Mesh(coronaGeometry, coronaMaterial);
      coronaMesh.name = `${object.celestialObjectId}-corona-${index}`;
      coronaMesh.material.depthWrite = false;
      coronaMesh.material.side = THREE.DoubleSide;
      group.add(coronaMesh);
    });
  }

  /**
   * Get the appropriate material for the star type
   * Subclasses must implement this
   */
  protected abstract getMaterial(
    object: RenderableCelestialObject,
  ): BaseStarMaterial;

  /**
   * Update the renderer with the current time
   */
  update(time?: number): void {
    if (time === undefined) {
      this.elapsedTime = Date.now() / 1000 - this.startTime;
    } else {
      this.elapsedTime = time;
    }

    // Update all materials
    this.materials.forEach((material) => {
      material.update(this.elapsedTime);
    });

    // Update all corona materials
    this.coronaMaterials.forEach((materials) => {
      materials.forEach((material) => {
        material.update(this.elapsedTime);
      });
    });
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    // Dispose materials
    this.materials.forEach((material) => {
      material.dispose();
    });

    // Dispose corona materials
    this.coronaMaterials.forEach((materials) => {
      materials.forEach((material) => {
        material.dispose();
      });
    });

    // Clear maps
    this.materials.clear();
    this.coronaMaterials.clear();
  }

  /**
   * Get the primary color for the star based on its properties
   * Subclasses can override this for specific star types
   */
  protected getStarColor(object: RenderableCelestialObject): THREE.Color {
    const starProps = object.properties as StarProperties;
    // Default color based on spectral class or generic white
    if (starProps?.color) {
      return new THREE.Color(starProps.color);
    }

    // Determine color based on spectral class if available
    if (starProps?.spectralClass) {
      switch (starProps.spectralClass.toUpperCase()) {
        case "O":
          return new THREE.Color(0x9bb0ff); // Blue
        case "B":
          return new THREE.Color(0xaabfff); // Bluish white
        case "A":
          return new THREE.Color(0xf8f7ff); // White
        case "F":
          return new THREE.Color(0xfff4ea); // Yellowish white
        case "G":
          return new THREE.Color(0xffcc00); // Yellow (Sun-like)
        case "K":
          return new THREE.Color(0xffaa55); // Light orange
        case "M":
          return new THREE.Color(0xff6644); // Light orangish red
      }
    }

    // Default yellow color if no spectral class specified
    return new THREE.Color(0xffcc00);
  }
}
