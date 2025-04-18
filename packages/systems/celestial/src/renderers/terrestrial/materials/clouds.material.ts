import * as THREE from 'three';

// Import the world-space raymarching cloud shaders
import cloudsVertexShaderSource from '../../../shaders/terrestrial/clouds.vertex.glsl?raw';
import cloudsFragmentShaderSource from '../../../shaders/terrestrial/clouds.fragment.glsl?raw';

// REMOVED: Noise Texture URL
// const NOISE_TEXTURE_URL = 'https://cdn.maximeheckel.com/noises/noise2.png';

interface CloudMaterialOptions {
  color?: THREE.Color;
  opacity?: number;
  speed?: number;
  sunPosition?: THREE.Vector3;
  // REMOVED: radius from material options
  // radius?: number; 
}

/**
 * Material for world-space raymarched planet clouds (using procedural noise).
 */
export class CloudMaterial extends THREE.ShaderMaterial {
  // REMOVED: noiseTexture property
  // private noiseTexture: THREE.Texture | null = null;

  constructor(
    options: CloudMaterialOptions = {}
  ) {
    const { 
      color = new THREE.Color(0xffffff), // Default cloud color
      opacity = 0.6, // Default opacity
      speed = 0.1, // Default speed
      sunPosition = new THREE.Vector3(1e10, 0, 0), // Default sun position (far away)
      // REMOVED: radius default
      // radius = 1.0 
    } = options;

    super({
      uniforms: {
        time: { value: 0.0 },
        // REMOVED: uNoise uniform
        // uNoise: { value: null }, 
        sunPosition: { value: sunPosition },
        cameraPosition: { value: new THREE.Vector3() }, // Will be updated
        // REMOVED: planetRadius uniform
        // planetRadius: { value: radius }, 
        cloudColor: { value: color },
        cloudOpacity: { value: opacity },
        cloudSpeed: { value: speed }
      },
      vertexShader: cloudsVertexShaderSource,
      fragmentShader: cloudsFragmentShaderSource,
      transparent: true, 
      depthWrite: false, 
      blending: THREE.NormalBlending, 
      side: THREE.FrontSide 
    });

    // REMOVED: loadNoiseTexture call
    // this.loadNoiseTexture();
  }

  // REMOVED: loadNoiseTexture method
  /*
  private loadNoiseTexture(): void {
    // ... removed implementation ...
  }
  */

  /**
   * Update the material uniforms.
   * @param time The current time (e.g., from clock.getElapsedTime()).
   * @param cameraPosition Current camera world position.
   * @param sunPosition Current sun world position.
   */
  update(time: number, cameraPosition: THREE.Vector3, sunPosition?: THREE.Vector3): void {
    this.uniforms.time.value = time;
    this.uniforms.cameraPosition.value.copy(cameraPosition);
    if (sunPosition) {
      this.uniforms.sunPosition.value.copy(sunPosition);
    }
  }

  dispose(): void {
    super.dispose();
    // REMOVED: Texture disposal
    // this.noiseTexture?.dispose();
  }
} 