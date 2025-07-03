import type { GasGiantProperties } from "@teskooano/data-types";
import * as THREE from "three";
import {
  BaseGasGiantRenderer,
  BaseGasGiantMaterial,
  GasGiantRendererDeps,
} from "../base";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import { ClassVMaterial } from "./material";

/**
 * Renderer for Class V gas giants
 */
export class ClassVGasGiantRenderer extends BaseGasGiantRenderer {
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

    const baseColor = properties.atmosphereColor
      ? new THREE.Color(properties.atmosphereColor)
      : new THREE.Color(0xfff8dc);

    const emissiveColor = properties.emissiveColor
      ? new THREE.Color(properties.emissiveColor)
      : new THREE.Color(0xff6600);
    const emissiveIntensity = properties.emissiveIntensity ?? 0.1;

    return new ClassVMaterial({
      baseColor: baseColor,
      emissiveColor: emissiveColor,
      emissiveIntensity: emissiveIntensity,
      stormMap: undefined,
    });
  }
}
