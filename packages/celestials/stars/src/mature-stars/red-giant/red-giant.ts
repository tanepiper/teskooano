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
 * Material for Red Giant stars
 * - Temperature: 3,000-5,000 K
 * - Color: Red to orange
 * - Typical mass: 0.6-10 M☉
 * - Hydrogen shell burning
 * - Large size and low density
 * - Convective envelope
 * - Examples: Aldebaran, Arcturus
 */
export class RedGiantMaterial extends EnhancedStarMaterial {
  constructor(object: RenderableCelestialObject) {
    // Red giants have expanded, cooler characteristics
    const redGiantDefaults = {
      // Basic effects - expanded and cooler
      noiseScale: 0.8, // Larger scale due to size
      noiseIntensity: 0.4, // More visible due to size
      plasmaTurbulence: 0.3, // Moderate turbulence
      lightingIntensity: 0.8, // Cooler, less intense
    };

    super(object, new THREE.Color(0xff6644), redGiantDefaults);
  }

  /**
   * Update for red giants with convective envelope effects
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

    // Convective envelope effect (red giants have large convection cells)
    const convectionPhase = Math.sin(time * 0.0002) * 0.2 + 0.8;
    this.uniforms.uNoiseIntensity.value = 0.4 * convectionPhase;
  }
}

/**
 * Renderer for Red Giant stars
 * - Creates large, cool coronas
 * - Shows convective envelope effects
 * - Large size with low surface gravity
 */
export class RedGiantRenderer extends BaseStarRenderer<RedGiantMaterial> {
  private redGiantMaterial: RedGiantMaterial | null = null;

  constructor(
    object: RenderableCelestialObject,
    options: BaseCelestialRendererOptions = {},
  ) {
    super(object, options);
  }

  /**
   * Create material for red giants
   */
  protected createMaterial(
    object: RenderableCelestialObject,
  ): RedGiantMaterial {
    if (!this.redGiantMaterial) {
      this.redGiantMaterial = new RedGiantMaterial(object);
    }
    return this.redGiantMaterial;
  }

  /**
   * Get custom LOD levels for red giants
   */
  protected getCustomLODs(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    const levels: LODLevel[] = [];
    const material = this.createAndRegisterMaterial(object);

    // High detail level (LOD 0) - Full red giant with large corona
    const highDetailGroup = new THREE.Group();
    highDetailGroup.name = `${object.celestialObjectId}-red-giant-high`;

    // Create main star body
    const starSegments = GeometryUtilities.getOptimizedStarSegments("high", 64);
    const starGeometry = new THREE.SphereGeometry(
      1,
      starSegments,
      starSegments,
    );
    const starMesh = new THREE.Mesh(starGeometry, material);
    starMesh.name = `${object.celestialObjectId}-red-giant-body`;
    highDetailGroup.add(starMesh);

    // Create large corona system for red giants
    this._createLargeCorona(object, highDetailGroup);

    levels.push({ object: highDetailGroup, distance: 0 });

    // Medium detail level (LOD 1) - Simplified red giant
    const mediumDetailGroup = new THREE.Group();
    mediumDetailGroup.name = `${object.celestialObjectId}-red-giant-medium`;

    const mediumStarMesh = new THREE.Mesh(starGeometry, material);
    mediumDetailGroup.add(mediumStarMesh);

    // Simplified corona
    this._addCoronaToGroup(object, mediumDetailGroup);

    levels.push({ object: mediumDetailGroup, distance: 2000 });

    return levels;
  }

  protected getBillboardLODDistance(object: RenderableCelestialObject): number {
    // Red giants are very bright and large
    return object.radius * 4000;
  }

  /**
   * Get star color for red giants (typically red to orange)
   */
  protected getStarColor(object: RenderableCelestialObject): THREE.Color {
    // Red giants are typically red to orange
    return new THREE.Color(0xff6644); // Red-orange
  }

  /**
   * Create large corona for red giants
   */
  private _createLargeCorona(
    object: RenderableCelestialObject,
    group: THREE.Group,
  ): void {
    const starColor = this.getStarColor(object);

    // Create 4 corona layers for red giants
    const coronaLayers = [
      { scale: 1.3, opacity: 0.12, pulseSpeed: 0.08 },
      { scale: 1.8, opacity: 0.1, pulseSpeed: 0.1 },
      { scale: 2.5, opacity: 0.08, pulseSpeed: 0.12 },
      { scale: 3.5, opacity: 0.06, pulseSpeed: 0.14 },
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

      // Create corona material
      const coronaMaterial = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uStarColor: { value: starColor },
          uOpacity: { value: layer.opacity },
          uPulseSpeed: { value: layer.pulseSpeed },
          uNoiseScale: { value: 1.5 + index * 0.3 },
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
            
            // Red giant corona effects
            float basePattern = fbm((centeredUV * 0.5 + 0.5) * uNoiseScale + uTime * 0.01);
            float detailPattern = fbm((centeredUV * 1.2 + 0.5) * uNoiseScale * 2.0 + uTime * 0.02);
            float pattern = basePattern * 0.7 + detailPattern * 0.3;
            
            // Slow pulsation for red giants
            float pulse = 0.8 + sin(uTime * uPulseSpeed) * 0.2;
            
            // Edge fading
            float edgeFade = 1.0 - smoothstep(0.7, 1.1, dist);
            
            float alpha = edgeFade * uOpacity * pulse;
            alpha *= (0.5 + pattern * 0.5);
            
            // Red giant color variation
            vec3 innerColor = uStarColor * 1.2;
            vec3 outerColor = mix(uStarColor * 0.8, vec3(1.0, 0.4, 0.2), 0.3);
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
      coronaMesh.name = `${object.celestialObjectId}-red-giant-corona-${index}`;
      group.add(coronaMesh);

      // Store material for updates
      if (!this.coronaMaterials.has(object.celestialObjectId)) {
        this.coronaMaterials.set(object.celestialObjectId, []);
      }
      this.coronaMaterials
        .get(object.celestialObjectId)!
        .push(coronaMaterial as any);
    });
  }

  /**
   * Enhanced update for red giants
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

    // Update red giant material
    if (this.redGiantMaterial) {
      this.redGiantMaterial.update(
        time,
        timeScale,
        lightSources,
        camera,
        allObjects,
        allMeshes,
      );
    }

    // Update corona materials
    const coronaMaterials = this.coronaMaterials.get(object.celestialObjectId);
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
   * Dispose of red giant-specific resources
   */
  dispose(): void {
    if (this.redGiantMaterial) {
      this.redGiantMaterial.dispose();
      this.redGiantMaterial = null;
    }
    super.dispose();
  }
}
