import * as THREE from "three";

// Import the NEW simple texture shaders
// @ts-ignore
import simpleVertexShaderSource from "../../../shaders/terrestrial/simple_texture.vertex.glsl?raw";
// @ts-ignore
import simpleFragmentShaderSource from "../../../shaders/terrestrial/simple_texture.fragment.glsl?raw";

// Define uniforms for the simple texture shader
interface SimpleTextureUniforms {
  colorMap: { value: THREE.Texture | null };
  normalMap: { value: THREE.Texture | null };
  heightMap: { value: THREE.Texture | null };
  displacementScale: { value: number };
  normalScale: { value: THREE.Vector2 };
  ambientIntensity: { value: number };
  diffuseIntensity: { value: number };
  specularIntensity: { value: number };
  shininess: { value: number };
  lightDirection: { value: THREE.Vector3 };
  lightColor: { value: THREE.Color };
  [key: string]: { value: any };
}

/**
 * Material for rendering pre-baked terrestrial planet textures
 */
export class TexturedPlanetMaterial extends THREE.ShaderMaterial {
  uniforms: SimpleTextureUniforms;

  constructor(
    options: {
      colorMap?: THREE.Texture | null;
      normalMap?: THREE.Texture | null;
      heightMap?: THREE.Texture | null;
      displacementScale?: number;
      normalScale?: THREE.Vector2;
      ambientIntensity?: number;
      diffuseIntensity?: number;
      specularIntensity?: number;
      shininess?: number;
      lightDirection?: THREE.Vector3;
      lightColor?: THREE.Color;
    } = {},
  ) {
    const uniforms: SimpleTextureUniforms = {
      colorMap: { value: options.colorMap ?? null },
      normalMap: { value: options.normalMap ?? null },
      heightMap: { value: options.heightMap ?? null },
      displacementScale: { value: options.displacementScale ?? 0.0 },
      normalScale: {
        value: options.normalScale ?? new THREE.Vector2(1.5, 1.5),
      },
      ambientIntensity: { value: options.ambientIntensity ?? 0.3 },
      diffuseIntensity: { value: options.diffuseIntensity ?? 0.9 },
      specularIntensity: { value: options.specularIntensity ?? 0.35 },
      shininess: { value: options.shininess ?? 15 },
      lightDirection: {
        value: options.lightDirection ?? new THREE.Vector3(1, 1, 1).normalize(),
      },
      lightColor: { value: options.lightColor ?? new THREE.Color(0xffffff) },
    };

    super({
      uniforms: uniforms,
      vertexShader: simpleVertexShaderSource,
      fragmentShader: simpleFragmentShaderSource,
      side: THREE.FrontSide,
    });
    this.uniforms = uniforms;
  }

  update(lightDirectionView: THREE.Vector3, lightColor?: THREE.Color): void {
    this.uniforms.lightDirection.value.copy(lightDirectionView);
    if (lightColor) {
      this.uniforms.lightColor.value.copy(lightColor);
    }
  }

  /**
   * Set the normal map scale to control bump intensity
   * @param scale Value between 0-2, where 0 is flat and 2 is maximum bump effect
   */
  setNormalScale(scale: number): void {
    this.uniforms.normalScale.value.set(scale, scale);
  }

  /**
   * Adjust all lighting parameters for a specific visual style
   * @param style Preset style identifier: 'default', 'dramatic', 'soft', 'harsh'
   */
  setLightingStyle(style: "default" | "dramatic" | "soft" | "harsh"): void {
    switch (style) {
      case "dramatic":
        this.uniforms.ambientIntensity.value = 0.25;
        this.uniforms.diffuseIntensity.value = 1.0;
        this.uniforms.specularIntensity.value = 0.6;
        this.uniforms.shininess.value = 20;
        this.uniforms.normalScale.value.set(1.7, 1.7);
        break;
      case "soft":
        this.uniforms.ambientIntensity.value = 0.4;
        this.uniforms.diffuseIntensity.value = 0.7;
        this.uniforms.specularIntensity.value = 0.25;
        this.uniforms.shininess.value = 8;
        this.uniforms.normalScale.value.set(1.0, 1.0);
        break;
      case "harsh":
        this.uniforms.ambientIntensity.value = 0.35;
        this.uniforms.diffuseIntensity.value = 1.0;
        this.uniforms.specularIntensity.value = 0.45;
        this.uniforms.shininess.value = 25;
        this.uniforms.normalScale.value.set(1.7, 1.7);
        break;
      case "default":
      default:
        this.uniforms.ambientIntensity.value = 0.3;
        this.uniforms.diffuseIntensity.value = 0.9;
        this.uniforms.specularIntensity.value = 0.35;
        this.uniforms.shininess.value = 15;
        this.uniforms.normalScale.value.set(1.5, 1.5);
        break;
    }
  }

  dispose(): void {
    super.dispose();
    this.uniforms.colorMap.value?.dispose();
    this.uniforms.normalMap.value?.dispose();
    this.uniforms.heightMap.value?.dispose();
  }
}
