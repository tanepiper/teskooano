import type { GasGiantProperties } from "@teskooano/data-types";
import * as THREE from "three";
import { BaseGasGiantMaterial, BaseGasGiantRenderer } from "./base-gas-giant";

import { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import classIIFragmentShader from "../../shaders/gas-giants/class-ii.fragment.glsl";
import classIIVertexShader from "../../shaders/gas-giants/class-ii.vertex.glsl";

const lodToOctaveMap = [2, 3, 5, 8];

/**
 * Material for Class II gas giants (Water Clouds) - Using the new shaders
 */
class ClassIIMaterial extends BaseGasGiantMaterial {
  private warpOctaves: number = 5;
  private colorOctaves: number = 3;

  constructor(options: {
    atmosphereColor: THREE.Color;
    cloudColor: THREE.Color;
    seed: string | number;
    textures?: {
      stormMap?: THREE.Texture;
      cloudMap?: THREE.Texture;
      detailMap?: THREE.Texture;
    };
  }) {
    const darkColor = options.atmosphereColor.clone().multiplyScalar(0.35);

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

        stormMap: { value: options.textures?.stormMap },
        hasStormMap: { value: !!options.textures?.stormMap },
      },
      vertexShader: classIIVertexShader,
      fragmentShader: classIIFragmentShader,
    });
  }

  updateLOD(lodLevel: number): void {
    const level = Math.max(0, Math.min(lodLevel, lodToOctaveMap.length - 1));

    const newWarpOctaves = lodToOctaveMap[level];

    const newColorOctaves = lodToOctaveMap[Math.max(0, level)];

    if (newWarpOctaves !== this.warpOctaves) {
      this.uniforms.uWarpOctaves.value = newWarpOctaves;
      this.warpOctaves = newWarpOctaves;
    }
    if (newColorOctaves !== this.colorOctaves) {
      this.uniforms.uColorOctaves.value = newColorOctaves;
      this.colorOctaves = newColorOctaves;
    }
  }

  dispose(): void {
    if (this.uniforms.stormMap?.value) {
      this.uniforms.stormMap.value.dispose();
    }

    super.dispose();
  }
}

/**
 * Renderer for Class II gas giants
 */
export class ClassIIGasGiantRenderer extends BaseGasGiantRenderer {
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

    return new ClassIIMaterial({
      atmosphereColor: atmosphereColor,
      cloudColor: cloudColor,
      seed: seed,
    });
  }
}
