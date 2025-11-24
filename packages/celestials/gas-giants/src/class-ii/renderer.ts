import type { GasGiantProperties } from "@teskooano/data-types";
import * as THREE from "three";
import { createSeededRandomSync } from "@teskooano/core-math";
import {
  BaseGasGiantRenderer,
  type GasGiantRendererDeps,
} from "../base/renderer";

import type { RenderableCelestialObject } from "@teskooano/data-types";
import { ClassIIMaterial } from "./material";
import { BaseGasGiantMaterial } from "../base/material";
import { GasGiantMaterialFactory } from "../base/material-factory";

/**
 * Renderer for Class II gas giants
 */
export class ClassIIGasGiantRenderer extends BaseGasGiantRenderer<ClassIIMaterial> {
  constructor(object: RenderableCelestialObject, deps: GasGiantRendererDeps) {
    super(object, deps);
  }

  protected createMaterial(object: RenderableCelestialObject): any {
    const properties = object.properties as GasGiantProperties;

    // Initialize seeded random for this gas giant
    const random = createSeededRandomSync(object.seed ?? object.id);

    const seed = object.id
      ? object.id
          .split("")
          .reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
      : random() * 10000;

    // Use provided colors or defaults for Class II
    const atmosphereColor = properties.atmosphereColor
      ? new THREE.Color(properties.atmosphereColor)
      : new THREE.Color(0xf5f5f5); // Whitish
    const cloudColor = properties.cloudColor
      ? new THREE.Color(properties.cloudColor)
      : new THREE.Color(0xb0c4de); // Light steel blue

    // Use factory for WebGPU, legacy material for WebGL
    if (this.rendererBackend === "webgpu") {
      return GasGiantMaterialFactory.createMaterial({
        rendererBackend: this.rendererBackend,
        baseColor: atmosphereColor,
        cloudColor: cloudColor,
        roughness: 0.7,
        metalness: 0.0,
      });
    } else {
      return new ClassIIMaterial({
        atmosphereColor: atmosphereColor,
        cloudColor: cloudColor,
        seed: seed,
      });
    }
  }
}
