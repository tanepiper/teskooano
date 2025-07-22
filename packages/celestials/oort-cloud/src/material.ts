import * as THREE from "three";
import { AsteroidFieldMaterial } from "@teskooano/celestials-asteroid-field";

export interface OortCloudMaterialOptions {
  // These options are now largely handled by AsteroidFieldMaterial
  cloudTexture?: THREE.Texture;
  pointSizeScale?: number;
  particleRotationSpeed?: number;
  texturePaths?: string[];
}

/**
 * Material for rendering Oort Cloud particles.
 *
 * This class now primarily serves as a wrapper to use AsteroidFieldMaterial,
 * ensuring consistency in rendering instanced particles.
 */
export class OortCloudMaterial extends AsteroidFieldMaterial {
  constructor(options: OortCloudMaterialOptions = {}) {
    // Pass relevant options to the base AsteroidFieldMaterial constructor
    super({
      particleRotationSpeed: options.particleRotationSpeed,
      renderScale: options.pointSizeScale, // Map pointSizeScale to renderScale
      asteroidTextures: options.cloudTexture ? [options.cloudTexture] : [],
    });

    // Load textures from paths if provided
    if (options.texturePaths && options.texturePaths.length > 0) {
      this.loadTexturesFromPaths(options.texturePaths);
    }
  }

  // Methods like updateTime, setCloudTexture, loadTexturesFromPaths, isMaterialReady,
  // and dispose are now handled by the base AsteroidFieldMaterial.
}
