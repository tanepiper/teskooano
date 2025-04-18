import * as THREE from "three";

// Import the atmosphere shaders
import atmosphereVertexShaderSource from "../../../shaders/terrestrial/atmosphere.vertex.glsl?raw";
import atmosphereFragmentShaderSource from "../../../shaders/terrestrial/atmosphere.fragment.glsl?raw";

interface AtmosphereMaterialOptions {
  density?: number;
  opacity?: number;
  color?: THREE.Color;
  sunPosition?: THREE.Vector3;
}

/**
 * Material for atmospheric scattering effect
 */
export class AtmosphereMaterial extends THREE.ShaderMaterial {
  constructor(
    color: THREE.Color = new THREE.Color(0x8899ff),
    options: AtmosphereMaterialOptions = {},
  ) {
    const { opacity = 0.3, sunPosition = new THREE.Vector3(1e10, 0, 0) } =
      options;

    super({
      uniforms: {
        time: { value: 0 },
        atmosphereColor: { value: color },
        atmosphereOpacity: { value: opacity },
        sunPosition: { value: sunPosition },
      },
      vertexShader: atmosphereVertexShaderSource,
      fragmentShader: atmosphereFragmentShaderSource,
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
    });
  }

  /**
   * Update the material with the current time and sun position
   */
  update(time: number, sunPosition?: THREE.Vector3): void {
    this.uniforms.time.value = time;
    if (sunPosition) {
      this.uniforms.sunPosition.value.copy(sunPosition);
    }
  }

  dispose(): void {
    super.dispose();
  }
}
