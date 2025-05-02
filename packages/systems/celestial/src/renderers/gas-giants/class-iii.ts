import type { GasGiantProperties } from "@teskooano/data-types";
import * as THREE from "three";
import { TextureFactory } from "../../textures/TextureFactory";
import { BaseGasGiantMaterial, BaseGasGiantRenderer } from "./base-gas-giant";

import { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import classIIIFragmentShader from "../../shaders/gas-giants/class-iii.fragment.glsl";
import classIIIVertexShader from "../../shaders/gas-giants/class-iii.vertex.glsl";

/**
 * Material for Class III gas giants (Cloudless / Azure)
 * Uses simple lighting and rim effect.
 */
class ClassIIIMaterial extends BaseGasGiantMaterial {
  constructor(options: { baseColor: THREE.Color; stormMap?: THREE.Texture }) {
    super({
      uniforms: {
        baseColor: { value: options.baseColor },

        time: { value: 0 },
        sunPosition: { value: new THREE.Vector3(0, 0, 0) },

        stormMap: { value: options.stormMap },
        hasStormMap: { value: !!options.stormMap },
      },
      vertexShader: classIIIVertexShader,
      fragmentShader: classIIIFragmentShader,
    });
  }

  updateLOD(lodLevel: number): void {}
}

/**
 * Renderer for Class III gas giants
 */
export class ClassIIIGasGiantRenderer extends BaseGasGiantRenderer {
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
      : new THREE.Color(0xafdbf5);

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

    return new ClassIIIMaterial({
      baseColor: baseColor,
      stormMap: stormMap,
    });
  }
}
