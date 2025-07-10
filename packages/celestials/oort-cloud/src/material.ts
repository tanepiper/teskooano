import * as THREE from "three";

// Import shaders from external files
import oortCloudVertexShader from "./shaders/oort-cloud.vertex.glsl?raw";
import oortCloudFragmentShader from "./shaders/oort-cloud.fragment.glsl?raw";

export interface OortCloudMaterialOptions {
  cloudTexture?: THREE.Texture;
  pointSizeScale?: number;
  particleRotationSpeed?: number;
}

/**
 * Material for rendering Oort Cloud particles.
 *
 * Features:
 * - Point-based particle rendering with size scaling
 * - Texture sampling with alpha testing
 * - Per-particle color variations
 * - Configurable point size and rotation parameters
 */
export class OortCloudMaterial extends THREE.ShaderMaterial {
  constructor(options: OortCloudMaterialOptions = {}) {
    // Create a fallback texture if none provided
    const fallbackTexture =
      options.cloudTexture || OortCloudMaterial.createFallbackTexture();

    super({
      uniforms: {
        cloudTexture: { value: fallbackTexture },
        alphaTest: { value: 0.5 },
        pointSizeScale: { value: options.pointSizeScale ?? 0.3 },
        time: { value: 0.0 },
        cloudRotationAngleX: { value: 0.0 },
        cloudRotationAngleY: { value: 0.0 },
        cloudRotationAngleZ: { value: 0.0 },
        particleRotationSpeed: { value: options.particleRotationSpeed ?? 0.75 },
      },
      vertexShader: oortCloudVertexShader,
      fragmentShader: oortCloudFragmentShader,
      transparent: false,
      vertexColors: true,
      depthWrite: true,
      depthTest: true,
      blending: THREE.NormalBlending,
      alphaTest: 0.2,
    });

    this.needsUpdate = true;
    this.uniformsNeedUpdate = true;
  }

  /**
   * Creates a fallback canvas texture for when the real texture doesn't load.
   * Generates a radial gradient from white to transparent blue.
   */
  static createFallbackTexture(): THREE.Texture {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      // Create a simple circular gradient
      const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
      gradient.addColorStop(0.5, "rgba(200, 220, 255, 0.8)");
      gradient.addColorStop(1, "rgba(160, 192, 255, 0)");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 32, 32);
    }

    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Updates the material's time uniform for animation.
   */
  updateTime(time: number): void {
    this.uniforms.time.value = time;
    this.uniformsNeedUpdate = true;
  }

  /**
   * Sets the cloud texture, useful for loading textures asynchronously.
   */
  setCloudTexture(texture: THREE.Texture): void {
    this.uniforms.cloudTexture.value = texture;
    this.needsUpdate = true;
  }
}
