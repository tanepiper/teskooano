import * as THREE from "three";
import { BaseStarRenderer } from "../base/base-star";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import { LODLevel } from "../../index";
import type { CelestialMeshOptions } from "../../common/CelestialRenderer";

// Import GLSL shaders as raw strings
import SHARED_VERTEX_SHADER from "../../../shaders/star/post-main-sequence/vertex.glsl";
import SHARED_FRAGMENT_SHADER from "../../../shaders/star/post-main-sequence/fragment.glsl";
import SHARED_CORONA_FRAGMENT_SHADER from "../../../shaders/star/post-main-sequence/corona.glsl";

/**
 * Base material for post-main-sequence stars.
 * Uses shared vertex and fragment shaders.
 */
export class PostMainSequenceStarMaterial extends THREE.ShaderMaterial {
  constructor(
    shaderParameters: {
      starColor?: THREE.Color;
      coronaIntensity?: number;
      pulseSpeed?: number;
      glowIntensity?: number;
      temperatureVariation?: number;
      metallicEffect?: number;
      time?: number; // Optional initial time
    } = {},
    vertexShader: string = SHARED_VERTEX_SHADER,
    fragmentShader: string = SHARED_FRAGMENT_SHADER,
  ) {
    const uniforms = {
      time: { value: shaderParameters.time ?? 0.0 },
      starColor: {
        value: shaderParameters.starColor ?? new THREE.Color(0xffccaa),
      },
      coronaIntensity: { value: shaderParameters.coronaIntensity ?? 0.5 },
      pulseSpeed: { value: shaderParameters.pulseSpeed ?? 0.1 },
      glowIntensity: { value: shaderParameters.glowIntensity ?? 0.7 },
      temperatureVariation: {
        value: shaderParameters.temperatureVariation ?? 0.2,
      },
      metallicEffect: { value: shaderParameters.metallicEffect ?? 0.3 },
    };

    super({
      uniforms: uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      transparent: true, // Stars are often additive or transparent
      blending: THREE.AdditiveBlending, // Good for stars
      depthWrite: false,
    });
  }

  update(time: number): void {
    if (this.uniforms.time) {
      this.uniforms.time.value = time;
    }
  }
}

/**
 * Abstract base class for renderers of post-main-sequence stars.
 */
export abstract class PostMainSequenceStarRenderer extends BaseStarRenderer {
  constructor(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ) {
    super(object, options);
  }

  protected getCoronaVertexShader(object: RenderableCelestialObject): string {
    // Corona is often a simple sphere or billboard, so shared vertex shader is fine.
    return SHARED_VERTEX_SHADER;
  }

  protected getCoronaFragmentShader(object: RenderableCelestialObject): string {
    return SHARED_CORONA_FRAGMENT_SHADER;
  }

  /**
   * Calculate the appropriate billboard sprite size based on the star's real radius.
   * This can be overridden by specific star type renderers to customize billboard scaling.
   *
   * @param object The renderable celestial object
   * @returns The calculated sprite size
   */
  protected calculateBillboardSize(object: RenderableCelestialObject): number {
    const minSpriteSize = 0.05;
    const maxSpriteSize = 0.4; // Increased max size for post-main-sequence stars
    const radiusScaleFactor = 0.0003; // Increased scale factor

    // Calculate size based on radius
    let calculatedSpriteSize = object.radius * radiusScaleFactor;

    // Apply clamping
    return Math.max(
      minSpriteSize,
      Math.min(maxSpriteSize, calculatedSpriteSize),
    );
  }

  // These remain abstract
  protected abstract override getCustomLODs(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[];

  protected abstract override getBillboardLODDistance(
    object: RenderableCelestialObject,
  ): number;

  // This will be implemented by specific star types to provide
  // the correct parameters to PostMainSequenceStarMaterial
  protected abstract override getMaterial(
    object: RenderableCelestialObject,
  ): PostMainSequenceStarMaterial;
}
