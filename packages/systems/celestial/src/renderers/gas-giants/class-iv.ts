import type { CelestialObject, GasGiantProperties } from '@teskooano/data-types';
import * as THREE from 'three';
import { BaseGasGiantMaterial, BaseGasGiantRenderer } from './base-gas-giant';
import { TextureFactory } from '../../textures/TextureFactory';
import classIVFragmentShader from '../../shaders/gas-giants/class-iv.fragment.glsl';
import classIVVertexShader from '../../shaders/gas-giants/class-iv.vertex.glsl';
import { RenderableCelestialObject } from '@teskooano/renderer-threejs';

/**
 * Material for Class IV gas giants (Alkali Metals / Dark)
 * Very low albedo.
 */
class ClassIVMaterial extends BaseGasGiantMaterial {
  constructor(options: {
    baseColor: THREE.Color; // Should be a very dark color
    stormMap?: THREE.Texture; // Optional storm texture
  }) {
    super({
      uniforms: {
        baseColor: { value: options.baseColor },
        time: { value: 0 },
        sunPosition: { value: new THREE.Vector3(0, 0, 0) },
        // Storm texture uniforms
        stormMap: { value: options.stormMap },
        hasStormMap: { value: !!options.stormMap },
      },
      vertexShader: classIVVertexShader,
      fragmentShader: classIVFragmentShader,
    });
  }

  updateLOD(lodLevel: number): void {}
}

/**
 * Renderer for Class IV gas giants
 */
export class ClassIVGasGiantRenderer extends BaseGasGiantRenderer {
  // private textureCache: Map<string, THREE.Texture> = new Map(); // Removed texture cache
  
  protected getMaterial(object: RenderableCelestialObject): BaseGasGiantMaterial {
    const properties = object.properties as GasGiantProperties;

    // Generate deterministic seed from object id
    const seed = object.celestialObjectId ? 
      object.celestialObjectId.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) : 
      Math.random() * 10000;

    // Default to a very dark grey/brown if no color provided
    const baseColor = properties.atmosphereColor
      ? new THREE.Color(properties.atmosphereColor)
      : new THREE.Color(0x332211); // Very dark brown default

    // Check if we should use a texture overlay (e.g., for storms)
    let stormMap: THREE.Texture | undefined = undefined;
    if (properties.stormColor) {
      // Get storm texture from TextureFactory
      const stormTexture = TextureFactory.generateGasGiantTexture({
        class: properties.gasGiantClass,
        baseColor: baseColor,
        secondaryColor: new THREE.Color(properties.stormColor),
        seed: seed
      });
      stormMap = stormTexture.colorMap;
    }

    return new ClassIVMaterial({
      baseColor: baseColor,
      stormMap: stormMap
    });
  }

  // Removed override update
  // Removed override dispose
} 