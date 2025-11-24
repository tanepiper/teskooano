import type {
  RenderableCelestialObject,
  GasGiantProperties,
} from "@teskooano/data-types";
import {
  BaseGasGiantRenderer,
  type GasGiantRendererDeps,
} from "../base/renderer";
import { ClassIVMaterial } from "./material";
import { BaseGasGiantMaterial } from "../base/material";
import * as THREE from "three";
import { GasGiantMaterialFactory } from "../base/material-factory";

/**
 * Renderer for Class IV gas giants
 */
export class ClassIVGasGiantRenderer extends BaseGasGiantRenderer<ClassIVMaterial> {
  constructor(object: RenderableCelestialObject, deps: GasGiantRendererDeps) {
    super(object, deps);
  }

  protected createMaterial(object: RenderableCelestialObject): any {
    const properties = object.properties as GasGiantProperties;

    // Use provided colors or defaults for Class IV
    const baseColor = properties.atmosphereColor
      ? new THREE.Color(properties.atmosphereColor)
      : new THREE.Color(0xb22222); // Firebrick

    // Use factory for WebGPU, legacy material for WebGL
    if (this.rendererBackend === "webgpu") {
      return GasGiantMaterialFactory.createMaterial({
        rendererBackend: this.rendererBackend,
        baseColor: baseColor,
        roughness: 0.9,
        metalness: 0.1,
      });
    } else {
      return new ClassIVMaterial({
        baseColor: baseColor,
      });
    }
  }
}
