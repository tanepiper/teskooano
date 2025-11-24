import * as THREE from "three";
import { MeshBasicNodeMaterial } from "three/webgpu";
import {
  uniform,
  texture,
  uv,
  color as colorNode,
  mul,
  float,
} from "three/tsl";

export interface AsteroidFieldMaterialOptions {
  asteroidTextures?: THREE.Texture[];
  alphaTest?: number;
  particleRotationSpeed?: number;
  renderScale?: number;
}

/**
 * TSL-based asteroid field material for WebGPU rendering.
 * Simplified material for instanced particle rendering with texture support.
 */
export class AsteroidFieldNodeMaterial extends MeshBasicNodeMaterial {
  private asteroidTextures: THREE.Texture[] = [];
  private textureLoader: THREE.TextureLoader;
  private loadedTextureCount = 0;
  private materialReady = false;
  private timeUniform: any;
  private renderScaleUniform: any;

  constructor(options: AsteroidFieldMaterialOptions = {}) {
    super();

    console.log(
      "[AsteroidFieldNodeMaterial] Creating WebGPU TSL asteroid field material",
    );

    // Initialize uniforms
    this.timeUniform = uniform(0.0);
    this.renderScaleUniform = uniform(options.renderScale ?? 1.0);

    this.textureLoader = new THREE.TextureLoader();

    // If textures provided, use them
    if (options.asteroidTextures && options.asteroidTextures.length > 0) {
      this.asteroidTextures = options.asteroidTextures;
      this.materialReady = true;

      // Use first texture as base (TSL will handle this automatically via material.map)
      if (this.asteroidTextures[0]) {
        this.map = this.asteroidTextures[0];
      }
    } else {
      // Create fallback textures
      this.createFallbackTextures();
    }

    // Material settings for particle rendering
    this.transparent = false;
    this.depthWrite = false;
    this.side = THREE.FrontSide;

    // Vertex colors enabled (handled automatically by MeshBasicNodeMaterial)
    this.vertexColors = true;

    this.needsUpdate = true;
  }

  /**
   * Creates fallback textures for asteroid rendering
   */
  private createFallbackTextures(): void {
    console.log("[AsteroidFieldNodeMaterial] Creating fallback textures");

    const textureCount = 5;
    this.asteroidTextures = [];

    for (let i = 0; i < textureCount; i++) {
      this.asteroidTextures.push(this.createFallbackTexture());
    }

    // Use first texture as base
    if (this.asteroidTextures[0]) {
      this.map = this.asteroidTextures[0];
    }

    this.materialReady = true;
    this.needsUpdate = true;
  }

  /**
   * Creates a single fallback texture for asteroid rendering
   */
  private createFallbackTexture(): THREE.Texture {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Could not get 2D context for fallback texture");
    }

    // Brown asteroid base color
    ctx.fillStyle = "#8B7355";
    ctx.fillRect(0, 0, 64, 64);

    // Add some noise for surface detail
    const imageData = ctx.getImageData(0, 0, 64, 64);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const noise = Math.random() * 40 - 20;
      data[i] = Math.max(0, Math.min(255, data[i] + noise)); // R
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // G
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // B
    }

    // Add some darker spots for craters
    for (let i = 0; i < 10; i++) {
      const x = Math.floor(Math.random() * 64);
      const y = Math.floor(Math.random() * 64);
      const radius = Math.floor(Math.random() * 8) + 2;

      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.putImageData(imageData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    return texture;
  }

  /**
   * Load textures from paths
   */
  loadTexturesFromPaths(texturePaths: string[]): void {
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

            // Update base texture
            if (this.asteroidTextures[0]) {
              this.map = this.asteroidTextures[0];
            }

            this.needsUpdate = true;
          }
        },
        undefined,
        (error) => {
          console.error(`Failed to load texture ${path}:`, error);
          this.asteroidTextures[index] = this.createFallbackTexture();
          this.loadedTextureCount++;

          if (this.loadedTextureCount === texturePaths.length) {
            this.materialReady = true;

            if (this.asteroidTextures[0]) {
              this.map = this.asteroidTextures[0];
            }

            this.needsUpdate = true;
          }
        },
      );
    });
  }

  /**
   * Update time uniform (for animation)
   */
  updateTime(time: number): void {
    this.timeUniform.value = time;
  }

  /**
   * Update render scale
   */
  updateRenderScale(scale: number): void {
    this.renderScaleUniform.value = scale;
  }

  /**
   * Update belt rotation angle (handled externally via instance matrices)
   */
  updateBeltRotation(angle: number): void {
    // Belt rotation is handled by instance matrix transformations
    // This method is kept for API compatibility
  }

  /**
   * Update particle rotation speed (handled externally)
   */
  updateParticleRotationSpeed(speed: number): void {
    // Particle rotation is handled by instance matrix transformations
    // This method is kept for API compatibility
  }

  /**
   * Check if material is ready
   */
  isMaterialReady(): boolean {
    return this.materialReady;
  }

  /**
   * Get asteroid textures
   */
  getAsteroidTextures(): THREE.Texture[] {
    return this.asteroidTextures;
  }

  dispose(): void {
    // Dispose textures
    this.asteroidTextures.forEach((texture) => {
      if (texture) {
        texture.dispose();
      }
    });

    this.asteroidTextures = [];

    super.dispose();
  }
}
