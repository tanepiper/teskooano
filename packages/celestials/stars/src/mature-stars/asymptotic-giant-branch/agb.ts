import * as THREE from "three";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import { BaseStarRenderer } from "../../base/base-star";
import { EnhancedStarMaterial } from "../../materials/enhanced-star.material";
import type { LODLevel } from "@teskooano/renderer-threejs-lod";
import {
  BaseCelestialRendererOptions,
  CelestialMeshOptions,
  LightSourcesMap,
  GeometryUtilities,
} from "@teskooano/renderer-threejs-celestial";

/**
 * Material for Asymptotic Giant Branch (AGB) stars
 * - Temperature: 2,500-4,500 K
 * - Color: Red to orange
 * - Typical mass: 0.6-10 M☉
 * - Carbon and oxygen core
 * - Helium and hydrogen shell burning
 * - Strong mass loss
 * - Examples: Mira variables, carbon stars
 */
export class AGBMaterial extends EnhancedStarMaterial {
  constructor(object: RenderableCelestialObject) {
    // AGB stars have complex shell burning and mass loss
    const agbDefaults = {
      // Basic effects - complex shell burning
      noiseScale: 1.5, // Large scale due to size
      noiseIntensity: 0.5, // High intensity due to shell burning
      plasmaTurbulence: 0.4, // High turbulence due to mass loss
      lightingIntensity: 0.9, // Moderate due to cool temperature
    };

    super(object, new THREE.Color(0xff5533), agbDefaults);
  }

  /**
   * Update for AGB stars with shell burning and mass loss effects
   */
  update(
    time: number,
    timeScale: number,
    lightSources: LightSourcesMap,
    camera: THREE.PerspectiveCamera,
    allObjects?: Record<string, RenderableCelestialObject>,
    allMeshes?: Record<string, THREE.Object3D>,
  ): void {
    super.update(time, timeScale, lightSources, camera, allObjects, allMeshes);

    // Shell burning effect (AGB stars have multiple shell burning)
    const shellPhase = Math.sin(time * 0.0001) * 0.3 + 0.7;
    this.uniforms.uNoiseIntensity.value = 0.5 * shellPhase;

    // Mass loss effect
    const massLossPhase = Math.sin(time * 0.0002) * 0.2 + 0.8;
    this.uniforms.uPlasmaTurbulence.value = 0.4 * massLossPhase;
  }
}

/**
 * Renderer for Asymptotic Giant Branch stars
 * - Creates complex coronas with mass loss
 * - Shows shell burning effects
 * - Large size with strong mass loss
 */
export class AGBRenderer extends BaseStarRenderer<AGBMaterial> {
  private agbMaterial: AGBMaterial | null = null;

  constructor(
    object: RenderableCelestialObject,
    options: BaseCelestialRendererOptions = {},
  ) {
    super(object, options);
  }

  /**
   * Create material for AGB stars
   */
  protected createMaterial(object: RenderableCelestialObject): AGBMaterial {
    if (!this.agbMaterial) {
      this.agbMaterial = new AGBMaterial(object);
    }
    return this.agbMaterial;
  }

  /**
   * Get custom LOD levels for AGB stars
   */
  protected getCustomLODs(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    const levels: LODLevel[] = [];
    const material = this.createAndRegisterMaterial(object);

    // High detail level (LOD 0) - Full AGB star with complex corona
    const highDetailGroup = new THREE.Group();
    highDetailGroup.name = `${object.id}-agb-high`;

    // Create main star body
    const starSegments = GeometryUtilities.getOptimizedStarSegments("high", 64);
    const starGeometry = new THREE.SphereGeometry(
      1,
      starSegments,
      starSegments,
    );
    const starMesh = new THREE.Mesh(starGeometry, material);
    starMesh.name = `${object.id}-agb-body`;
    highDetailGroup.add(starMesh);

    // Create complex corona system for AGB stars
    this._createComplexCorona(object, highDetailGroup);

    levels.push({ object: highDetailGroup, distance: 0 });

    // Medium detail level (LOD 1) - Simplified AGB star
    const mediumDetailGroup = new THREE.Group();
    mediumDetailGroup.name = `${object.id}-agb-medium`;

    const mediumStarMesh = new THREE.Mesh(starGeometry, material);
    mediumDetailGroup.add(mediumStarMesh);

    // Simplified corona
    this._addCoronaToGroup(object, mediumDetailGroup);

    levels.push({ object: mediumDetailGroup, distance: 2000 });

    return levels;
  }

  protected getBillboardLODDistance(object: RenderableCelestialObject): number {
    // AGB stars are very bright and large
    return object.radius * 5000;
  }

  /**
   * Get star color for AGB stars (typically red to orange)
   */
  protected getStarColor(object: RenderableCelestialObject): THREE.Color {
    // AGB stars are typically red to orange
    return new THREE.Color(0xff5533); // Red-orange
  }

  /**
   * Create complex corona for AGB stars with mass loss
   */
  private _createComplexCorona(
    object: RenderableCelestialObject,
    group: THREE.Group,
  ): void {
    const starColor = this.getStarColor(object);

    // Create 5 corona layers for AGB stars with mass loss
    const coronaLayers = [
      { scale: 1.4, opacity: 0.15, pulseSpeed: 0.06 },
      { scale: 2.0, opacity: 0.12, pulseSpeed: 0.08 },
      { scale: 3.0, opacity: 0.1, pulseSpeed: 0.1 },
      { scale: 4.5, opacity: 0.08, pulseSpeed: 0.12 },
      { scale: 7.0, opacity: 0.06, pulseSpeed: 0.14 },
    ];

    coronaLayers.forEach((layer, index) => {
      const coronaRadius = object.radius * layer.scale;
      const coronaSegments = GeometryUtilities.getOptimizedStarSegments(
        "medium",
        32,
      );
      const coronaGeometry = new THREE.SphereGeometry(
        coronaRadius,
        coronaSegments,
        coronaSegments,
      );

      // Create corona material with mass loss effects
      const coronaMaterial = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uStarColor: { value: starColor },
          uOpacity: { value: layer.opacity },
          uPulseSpeed: { value: layer.pulseSpeed },
          uNoiseScale: { value: 2.0 + index * 0.5 },
        },
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vNormal;
          varying vec3 vPosition;
          
          void main() {
            vUv = uv;
            vNormal = normalize(normalMatrix * normal);
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform vec3 uStarColor;
          uniform float uOpacity;
          uniform float uPulseSpeed;
          uniform float uNoiseScale;
          
          varying vec2 vUv;
          varying vec3 vNormal;
          varying vec3 vPosition;
          
          float noise(vec2 p) {
            return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
          }
          
          float fbm(vec2 p) {
            float f = 0.0;
            float amp = 1.0;
            for(int i = 0; i < 5; i++) {
              f += amp * noise(p);
              p *= 2.0;
              amp *= 0.5;
            }
            return f;
          }
          
          void main() {
            vec2 centeredUV = vUv * 2.0 - 1.0;
            float dist = length(centeredUV);
            
            // AGB corona effects with mass loss
            float basePattern = fbm((centeredUV * 0.5 + 0.5) * uNoiseScale + uTime * 0.008);
            float detailPattern = fbm((centeredUV * 1.5 + 0.5) * uNoiseScale * 3.0 + uTime * 0.015);
            float pattern = basePattern * 0.6 + detailPattern * 0.4;
            
            // Slow pulsation for AGB stars
            float pulse = 0.7 + sin(uTime * uPulseSpeed) * 0.3;
            
            // Edge fading
            float edgeFade = 1.0 - smoothstep(0.6, 1.2, dist);
            
            // Mass loss streaming effects
            float streams = sin(atan(centeredUV.y, centeredUV.x) * 8.0 + uTime * 0.05) * 0.5 + 0.5;
            
            float alpha = edgeFade * uOpacity * pulse;
            alpha *= (0.4 + pattern * 0.6 + streams * 0.3);
            
            // AGB color variation
            vec3 innerColor = uStarColor * 1.3;
            vec3 outerColor = mix(uStarColor * 0.7, vec3(1.0, 0.3, 0.1), 0.4);
            vec3 finalColor = mix(innerColor, outerColor, smoothstep(0.0, 1.0, dist));
            
            // Add streaming effects
            finalColor = mix(finalColor, finalColor * (1.0 + streams * 0.4), 0.2);
            
            gl_FragColor = vec4(finalColor, alpha);
          }
        `,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: true,
        blending: THREE.AdditiveBlending,
      });

      const coronaMesh = new THREE.Mesh(coronaGeometry, coronaMaterial);
      coronaMesh.name = `${object.id}-agb-corona-${index}`;
      group.add(coronaMesh);

      // Store material for updates
      if (!this.coronaMaterials.has(object.id)) {
        this.coronaMaterials.set(object.id, []);
      }
      this.coronaMaterials.get(object.id)!.push(coronaMaterial as any);
    });
  }

  /**
   * Enhanced update for AGB stars
   */
  update(
    object: RenderableCelestialObject,
    time: number,
    timeScale: number,
    lightSources: LightSourcesMap,
    camera: THREE.PerspectiveCamera,
    allObjects?: Record<string, RenderableCelestialObject>,
    allMeshes?: Record<string, THREE.Object3D>,
  ): void {
    super.update(
      object,
      time,
      timeScale,
      lightSources,
      camera,
      allObjects,
      allMeshes,
    );

    // Update AGB material
    if (this.agbMaterial) {
      this.agbMaterial.update(
        time,
        timeScale,
        lightSources,
        camera,
        allObjects,
        allMeshes,
      );
    }

    // Update corona materials
    const coronaMaterials = this.coronaMaterials.get(object.id);
    if (coronaMaterials) {
      coronaMaterials.forEach((material) => {
        if (material.uniforms && material.uniforms.uTime) {
          // Create a much smaller time scale for visible animation cycles
          // Use a very small scale to create fast, visible animation cycles
          const animationTime = ((time * timeScale) / 1000) * 0.001; // Scale down much more for faster animation
          material.uniforms.uTime.value = animationTime;
        }
      });
    }
  }

  /**
   * Dispose of AGB-specific resources
   */
  dispose(): void {
    if (this.agbMaterial) {
      this.agbMaterial.dispose();
      this.agbMaterial = null;
    }
    super.dispose();
  }
}
