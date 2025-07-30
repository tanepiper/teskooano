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
 * Material for Hypergiant stars - the most massive and luminous stars
 * - Extremely hot and bright
 * - Massive coronas extending far from the star
 * - Intense stellar winds
 * - Unstable pulsations and mass loss
 * - Variable brightness and size
 */
export class HypergiantMaterial extends EnhancedStarMaterial {
  constructor(object: RenderableCelestialObject) {
    // Hypergiants have extreme parameters
    const hypergiantDefaults = {
      // Basic effects - all maxed out
      coronaIntensity: 1.5, // Massive corona
      pulseSpeed: 1.2, // Fast, unstable pulsations
      glowIntensity: 1.8, // Extremely bright
      temperatureVariation: 0.3, // High temperature variation
      metallicEffect: 0.2, // Less metallic, more plasma-dominated

      // Enhanced plasma dynamics - extreme values
      plasmaIntensity: 2.0, // Maximum plasma activity
      convectionScale: 25.0, // Massive convection cells
      convectionSpeed: 3.0, // Rapid convection
      plasmaTurbulence: 1.5, // Extreme turbulence
      magneticFieldStrength: 2.0, // Powerful magnetic fields

      // Sunspot system - different from smaller stars
      sunspotFrequency: 0.1, // Very few but massive
      sunspotSize: 15.0, // Huge sunspots
      sunspotContrast: 1.0, // High contrast
      sunspotLatitudeBand: 0.3, // Confined to specific bands
      sunspotCycle: 2000.0, // Very long cycles

      // Coronal mass ejections - extreme
      cmeFrequency: 1.5, // Frequent massive ejections
      cmeIntensity: 2.5, // Extremely intense
      cmeSpeed: 5.0, // Very fast
      cmeScale: 3.0, // Large scale

      // Stellar activity - all extreme
      solarFlareIntensity: 2.0, // Massive flares
      stellarWindStrength: 3.0, // Powerful stellar winds
      prominenceActivity: 1.5, // Large prominences

      // Surface features
      surfaceFeatureScale: 20.0, // Massive surface features
      rotationPeriod: 100.0, // Very slow rotation due to size
      differentialRotation: true,
      poleEquatorRatio: 0.6, // Significant flattening

      // Visual effects - all enabled
      enableGranulation: true,
      enableSunspots: true,
      enableSolarFlares: true,
    };

    super(object, new THREE.Color(0x4488ff), hypergiantDefaults);
  }

  /**
   * Enhanced update for hypergiants with additional instability effects
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

    // Add hypergiant-specific instability effects
    const instabilityPhase = Math.sin(time * 0.001) * 0.5 + 0.5;

    // Variable brightness (hypergiants are unstable)
    const brightnessVariation = 0.3 * instabilityPhase;
    this.uniforms.glowIntensity.value = 1.8 + brightnessVariation;

    // Variable size pulsations
    const pulsationVariation = 0.2 * Math.sin(time * 0.002);
    this.uniforms.pulseSpeed.value = 1.2 + pulsationVariation;

    // Increased mass loss events
    const massLossEvent = Math.random() < 0.001; // Rare but dramatic events
    if (massLossEvent) {
      this.uniforms.cmeIntensity.value = 5.0; // Massive ejection
      this.uniforms.stellarWindStrength.value = 5.0;
    } else {
      // Gradually return to normal
      this.uniforms.cmeIntensity.value = Math.max(
        2.5,
        this.uniforms.cmeIntensity.value * 0.99,
      );
      this.uniforms.stellarWindStrength.value = Math.max(
        3.0,
        this.uniforms.stellarWindStrength.value * 0.99,
      );
    }
  }
}

/**
 * Renderer for Hypergiant stars
 * - Creates massive coronas extending far from the star
 * - Enhanced visual effects for the most extreme stars
 * - Multiple corona layers for spectacular appearance
 */
export class HypergiantRenderer extends BaseStarRenderer<HypergiantMaterial> {
  private hypergiantMaterial: HypergiantMaterial | null = null;

  constructor(
    object: RenderableCelestialObject,
    options: BaseCelestialRendererOptions = {},
  ) {
    super(object, options);
  }

  /**
   * Create material for hypergiants
   */
  protected createMaterial(
    object: RenderableCelestialObject,
  ): HypergiantMaterial {
    if (!this.hypergiantMaterial) {
      this.hypergiantMaterial = new HypergiantMaterial(object);
    }
    return this.hypergiantMaterial;
  }

  /**
   * Get custom LOD levels for hypergiants with massive coronas
   */
  protected getCustomLODs(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    const levels: LODLevel[] = [];
    const material = this.createAndRegisterMaterial(object);

    // High detail level (LOD 0) - Full hypergiant with massive corona
    const highDetailGroup = new THREE.Group();
    highDetailGroup.name = `${object.celestialObjectId}-hypergiant-high`;

    // Create main star body
    const starSegments = GeometryUtilities.getOptimizedStarSegments(
      "high",
      128,
    );
    const starGeometry = new THREE.SphereGeometry(
      1,
      starSegments,
      starSegments,
    );
    const starMesh = new THREE.Mesh(starGeometry, material);
    starMesh.name = `${object.celestialObjectId}-hypergiant-body`;
    highDetailGroup.add(starMesh);

    // Create massive multi-layer corona system
    this._createMassiveCorona(object, highDetailGroup);

    levels.push({ object: highDetailGroup, distance: 0 });

    // Medium detail level (LOD 1) - Simplified hypergiant
    const mediumDetailGroup = new THREE.Group();
    mediumDetailGroup.name = `${object.celestialObjectId}-hypergiant-medium`;

    const mediumStarMesh = new THREE.Mesh(starGeometry, material);
    mediumDetailGroup.add(mediumStarMesh);

    // Simplified corona (fewer layers)
    this._createSimplifiedCorona(object, mediumDetailGroup);

    levels.push({ object: mediumDetailGroup, distance: 2000 });

    // Low detail level (LOD 2) - Basic hypergiant
    const lowDetailGroup = new THREE.Group();
    lowDetailGroup.name = `${object.celestialObjectId}-hypergiant-low`;

    const lowStarMesh = new THREE.Mesh(starGeometry, material);
    lowDetailGroup.add(lowStarMesh);

    // Basic corona
    this._createBasicCorona(object, lowDetailGroup);

    levels.push({ object: lowDetailGroup, distance: 8000 });

    return levels;
  }

  protected getBillboardLODDistance(object: RenderableCelestialObject): number {
    // Hypergiants are visible from much farther due to their extreme brightness
    return object.radius * 50000;
  }

  /**
   * Create massive multi-layer corona for hypergiants
   */
  private _createMassiveCorona(
    object: RenderableCelestialObject,
    group: THREE.Group,
  ): void {
    const starColor = this.getStarColor(object);

    // Create 6 corona layers extending very far from the star
    const coronaLayers = [
      { scale: 1.2, opacity: 0.15, pulseSpeed: 0.1 },
      { scale: 1.8, opacity: 0.12, pulseSpeed: 0.12 },
      { scale: 2.5, opacity: 0.1, pulseSpeed: 0.14 },
      { scale: 3.5, opacity: 0.08, pulseSpeed: 0.16 },
      { scale: 5.0, opacity: 0.06, pulseSpeed: 0.18 },
      { scale: 8.0, opacity: 0.04, pulseSpeed: 0.2 }, // Extends very far
    ];

    coronaLayers.forEach((layer, index) => {
      const coronaRadius = object.radius * layer.scale;
      const coronaSegments = GeometryUtilities.getOptimizedStarSegments(
        "high",
        64,
      );
      const coronaGeometry = new THREE.SphereGeometry(
        coronaRadius,
        coronaSegments,
        coronaSegments,
      );

      // Create enhanced corona material
      const coronaMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          starColor: { value: starColor },
          opacity: { value: layer.opacity },
          pulseSpeed: { value: layer.pulseSpeed },
          noiseScale: { value: 2.0 + index * 0.5 },
          turbulenceIntensity: { value: 1.5 }, // High turbulence for hypergiants
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
          uniform float time;
          uniform vec3 starColor;
          uniform float opacity;
          uniform float pulseSpeed;
          uniform float noiseScale;
          uniform float turbulenceIntensity;
          
          varying vec2 vUv;
          varying vec3 vNormal;
          varying vec3 vPosition;
          
          float noise(vec2 p) {
            return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
          }
          
          float fbm(vec2 p) {
            float f = 0.0;
            float amp = 1.0;
            for(int i = 0; i < 6; i++) {
              f += amp * noise(p);
              p *= 2.0;
              amp *= 0.5;
            }
            return f;
          }
          
          void main() {
            vec2 centeredUV = vUv * 2.0 - 1.0;
            float dist = length(centeredUV);
            
            // Enhanced turbulence for hypergiant corona
            float basePattern = fbm((centeredUV * 0.5 + 0.5) * noiseScale + time * 0.02);
            float detailPattern = fbm((centeredUV * 1.5 + 0.5) * noiseScale * 3.0 + time * 0.04);
            float pattern = basePattern * 0.6 + detailPattern * 0.4;
            
            // Intense pulsation
            float pulse = 0.7 + sin(time * pulseSpeed) * 0.3;
            
            // Edge fading
            float edgeFade = 1.0 - smoothstep(0.6, 1.2, dist);
            
            // Hypergiant-specific streaming effects
            float streams = sin(atan(centeredUV.y, centeredUV.x) * 12.0 + time * 0.1) * 0.5 + 0.5;
            
            float alpha = edgeFade * opacity * pulse * turbulenceIntensity;
            alpha *= (0.4 + pattern * 0.6 + streams * 0.3);
            
            // Enhanced color variation
            vec3 innerColor = starColor * 1.5;
            vec3 outerColor = mix(starColor * 0.8, vec3(1.0, 0.6, 0.3), 0.4);
            vec3 finalColor = mix(innerColor, outerColor, smoothstep(0.0, 1.0, dist));
            
            // Add streaming effects
            finalColor = mix(finalColor, finalColor * (1.0 + streams * 0.5), 0.3);
            
            gl_FragColor = vec4(finalColor, alpha);
          }
        `,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: true,
        blending: THREE.AdditiveBlending,
      });

      const coronaMesh = new THREE.Mesh(coronaGeometry, coronaMaterial);
      coronaMesh.name = `${object.celestialObjectId}-hypergiant-corona-${index}`;
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
   * Create simplified corona for medium detail
   */
  private _createSimplifiedCorona(
    object: RenderableCelestialObject,
    group: THREE.Group,
  ): void {
    // Just 3 layers for medium detail
    this._addCoronaToGroup(object, group);

    // Add one extra large layer for hypergiant effect
    const starColor = this.getStarColor(object);
    const extraRadius = object.radius * 4.0;
    const extraGeometry = new THREE.SphereGeometry(extraRadius, 32, 32);
    const extraMaterial = new THREE.MeshBasicMaterial({
      color: starColor,
      transparent: true,
      opacity: 0.05,
      side: THREE.DoubleSide,
      depthWrite: true,
      blending: THREE.AdditiveBlending,
    });
    const extraCorona = new THREE.Mesh(extraGeometry, extraMaterial);
    extraCorona.name = `${object.celestialObjectId}-hypergiant-extra-corona`;
    group.add(extraCorona);
  }

  /**
   * Create basic corona for low detail
   */
  private _createBasicCorona(
    object: RenderableCelestialObject,
    group: THREE.Group,
  ): void {
    // Standard corona
    this._addCoronaToGroup(object, group);
  }

  /**
   * Enhanced update for hypergiants
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

    // Update hypergiant material
    if (this.hypergiantMaterial) {
      this.hypergiantMaterial.update(
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
        if (material.uniforms && material.uniforms.time) {
          material.uniforms.time.value = time;
        }
      });
    }
  }

  /**
   * Get star color for hypergiants (typically blue or blue-white)
   */
  protected getStarColor(object: RenderableCelestialObject): THREE.Color {
    // Hypergiants are typically very hot and blue
    return new THREE.Color(0x4488ff); // Blue-white
  }

  /**
   * Dispose of hypergiant-specific resources
   */
  dispose(): void {
    if (this.hypergiantMaterial) {
      this.hypergiantMaterial.dispose();
      this.hypergiantMaterial = null;
    }
    super.dispose();
  }
}
