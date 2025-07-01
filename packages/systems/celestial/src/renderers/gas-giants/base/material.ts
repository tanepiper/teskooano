import * as THREE from "three";
import basicFragmentShader from "../../../shaders/gas-giants/basic.fragment.glsl";
import basicVertexShader from "../../../shaders/gas-giants/basic.vertex.glsl";

// Remove hard-coded constants - we'll calculate dynamically
interface CalculatedLight {
  direction: THREE.Vector3;
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
          this.uniforms.uLights.value[i].direction.copy(light.direction);
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

    if (this.defines.MAX_LIGHTS !== newSize) {
      this.defines.MAX_LIGHTS = newSize;
      this.needsUpdate = true;
    }

    const currentArray = this.uniforms.uLights.value;
    const newArray: Array<{
      direction: THREE.Vector3;
      color: THREE.Color;
      intensity: number;
    }> = [];

    // Copy existing data and add new slots as needed
    for (let i = 0; i < newSize; i++) {
      if (i < currentArray.length && currentArray[i]) {
        newArray.push(currentArray[i]);
      } else {
        newArray.push({
          direction: new THREE.Vector3(),
          color: new THREE.Color(),
          intensity: 0,
        });
      }
    }

    this.uniforms.uLights.value = newArray;
  }

  /**
   * Resize the shadow caster arrays to accommodate the new number of shadow casters
   */
  protected resizeShadowCasterArrays(newSize: number): void {
    if (!this.uniforms.uShadowCasters) return;

    if (this.defines.MAX_SHADOW_CASTERS !== newSize) {
      this.defines.MAX_SHADOW_CASTERS = newSize;
      this.needsUpdate = true;
    }

    const currentArray = this.uniforms.uShadowCasters.value;
    const newArray: Array<{ position: THREE.Vector3; radius: number }> = [];

    // Copy existing data and add new slots as needed
    for (let i = 0; i < newSize; i++) {
      if (i < currentArray.length && currentArray[i]) {
        newArray.push(currentArray[i]);
      } else {
        newArray.push({
          position: new THREE.Vector3(),
          radius: 0,
        });
      }
    }

    this.uniforms.uShadowCasters.value = newArray;
  }

  dispose(): void {}
}

/**
 * Create initial arrays for lights and shadow casters with reasonable starting sizes
 */
function createInitialLightArray(initialSize: number = 4): Array<{
  direction: THREE.Vector3;
  color: THREE.Color;
  intensity: number;
}> {
  const lights: Array<{
    direction: THREE.Vector3;
    color: THREE.Color;
    intensity: number;
  }> = [];

  for (let i = 0; i < initialSize; i++) {
    lights.push({
      direction: new THREE.Vector3(),
      color: new THREE.Color(),
      intensity: 0,
    });
  }

  return lights;
}

function createInitialShadowCasterArray(initialSize: number = 8): Array<{
  position: THREE.Vector3;
  radius: number;
}> {
  const shadowCasters: Array<{ position: THREE.Vector3; radius: number }> = [];

  for (let i = 0; i < initialSize; i++) {
    shadowCasters.push({
      position: new THREE.Vector3(),
      radius: 0,
    });
  }

  return shadowCasters;
}

/**
 * Basic Gas Giant Material using the simple shaders
 */
export class BasicGasGiantMaterial extends BaseGasGiantMaterial {
  constructor(baseColor: THREE.Color = new THREE.Color(0xffffff)) {
    const MAX_LIGHTS = 4;
    const MAX_SHADOW_CASTERS = 8;
    const lights = createInitialLightArray(MAX_LIGHTS);
    const shadowCasters = createInitialShadowCasterArray(MAX_SHADOW_CASTERS);

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
      },
      vertexShader: basicVertexShader,
      fragmentShader: basicFragmentShader,
    });

    this.currentNumLights = MAX_LIGHTS;
    this.currentNumShadowCasters = MAX_SHADOW_CASTERS;
  }
}
