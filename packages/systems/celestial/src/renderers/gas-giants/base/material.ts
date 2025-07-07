import * as THREE from "three";
import basicFragmentShader from "../../../shaders/gas-giants/basic.fragment.glsl";
import basicVertexShader from "../../../shaders/gas-giants/basic.vertex.glsl";
import { LightArrayUtils } from "@teskooano/renderer-threejs-celestial";

// Remove hard-coded constants - we'll calculate dynamically
interface CalculatedLight {
  position: THREE.Vector3;
  color: THREE.Color;
  intensity: number;
}
interface CalculatedShadowCaster {
  position: THREE.Vector3;
  radius: number;
}

/**
 * Base material for gas giants with dynamic light and shadow caster support
 */
export abstract class BaseGasGiantMaterial extends THREE.ShaderMaterial {
  protected currentNumLights: number = 0;
  protected currentNumShadowCasters: number = 0;

  updateLOD(lodLevel: number): void {}

  /**
   * Update the material with current time and pre-calculated light data.
   * Dynamically handles any number of lights and shadow casters.
   */
  update(
    time: number,
    timeScale: number,
    lights: CalculatedLight[],
    camera: THREE.Camera | undefined,
    shadowCasters: CalculatedShadowCaster[],
  ): void {
    if (this.uniforms.time) {
      this.uniforms.time.value = time;
    }

    // Update lights dynamically
    if (this.uniforms.uNumLights && this.uniforms.uLights) {
      const numLights = lights.length;

      // Resize arrays if needed
      if (numLights !== this.currentNumLights) {
        this.resizeLightArrays(numLights);
        this.currentNumLights = numLights;
      }

      this.uniforms.uNumLights.value = numLights;

      for (let i = 0; i < numLights; i++) {
        const light = lights[i];
        if (light && this.uniforms.uLights.value[i]) {
          // Simply copy the light position to the shader
          // The direction will be calculated in the fragment shader
          this.uniforms.uLights.value[i].position.copy(light.position);
          this.uniforms.uLights.value[i].color.copy(light.color);
          this.uniforms.uLights.value[i].intensity = light.intensity;
        }
      }
    }

    // Update shadow casters dynamically
    if (
      this.uniforms.uNumShadowCasters &&
      this.uniforms.uShadowCasters &&
      shadowCasters
    ) {
      const numShadowCasters = shadowCasters.length;

      // Resize arrays if needed
      if (numShadowCasters !== this.currentNumShadowCasters) {
        this.resizeShadowCasterArrays(numShadowCasters);
        this.currentNumShadowCasters = numShadowCasters;
      }

      this.uniforms.uNumShadowCasters.value = numShadowCasters;

      for (let i = 0; i < numShadowCasters; i++) {
        if (this.uniforms.uShadowCasters.value[i]) {
          this.uniforms.uShadowCasters.value[i].position.copy(
            shadowCasters[i].position,
          );
          this.uniforms.uShadowCasters.value[i].radius =
            shadowCasters[i].radius;
        }
      }
    }
  }

  /**
   * Resize the light arrays to accommodate the new number of lights
   */
  protected resizeLightArrays(newSize: number): void {
    if (!this.uniforms.uLights) return;

    this.uniforms.uLights.value = LightArrayUtils.resizeLightArray(
      this,
      newSize,
      this.uniforms.uLights.value,
    );
  }

  /**
   * Resize the shadow caster arrays to accommodate the new number of shadow casters
   */
  protected resizeShadowCasterArrays(newSize: number): void {
    if (!this.uniforms.uShadowCasters) return;

    this.uniforms.uShadowCasters.value =
      LightArrayUtils.resizeShadowCasterArray(
        this,
        newSize,
        this.uniforms.uShadowCasters.value,
      );
  }

  dispose(): void {}
}

/**
 * Create initial arrays for lights and shadow casters with reasonable starting sizes
 */
function createInitialLightArray(initialSize: number = 4): Array<{
  position: THREE.Vector3;
  color: THREE.Color;
  intensity: number;
}> {
  return LightArrayUtils.createLightSourceArray(initialSize);
}

/**
 * Basic Gas Giant Material using the simple shaders
 */
export class BasicGasGiantMaterial extends BaseGasGiantMaterial {
  constructor(baseColor: THREE.Color = new THREE.Color(0xffffff)) {
    const MAX_LIGHTS = 4;
    const MAX_SHADOW_CASTERS = 8;
    const lights = createInitialLightArray(MAX_LIGHTS);
    const shadowCasters =
      LightArrayUtils.createShadowCasterArray(MAX_SHADOW_CASTERS);

    super({
      defines: {
        MAX_LIGHTS: MAX_LIGHTS,
        MAX_SHADOW_CASTERS: MAX_SHADOW_CASTERS,
      },
      uniforms: {
        baseColor: { value: baseColor },
        time: { value: 0 },
        uLights: { value: lights },
        uNumLights: { value: 0 },
        uShadowCasters: { value: shadowCasters },
        uNumShadowCasters: { value: 0 },
        uDynamicAmbientIntensity: { value: 0.001 }, // Dynamic ambient uniform
      },
      vertexShader: basicVertexShader,
      fragmentShader: basicFragmentShader,
    });

    this.currentNumLights = MAX_LIGHTS;
    this.currentNumShadowCasters = MAX_SHADOW_CASTERS;
  }
}
