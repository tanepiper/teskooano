import type { GasGiantProperties } from "@teskooano/data-types";
import * as THREE from "three";
import {
  BaseGasGiantRenderer,
  BaseGasGiantMaterial,
  GasGiantRendererDeps,
} from "../base";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import { ClassIVMaterial } from "./material";

/**
 * Renderer for Class IV gas giants
 */
export class ClassIVGasGiantRenderer extends BaseGasGiantRenderer<ClassIVMaterial> {
  constructor(object: RenderableCelestialObject, deps: GasGiantRendererDeps) {
    super(object, deps);
  }

  protected createMaterial(object: RenderableCelestialObject): ClassIVMaterial {
    const properties = object.properties as GasGiantProperties;

    const seed = object.celestialObjectId
      ? object.celestialObjectId
          .split("")
          .reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
      : Math.random() * 10000;

    const baseColor = properties.atmosphereColor
      ? new THREE.Color(properties.atmosphereColor)
      : new THREE.Color(0x332211);

    return new ClassIVMaterial({
      baseColor: baseColor,
      stormMap: undefined,
    });
  }
}
