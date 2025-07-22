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

    // If textures provided, use them, otherwise load textures from paths or create fallbacks
    if (options.asteroidTextures && options.asteroidTextures.length > 0) {
      this.asteroidTextures = options.asteroidTextures;
      this.materialReady = true;
      this.uniforms.asteroidTextures.value = this.asteroidTextures;
    } else {
      this.loadTextures();
    }

    this.needsUpdate = true;
  }

  /**
   * Loads asteroid textures asynchronously from provided paths or creates fallback textures.
   */
  private loadTextures(texturePaths?: string[]): void {
    // If no texture paths provided or empty array, create fallback textures
    if (!texturePaths || texturePaths.length === 0) {
      this.createFallbackTextures();
      return;
    }

    this.asteroidTextures = new Array(texturePaths.length).fill(null);
    this.loadedTextureCount = 0;
    this.materialReady = false;

    texturePaths.forEach((path, index) => {
      this.textureLoader.load(
        path,
        (texture) => {
          this.asteroidTextures[index] = texture;
          this.loadedTextureCount++;

          if (this.loadedTextureCount === texturePaths.length) {
            this.materialReady = true;

            // Update material with loaded textures
            this.uniforms.asteroidTextures.value = this.asteroidTextures;
            this.needsUpdate = true;
          }
        },
        undefined,
        (error) => {
          // If texture loading fails, create a fallback for this slot
          this.asteroidTextures[index] = this.createFallbackTexture();
          this.loadedTextureCount++;

          if (this.loadedTextureCount === texturePaths.length) {
            this.materialReady = true;
            this.uniforms.asteroidTextures.value = this.asteroidTextures;
            this.needsUpdate = true;
          }
        },
      );
    });
  }

  /**
   * Creates a single fallback texture for asteroid rendering.
   */
  private createFallbackTexture(): THREE.Texture {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      // Create a simple asteroid-like texture with noise
      ctx.fillStyle = "#8B7355"; // Brown base color
      ctx.fillRect(0, 0, 64, 64);

      // Add some noise/detail
      for (let i = 0; i < 100; i++) {
        const x = Math.random() * 64;
        const y = Math.random() * 64;
        const size = Math.random() * 3 + 1;
        const brightness = Math.random() * 0.3 + 0.7;

        ctx.fillStyle = `rgba(139, 115, 85, ${brightness})`;
        ctx.fillRect(x, y, size, size);
      }

      // Add some darker spots for craters
      for (let i = 0; i < 20; i++) {
        const x = Math.random() * 64;
        const y = Math.random() * 64;
        const radius = Math.random() * 4 + 2;

        ctx.fillStyle = "rgba(50, 40, 30, 0.8)";
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Creates fallback textures for when no texture paths are provided.
   */
  private createFallbackTextures(): void {
    const fallbackTextures = [
      this.createFallbackTexture(),
      this.createFallbackTexture(),
      this.createFallbackTexture(),
      this.createFallbackTexture(),
      this.createFallbackTexture(),
    ];

    this.asteroidTextures = fallbackTextures;
    this.materialReady = true;
    this.uniforms.asteroidTextures.value = this.asteroidTextures;
    this.needsUpdate = true;
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
   * Loads textures from provided paths.
   */
  loadTexturesFromPaths(texturePaths: string[]): void {
    this.loadTextures(texturePaths);
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
