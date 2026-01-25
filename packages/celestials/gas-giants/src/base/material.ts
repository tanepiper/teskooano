import * as THREE from "three";
import basicFragmentShader from "../shaders/basic.fragment.glsl";
import basicVertexShader from "../shaders/basic.vertex.glsl";
import {
  LightArrayUtils,
  LightingUniformPack,
} from "@teskooano/renderer-threejs-celestial";

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

  constructor(parameters?: THREE.ShaderMaterialParameters) {
    super({
      ...parameters,
      depthTest: true,
      depthWrite: true, // Ensure gas giants write to the depth buffer for occlusion culling
    });
  }

  updateLOD(lodLevel: number): void {}

  /**
   * Update the material with current time and pre-calculated light data.
   * Dynamically handles any number of lights and shadow casters.
   */
  update(
    time: number,
    timeScale: number,
    lights: CalculatedLight[],
    camera: THREE.PerspectiveCamera,
    shadowCasters: CalculatedShadowCaster[],
  ): void {
    if (this.uniforms.time) {
      this.uniforms.time.value = time;
    }

    if (
      this.uniforms.uNumLights &&
      this.uniforms.uLightPositions &&
      this.uniforms.uLightColors &&
      this.uniforms.uLightIntensities
    ) {
      LightingUniformPack.applyFromArray(
        {
          uNumLights: this.uniforms.uNumLights,
          uLightPositions: this.uniforms.uLightPositions,
          uLightColors: this.uniforms.uLightColors,
          uLightIntensities: this.uniforms.uLightIntensities,
          uAmbientColor: this.uniforms.uAmbientColor,
        },
        lights,
        4,
      );
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
function createLightArrays(initialSize: number = 4): {
  positions: THREE.Vector3[];
  colors: THREE.Color[];
  intensities: Float32Array;
} {
  return LightingUniformPack.createLightArrays(initialSize);
}

/**
 * Basic Gas Giant Material using the simple shaders
 */
export class BasicGasGiantMaterial extends BaseGasGiantMaterial {
  constructor(baseColor: THREE.Color = new THREE.Color(0xffffff)) {
    const MAX_LIGHTS = 4;
    const MAX_SHADOW_CASTERS = 8;
    const lights = createLightArrays(MAX_LIGHTS);
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
        uLightPositions: { value: lights.positions },
        uLightColors: { value: lights.colors },
        uLightIntensities: { value: lights.intensities },
        uNumLights: { value: 0 },
        uShadowCasters: { value: shadowCasters },
        uNumShadowCasters: { value: 0 },
        uAmbientColor: { value: new THREE.Color(0xffffff) },
        uAmbientIntensity: { value: 0.03 }, // System-wide minimum ambient for "just enough glow"
      },
      vertexShader: basicVertexShader,
      fragmentShader: basicFragmentShader,
    });

    this.currentNumLights = MAX_LIGHTS;
    this.currentNumShadowCasters = MAX_SHADOW_CASTERS;
  }
}
