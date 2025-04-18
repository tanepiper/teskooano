import * as THREE from 'three';
import { TextureGeneratorBase } from './TextureGeneratorBase';
import { GasGiantTextureOptions, TextureResult } from './TextureTypes';

/**
 * Generator for gas giant textures
 */
export class GasGiantTextureGenerator extends TextureGeneratorBase {
  /**
   * Generate a gas giant texture
   * 
   * @param options Options for generating the gas giant texture
   * @returns The generated texture result with color and normal maps
   */
  public generateTexture(options: GasGiantTextureOptions): TextureResult {
    return this.getOrCreateTexture(options, (opts) => this.createGasGiantTexture(opts));
  }
  
  /**
   * Create the actual texture for a gas giant
   * 
   * @param options Options for the gas giant texture
   * @returns The texture result
   */
  private createGasGiantTexture(options: GasGiantTextureOptions): TextureResult {
    const { 
      class: gasGiantClass,
      baseColor = new THREE.Color(0xCCBB99),
      secondaryColor = new THREE.Color(0xBBAA88),
      textureSize = 1024,
      seed = Math.random() * 10000,
      generateMipmaps = true
    } = options;
    
    // Create a material for the gas giant bands
    const material = new THREE.ShaderMaterial({
      uniforms: {
        baseColor: { value: new THREE.Color(baseColor) },
        secondaryColor: { value: new THREE.Color(secondaryColor) },
        seed: { value: seed },
        classType: { value: gasGiantClass }
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
        uniform vec3 secondaryColor;
        uniform float seed;
        uniform int classType;
        varying vec2 vUv;
        
        // Hash function for randomness
        float hash(float n) {
          return fract(sin(n) * 43758.5453123);
        }
        
        // Simple noise function
        float noise(vec2 p) {
          vec2 ip = floor(p);
          vec2 fp = fract(p);
          fp = fp * fp * (3.0 - 2.0 * fp);
          
          float n = ip.x + ip.y * 57.0;
          float a = hash(n);
          float b = hash(n + 1.0);
          float c = hash(n + 57.0);
          float d = hash(n + 58.0);
          
          return mix(mix(a, b, fp.x), mix(c, d, fp.x), fp.y);
        }
        
        void main() {
          // Number of bands varies by gas giant class
          float bandFrequency = float(classType) * 2.0 + 10.0;
          
          // Create horizontal bands
          float bandPattern = noise(vec2(vUv.y * bandFrequency + seed, vUv.x * 2.0));
          
          // Create more detail and variation
          float detail = noise(vec2(vUv.x * 20.0 + seed, vUv.y * 20.0));
          
          // Mix base and secondary colors based on the patterns
          vec3 color = mix(baseColor, secondaryColor, bandPattern * 0.7 + detail * 0.3);
          
          gl_FragColor = vec4(color, 1.0);
        }
      `
    });
    
    // Render the shader to a texture
    const colorMap = this.renderToTexture(material, textureSize, generateMipmaps);
    
    // Create a simple result with just the color map for now
    const result: TextureResult = {
      colorMap: colorMap
    };
    
    return result;
  }
} 