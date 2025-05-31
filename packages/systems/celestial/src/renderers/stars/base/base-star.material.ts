import { Color, DoubleSide, ShaderMaterial } from "three";
import type { StarProperties } from "@teskooano/data-types";

// Define a specific type for Corona Uniforms from StarProperties
export type CoronaUniformArgs =
  StarProperties["shaderUniforms"] extends infer SU
    ? SU extends { corona?: infer C } // Check if shaderUniforms and corona exist
      ? C
      : never
    : never;

/**
 * Material for corona effect around stars
 */
export class CoronaMaterial extends ShaderMaterial {
  constructor(
    color: Color = new Color(0xffff00),
    options: {
      scale?: number;
      opacity?: number;
      pulseSpeed?: number;
      noiseScale?: number;
      noiseEvolutionSpeed?: number;
      timeOffset?: number;
    } = {},
    vertexShader: string,
    fragmentShader: string,
  ) {
    super({
      uniforms: {
        time: { value: 0 },
        starColor: { value: color },
        opacity: { value: options.opacity ?? 0.6 },
        pulseSpeed: { value: options.pulseSpeed ?? 0.3 },
        noiseScale: { value: options.noiseScale ?? 3.0 },
        noiseEvolutionSpeed: { value: options.noiseEvolutionSpeed ?? 1.0 },
        timeOffset: { value: options.timeOffset ?? Math.random() * 1000.0 },
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      transparent: true,
      side: DoubleSide,
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
   * Updates the material's uniforms based on new star properties for corona.
   */
  public updateUniforms(
    coronaUniforms?: CoronaUniformArgs,
    timeOffset?: number,
  ): void {
    if (!coronaUniforms) return;

    let changesMade = false;

    if (coronaUniforms.opacity !== undefined && this.uniforms.opacity) {
      if (this.uniforms.opacity.value !== coronaUniforms.opacity) {
        this.uniforms.opacity.value = coronaUniforms.opacity;
        changesMade = true;
      }
    }
    if (coronaUniforms.pulseSpeed !== undefined && this.uniforms.pulseSpeed) {
      if (this.uniforms.pulseSpeed.value !== coronaUniforms.pulseSpeed) {
        this.uniforms.pulseSpeed.value = coronaUniforms.pulseSpeed;
        changesMade = true;
      }
    }
    if (coronaUniforms.noiseScale !== undefined && this.uniforms.noiseScale) {
      if (this.uniforms.noiseScale.value !== coronaUniforms.noiseScale) {
        this.uniforms.noiseScale.value = coronaUniforms.noiseScale;
        changesMade = true;
      }
    }
    if (
      coronaUniforms.noiseEvolutionSpeed !== undefined &&
      this.uniforms.noiseEvolutionSpeed
    ) {
      if (
        this.uniforms.noiseEvolutionSpeed.value !==
        coronaUniforms.noiseEvolutionSpeed
      ) {
        this.uniforms.noiseEvolutionSpeed.value =
          coronaUniforms.noiseEvolutionSpeed;
        changesMade = true;
      }
    }
    if (timeOffset !== undefined && this.uniforms.timeOffset) {
      if (this.uniforms.timeOffset.value !== timeOffset) {
        this.uniforms.timeOffset.value = timeOffset;
        changesMade = true;
      }
    }

    if (changesMade) {
      this.needsUpdate = true;
    }
  }

  /**
   * Dispose of any resources
   */
  dispose(): void {}
}
