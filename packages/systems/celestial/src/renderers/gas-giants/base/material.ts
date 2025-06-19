import * as THREE from "three";
import basicFragmentShader from "../../../shaders/gas-giants/basic.fragment.glsl";
import basicVertexShader from "../../../shaders/gas-giants/basic.vertex.glsl";

const MAX_LIGHTS = 4;
const MAX_SHADOW_CASTERS = 8;

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
 * Base material for gas giants
 */
export abstract class BaseGasGiantMaterial extends THREE.ShaderMaterial {
  updateLOD(lodLevel: number): void {}

  /**
   * Update the material with current time and pre-calculated light data.
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

    if (this.uniforms.uNumLights && this.uniforms.uLights) {
      const numLightsToUse = Math.min(lights.length, MAX_LIGHTS);
      this.uniforms.uNumLights.value = numLightsToUse;

      for (let i = 0; i < numLightsToUse; i++) {
        const light = lights[i];
        if (light) {
          this.uniforms.uLights.value[i].direction.copy(light.direction);
          this.uniforms.uLights.value[i].color.copy(light.color);
          this.uniforms.uLights.value[i].intensity = light.intensity;
        }
      }
    }

    if (
      this.uniforms.uNumShadowCasters &&
      this.uniforms.uShadowCasters &&
      shadowCasters
    ) {
      const numToUse = Math.min(shadowCasters.length, MAX_SHADOW_CASTERS);
      this.uniforms.uNumShadowCasters.value = numToUse;
      for (let i = 0; i < numToUse; i++) {
        this.uniforms.uShadowCasters.value[i].position.copy(
          shadowCasters[i].position,
        );
        this.uniforms.uShadowCasters.value[i].radius = shadowCasters[i].radius;
      }
    }
  }

  dispose(): void {}
}

/**
 * Basic Gas Giant Material using the simple shaders
 */
export class BasicGasGiantMaterial extends BaseGasGiantMaterial {
  constructor(baseColor: THREE.Color = new THREE.Color(0xffffff)) {
    const lights: {
      direction: THREE.Vector3;
      color: THREE.Color;
      intensity: number;
    }[] = [];
    for (let i = 0; i < MAX_LIGHTS; i++) {
      lights.push({
        direction: new THREE.Vector3(),
        color: new THREE.Color(),
        intensity: 0,
      });
    }

    const shadowCasters: { position: THREE.Vector3; radius: number }[] = [];
    for (let i = 0; i < MAX_SHADOW_CASTERS; i++) {
      shadowCasters.push({
        position: new THREE.Vector3(),
        radius: 0,
      });
    }

    super({
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
  }
}
