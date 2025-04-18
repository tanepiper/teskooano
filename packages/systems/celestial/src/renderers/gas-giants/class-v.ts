import type {
  CelestialObject,
  GasGiantProperties,
} from "@teskooano/data-types";
import * as THREE from "three";
import { BaseGasGiantMaterial, BaseGasGiantRenderer } from "./base-gas-giant";
import { TextureFactory } from "../../textures/TextureFactory";

// Import the new Class V shaders
import classVFragmentShader from "../../shaders/gas-giants/class-v.fragment.glsl";
import classVVertexShader from "../../shaders/gas-giants/class-v.vertex.glsl";
import { RenderableCelestialObject } from "@teskooano/renderer-threejs";

/**
 * Material for Class V gas giants (Silicate Clouds / Bright / Glowing)
 * High albedo, includes emissive component for heat.
 */
class ClassVMaterial extends BaseGasGiantMaterial {
  constructor(options: {
    baseColor: THREE.Color; // Bright reflective color
    emissiveColor: THREE.Color; // Glow color
    emissiveIntensity: number; // Glow strength
    stormMap?: THREE.Texture; // Optional storm texture
  }) {
    super({
      uniforms: {
        baseColor: { value: options.baseColor },
        emissiveColor: { value: options.emissiveColor },
        emissiveIntensity: { value: options.emissiveIntensity },
        time: { value: 0 },
        sunPosition: { value: new THREE.Vector3(0, 0, 0) },
        // Storm texture uniforms
        stormMap: { value: options.stormMap },
        hasStormMap: { value: !!options.stormMap },
      },
      vertexShader: classVVertexShader,
      fragmentShader: classVFragmentShader,
    });
  }

  updateLOD(lodLevel: number): void {}
}

/**
 * Renderer for Class V gas giants
 */
export class ClassVGasGiantRenderer extends BaseGasGiantRenderer {
  // private textureCache: Map<string, THREE.Texture> = new Map(); // Removed texture cache

  protected getMaterial(
    object: RenderableCelestialObject,
  ): BaseGasGiantMaterial {
    const properties = object.properties as GasGiantProperties;

    // Generate deterministic seed from object id
    const seed = object.celestialObjectId
      ? object.celestialObjectId
          .split("")
          .reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
      : Math.random() * 10000;

    // Default to a bright off-white/pale yellow for silicate clouds
    const baseColor = properties.atmosphereColor
      ? new THREE.Color(properties.atmosphereColor)
      : new THREE.Color(0xfff8dc); // Cornsilk / Pale Yellowish default

    // Default emissive properties - use object props if available
    const emissiveColor = properties.emissiveColor
      ? new THREE.Color(properties.emissiveColor)
      : new THREE.Color(0xff6600); // Dull Orange/Red default glow
    const emissiveIntensity = properties.emissiveIntensity ?? 0.1; // Default faint glow

    // Check if we should use a texture overlay (e.g., for storms)
    let stormMap: THREE.Texture | undefined = undefined;
    if (properties.stormColor) {
      // Get storm texture from TextureFactory
      const stormTexture = TextureFactory.generateGasGiantTexture({
        class: properties.gasGiantClass,
        baseColor: baseColor,
        secondaryColor: new THREE.Color(properties.stormColor),
        seed: seed,
      });
      stormMap = stormTexture.colorMap;
    }

    return new ClassVMaterial({
      baseColor: baseColor,
      emissiveColor: emissiveColor,
      emissiveIntensity: emissiveIntensity,
      stormMap: stormMap,
    });
  }

  // Removed override update
  // Removed override dispose
}
