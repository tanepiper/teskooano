import * as THREE from "three";
import type {
  RenderableCelestialObject,
  StarProperties,
} from "@teskooano/data-types";
import type { LightSourcesMap } from "@teskooano/renderer-threejs-celestial";
import realisticStarVertexShader from "../shaders/realistic-star.vertex.glsl?raw";
import realisticStarFragmentShader from "../shaders/realistic-star.fragment.glsl?raw";

/**
 * Realistic Volumetric Star Material
 * Implements a ray-marching volumetric shader for stars
 */
export class RealisticStarMaterial extends THREE.ShaderMaterial {
  private object: RenderableCelestialObject;

  constructor(
    object: RenderableCelestialObject,
    color: THREE.Color = new THREE.Color(0xffff00),
  ) {
    const starProps = object.properties as StarProperties;

    // Use hotColor/coolColor if available, otherwise derive from the provided color
    // Core (hot) is brighter, outer (cool) is darker/redder
    const coreColor = starProps?.hotColor
      ? new THREE.Color(starProps.hotColor)
      : color.clone().multiplyScalar(1.2); // Brighter core

    const outerColor = starProps?.coolColor
      ? new THREE.Color(starProps.coolColor)
      : color.clone().multiplyScalar(0.3).lerp(new THREE.Color(0xff0000), 0.2); // Darker, slightly redder outer

    super({
      vertexShader: realisticStarVertexShader,
      fragmentShader: realisticStarFragmentShader,
      uniforms: {
        uTime: { value: 0.0 },
        uColorA: { value: coreColor },
        uColorB: { value: outerColor },
        uSwirlSpeed: { value: 0.85 },
        uDensityMult: { value: 2.6 },
        uNoiseScale: { value: 1.6 },
        uScattering: { value: 0.3 },
        uBrightness: { value: 1.75 },
        uEdgeSoftness: { value: object.radius * 0.575 }, // 2.3/4 ratio from example
        uEdgeNoise: { value: object.radius * 0.4 }, // 1.6/4 ratio from example
        uLightPos: { value: new THREE.Vector3(10, 10, 10) }, // Match original
        uRadius: { value: object.radius },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      blending: THREE.NormalBlending, // Match original (no additive)
    });

    this.object = object;
  }

  /**
   * Update the material with current time and state
   */
  update(
    time: number,
    timeScale: number,
    _lightSources: LightSourcesMap,
    _camera: THREE.PerspectiveCamera,
    _allObjects?: Record<string, RenderableCelestialObject>,
    _allMeshes?: Record<string, THREE.Object3D>,
  ): void {
    // Update time uniform for animation.
    // Stars are rendered by BaseStarRenderer using `material.update(time * timeScale, timeScale, ...)`.
    // If we used the provided `time` directly, the visual animation would accelerate massively when
    // the simulation timeScale is increased (e.g. fast-forward).
    // Cancel the simulation timeScale so shader animation stays visually stable.
    const safeTimeScale = Math.max(0.0001, Math.abs(timeScale));
    this.uniforms.uTime.value = (time / safeTimeScale) * 0.001;

    // Update colors if they change in properties
    const starProps = this.object.properties as StarProperties;
    if (starProps?.hotColor) {
      this.uniforms.uColorA.value.set(starProps.hotColor);
    }
    if (starProps?.coolColor) {
      this.uniforms.uColorB.value.set(starProps.coolColor);
    }

    // Update radius if it changes
    if (this.uniforms.uRadius.value !== this.object.radius) {
      this.uniforms.uRadius.value = this.object.radius;
    }

    // Update from custom params if provided
    if (starProps?.materialParams) {
      this.updateFromParams(starProps.materialParams);
    }
  }

  private updateFromParams(params: any): void {
    if (params.density !== undefined)
      this.uniforms.uDensityMult.value = params.density;
    if (params.swirlSpeed !== undefined)
      this.uniforms.uSwirlSpeed.value = params.swirlSpeed;
    if (params.noiseScale !== undefined)
      this.uniforms.uNoiseScale.value = params.noiseScale;
    if (params.brightness !== undefined)
      this.uniforms.uBrightness.value = params.brightness;
    if (params.edgeSoftness !== undefined)
      this.uniforms.uEdgeSoftness.value = params.edgeSoftness;
    if (params.edgeNoise !== undefined)
      this.uniforms.uEdgeNoise.value = params.edgeNoise;
  }

  dispose(): void {
    super.dispose();
  }
}
