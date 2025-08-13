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
 * Material for Post-AGB stars
 * - Temperature: 5,000-30,000 K
 * - Color: White to blue-white
 * - Typical mass: 0.6-10 M☉
 * - Hot central star of planetary nebula
 * - Contracted from AGB phase
 * - Very hot and luminous
 * - Examples: Central stars of planetary nebulae
 */
export class PostAGBMaterial extends EnhancedStarMaterial {
  constructor(object: RenderableCelestialObject) {
    // Post-AGB stars are hot and contracted
    const postAGBDefaults = {
      // Basic effects - hot and contracted
      noiseScale: 0.6, // Small scale due to contraction
      noiseIntensity: 0.6, // High intensity due to heat
      plasmaTurbulence: 0.3, // Moderate turbulence
      lightingIntensity: 1.5, // Very bright due to high temperature
    };

    super(object, new THREE.Color(0xffffff), postAGBDefaults);
  }

  /**
   * Update for post-AGB stars with high temperature effects
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

    // High temperature effect (post-AGB stars are very hot)
    const temperaturePhase = Math.sin(time * 0.0005) * 0.2 + 0.8;
    this.uniforms.uLightingIntensity.value = 1.5 * temperaturePhase;
  }
}

/**
 * Renderer for Post-AGB stars
 * - Creates hot, bright coronas
 * - Shows high temperature effects
 * - Small size but very luminous
 */
export class PostAGBRenderer extends BaseStarRenderer<PostAGBMaterial> {
  private postAGBMaterial: PostAGBMaterial | null = null;

  constructor(
    object: RenderableCelestialObject,
    options: BaseCelestialRendererOptions = {},
  ) {
    super(object, options);
  }

  /**
   * Create material for post-AGB stars
   */
  protected createMaterial(object: RenderableCelestialObject): PostAGBMaterial {
    if (!this.postAGBMaterial) {
      this.postAGBMaterial = new PostAGBMaterial(object);
    }
    return this.postAGBMaterial;
  }

  /**
   * Get custom LOD levels for post-AGB stars
   */
  protected getCustomLODs(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    const levels: LODLevel[] = [];
    const material = this.createAndRegisterMaterial(object);

    // High detail level (LOD 0) - Full post-AGB star with bright corona
    const highDetailGroup = new THREE.Group();
    highDetailGroup.name = `${object.id}-post-agb-high`;

    // Create main star body
    const starSegments = GeometryUtilities.getOptimizedStarSegments("high", 64);
    const starGeometry = new THREE.SphereGeometry(
      1,
      starSegments,
      starSegments,
    );
    const starMesh = new THREE.Mesh(starGeometry, material);
    starMesh.name = `${object.id}-post-agb-body`;
    highDetailGroup.add(starMesh);

    // Create bright corona system for post-AGB stars
    this._createBrightCorona(object, highDetailGroup);

    levels.push({ object: highDetailGroup, distance: 0 });

    // Medium detail level (LOD 1) - Simplified post-AGB star
    const mediumDetailGroup = new THREE.Group();
    mediumDetailGroup.name = `${object.id}-post-agb-medium`;

    const mediumStarMesh = new THREE.Mesh(starGeometry, material);
    mediumDetailGroup.add(mediumStarMesh);

    // Basic corona
    this._addCoronaToGroup(object, mediumDetailGroup);

    levels.push({ object: mediumDetailGroup, distance: 1500 });

    return levels;
  }

  protected getBillboardLODDistance(object: RenderableCelestialObject): number {
    // Post-AGB stars are very bright
    return object.radius * 4000;
  }

  /**
   * Get star color for post-AGB stars (typically white to blue-white)
   */
  protected getStarColor(object: RenderableCelestialObject): THREE.Color {
    // Post-AGB stars are typically white to blue-white
    return new THREE.Color(0xffffff); // White
  }

  /**
   * Create bright corona for post-AGB stars
   */
  private _createBrightCorona(
    object: RenderableCelestialObject,
    group: THREE.Group,
  ): void {
    const starColor = this.getStarColor(object);

    // Create 3 bright corona layers for post-AGB stars
    const coronaLayers = [
      { scale: 1.2, opacity: 0.2, pulseSpeed: 0.1 },
      { scale: 1.6, opacity: 0.15, pulseSpeed: 0.12 },
      { scale: 2.2, opacity: 0.1, pulseSpeed: 0.14 },
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

      // Create bright corona material
      const coronaMaterial = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uStarColor: { value: starColor },
          uOpacity: { value: layer.opacity },
          uPulseSpeed: { value: layer.pulseSpeed },
          uNoiseScale: { value: 1.0 + index * 0.3 },
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
            for(int i = 0; i < 4; i++) {
              f += amp * noise(p);
              p *= 2.0;
              amp *= 0.5;
            }
            return f;
          }
          
          void main() {
            vec2 centeredUV = vUv * 2.0 - 1.0;
            float dist = length(centeredUV);
            
            // Post-AGB corona effects
            float basePattern = fbm((centeredUV * 0.5 + 0.5) * uNoiseScale + uTime * 0.02);
            float detailPattern = fbm((centeredUV * 1.2 + 0.5) * uNoiseScale * 2.0 + uTime * 0.04);
            float pattern = basePattern * 0.7 + detailPattern * 0.3;
            
            // Fast pulsation for post-AGB stars
            float pulse = 0.8 + sin(uTime * uPulseSpeed) * 0.2;
            
            // Edge fading
            float edgeFade = 1.0 - smoothstep(0.8, 1.1, dist);
            
            float alpha = edgeFade * uOpacity * pulse;
            alpha *= (0.6 + pattern * 0.4);
            
            // Post-AGB color variation (very hot)
            vec3 innerColor = uStarColor * 1.5;
            vec3 outerColor = mix(uStarColor * 1.0, vec3(0.8, 0.9, 1.0), 0.3);
            vec3 finalColor = mix(innerColor, outerColor, smoothstep(0.0, 1.0, dist));
            
            gl_FragColor = vec4(finalColor, alpha);
          }
        `,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: true,
        blending: THREE.AdditiveBlending,
      });

      const coronaMesh = new THREE.Mesh(coronaGeometry, coronaMaterial);
      coronaMesh.name = `${object.id}-post-agb-corona-${index}`;
      group.add(coronaMesh);

      // Store material for updates
      if (!this.coronaMaterials.has(object.id)) {
        this.coronaMaterials.set(object.id, []);
      }
      this.coronaMaterials.get(object.id)!.push(coronaMaterial as any);
    });
  }

  /**
   * Enhanced update for post-AGB stars
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

    // Update post-AGB material
    if (this.postAGBMaterial) {
      this.postAGBMaterial.update(
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
   * Dispose of post-AGB-specific resources
   */
  dispose(): void {
    if (this.postAGBMaterial) {
      this.postAGBMaterial.dispose();
      this.postAGBMaterial = null;
    }
    super.dispose();
  }
}
