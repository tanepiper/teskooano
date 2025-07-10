import type {
  RenderableCelestialObject,
  GasGiantProperties,
} from "@teskooano/data-types";
import {
  BaseGasGiantRenderer,
  type GasGiantRendererDeps,
} from "../base/renderer";
import { ClassVMaterial } from "./material";
import { BaseGasGiantMaterial } from "../base/material";
import * as THREE from "three";
import { createSeededRandomSync } from "@teskooano/core-math";

/**
 * Renderer for Class V gas giants
 */
export class ClassVGasGiantRenderer extends BaseGasGiantRenderer<ClassVMaterial> {
  constructor(object: RenderableCelestialObject, deps: GasGiantRendererDeps) {
    super(object, deps);
  }

  protected createMaterial(object: RenderableCelestialObject): ClassVMaterial {
    const properties = object.properties as GasGiantProperties;

    // Initialize seeded random for this gas giant
    const random = createSeededRandomSync(object.seed ?? object.celestialObjectId);

    const seed = object.celestialObjectId
      ? object.celestialObjectId
          .split("")
          .reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
      : random() * 10000;

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
