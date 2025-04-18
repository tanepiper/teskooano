import * as THREE from 'three';
import { TextureGeneratorBase } from './TextureGeneratorBase';
import { StarTextureOptions, TextureResult } from './TextureTypes';
import { SpectralClass } from '@teskooano/data-types';

/**
 * Generator for star textures
 */
export class StarTextureGenerator extends TextureGeneratorBase {
  /**
   * Generate a star texture
   * 
   * @param options Options for generating the star texture
   * @returns The generated texture result with color map
   */
  public generateTexture(options: StarTextureOptions): TextureResult {
    // Use the cache mechanism from base class
    return this.getOrCreateTexture(options, (opts) => this.createStarTexture(opts));
  }
  
  /**
   * Create the actual texture for a star
   * 
   * @param options Options for the star texture
   * @returns The texture result
   */
  private createStarTexture(options: StarTextureOptions): TextureResult {
    const { 
      spectralClass,
      baseColor,
      surfaceIntensity = 0.8,
      spotIntensity = 0.5,
      textureSize = 1024,
      seed = Math.random() * 10000,
      generateMipmaps = true
    } = options;
    
    // Use spectralClass to determine the base color if not provided
    const starColor = baseColor instanceof THREE.Color 
      ? baseColor 
      : new THREE.Color(this.getColorForSpectralClass(spectralClass || SpectralClass.G));
    
    // Create a material for the star surface
    const material = new THREE.ShaderMaterial({
      uniforms: {
        baseColor: { value: starColor },
        surfaceIntensity: { value: surfaceIntensity },
        spotIntensity: { value: spotIntensity },
        seed: { value: seed }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 baseColor;
        uniform float surfaceIntensity;
        uniform float spotIntensity;
        uniform float seed;
        varying vec2 vUv;
        
        // Noise function
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }
        
        void main() {
          // Create star surface granulation
          float noise = hash(vUv * 100.0 + seed);
          float pattern = mix(1.0 - spotIntensity * 0.2, 1.0, noise);
          
          // Apply color with intensity
          vec3 color = baseColor * surfaceIntensity * pattern;
          
          // Add glow at the edges
          float dist = distance(vUv, vec2(0.5));
          float edgeGlow = 1.0 - smoothstep(0.4, 0.5, dist);
          color = mix(color * 0.8, color * 1.2, edgeGlow);
          
          gl_FragColor = vec4(color, 1.0);
        }
      `
    });
    
    // Render the shader to a texture
    const colorMap = this.renderToTexture(material, textureSize, generateMipmaps);
    
    // Create a result with just the color map for now
    const result: TextureResult = {
      colorMap: colorMap,
      emissiveMap: colorMap // Stars emit light
    };
    
    return result;
  }
  
  /**
   * Get a base color for a star based on its spectral class
   */
  private getColorForSpectralClass(spectralClass: SpectralClass): THREE.ColorRepresentation {
    switch (spectralClass) {
      case SpectralClass.O: return 0x9bb0ff; // Blue
      case SpectralClass.B: return 0xaabfff; // Blue-white
      case SpectralClass.A: return 0xcad7ff; // White
      case SpectralClass.F: return 0xf8f7ff; // White-yellow
      case SpectralClass.G: return 0xfff4ea; // Yellow (like Sun)
      case SpectralClass.K: return 0xffd2a1; // Orange
      case SpectralClass.M: return 0xffa366; // Red
      case SpectralClass.L: return 0xff6633; // Red-brown (dim)
      case SpectralClass.T: return 0xcc3333; // Magenta/Brown (dimmer)
      case SpectralClass.Y: return 0xaa3333; // Dark Red/Infrared (dimmest)
      default: return 0xffffff; // Default white
    }
  }
} 