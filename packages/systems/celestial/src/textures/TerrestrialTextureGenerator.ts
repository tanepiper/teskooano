import * as THREE from "three";

import { PlanetType } from "@teskooano/data-types";
import { generateTerrainTexture } from "../generation/procedural-texture";
import { TextureGeneratorBase } from "./TextureGeneratorBase";
import { TerrestrialTextureOptions, TextureResult } from "./TextureTypes";

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

    const surfaceProperties = {
      type: this.mapPlanetTypeToSurfaceType(type),
      planetType: type,
      color:
        surfaceColor instanceof THREE.Color
          ? surfaceColor.getHexString()
          : surfaceColor,
      roughness: roughness,
    };

    if (type === PlanetType.OCEAN && waterColor) {
      Object.assign(surfaceProperties, {
        oceanColor:
          waterColor instanceof THREE.Color
            ? waterColor.getHexString()
            : waterColor,
      });
    }

    if (hasVegetation && vegetationColor) {
      Object.assign(surfaceProperties, {
        vegetationColor:
          vegetationColor instanceof THREE.Color
            ? vegetationColor.getHexString()
            : vegetationColor,
      });
    }

    if (cloudColor) {
      Object.assign(surfaceProperties, {
        cloudColor:
          cloudColor instanceof THREE.Color
            ? cloudColor.getHexString()
            : cloudColor,
        cloudCoverage: cloudCoverage,
      });
    }

    if (type === PlanetType.ROCKY || type === PlanetType.BARREN) {
      Object.assign(surfaceProperties, {
        bumpStrength: 2.0,
      });
    } else if (type === PlanetType.LAVA) {
      Object.assign(surfaceProperties, {
        bumpStrength: 1.8,
      });
    } else if (type === PlanetType.ICE) {
      Object.assign(surfaceProperties, {
        bumpStrength: 1.2,
      });
    } else {
      Object.assign(surfaceProperties, {
        bumpStrength: 1.5,
      });
    }

    const { colorCanvas, normalCanvas } = generateTerrainTexture(seed, {
      surfaceProperties: surfaceProperties as any,
      canvasSize: textureSize,
    });

    const colorMap = new THREE.CanvasTexture(colorCanvas);
    const normalMap = new THREE.CanvasTexture(normalCanvas);

    [colorMap, normalMap].forEach((texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;

      if (generateMipmaps) {
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.anisotropy = 16;
      } else {
        texture.minFilter = THREE.LinearFilter;
      }

      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = generateMipmaps;
      texture.needsUpdate = true;
    });

    colorMap.colorSpace = THREE.SRGBColorSpace;

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
