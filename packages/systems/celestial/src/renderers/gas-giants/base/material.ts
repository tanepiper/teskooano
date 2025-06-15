import * as THREE from "three";
import { type LightSourcesMap } from "../../base/CelestialRenderer";
import basicFragmentShader from "../../../shaders/gas-giants/basic.fragment.glsl";
import basicVertexShader from "../../../shaders/gas-giants/basic.vertex.glsl";

/**
 * Base material for gas giants
 */
export abstract class BaseGasGiantMaterial extends THREE.ShaderMaterial {
  updateLOD(lodLevel: number): void {}

  /**
   * Update the material with current time
   */
  update(
    time: number,
    timeScale: number,
    lightSources?: LightSourcesMap,
    camera?: THREE.Camera,
  ): void {
    this.uniforms.time.value = time;

    if (lightSources && lightSources.size > 0) {
      const firstLight = lightSources.values().next().value;
      if (firstLight) {
        if (this.uniforms.sunPosition) {
          this.uniforms.sunPosition.value = firstLight.position;
        }
        if (this.uniforms.lightPosition) {
          this.uniforms.lightPosition.value.copy(firstLight.position);
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
    super({
      uniforms: {
        baseColor: { value: baseColor },
        sunPosition: { value: new THREE.Vector3(1, 1, 1) },
        time: { value: 0 },
      },
      vertexShader: basicVertexShader,
      fragmentShader: basicFragmentShader,
    });
  }
}
