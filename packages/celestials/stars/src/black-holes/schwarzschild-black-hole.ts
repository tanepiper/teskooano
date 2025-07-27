import * as THREE from "three";
import type {
  CelestialObject,
  RenderableCelestialObject,
} from "@teskooano/data-types";
import { BaseStarMaterial, BaseStarRenderer } from "../base/base-star";
import { GravitationalLensingHelper } from "./gravitational-lensing";

import { LODLevel } from "@teskooano/renderer-threejs-lod";
import {
  BaseCelestialRendererOptions,
  CelestialMeshOptions,
  LightSourcesMap,
  GeometryUtilities,
} from "@teskooano/renderer-threejs-celestial";

/**
 * Material for Schwarzschild black holes
 * - Non-rotating black hole
 * - Spherically symmetric
 * - Defined only by mass
 * - Has event horizon and photon sphere
 * - No charge or angular momentum
 * - Emits no light
 */
export class SchwarzschildBlackHoleMaterial extends THREE.ShaderMaterial {
  constructor() {
    const horizonShader = {
      uniforms: {
        time: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec2 vUv;
        varying vec3 vNormal;
        
        void main() {
          // Schwarzschild black holes emit no light - pure black
          vec3 baseColor = vec3(0.0, 0.0, 0.0);
          
          // Very subtle rim lighting to show the event horizon
          float rimLight = 1.0 - max(0.0, dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)));
          rimLight = pow(rimLight, 8.0) * 0.1; // Much more subtle
          
          // Minimal color variation
          vec3 finalColor = baseColor + vec3(0.0, 0.05, 0.1) * rimLight;
          
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
    };

    super({
      uniforms: horizonShader.uniforms,
      vertexShader: horizonShader.vertexShader,
      fragmentShader: horizonShader.fragmentShader,
      transparent: false,
      side: THREE.FrontSide,
    });
  }

  /**
   * Update the material with the current time
   */
  update(
    time: number,
    timeScale: number,
    lightSources: LightSourcesMap,
    camera: THREE.PerspectiveCamera,
  ): void {
    if (this.uniforms.time !== undefined) {
      this.uniforms.time.value = time;
    }
  }

  /**
   * Dispose of material resources
   */
  dispose(): void {}
}

// Remove the AccretionDiskMaterial class since Schwarzschild black holes shouldn't have accretion disks

/**
 * Renderer for Schwarzschild black holes
 * - No accretion disk (non-rotating)
 * - Minimal gravitational lensing
 * - No light emission
 */
export class SchwarzschildBlackHoleRenderer extends BaseStarRenderer<SchwarzschildBlackHoleMaterial> {
  private eventHorizonMaterial: SchwarzschildBlackHoleMaterial | null = null;
  private lensingHelpers: Map<string, GravitationalLensingHelper> = new Map();

  constructor(
    object: RenderableCelestialObject,
    options: BaseCelestialRendererOptions = {},
  ) {
    super(object, options);
  }

  protected createMaterial(
    object: RenderableCelestialObject,
  ): SchwarzschildBlackHoleMaterial {
    if (!this.eventHorizonMaterial) {
      this.eventHorizonMaterial = new SchwarzschildBlackHoleMaterial();
    }
    return this.eventHorizonMaterial;
  }

  protected getCustomLODs(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    // --- 1. Create event horizon only ---
    const eventHorizon = this._createEventHorizon(object);

    // --- 2. Assemble LOD levels ---

    // Level 0: High detail (Horizon only)
    const highDetailGroup = new THREE.Group();
    highDetailGroup.name = `${object.celestialObjectId}-lod-high`;
    highDetailGroup.add(eventHorizon.clone());
    const lod0: LODLevel = { object: highDetailGroup, distance: 0 };

    // Level 1: Low detail (Horizon only)
    const lowDetailGroup = new THREE.Group();
    lowDetailGroup.name = `${object.celestialObjectId}-lod-low`;
    lowDetailGroup.add(eventHorizon);
    const lod1: LODLevel = { object: lowDetailGroup, distance: 10000 };

    return [lod0, lod1];
  }

  protected getBillboardLODDistance(object: RenderableCelestialObject): number {
    return object.radius * 20000;
  }

  /**
   * Add the event horizon sphere to the group
   * @internal
   */
  private _createEventHorizon(object: RenderableCelestialObject): THREE.Mesh {
    const radius = object.radius || 1;
    const segments = GeometryUtilities.getOptimizedStarSegments("high", 64);
    const geometry = new THREE.SphereGeometry(radius, segments, segments);
    this.eventHorizonMaterial = new SchwarzschildBlackHoleMaterial();
    this.materials.set(
      object.celestialObjectId,
      this.eventHorizonMaterial as any,
    ); // Cast needed as it's not a BaseStarMaterial
    const eventHorizon = new THREE.Mesh(geometry, this.eventHorizonMaterial);
    eventHorizon.name = `${object.celestialObjectId}-event-horizon`;
    return eventHorizon;
  }

  /**
   * Add minimal gravitational lensing effect to the Schwarzschild black hole
   * Should be called after the object is added to the scene
   */
  addGravitationalLensing(
    object: RenderableCelestialObject,
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    group: THREE.Object3D,
  ): void {
    const lensHelper = new GravitationalLensingHelper(
      renderer,
      scene,
      camera,
      group,
      {
        intensity: 0.6, // Much smaller lensing effect

        distortionScale:
          0.8 * (object.mass ? Math.min(3, object.mass / 1e7) : 1.0), // Reduced scale

        lensSphereScale: 4.0, // Smaller lensing sphere
      },
    );

    this.lensingHelpers.set(object.celestialObjectId, lensHelper);
  }

  /**
   * Update materials with current time
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
    super.update(object, time, timeScale, lightSources, camera);

    const currentTime = this.getElapsedTime();

    // Update the event horizon material
    if (this.eventHorizonMaterial) {
      this.eventHorizonMaterial.uniforms.time.value = currentTime;
    }

    // No accretion disk materials to update for Schwarzschild black holes
  }

  /**
   * Dispose of all materials
   */
  dispose(): void {
    if (this.eventHorizonMaterial) {
      this.eventHorizonMaterial.dispose();
    }

    this.lensingHelpers.forEach((helper) => {
      helper.dispose();
    });

    this.lensingHelpers.clear();
  }
}
