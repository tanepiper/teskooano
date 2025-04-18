import type { GasGiantProperties } from "@teskooano/data-types";
import * as THREE from "three";
import { BaseGasGiantMaterial, BaseGasGiantRenderer } from "./base-gas-giant";

// Import the new Class II shaders
import { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import classIIFragmentShader from "../../shaders/gas-giants/class-ii.fragment.glsl";
import classIIVertexShader from "../../shaders/gas-giants/class-ii.vertex.glsl";

// Map LOD level (0-3) to number of noise octaves (copied from class-i.ts)
const lodToOctaveMap = [
  2, // very-low (LOD 0)
  3, // low (LOD 1)
  5, // medium (LOD 2)
  8, // high (LOD 3)
];

/**
 * Material for Class II gas giants (Water Clouds) - Using the new shaders
 */
class ClassIIMaterial extends BaseGasGiantMaterial {
  // Store the mapped octave counts for warping and color noise
  private warpOctaves: number = 5; // Default matching shader
  private colorOctaves: number = 3; // Default matching shader

  constructor(options: {
    atmosphereColor: THREE.Color; // Maps to mainColor1
    cloudColor: THREE.Color; // Maps to mainColor2
    seed: string | number;
    textures?: {
      // New option for textures
      stormMap?: THREE.Texture;
      cloudMap?: THREE.Texture;
      detailMap?: THREE.Texture;
    };
  }) {
    // Derive a dark color - use a slightly different factor for variety?
    const darkColor = options.atmosphereColor.clone().multiplyScalar(0.35); // Darken atmosphere

    super({
      uniforms: {
        // Map colors to shader uniforms
        mainColor1: { value: options.atmosphereColor },
        mainColor2: { value: options.cloudColor },
        darkColor: { value: darkColor },

        uSeed: { value: options.seed },

        // Base uniforms
        time: { value: 0 },
        sunPosition: { value: new THREE.Vector3(0, 0, 0) },

        // LOD uniforms
        uWarpOctaves: { value: 5 }, // Default
        uColorOctaves: { value: 3 }, // Default

        // Texture uniforms
        stormMap: { value: options.textures?.stormMap },
        hasStormMap: { value: !!options.textures?.stormMap },
      },
      vertexShader: classIIVertexShader, // Use Class II vertex shader
      fragmentShader: classIIFragmentShader, // Use Class II fragment shader
    });
  }

  // Override updateLOD to set the octave uniforms (copied from class-i.ts)
  updateLOD(lodLevel: number): void {
    const level = Math.max(0, Math.min(lodLevel, lodToOctaveMap.length - 1));

    // Using the same mapping logic as Class I for now
    const newWarpOctaves = lodToOctaveMap[level];
    // Slightly different mapping for color octaves for variety?
    const newColorOctaves = lodToOctaveMap[Math.max(0, level)]; // Less reduction than Class I?

    if (newWarpOctaves !== this.warpOctaves) {
      this.uniforms.uWarpOctaves.value = newWarpOctaves;
      this.warpOctaves = newWarpOctaves;
    }
    if (newColorOctaves !== this.colorOctaves) {
      this.uniforms.uColorOctaves.value = newColorOctaves;
      this.colorOctaves = newColorOctaves;
    }
  }

  // Override dispose to clean up textures
  dispose(): void {
    // Dispose textures if they exist
    if (this.uniforms.stormMap?.value) {
      this.uniforms.stormMap.value.dispose();
    }
    // Other cleanup...
    super.dispose();
  }
}

/**
 * Renderer for Class II gas giants
 */
export class ClassIIGasGiantRenderer extends BaseGasGiantRenderer {
  // Removed texture cache

  protected getMaterial(
    object: RenderableCelestialObject,
  ): BaseGasGiantMaterial {
    // Return type is Base, actual is ClassII
    const properties = object.properties as GasGiantProperties;

    // Generate deterministic seed from object id or use random
    const seed = object.celestialObjectId
      ? object.celestialObjectId
          .split("")
          .reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
      : Math.random() * 10000;

    // Use default colors if properties are missing
    const atmosphereColor = properties.atmosphereColor
      ? new THREE.Color(properties.atmosphereColor)
      : new THREE.Color(0xffffe0); // Light Yellow default
    const cloudColor = properties.cloudColor
      ? new THREE.Color(properties.cloudColor)
      : new THREE.Color(0xd2b48c); // Tan/Light Brown default

    // Removed old BasicGasGiantMaterial logic

    // Return the new Class II material
    return new ClassIIMaterial({
      atmosphereColor: atmosphereColor,
      cloudColor: cloudColor,
      seed: seed,
    });
  }

  // Base class update and dispose are sufficient now
}
