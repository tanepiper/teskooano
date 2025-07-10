import type { GasGiantProperties } from "@teskooano/data-types";
import * as THREE from "three";
import {
  BaseGasGiantRenderer,
  type GasGiantRendererDeps,
} from "../base/renderer";

import type { RenderableCelestialObject } from "@teskooano/data-types";
import { SCALE } from "@teskooano/data-types";
import { createSeededRandomSync } from "@teskooano/core-math";
import { BaseGasGiantMaterial } from "../base/material";
import { ClassIMaterial } from "./material";

/**
 * Renderer for Class I gas giants
 */
export class ClassIGasGiantRenderer extends BaseGasGiantRenderer<ClassIMaterial> {
  // Gas giant-specific properties
  private rotationSpeed: number;

  constructor(object: RenderableCelestialObject, deps: GasGiantRendererDeps) {
    super(object, deps);
    this.rotationSpeed = 0.01; // Default, will be seeded
  }

  protected createMaterial(object: RenderableCelestialObject): ClassIMaterial {
    const properties = object.properties as GasGiantProperties;

    // Initialize seeded random for this gas giant
    const random = createSeededRandomSync(object.seed ?? object.celestialObjectId);
    this.rotationSpeed = random() * 10000;

    const seed = object.celestialObjectId
      ? object.celestialObjectId
          .split("")
          .reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
      : random() * 10000;

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
