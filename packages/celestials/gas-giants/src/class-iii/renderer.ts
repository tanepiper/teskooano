import type {
  RenderableCelestialObject,
  GasGiantProperties,
} from "@teskooano/data-types";
import {
  BaseGasGiantRenderer,
  type GasGiantRendererDeps,
} from "../base/renderer";
import { ClassIIIMaterial } from "./material";
import { BaseGasGiantMaterial } from "../base/material";
import * as THREE from "three";
import { GasGiantMaterialFactory } from "../base/material-factory";

/**
 * Renderer for Class III gas giants
 */
export class ClassIIIGasGiantRenderer extends BaseGasGiantRenderer<ClassIIIMaterial> {
  constructor(object: RenderableCelestialObject, deps: GasGiantRendererDeps) {
    super(object, deps);
  }

  protected createMaterial(object: RenderableCelestialObject): any {
    const properties = object.properties as GasGiantProperties;

    // Use provided colors or defaults for Class III
    const baseColor = properties.atmosphereColor
      ? new THREE.Color(properties.atmosphereColor)
      : new THREE.Color(0x6495ed); // Cornflower blue

    // Use factory for WebGPU, legacy material for WebGL
    if (this.rendererBackend === "webgpu") {
      return GasGiantMaterialFactory.createMaterial({
        rendererBackend: this.rendererBackend,
        baseColor: baseColor,
        roughness: 0.6,
        metalness: 0.0,
      });
    } else {
      return new ClassIIIMaterial({
        baseColor: baseColor,
      });
    }
  }
}
