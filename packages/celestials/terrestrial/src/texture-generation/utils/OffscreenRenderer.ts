/**
 * OffscreenRenderer - WebGL render-to-texture utility.
 *
 * Provides off-screen rendering capabilities for generating textures
 * using shader-based computation.
 *
 * @module texture-generation/utils/OffscreenRenderer
 */

import * as THREE from "three";
import type { TextureResolution } from "../types";

/**
 * Fullscreen quad vertex shader for texture generation.
 */
const FULLSCREEN_VERTEX_SHADER = `
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
}
`;

/**
 * Options for creating an offscreen render target.
 */
export interface RenderTargetOptions {
  /** Texture format */
  format?: THREE.PixelFormat;
  /** Texture type */
  type?: THREE.TextureDataType;
  /** Min filter */
  minFilter?: THREE.TextureFilter;
  /** Mag filter */
  magFilter?: THREE.TextureFilter;
  /** Wrap mode S */
  wrapS?: THREE.Wrapping;
  /** Wrap mode T */
  wrapT?: THREE.Wrapping;
  /** Generate mipmaps */
  generateMipmaps?: boolean;
}

/**
 * Shared singleton instance of OffscreenRenderer to avoid creating multiple WebGL contexts.
 * This instance persists for the lifetime of the application and should not be disposed
 * by individual TerrainTextureGenerator instances.
 */
let sharedOffscreenRenderer: OffscreenRenderer | null = null;

/**
 * OffscreenRenderer provides GPU-accelerated texture generation.
 *
 * Uses Three.js WebGLRenderTarget to render shader output to textures
 * that can be used for terrain generation passes.
 *
 * IMPORTANT: This class should reuse the main renderer when possible to avoid
 * WebGL context loss from creating too many contexts.
 */
export class OffscreenRenderer {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private quad: THREE.Mesh;
  private isDisposed: boolean = false;
  private ownsRenderer: boolean = false; // Whether we created the renderer or it was passed in

  /**
   * Creates a new OffscreenRenderer.
   *
   * @param existingRenderer - Optional existing WebGLRenderer to use.
   *                          If not provided, creates a new one.
   *                          STRONGLY RECOMMENDED to pass the main renderer to avoid context loss.
   */
  constructor(existingRenderer?: THREE.WebGLRenderer) {
    if (existingRenderer) {
      this.renderer = existingRenderer;
      this.ownsRenderer = false;
    } else {
      // Create a minimal offscreen renderer
      // WARNING: Creating new contexts can cause context loss
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;

      try {
        this.renderer = new THREE.WebGLRenderer({
          canvas,
          antialias: false,
          alpha: false,
          preserveDrawingBuffer: true,
          powerPreference: "high-performance",
        });
        this.ownsRenderer = true;

        // Add context loss handling
        canvas.addEventListener("webglcontextlost", (event) => {
          event.preventDefault();
          console.warn("[OffscreenRenderer] WebGL context lost");
        });

        canvas.addEventListener("webglcontextrestored", () => {
          console.log("[OffscreenRenderer] WebGL context restored");
        });
      } catch (error) {
        throw new Error(
          `Failed to create WebGL renderer for texture generation: ${error}`,
        );
      }
    }

    // Create orthographic camera for fullscreen quad rendering
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Create scene
    this.scene = new THREE.Scene();

    // Create fullscreen quad geometry
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader: FULLSCREEN_VERTEX_SHADER,
      fragmentShader: "void main() { gl_FragColor = vec4(0.0); }",
    });

    this.quad = new THREE.Mesh(geometry, material);
    this.scene.add(this.quad);
  }

  /**
   * Creates a WebGLRenderTarget with the specified resolution and options.
   *
   * @param resolution - Texture resolution
   * @param options - Render target options
   * @returns The created render target
   */
  createRenderTarget(
    resolution: TextureResolution,
    options: RenderTargetOptions = {},
  ): THREE.WebGLRenderTarget {
    const {
      format = THREE.RGBAFormat,
      type = THREE.FloatType,
      minFilter = THREE.LinearFilter,
      magFilter = THREE.LinearFilter,
      wrapS = THREE.RepeatWrapping,
      wrapT = THREE.ClampToEdgeWrapping,
      generateMipmaps = false,
    } = options;

    return new THREE.WebGLRenderTarget(resolution.width, resolution.height, {
      format,
      type,
      minFilter,
      magFilter: magFilter as THREE.MagnificationTextureFilter,
      wrapS,
      wrapT,
      generateMipmaps,
      depthBuffer: false,
      stencilBuffer: false,
    });
  }

  /**
   * Renders a shader to a render target with context loss protection.
   *
   * @param fragmentShader - GLSL fragment shader source
   * @param uniforms - Shader uniforms
   * @param target - Render target to render to
   */
  renderToTarget(
    fragmentShader: string,
    uniforms: Record<string, THREE.IUniform>,
    target: THREE.WebGLRenderTarget,
  ): void {
    if (this.isDisposed) {
      throw new Error("OffscreenRenderer has been disposed");
    }

    if (!this.isContextValid()) {
      throw new Error("WebGL context is lost or invalid");
    }

    // Update quad material with new shader
    const material = new THREE.ShaderMaterial({
      vertexShader: FULLSCREEN_VERTEX_SHADER,
      fragmentShader,
      uniforms,
    });

    // Dispose old material
    (this.quad.material as THREE.Material).dispose();
    this.quad.material = material;

    // Store current render target
    const previousTarget = this.renderer.getRenderTarget();

    try {
      // Render to target
      this.renderer.setRenderTarget(target);
      this.renderer.setSize(target.width, target.height, false);
      this.renderer.render(this.scene, this.camera);
    } catch (error) {
      // Restore previous render target on error
      this.renderer.setRenderTarget(previousTarget);
      throw new Error(
        `Failed to render to target: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      // Restore previous render target
      this.renderer.setRenderTarget(previousTarget);
    }
  }

  /**
   * Reads pixel data from a render target.
   *
   * Automatically uses the correct data type based on the render target's texture type.
   *
   * For RGBFormat targets, creates a temporary RGBA render target to read from,
   * since readRenderTargetPixels requires RGBA format.
   *
   * @param target - Render target to read from
   * @returns Float32Array or Uint8Array of RGBA pixel data (depending on texture type)
   */
  readPixels(target: THREE.WebGLRenderTarget): Float32Array | Uint8Array {
    if (this.isDisposed) {
      throw new Error("OffscreenRenderer has been disposed");
    }

    if (!this.isContextValid()) {
      throw new Error("WebGL context is lost or invalid");
    }

    const width = target.width;
    const height = target.height;
    const textureType = target.texture.type;
    const textureFormat = target.texture.format;

    // Use appropriate data type based on texture type
    const pixels =
      textureType === THREE.UnsignedByteType
        ? new Uint8Array(width * height * 4)
        : new Float32Array(width * height * 4);

    // Store current render target
    const previousTarget = this.renderer.getRenderTarget();

    try {
      // If target is RGBFormat, we need to copy to RGBA first
      // because readRenderTargetPixels requires RGBA format
      if (textureFormat === THREE.RGBFormat) {
        // Create temporary RGBA render target
        const tempTarget = this.createRenderTarget(
          { width, height },
          {
            format: THREE.RGBAFormat,
            type: textureType,
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            wrapS: target.texture.wrapS,
            wrapT: target.texture.wrapT,
          },
        );

        // Copy RGB to RGBA using a pass-through shader
        const passThroughShader = `
          precision highp float;
          varying vec2 vUv;
          uniform sampler2D uTexture;
          void main() {
            vec3 rgb = texture2D(uTexture, vUv).rgb;
            gl_FragColor = vec4(rgb, 1.0);
          }
        `;

        this.renderToTarget(
          passThroughShader,
          { uTexture: { value: target.texture } },
          tempTarget,
        );

        // Read from temporary RGBA target
        this.renderer.setRenderTarget(tempTarget);
        this.renderer.readRenderTargetPixels(
          tempTarget,
          0,
          0,
          width,
          height,
          pixels,
        );

        // Immediately dispose temporary target to free memory
        tempTarget.dispose();
        // Force garbage collection hint (if available)
        if (typeof gc !== "undefined") {
          gc();
        }
      } else {
        // Direct read for RGBAFormat targets
        this.renderer.setRenderTarget(target);
        this.renderer.readRenderTargetPixels(
          target,
          0,
          0,
          width,
          height,
          pixels,
        );
      }
    } catch (error) {
      // Restore previous render target on error
      this.renderer.setRenderTarget(previousTarget);
      throw new Error(
        `Failed to read pixels: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      // Restore previous render target
      this.renderer.setRenderTarget(previousTarget);
    }

    return pixels;
  }

  /**
   * Reads only the red channel from a render target as a height map.
   *
   * Assumes the render target uses FloatType (for height maps).
   *
   * @param target - Render target to read from
   * @returns Float32Array of height values (single channel)
   */
  readHeightMap(target: THREE.WebGLRenderTarget): Float32Array {
    const pixels = this.readPixels(target);
    const width = target.width;
    const height = target.height;
    const heightMap = new Float32Array(width * height);

    // Handle both Float32Array and Uint8Array (though height maps should be FloatType)
    if (pixels instanceof Float32Array) {
      for (let i = 0; i < width * height; i++) {
        heightMap[i] = pixels[i * 4]; // Red channel
      }
    } else {
      // Convert Uint8Array to float (0-255 -> 0-1)
      for (let i = 0; i < width * height; i++) {
        heightMap[i] = pixels[i * 4] / 255.0; // Red channel, normalized
      }
    }

    return heightMap;
  }

  /**
   * Creates a texture from a Float32Array height map.
   *
   * @param heightMap - Height map data (single channel)
   * @param resolution - Texture resolution
   * @returns THREE.DataTexture containing the height map
   */
  createHeightMapTexture(
    heightMap: Float32Array,
    resolution: TextureResolution,
  ): THREE.DataTexture {
    // Convert single channel to RGBA
    const data = new Float32Array(heightMap.length * 4);
    for (let i = 0; i < heightMap.length; i++) {
      const h = heightMap[i];
      data[i * 4] = h; // R
      data[i * 4 + 1] = h; // G
      data[i * 4 + 2] = h; // B
      data[i * 4 + 3] = 1; // A
    }

    const texture = new THREE.DataTexture(
      data,
      resolution.width,
      resolution.height,
      THREE.RGBAFormat,
      THREE.FloatType,
    );
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;

    return texture;
  }

  /**
   * Creates a regular texture from pixel data.
   *
   * @param pixels - Pixel data (RGBA format from readPixels, but will be converted based on format)
   * @param resolution - Texture resolution
   * @param format - Texture format (default: RGBAFormat)
   * @param type - Texture data type (default: FloatType)
   * @returns THREE.DataTexture
   */
  createTextureFromPixels(
    pixels: Float32Array | Uint8Array,
    resolution: TextureResolution,
    format: THREE.PixelFormat = THREE.RGBAFormat,
    type: THREE.TextureDataType = THREE.FloatType,
  ): THREE.DataTexture {
    // For RGBFormat, convert RGBA data to RGB
    let textureData: Float32Array | Uint8Array = pixels;
    if (
      format === THREE.RGBFormat &&
      pixels.length === resolution.width * resolution.height * 4
    ) {
      const pixelCount = resolution.width * resolution.height;
      if (type === THREE.FloatType) {
        const rgbData = new Float32Array(pixelCount * 3);
        for (let i = 0; i < pixelCount; i++) {
          rgbData[i * 3] = pixels[i * 4]; // R
          rgbData[i * 3 + 1] = pixels[i * 4 + 1]; // G
          rgbData[i * 3 + 2] = pixels[i * 4 + 2]; // B
        }
        textureData = rgbData;
      } else {
        const rgbData = new Uint8Array(pixelCount * 3);
        for (let i = 0; i < pixelCount; i++) {
          rgbData[i * 3] = pixels[i * 4]; // R
          rgbData[i * 3 + 1] = pixels[i * 4 + 1]; // G
          rgbData[i * 3 + 2] = pixels[i * 4 + 2]; // B
        }
        textureData = rgbData;
      }
    }

    const texture = new THREE.DataTexture(
      textureData,
      resolution.width,
      resolution.height,
      format,
      type,
    );
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    texture.needsUpdate = true;

    return texture;
  }

  /**
   * Converts a render target's texture to a regular texture.
   * This allows the render target to be disposed while keeping the texture.
   *
   * Preserves the format and type of the original render target.
   *
   * @param target - Render target to convert
   * @returns A new texture with the same content, format, and type
   */
  detachTexture(target: THREE.WebGLRenderTarget): THREE.DataTexture {
    const pixels = this.readPixels(target);
    const format = target.texture.format as THREE.PixelFormat;
    const type = target.texture.type as THREE.TextureDataType;
    return this.createTextureFromPixels(
      pixels,
      {
        width: target.width,
        height: target.height,
      },
      format,
      type,
    );
  }

  /**
   * Gets the WebGL renderer instance.
   */
  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  /**
   * Gets whether this renderer has been disposed.
   */
  get disposed(): boolean {
    return this.isDisposed;
  }

  /**
   * Disposes of the renderer and associated resources.
   *
   * IMPORTANT: If this is the shared instance, disposal is prevented
   * to avoid breaking other generators that are using it.
   */
  dispose(): void {
    if (this.isDisposed) return;

    // Never dispose the shared instance - it's used by multiple generators
    if (this === sharedOffscreenRenderer) {
      // Don't dispose - shared instance must persist
      return;
    }

    this.isDisposed = true;

    // Dispose quad material and geometry
    (this.quad.material as THREE.Material).dispose();
    this.quad.geometry.dispose();

    // Clear scene
    this.scene.clear();

    // Only dispose renderer if we created it
    if (this.ownsRenderer) {
      this.renderer.dispose();
    }
  }

  /**
   * Gets or creates a shared OffscreenRenderer instance.
   * This helps avoid creating multiple WebGL contexts.
   *
   * The shared instance persists for the application lifetime and should
   * NOT be disposed by individual generators.
   *
   * @param existingRenderer - Optional renderer to use (recommended)
   * @returns Shared OffscreenRenderer instance
   */
  static getSharedInstance(
    existingRenderer?: THREE.WebGLRenderer,
  ): OffscreenRenderer {
    if (!sharedOffscreenRenderer || sharedOffscreenRenderer.disposed) {
      sharedOffscreenRenderer = new OffscreenRenderer(existingRenderer);
    } else if (
      existingRenderer &&
      sharedOffscreenRenderer.renderer !== existingRenderer
    ) {
      // If a different renderer is provided, update the shared instance
      // (though ideally we should reuse the same renderer)
      console.warn(
        "[OffscreenRenderer] Shared instance already exists with different renderer. Consider reusing the same renderer.",
      );
    }

    // Check if context is still valid
    if (sharedOffscreenRenderer && !sharedOffscreenRenderer.isContextValid()) {
      console.warn(
        "[OffscreenRenderer] Shared instance has lost context, recreating...",
      );
      if (!sharedOffscreenRenderer.disposed) {
        // Mark as disposed but don't actually dispose resources
        // since we're about to recreate
        (sharedOffscreenRenderer as any).isDisposed = true;
      }
      sharedOffscreenRenderer = new OffscreenRenderer(existingRenderer);
    }

    return sharedOffscreenRenderer;
  }

  /**
   * Checks if the WebGL context is still valid.
   */
  isContextValid(): boolean {
    try {
      const gl = this.renderer.getContext();
      return gl !== null && !gl.isContextLost();
    } catch {
      return false;
    }
  }
}
