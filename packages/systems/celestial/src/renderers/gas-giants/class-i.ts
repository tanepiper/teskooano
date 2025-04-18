import type { GasGiantProperties } from "@teskooano/data-types";
import * as THREE from "three";
import { TextureFactory } from "../../textures/TextureFactory";
import { BaseGasGiantMaterial, BaseGasGiantRenderer } from "./base-gas-giant";

// Import placeholder shaders for Class I - these might need creation/adaptation
import { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import classIFragmentShader from "../../shaders/gas-giants/class-i.fragment.glsl";
import classIVertexShader from "../../shaders/gas-giants/class-i.vertex.glsl";

// Map LOD level (0-3) to number of noise octaves
const lodToOctaveMap = [
  2, // very-low (LOD 0)
  3, // low (LOD 1)
  5, // medium (LOD 2)
  8, // high (LOD 3)
];

/**
 * Material for Class I gas giants (Ammonia Clouds) - Jupiter-like
 * Uses 4D fractal simplex noise based on example.
 */
class ClassIMaterial extends BaseGasGiantMaterial {
  // Store the mapped octave counts for warping and color noise
  private warpOctaves: number = 5; // Default (matches shader initial value)
  private colorOctaves: number = 3; // Default (matches shader initial value)

  constructor(options: {
    atmosphereColor: THREE.Color; // Will map to mainColor1
    cloudColor: THREE.Color; // Will map to mainColor2
    seed: string | number;
    stormMap?: THREE.Texture;
  }) {
    // Derive a dark color from the atmosphere color
    const darkColor = options.atmosphereColor.clone().multiplyScalar(0.4); // Darken atmosphere

    super({
      uniforms: {
        // Map our colors to the example's expected uniforms
        mainColor1: { value: options.atmosphereColor },
        mainColor2: { value: options.cloudColor },
        darkColor: { value: darkColor }, // Pass the derived dark color

        uSeed: { value: options.seed }, // Use 'uSeed' for consistency

        // Uniforms required by the base material/vertex shader
        time: { value: 0 }, // Keep time uniform, though fragment shader won't use it
        sunPosition: { value: new THREE.Vector3(0, 0, 0) }, // Provided by BaseGasGiantMaterial update

        // Add uniforms for LOD-controlled octaves, provide defaults
        uWarpOctaves: { value: 5 }, // Default value matching initial shader
        uColorOctaves: { value: 3 }, // Default value matching initial shader

        // New uniforms for storm map
        stormMap: { value: options.stormMap },
        hasStormMap: { value: !!options.stormMap },
      },
      vertexShader: classIVertexShader, // Use the updated vertex shader
      fragmentShader: classIFragmentShader, // Use the new fragment shader (to be created next)
    });
  }

  // Override updateLOD to set the octave uniforms
  updateLOD(lodLevel: number): void {
    // Ensure lodLevel is within bounds
    const level = Math.max(0, Math.min(lodLevel, lodToOctaveMap.length - 1));

    // Map LOD level to different octave counts for warp and color
    // Example: Warp uses the direct mapping, color uses one less for less detail
    const newWarpOctaves = lodToOctaveMap[level];
    const newColorOctaves = lodToOctaveMap[Math.max(0, level - 1)]; // Use lower detail for color

    // Update uniforms only if the value changed
    if (newWarpOctaves !== this.warpOctaves) {
      this.uniforms.uWarpOctaves.value = newWarpOctaves;
      this.warpOctaves = newWarpOctaves; // Store current value
    }
    if (newColorOctaves !== this.colorOctaves) {
      this.uniforms.uColorOctaves.value = newColorOctaves;
      this.colorOctaves = newColorOctaves; // Store current value
    }
  }
}

/**
 * Renderer for Class I gas giants
 */
export class ClassIGasGiantRenderer extends BaseGasGiantRenderer {
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

    const atmosphereColor = properties.atmosphereColor
      ? new THREE.Color(properties.atmosphereColor)
      : new THREE.Color(0xffffe0);
    const cloudColor = properties.cloudColor
      ? new THREE.Color(properties.cloudColor)
      : new THREE.Color(0xd2b48c);

    // Check if we should use a texture overlay (e.g., for storms)
    let stormMap: THREE.Texture | undefined = undefined;
    if (properties.stormColor) {
      // Get storm texture from TextureFactory
      const stormTexture = TextureFactory.generateGasGiantTexture({
        class: properties.gasGiantClass,
        baseColor: atmosphereColor,
        secondaryColor: cloudColor,
        stormColor: properties.stormColor,
        seed: seed,
      });
      stormMap = stormTexture.colorMap;
    }

    // Return the material with optional storm map
    return new ClassIMaterial({
      atmosphereColor: atmosphereColor,
      cloudColor: cloudColor,
      seed: seed,
      stormMap: stormMap,
    });
  }
}
