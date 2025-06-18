import * as THREE from "three";
import { type LightSourcesMap } from "../../base/CelestialRenderer";
import basicFragmentShader from "../../../shaders/gas-giants/basic.fragment.glsl";
import basicVertexShader from "../../../shaders/gas-giants/basic.vertex.glsl";

const MAX_LIGHTS = 4;

interface CalculatedLight {
  direction: THREE.Vector3;
  color: THREE.Color;
  intensity: number;
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
    camera?: THREE.Camera,
  ): void {
    if (this.uniforms.time) {
      this.uniforms.time.value = time;
    }

    if (this.uniforms.uNumLights && this.uniforms.uLights) {
      this.uniforms.uNumLights.value = lights.length;

      for (let i = 0; i < MAX_LIGHTS; i++) {
        if (i < lights.length) {
          this.uniforms.uLights.value[i].direction.copy(lights[i].direction);
          this.uniforms.uLights.value[i].color.copy(lights[i].color);
          this.uniforms.uLights.value[i].intensity = lights[i].intensity;
        }
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

    super({
      uniforms: {
        baseColor: { value: baseColor },
        time: { value: 0 },
        uLights: { value: lights },
        uNumLights: { value: 0 },
      },
      vertexShader: basicVertexShader,
      fragmentShader: basicFragmentShader,
    });
  }
}
