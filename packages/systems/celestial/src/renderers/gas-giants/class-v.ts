import type {
  CelestialObject,
  GasGiantProperties,
} from "@teskooano/data-types";
import * as THREE from "three";
import { BaseGasGiantMaterial, BaseGasGiantRenderer } from "./base-gas-giant";
import { TextureFactory } from "../../textures/TextureFactory";

import classVFragmentShader from "../../shaders/gas-giants/class-v.fragment.glsl";
import classVVertexShader from "../../shaders/gas-giants/class-v.vertex.glsl";
import { RenderableCelestialObject } from "@teskooano/renderer-threejs";

/**
 * Material for Class V gas giants (Silicate Clouds / Bright / Glowing)
 * High albedo, includes emissive component for heat.
 */
class ClassVMaterial extends BaseGasGiantMaterial {
  constructor(options: {
    baseColor: THREE.Color;
    emissiveColor: THREE.Color;
    emissiveIntensity: number;
    stormMap?: THREE.Texture;
  }) {
    super({
      uniforms: {
        baseColor: { value: options.baseColor },
        emissiveColor: { value: options.emissiveColor },
        emissiveIntensity: { value: options.emissiveIntensity },
        time: { value: 0 },
        sunPosition: { value: new THREE.Vector3(0, 0, 0) },

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
  protected getMaterial(
    object: RenderableCelestialObject,
  ): BaseGasGiantMaterial {
    const properties = object.properties as GasGiantProperties;

    const seed = object.celestialObjectId
      ? object.celestialObjectId
          .split("")
          .reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
      : Math.random() * 10000;

    const baseColor = properties.atmosphereColor
      ? new THREE.Color(properties.atmosphereColor)
      : new THREE.Color(0xfff8dc);

    const emissiveColor = properties.emissiveColor
      ? new THREE.Color(properties.emissiveColor)
      : new THREE.Color(0xff6600);
    const emissiveIntensity = properties.emissiveIntensity ?? 0.1;

    let stormMap: THREE.Texture | undefined = undefined;
    if (properties.stormColor) {
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
}
