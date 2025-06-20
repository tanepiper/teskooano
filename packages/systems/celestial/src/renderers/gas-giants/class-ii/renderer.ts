import type { GasGiantProperties } from "@teskooano/data-types";
import * as THREE from "three";
import {
  BaseGasGiantRenderer,
  BaseGasGiantMaterial,
  GasGiantRendererDeps,
} from "../base";

import type { RenderableCelestialObject } from "@teskooano/data-types";
import { ClassIIMaterial } from "./material";
import { CelestialMeshOptions } from "../../base/CelestialRenderer";
import { LODLevel } from "@teskooano/renderer-threejs-lod";

/**
 * Renderer for Class II gas giants
 */
export class ClassIIGasGiantRenderer extends BaseGasGiantRenderer {
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

    return new ClassIIMaterial({
      atmosphereColor: atmosphereColor,
      cloudColor: cloudColor,
      seed: seed,
    });
  }
}
