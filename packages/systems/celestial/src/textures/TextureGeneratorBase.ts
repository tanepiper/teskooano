import * as THREE from 'three';
import { TextureResult } from './TextureTypes';

/**
 * Singleton resource manager for sharing WebGL resources
 */
export class TextureResourceManager {
  private static instance: TextureResourceManager | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private renderTargets: Map<number, THREE.WebGLRenderTarget> = new Map();
  private scene: THREE.Scene | null = null;
  private camera: THREE.OrthographicCamera | null = null;
  private initialized = false;
  
  private constructor() {}
  
  public static getInstance(): TextureResourceManager {
    if (!TextureResourceManager.instance) {
      TextureResourceManager.instance = new TextureResourceManager();
    }
    return TextureResourceManager.instance;
  }
  
  /**
   * Initialize the shared resources for texture generation
   */
  public initialize(size: number = 1024): void {
    if (this.initialized) return;
    
    try {
      // Create renderer
      this.renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        powerPreference: 'high-performance'
      });
      this.renderer.setSize(size, size);
      
      // Create render target for the specified size
      this.getRenderTarget(size);
      
      // Create simple scene with orthographic camera
      this.scene = new THREE.Scene();
      this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      this.camera.position.z = 1;
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize texture resources:', error);
      this.dispose();
      throw new Error('Failed to initialize WebGL resources for texture generation');
    }
  }
  
  /**
   * Get or create a render target of the specified size
   */
  public getRenderTarget(size: number): THREE.WebGLRenderTarget {
    if (!this.renderTargets.has(size)) {
      const renderTarget = new THREE.WebGLRenderTarget(size, size, {
        format: THREE.RGBAFormat,
        type: THREE.UnsignedByteType,
        depthBuffer: false,
        stencilBuffer: false,
        generateMipmaps: true
      });
      this.renderTargets.set(size, renderTarget);
    }
    return this.renderTargets.get(size)!;
  }
  
  /**
   * Render the scene to a texture
   */
  public renderToTexture(
    material: THREE.Material, 
    textureSize: number,
    generateMipmaps: boolean = false
  ): THREE.Texture {
    if (!this.initialized) {
      this.initialize(textureSize);
    }
    
    if (!this.renderer || !this.scene || !this.camera) {
      throw new Error('Renderer resources not properly initialized');
    }
    
    // Create a plane geometry that fills the entire camera view
    const geometry = new THREE.PlaneGeometry(2, 2);
    
    // Create mesh and add to scene
    const mesh = new THREE.Mesh(geometry, material);
    this.scene.add(mesh);
    
    // Get appropriate render target
    const renderTarget = this.getRenderTarget(textureSize);
    
    try {
      // Render to texture
      this.renderer.setRenderTarget(renderTarget);
      this.renderer.render(this.scene, this.camera);
      
      // Create a DataTexture with proper format specification
      const buffer = new Uint8Array(textureSize * textureSize * 4);
      this.renderer.readRenderTargetPixels(
        renderTarget, 
        0, 0, textureSize, textureSize, 
        buffer
      );
      
      // Create a DataTexture with proper format specification
      const texture = new THREE.DataTexture(
        buffer,
        textureSize,
        textureSize,
        THREE.RGBAFormat,
        THREE.UnsignedByteType
      );
      
      // Set appropriate texture properties
      texture.needsUpdate = true;
      texture.minFilter = generateMipmaps ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.generateMipmaps = generateMipmaps;
      
      // Reset render target
      this.renderer.setRenderTarget(null);
      
      return texture;
    } catch (error) {
      console.error('Error during texture rendering:', error);
      throw new Error('Failed to render texture');
    } finally {
      // Clean up
      if (this.scene) {
        this.scene.remove(mesh);
      }
      geometry.dispose();
    }
  }
  
  /**
   * Release all resources
   */
  public dispose(): void {
    // Dispose of all render targets
    this.renderTargets.forEach(renderTarget => {
      renderTarget.dispose();
    });
    this.renderTargets.clear();
    
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
    
    this.scene = null;
    this.camera = null;
    this.initialized = false;
  }
}

/**
 * Base class for texture generators with shared rendering resources
 */
export class TextureGeneratorBase {
  private resourceManager = TextureResourceManager.getInstance();
  private textureCache: Map<string, TextureResult> = new Map();
  
  constructor() {}
  
  /**
   * Initialize the shared resources for texture generation
   */
  protected initialize(size: number = 1024): void {
    this.resourceManager.initialize(size);
  }
  
  /**
   * Render the scene to a texture
   */
  protected renderToTexture(
    material: THREE.Material, 
    textureSize: number,
    generateMipmaps: boolean = false
  ): THREE.Texture {
    return this.resourceManager.renderToTexture(material, textureSize, generateMipmaps);
  }
  
  /**
   * Get a texture from cache or generate a new one
   */
  protected getOrCreateTexture(
    options: any, 
    generator: (opts: any) => TextureResult,
    cacheKey?: string
  ): TextureResult {
    // Create cache key from options if not provided
    if (!cacheKey) {
      cacheKey = this.createCacheKey(options);
    }
    
    // Return cached texture if available
    if (this.textureCache.has(cacheKey)) {
      return this.textureCache.get(cacheKey)!;
    }
    
    // Generate new texture
    const result = generator(options);
    
    // Cache the result
    this.textureCache.set(cacheKey, result);
    
    return result;
  }
  
  /**
   * Create a cache key from options
   */
  protected createCacheKey(options: any): string {
    return JSON.stringify(options, (key, value) => {
      // Handle non-serializable values like THREE.Color
      if (value instanceof THREE.Color) {
        return `#${value.getHexString()}`;
      }
      return value;
    });
  }
  
  /**
   * Clear the texture cache
   */
  protected clearCache(): void {
    // Dispose all cached textures
    this.textureCache.forEach(result => {
      Object.values(result).forEach(texture => {
        if (texture) {
          texture.dispose();
        }
      });
    });
    
    this.textureCache.clear();
  }
  
  /**
   * Release all resources
   */
  public dispose(): void {
    this.clearCache();
  }
} 