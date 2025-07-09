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

/**
 * Renderer for Class IV gas giants
 */
export class ClassIVGasGiantRenderer extends BaseGasGiantRenderer<ClassIVMaterial> {
  constructor(object: RenderableCelestialObject, deps: GasGiantRendererDeps) {
    super(object, deps);
  }

  protected createMaterial(object: RenderableCelestialObject): ClassIVMaterial {
    const properties = object.properties as GasGiantProperties;

    // Use provided colors or defaults for Class IV
    const baseColor = properties.atmosphereColor
      ? new THREE.Color(properties.atmosphereColor)
      : new THREE.Color(0xb22222); // Firebrick

    return new ClassIVMaterial({
      baseColor: baseColor,
    });
  }
}
