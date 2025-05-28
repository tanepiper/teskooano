import type { StarProperties } from "@teskooano/data-types";
import { SCALE } from "@teskooano/data-types";
import { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import * as THREE from "three";
import type { CelestialMeshOptions } from "../../common/CelestialRenderer";
import { LODLevel } from "../../index";
import { BaseStarRenderer } from "../base/base-star";

// Import main sequence specific shaders
import mainSequenceCoronaFragmentShader from "../../../shaders/star/main-sequence/corona.glsl";
import mainSequenceFragmentShader from "../../../shaders/star/main-sequence/fragment.glsl";
import mainSequenceVertexShader from "../../../shaders/star/main-sequence/vertex.glsl";

/**
 * Material for main sequence stars with shader effects
 */
export class MainSequenceStarMaterial extends THREE.ShaderMaterial {
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
      vertexShader: mainSequenceVertexShader,
      fragmentShader: mainSequenceFragmentShader,
      transparent: true,
      side: THREE.FrontSide,
    });
  }

  /**
   * Update the material with the current time (optional, can be handled by renderer if preferred)
   */
  update(time: number): void {
    if (this.uniforms.time) {
      this.uniforms.time.value = time;
    }
  }
}

/**
 * Main sequence star renderer
 */
export class MainSequenceStarRenderer extends BaseStarRenderer {
  constructor(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ) {
    super(object, options);
  }

  /**
   * Returns the appropriate material for a main sequence star
   */
  protected getMaterial(
    object: RenderableCelestialObject,
  ): THREE.ShaderMaterial {
    return new MainSequenceStarMaterial(this.getStarColor(object));
  }

  /**
   * Get the star color based on its properties
   */
  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    const properties = star.properties as StarProperties;

    if (properties && properties.color) {
      return new THREE.Color(properties.color);
    }

    return new THREE.Color(0xffcc00);
  }

  /**
   * Provides default custom LOD levels for main sequence stars.
   * Subclasses can override this for specific spectral types.
   */
  protected getCustomLODs(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    const scale = typeof SCALE === "number" ? SCALE : 1;

    // Default high detail (matches previous BaseStarRenderer default)
    const highDetailGroup = this._createHighDetailGroup(object, {
      ...options,
      segments: options?.segments ?? 128,
    });
    const level0: LODLevel = { object: highDetailGroup, distance: 0 };

    // Default medium detail (matches previous BaseStarRenderer default)
    const mediumDetailGroup = this._createHighDetailGroup(object, {
      ...options,
      segments: options?.segments ?? 64,
    });
    mediumDetailGroup.name = `${object.celestialObjectId}-medium-lod`;
    const level1: LODLevel = {
      object: mediumDetailGroup,
      distance: 200 * scale,
    };

    return [level0, level1];
  }

  /**
   * Provides a default billboard LOD distance for main sequence stars.
   * Subclasses can override this for specific spectral types.
   */
  protected getBillboardLODDistance(object: RenderableCelestialObject): number {
    const scale = typeof SCALE === "number" ? SCALE : 1;
    return 2000 * scale; // Default distance for main sequence billboard
  }

  /**
   * Provides the vertex shader for the corona effect for main sequence stars.
   */
  protected getCoronaVertexShader(object: RenderableCelestialObject): string {
    return mainSequenceVertexShader;
  }

  /**
   * Provides the fragment shader for the corona effect for main sequence stars.
   */
  protected getCoronaFragmentShader(object: RenderableCelestialObject): string {
    return mainSequenceCoronaFragmentShader;
  }
}
