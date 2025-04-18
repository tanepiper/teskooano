import type { GasGiantProperties } from "@teskooano/data-types";
import * as THREE from "three";
import { TextureFactory } from "../../textures/TextureFactory";
import { BaseGasGiantMaterial, BaseGasGiantRenderer } from "./base-gas-giant";

// Import the new Class III shaders
import { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import classIIIFragmentShader from "../../shaders/gas-giants/class-iii.fragment.glsl";
import classIIIVertexShader from "../../shaders/gas-giants/class-iii.vertex.glsl";

/**
 * Material for Class III gas giants (Cloudless / Azure)
 * Uses simple lighting and rim effect.
 */
class ClassIIIMaterial extends BaseGasGiantMaterial {
  constructor(options: {
    baseColor: THREE.Color; // The main azure/blue color
    stormMap?: THREE.Texture; // Optional storm texture
  }) {
    super({
      uniforms: {
        // Pass the base color to the shader
        baseColor: { value: options.baseColor },

        // Uniforms required by the base material/vertex shader
        time: { value: 0 }, // Still needed for Base class update method
        sunPosition: { value: new THREE.Vector3(0, 0, 0) }, // Updated by Base

        // Storm texture uniforms
        stormMap: { value: options.stormMap },
        hasStormMap: { value: !!options.stormMap },
      },
      vertexShader: classIIIVertexShader, // Use Class III vertex shader
      fragmentShader: classIIIFragmentShader, // Use Class III fragment shader
    });
  }

  // No updateLOD needed as this shader doesn't use noise octaves
  updateLOD(lodLevel: number): void {
    // Do nothing
  }
}

/**
 * Renderer for Class III gas giants
 */
export class ClassIIIGasGiantRenderer extends BaseGasGiantRenderer {
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

    // Determine the base color. Use property if available, otherwise default pale cyan.
    const baseColor = properties.atmosphereColor
      ? new THREE.Color(properties.atmosphereColor)
      : new THREE.Color(0xafdbf5); // Changed default to a paler cyan/blue (was 0x2B65EC)

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

    // Return the new Class III material
    return new ClassIIIMaterial({
      baseColor: baseColor,
      stormMap: stormMap,
    });
  }

  // Base class update and dispose are sufficient
}
