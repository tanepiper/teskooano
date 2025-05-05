import type { GasGiantProperties } from "@teskooano/data-types";
import * as THREE from "three";
import { BaseGasGiantMaterial, BaseGasGiantRenderer } from "./base-gas-giant";

import { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import classIFragmentShader from "../../shaders/gas-giants/class-i.fragment.glsl";
import classIVertexShader from "../../shaders/gas-giants/class-i.vertex.glsl";

const lodToOctaveMap = [2, 3, 5, 8];

/**
 * Material for Class I gas giants (Ammonia Clouds) - Jupiter-like
 * Uses 4D fractal simplex noise based on example.
 */
class ClassIMaterial extends BaseGasGiantMaterial {
  private warpOctaves: number = 5;
  private colorOctaves: number = 3;

  constructor(options: {
    atmosphereColor: THREE.Color;
    cloudColor: THREE.Color;
    seed: string | number;
    stormMap?: THREE.Texture;
  }) {
    const darkColor = options.atmosphereColor.clone().multiplyScalar(0.4);

    super({
      uniforms: {
        mainColor1: { value: options.atmosphereColor },
        mainColor2: { value: options.cloudColor },
        darkColor: { value: darkColor },

        uSeed: { value: options.seed },

        time: { value: 0 },
        sunPosition: { value: new THREE.Vector3(0, 0, 0) },

        uWarpOctaves: { value: 5 },
        uColorOctaves: { value: 3 },

        stormMap: { value: options.stormMap },
        hasStormMap: { value: !!options.stormMap },
      },
      vertexShader: classIVertexShader,
      fragmentShader: classIFragmentShader,
    });
  }

  updateLOD(lodLevel: number): void {
    const level = Math.max(0, Math.min(lodLevel, lodToOctaveMap.length - 1));

    const newWarpOctaves = lodToOctaveMap[level];
    const newColorOctaves = lodToOctaveMap[Math.max(0, level - 1)];

    if (newWarpOctaves !== this.warpOctaves) {
      this.uniforms.uWarpOctaves.value = newWarpOctaves;
      this.warpOctaves = newWarpOctaves;
    }
    if (newColorOctaves !== this.colorOctaves) {
      this.uniforms.uColorOctaves.value = newColorOctaves;
      this.colorOctaves = newColorOctaves;
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

    let stormMap: THREE.Texture | undefined = undefined;
    // if (properties.stormColor) {
    //   const stormTexture = TextureFactory.generateGasGiantTexture({
    //     class: properties.gasGiantClass,
    //     baseColor: atmosphereColor,
    //     secondaryColor: cloudColor,
    //     stormColor: properties.stormColor,
    //     seed: seed,
    //   });
    //   stormMap = stormTexture.colorMap;
    // }

    return new ClassIMaterial({
      atmosphereColor: atmosphereColor,
      cloudColor: cloudColor,
      seed: seed,
      stormMap: stormMap,
    });
  }
}
