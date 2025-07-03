import type { GasGiantProperties } from "@teskooano/data-types";
import * as THREE from "three";
import { BaseGasGiantRenderer, GasGiantRendererDeps } from "../base";

import type { RenderableCelestialObject } from "@teskooano/data-types";
import { BaseGasGiantMaterial } from "../base";
import { ClassIMaterial } from "./material";

/**
 * Renderer for Class I gas giants
 */
export class ClassIGasGiantRenderer extends BaseGasGiantRenderer {
  constructor(object: RenderableCelestialObject, deps: GasGiantRendererDeps) {
    super(object, deps);
  }

  public getMaterial(object: RenderableCelestialObject): BaseGasGiantMaterial {
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

    return new ClassIMaterial({
      atmosphereColor: atmosphereColor,
      cloudColor: cloudColor,
      seed: seed,
      stormMap: undefined,
    });
  }
}
