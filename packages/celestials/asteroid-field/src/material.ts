import * as THREE from "three";

// Import shaders from external files
import asteroidVertexShader from "./shaders/asteroid.vert?raw";
import asteroidFragmentShader from "./shaders/asteroid.frag?raw";

export interface AsteroidFieldMaterialOptions {
  asteroidTextures?: THREE.Texture[];
  alphaTest?: number;
  particleRotationSpeed?: number;
  renderScale?: number;
}

/**
 * Material for rendering asteroid field particles.
 *
 * Features:
 * - Multiple texture support for variety
 * - Point-based particle rendering with size scaling
 * - Belt rotation and individual particle animation
 * - Vertex color variations for realistic appearance
 * - Configurable render scale and rotation parameters
 */
export class AsteroidFieldMaterial extends THREE.ShaderMaterial {
  private asteroidTextures: THREE.Texture[] = [];
  private textureLoader: THREE.TextureLoader;
  private loadedTextureCount = 0;
  private materialReady = false;

  constructor(options: AsteroidFieldMaterialOptions = {}) {
    super({
      uniforms: {
        // Texture uniforms
        asteroidTextures: { value: options.asteroidTextures || [] },
        alphaTest: { value: options.alphaTest ?? 0.2 },

        // Animation uniforms
        beltRotationAngle: { value: 0.0 },
        time: { value: 0.0 },
        particleRotationSpeed: { value: options.particleRotationSpeed ?? 1.5 },

        // Rendering uniforms
        renderScale: { value: options.renderScale ?? 1.0 },
      },
      vertexShader: asteroidVertexShader,
      fragmentShader: asteroidFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    });

    this.textureLoader = new THREE.TextureLoader();

    // If textures provided, use them, otherwise load default textures
    if (options.asteroidTextures && options.asteroidTextures.length > 0) {
      this.asteroidTextures = options.asteroidTextures;
      this.materialReady = true;
      this.uniforms.asteroidTextures.value = this.asteroidTextures;
    } else {
      this.loadDefaultTextures();
    }

    this.needsUpdate = true;
  }

  /**
   * Loads default asteroid textures asynchronously.
   */
  private loadDefaultTextures(): void {
    const texturePaths = [
      "space/textures/asteroids/asteroid_1.png",
      "space/textures/asteroids/asteroid_2.png",
      "space/textures/asteroids/asteroid_3.png",
      "space/textures/asteroids/asteroid_4.png",
      "space/textures/asteroids/asteroid_5.png",
    ];

    this.asteroidTextures = new Array(5).fill(null);
    this.loadedTextureCount = 0;
    this.materialReady = false;

    texturePaths.forEach((path, index) => {
      this.textureLoader.load(
        path,
        (texture) => {
          this.asteroidTextures[index] = texture;
          this.loadedTextureCount++;

          console.debug(
            `[AsteroidFieldMaterial] Loaded texture ${index + 1}/5: ${path}`,
          );

          if (this.loadedTextureCount === 5) {
            this.materialReady = true;
            console.debug(
              `[AsteroidFieldMaterial] All asteroid textures loaded`,
            );

            // Update material with loaded textures
            this.uniforms.asteroidTextures.value = this.asteroidTextures;
            this.needsUpdate = true;
          }
        },
        undefined,
        (error) => {
          console.error(
            `[AsteroidFieldMaterial] Failed to load texture: ${path}`,
            error,
          );
        },
      );
    });
  }

  /**
   * Updates the belt rotation angle for animating the entire field.
   */
  updateBeltRotation(angle: number): void {
    this.uniforms.beltRotationAngle.value = angle;
  }

  /**
   * Updates the time uniform for individual particle animations.
   */
  updateTime(time: number): void {
    this.uniforms.time.value = time;
  }

  /**
   * Updates the particle rotation speed.
   */
  updateParticleRotationSpeed(speed: number): void {
    this.uniforms.particleRotationSpeed.value = speed;
  }

  /**
   * Updates the render scale uniform.
   */
  updateRenderScale(scale: number): void {
    this.uniforms.renderScale.value = scale;
  }

  /**
   * Sets custom asteroid textures.
   */
  setAsteroidTextures(textures: THREE.Texture[]): void {
    this.asteroidTextures = textures;
    this.uniforms.asteroidTextures.value = textures;
    this.materialReady = true;
    this.needsUpdate = true;
  }

  /**
   * Returns whether all textures have been loaded and the material is ready.
   */
  isMaterialReady(): boolean {
    return this.materialReady;
  }

  /**
   * Returns the loaded asteroid textures.
   */
  getAsteroidTextures(): THREE.Texture[] {
    return this.asteroidTextures;
  }

  /**
   * Disposes of all textures and cleans up resources.
   */
  dispose(): void {
    super.dispose();

    this.asteroidTextures.forEach((texture) => {
      if (texture) texture.dispose();
    });
    this.asteroidTextures = [];
    this.materialReady = false;
  }
}
