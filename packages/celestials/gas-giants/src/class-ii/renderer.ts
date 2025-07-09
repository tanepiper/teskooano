import type { GasGiantProperties } from "@teskooano/data-types";
import * as THREE from "three";
import {
  BaseGasGiantRenderer,
  type GasGiantRendererDeps,
} from "../base/renderer";

import type { RenderableCelestialObject } from "@teskooano/data-types";
import { ClassIIMaterial } from "./material";
import { BaseGasGiantMaterial } from "../base/material";

/**
 * Renderer for Class II gas giants
 */
export class ClassIIGasGiantRenderer extends BaseGasGiantRenderer<ClassIIMaterial> {
  constructor(object: RenderableCelestialObject, deps: GasGiantRendererDeps) {
    super(object, deps);
  }

  protected createMaterial(object: RenderableCelestialObject): ClassIIMaterial {
    const properties = object.properties as GasGiantProperties;

    const seed = object.celestialObjectId
      ? object.celestialObjectId
          .split("")
          .reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
      : Math.random() * 10000;

    // Use provided colors or defaults for Class II
    const atmosphereColor = properties.atmosphereColor
      ? new THREE.Color(properties.atmosphereColor)
      : new THREE.Color(0xf5f5f5); // Whitish
    const cloudColor = properties.cloudColor
      ? new THREE.Color(properties.cloudColor)
      : new THREE.Color(0xb0c4de); // Light steel blue

    return new ClassIIMaterial({
      atmosphereColor: atmosphereColor,
      cloudColor: cloudColor,
      seed: seed,
    });
  }
}
