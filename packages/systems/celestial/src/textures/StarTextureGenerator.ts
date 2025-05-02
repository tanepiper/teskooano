import * as THREE from "three";
import { TextureGeneratorBase } from "./TextureGeneratorBase";
import { StarTextureOptions, TextureResult } from "./TextureTypes";
import { SpectralClass } from "@teskooano/data-types";

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
    return this.getOrCreateTexture(options, (opts) =>
      this.createStarTexture(opts),
    );
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
      generateMipmaps = true,
    } = options;

    const starColor =
      baseColor instanceof THREE.Color
        ? baseColor
        : new THREE.Color(
            this.getColorForSpectralClass(spectralClass || SpectralClass.G),
          );

    const material = new THREE.ShaderMaterial({
      uniforms: {
        baseColor: { value: starColor },
        surfaceIntensity: { value: surfaceIntensity },
        spotIntensity: { value: spotIntensity },
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
        uniform float surfaceIntensity;
        uniform float spotIntensity;
        uniform float seed;
        varying vec2 vUv;
        
        
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }
        
        void main() {
          
          float noise = hash(vUv * 100.0 + seed);
          float pattern = mix(1.0 - spotIntensity * 0.2, 1.0, noise);
          
          
          vec3 color = baseColor * surfaceIntensity * pattern;
          
          
          float dist = distance(vUv, vec2(0.5));
          float edgeGlow = 1.0 - smoothstep(0.4, 0.5, dist);
          color = mix(color * 0.8, color * 1.2, edgeGlow);
          
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
      emissiveMap: colorMap,
    };

    return result;
  }

  /**
   * Get a base color for a star based on its spectral class
   */
  private getColorForSpectralClass(
    spectralClass: SpectralClass,
  ): THREE.ColorRepresentation {
    switch (spectralClass) {
      case SpectralClass.O:
        return 0x9bb0ff;
      case SpectralClass.B:
        return 0xaabfff;
      case SpectralClass.A:
        return 0xcad7ff;
      case SpectralClass.F:
        return 0xf8f7ff;
      case SpectralClass.G:
        return 0xfff4ea;
      case SpectralClass.K:
        return 0xffd2a1;
      case SpectralClass.M:
        return 0xffa366;
      case SpectralClass.L:
        return 0xff6633;
      case SpectralClass.T:
        return 0xcc3333;
      case SpectralClass.Y:
        return 0xaa3333;
      default:
        return 0xffffff;
    }
  }
}
