import * as THREE from "three";

import { PlanetType } from "@teskooano/data-types"; // Corrected import path
import { generateTerrainTexture } from "../generation/procedural-texture"; // Import the new generator
import { TextureGeneratorBase } from "./TextureGeneratorBase"; // Removed TextureData import
import { TerrestrialTextureOptions, TextureResult } from "./TextureTypes";

// Define the expected return type locally
interface GeneratedTextureData {
  colorMap: THREE.Texture;
  normalMap: THREE.Texture;
}

/**
 * Generator for terrestrial planet textures
 */
export class TerrestrialTextureGenerator extends TextureGeneratorBase {
  /**
   * Generate a terrestrial planet texture
   *
   * @param options Options for generating the terrestrial texture
   * @returns The generated texture result with color and normal maps
   */
  public generateTexture(options: TerrestrialTextureOptions): TextureResult {
    // Use the cache mechanism from base class
    return this.getOrCreateTexture(options, (opts) =>
      this.createTerrestrialTexture(opts),
    );
  }

  /**
   * Create the actual texture for a terrestrial planet
   *
   * @param options Options for the terrestrial texture
   * @returns The texture result
   */
  private createTerrestrialTexture(
    options: TerrestrialTextureOptions,
  ): TextureResult {
    const {
      type,
      surfaceColor,
      waterColor,
      cloudColor,
      cloudCoverage = 0.3,
      roughness = 0.7,
      hasVegetation = false,
      vegetationColor,
      textureSize = 2048,
      seed = Math.random() * 10000,
      generateMipmaps = true,
    } = options;

    // Convert options to format expected by generateTerrainTexture
    const surfaceProperties = {
      type: this.mapPlanetTypeToSurfaceType(type),
      planetType: type,
      color:
        surfaceColor instanceof THREE.Color
          ? surfaceColor.getHexString()
          : surfaceColor,
      roughness: roughness,
    };

    // Add water-specific properties for ocean planet type
    if (type === PlanetType.OCEAN && waterColor) {
      Object.assign(surfaceProperties, {
        oceanColor:
          waterColor instanceof THREE.Color
            ? waterColor.getHexString()
            : waterColor,
      });
    }

    // Add vegetation-specific properties if applicable
    if (hasVegetation && vegetationColor) {
      Object.assign(surfaceProperties, {
        vegetationColor:
          vegetationColor instanceof THREE.Color
            ? vegetationColor.getHexString()
            : vegetationColor,
      });
    }

    // Add cloud-specific properties if applicable
    if (cloudColor) {
      Object.assign(surfaceProperties, {
        cloudColor:
          cloudColor instanceof THREE.Color
            ? cloudColor.getHexString()
            : cloudColor,
        cloudCoverage: cloudCoverage,
      });
    }

    // Add normal map intensity option
    if (type === PlanetType.ROCKY || type === PlanetType.BARREN) {
      // Rocky planets should have more pronounced surface features
      Object.assign(surfaceProperties, {
        bumpStrength: 2.0, // Higher bump strength for rocky planets
      });
    } else if (type === PlanetType.LAVA) {
      Object.assign(surfaceProperties, {
        bumpStrength: 1.8, // High bump strength for lava planets
      });
    } else if (type === PlanetType.ICE) {
      Object.assign(surfaceProperties, {
        bumpStrength: 1.2, // Moderate bump strength for ice planets
      });
    } else {
      // Default bump strength for other planet types
      Object.assign(surfaceProperties, {
        bumpStrength: 1.5, // Increased from default 1.0
      });
    }

    // Generate textures using the procedural generator
    const { colorCanvas, normalCanvas } = generateTerrainTexture(seed, {
      // Cast to any to bypass type checking for now
      // This is a temporary solution until we update the generateTerrainTexture function
      // to properly handle our texture options
      surfaceProperties: surfaceProperties as any,
      canvasSize: textureSize,
    });

    // Convert OffscreenCanvas to THREE.CanvasTexture
    const colorMap = new THREE.CanvasTexture(colorCanvas);
    const normalMap = new THREE.CanvasTexture(normalCanvas);

    // Set up improved texture properties for sharpness
    [colorMap, normalMap].forEach((texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;

      // Improve filtering for sharper textures
      if (generateMipmaps) {
        texture.minFilter = THREE.LinearMipmapLinearFilter; // Trilinear filtering
        texture.anisotropy = 16; // Use high anisotropy for sharper textures at angles
      } else {
        texture.minFilter = THREE.LinearFilter;
      }

      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = generateMipmaps;
      texture.needsUpdate = true;
    });

    // Properly set colorspace for color map
    colorMap.colorSpace = THREE.SRGBColorSpace;

    // Return the result
    const result: TextureResult = {
      colorMap,
      normalMap,
    };

    return result;
  }

  /**
   * Maps PlanetType to SurfaceType for texture generation
   */
  private mapPlanetTypeToSurfaceType(planetType: PlanetType) {
    // This is a simple mapping that might need to be adjusted based on your exact definitions
    switch (planetType) {
      case PlanetType.DESERT:
        return "DUNES";
      case PlanetType.ICE:
        return "ICE_FLATS";
      case PlanetType.LAVA:
        return "VOLCANIC";
      case PlanetType.OCEAN:
        return "OCEAN";
      case PlanetType.ROCKY:
        return "CRATERED";
      case PlanetType.TERRESTRIAL:
        return "VARIED";
      case PlanetType.BARREN:
        return "CRATERED";
      default:
        return "CRATERED";
    }
  }
}
