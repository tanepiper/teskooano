import * as THREE from "three";

import cloudsVertexShaderSource from "../../../shaders/terrestrial/clouds.vertex.glsl?raw";
import cloudsFragmentShaderSource from "../../../shaders/terrestrial/clouds.fragment.glsl?raw";

interface CloudMaterialOptions {
  color?: THREE.Color;
  opacity?: number;
  speed?: number;
  sunPosition?: THREE.Vector3;
}

/**
 * Material for world-space raymarched planet clouds (using procedural noise).
 */
export class CloudMaterial extends THREE.ShaderMaterial {
  constructor(options: CloudMaterialOptions = {}) {
    const {
      color = new THREE.Color(0xffffff),
      opacity = 0.6,
      speed = 0.1,
      sunPosition = new THREE.Vector3(1e10, 0, 0),
    } = options;

    super({
      uniforms: {
        time: { value: 0.0 },

        sunPosition: { value: sunPosition },
        cameraPosition: { value: new THREE.Vector3() },

        cloudColor: { value: color },
        cloudOpacity: { value: opacity },
        cloudSpeed: { value: speed },
      },
      vertexShader: cloudsVertexShaderSource,
      fragmentShader: cloudsFragmentShaderSource,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      side: THREE.FrontSide,
    });
  }

  /*
  private loadNoiseTexture(): void {
    
  }
  */

  /**
   * Update the material uniforms.
   * @param time The current time (e.g., from clock.getElapsedTime()).
   * @param cameraPosition Current camera world position.
   * @param sunPosition Current sun world position.
   */
  update(
    time: number,
    cameraPosition: THREE.Vector3,
    sunPosition?: THREE.Vector3,
  ): void {
    this.uniforms.time.value = time;
    this.uniforms.cameraPosition.value.copy(cameraPosition);
    if (sunPosition) {
      this.uniforms.sunPosition.value.copy(sunPosition);
    }
  }

  dispose(): void {
    super.dispose();
  }
}
