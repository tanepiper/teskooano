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
 * Material for Supergiant stars
 * - Temperature: 3,000-50,000 K
 * - Color: Red to blue (depending on type)
 * - Typical mass: 10-100 M☉
 * - Massive and luminous
 * - Advanced fusion stages
 * - Strong stellar winds
 * - Examples: Antares, Betelgeuse, Rigel
 */
export class SupergiantMaterial extends EnhancedStarMaterial {
  constructor(object: RenderableCelestialObject) {
    // Supergiants have extreme parameters
    const supergiantDefaults = {
      // Basic effects - all extreme values
      noiseScale: 2.0, // Large scale due to massive size
      noiseIntensity: 0.7, // High intensity due to mass
      plasmaTurbulence: 0.6, // High turbulence due to stellar winds
      lightingIntensity: 1.3, // Very bright
    };

    super(object, new THREE.Color(0xff8844), supergiantDefaults);
  }

  /**
   * Update for supergiants with extreme stellar wind effects
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

    // Stellar wind effect (supergiants have powerful winds)
    const windPhase = Math.sin(time * 0.0001) * 0.4 + 0.6;
    this.uniforms.uPlasmaTurbulence.value = 0.6 * windPhase;

    // Variable brightness (supergiants are unstable)
    const brightnessVariation = 0.2 * Math.sin(time * 0.0002);
    this.uniforms.uLightingIntensity.value = 1.3 + brightnessVariation;
  }
}

/**
 * Renderer for Supergiant stars
 * - Creates massive coronas with stellar winds
 * - Shows extreme stellar activity
 * - Massive size with powerful winds
 */
export class SupergiantRenderer extends BaseStarRenderer<SupergiantMaterial> {
  private supergiantMaterial: SupergiantMaterial | null = null;

  constructor(
    object: RenderableCelestialObject,
    options: BaseCelestialRendererOptions = {},
  ) {
    super(object, options);
  }

  /**
   * Create material for supergiants
   */
  protected createMaterial(
    object: RenderableCelestialObject,
  ): SupergiantMaterial {
    if (!this.supergiantMaterial) {
      this.supergiantMaterial = new SupergiantMaterial(object);
    }
    return this.supergiantMaterial;
  }

  /**
   * Get custom LOD levels for supergiants
   */
  protected getCustomLODs(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    const levels: LODLevel[] = [];
    const material = this.createAndRegisterMaterial(object);

    // High detail level (LOD 0) - Full supergiant with massive corona
    const highDetailGroup = new THREE.Group();
    highDetailGroup.name = `${object.id}-supergiant-high`;

    // Create main star body
    const starSegments = GeometryUtilities.getOptimizedStarSegments("high", 64);
    const starGeometry = new THREE.SphereGeometry(
      1,
      starSegments,
      starSegments,
    );
    const starMesh = new THREE.Mesh(starGeometry, material);
    starMesh.name = `${object.id}-supergiant-body`;
    highDetailGroup.add(starMesh);

    // Create massive corona system for supergiants
    this._createMassiveCorona(object, highDetailGroup);

    levels.push({ object: highDetailGroup, distance: 0 });

    // Medium detail level (LOD 1) - Simplified supergiant
    const mediumDetailGroup = new THREE.Group();
    mediumDetailGroup.name = `${object.id}-supergiant-medium`;

    const mediumStarMesh = new THREE.Mesh(starGeometry, material);
    mediumDetailGroup.add(mediumStarMesh);

    // Simplified corona
    this._addCoronaToGroup(object, mediumDetailGroup);

    levels.push({ object: mediumDetailGroup, distance: 3000 });

    return levels;
  }

  protected getBillboardLODDistance(object: RenderableCelestialObject): number {
    // Supergiants are extremely bright and large
    return object.radius * 10000;
  }

  /**
   * Get star color for supergiants (typically red to blue)
   */
  protected getStarColor(object: RenderableCelestialObject): THREE.Color {
    // Supergiants are typically red to blue depending on type
    return new THREE.Color(0xff8844); // Red-orange
  }

  /**
   * Create massive corona for supergiants with stellar winds
   */
  private _createMassiveCorona(
    object: RenderableCelestialObject,
    group: THREE.Group,
  ): void {
    const starColor = this.getStarColor(object);

    // Create 5 massive corona layers for supergiants
    const coronaLayers = [
      { scale: 1.3, opacity: 0.15, pulseSpeed: 0.08 },
      { scale: 2.0, opacity: 0.12, pulseSpeed: 0.1 },
      { scale: 3.0, opacity: 0.1, pulseSpeed: 0.12 },
      { scale: 4.5, opacity: 0.08, pulseSpeed: 0.14 },
      { scale: 7.0, opacity: 0.06, pulseSpeed: 0.16 },
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

      // Create corona material with stellar wind effects
      const coronaMaterial = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uStarColor: { value: starColor },
          uOpacity: { value: layer.opacity },
          uPulseSpeed: { value: layer.pulseSpeed },
          uNoiseScale: { value: 2.5 + index * 0.5 },
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
            
            // Supergiant corona effects with stellar winds
            float basePattern = fbm((centeredUV * 0.5 + 0.5) * uNoiseScale + uTime * 0.01);
            float detailPattern = fbm((centeredUV * 1.5 + 0.5) * uNoiseScale * 3.0 + uTime * 0.02);
            float pattern = basePattern * 0.6 + detailPattern * 0.4;
            
            // Variable pulsation for supergiants
            float pulse = 0.7 + sin(uTime * uPulseSpeed) * 0.3;
            
            // Edge fading
            float edgeFade = 1.0 - smoothstep(0.6, 1.2, dist);
            
            // Stellar wind streaming effects
            float streams = sin(atan(centeredUV.y, centeredUV.x) * 10.0 + uTime * 0.08) * 0.5 + 0.5;
            
            float alpha = edgeFade * uOpacity * pulse;
            alpha *= (0.4 + pattern * 0.6 + streams * 0.4);
            
            // Supergiant color variation
            vec3 innerColor = uStarColor * 1.4;
            vec3 outerColor = mix(uStarColor * 0.8, vec3(1.0, 0.4, 0.2), 0.5);
            vec3 finalColor = mix(innerColor, outerColor, smoothstep(0.0, 1.0, dist));
            
            // Add streaming effects
            finalColor = mix(finalColor, finalColor * (1.0 + streams * 0.6), 0.3);
            
            gl_FragColor = vec4(finalColor, alpha);
          }
        `,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: true,
        blending: THREE.AdditiveBlending,
      });

      const coronaMesh = new THREE.Mesh(coronaGeometry, coronaMaterial);
      coronaMesh.name = `${object.id}-supergiant-corona-${index}`;
      group.add(coronaMesh);

      // Store material for updates
      if (!this.coronaMaterials.has(object.id)) {
        this.coronaMaterials.set(object.id, []);
      }
      this.coronaMaterials.get(object.id)!.push(coronaMaterial as any);
    });
  }

  /**
   * Enhanced update for supergiants
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

    // Update supergiant material
    if (this.supergiantMaterial) {
      this.supergiantMaterial.update(
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
   * Dispose of supergiant-specific resources
   */
  dispose(): void {
    if (this.supergiantMaterial) {
      this.supergiantMaterial.dispose();
      this.supergiantMaterial = null;
    }
    super.dispose();
  }
}
