import { RockyType } from "@teskooano/data-types";
import * as THREE from "three";
import { TextureGeneratorBase } from "./TextureGeneratorBase";
import { SpaceRockTextureOptions, TextureResult } from "./TextureTypes";

/**
 * Generator for space rock textures (asteroids, comets, etc.)
 */
export class SpaceRockTextureGenerator extends TextureGeneratorBase {
  /**
   * Generate a space rock texture
   *
   * @param options Options for generating the space rock texture
   * @returns The generated texture result with color and normal maps
   */
  public generateTexture(options: SpaceRockTextureOptions): TextureResult {
    return this.getOrCreateTexture(options, (opts) =>
      this.createSpaceRockTexture(opts),
    );
  }

  /**
   * Create the actual texture for a space rock
   *
   * @param options Options for the space rock texture
   * @returns The texture result
   */
  private createSpaceRockTexture(
    options: SpaceRockTextureOptions,
  ): TextureResult {
    const {
      type,
      baseColor = this.getBaseColorForType(type),
      featureColor = new THREE.Color(0x555555),
      roughness = 0.8,
      metalness = type === RockyType.METALLIC ? 0.6 : 0.1,
      textureSize = 1024,
      seed = Math.random() * 10000,
      generateMipmaps = true,
    } = options;

    const material = new THREE.ShaderMaterial({
      uniforms: {
        baseColor: { value: new THREE.Color(baseColor) },
        featureColor: { value: new THREE.Color(featureColor) },
        roughnessValue: { value: roughness },
        metalnessValue: { value: metalness },
        seed: { value: seed },
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
        uniform vec3 featureColor;
        uniform float roughnessValue;
        uniform float metalnessValue;
        uniform float seed;
        varying vec2 vUv;
        
        
        float hash(float n) {
          return fract(sin(n) * 43758.5453123);
        }
        
        
        float noise(vec2 p) {
          vec2 ip = floor(p);
          vec2 fp = fract(p);
          fp = fp * fp * (3.0 - 2.0 * fp);
          
          float n = ip.x + ip.y * 57.0;
          float a = hash(n + seed);
          float b = hash(n + 1.0 + seed);
          float c = hash(n + 57.0 + seed);
          float d = hash(n + 58.0 + seed);
          
          return mix(mix(a, b, fp.x), mix(c, d, fp.x), fp.y);
        }
        
        
        float fractalNoise(vec2 p) {
          float f = 0.0;
          f += 0.5000 * noise(p * 1.0);
          f += 0.2500 * noise(p * 2.0);
          f += 0.1250 * noise(p * 4.0);
          f += 0.0625 * noise(p * 8.0);
          return f;
        }
        
        void main() {
          
          float n = fractalNoise(vUv * 10.0);
          
          
          float craters = smoothstep(0.4, 0.6, noise(vUv * 8.0));
          
          
          vec3 color = mix(baseColor, featureColor, n * 0.5);
          color = mix(color, featureColor * 0.8, craters * 0.3);
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
    });

    const colorMap = this.renderToTexture(
      material,
      textureSize,
      generateMipmaps,
    );

    const result: TextureResult = {
      colorMap: colorMap,
    };

    return result;
  }

  /**
   * Get a base color based on the rock type
   */
  private getBaseColorForType(type: RockyType): THREE.ColorRepresentation {
    switch (type) {
      case RockyType.ICE:
        return 0xd0e0f0;
      case RockyType.METALLIC:
        return 0x8c8c8c;
      case RockyType.LIGHT_ROCK:
        return 0xb0a090;
      case RockyType.DARK_ROCK:
        return 0x605040;
      case RockyType.ICE_DUST:
        return 0xb0b8c0;
      case RockyType.DUST:
        return 0xa09080;
      default:
        return 0x808080;
    }
  }
}
