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
import { GasGiantMaterialFactory } from "../base/material-factory";

/**
 * Renderer for Class V gas giants
 */
export class ClassVGasGiantRenderer extends BaseGasGiantRenderer<ClassVMaterial> {
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

    // Enhanced color contrast for more visible atmospheric features
    const baseColor = properties.atmosphereColor
      ? new THREE.Color(properties.atmosphereColor)
      : new THREE.Color(0xffead0); // Slightly warmer base

    // Generate cloud color based on base color with silicate tint
    const cloudColor = baseColor.clone().lerp(new THREE.Color(0xffd700), 0.3); // Golden silicate clouds

    const emissiveColor = properties.emissiveColor
      ? new THREE.Color(properties.emissiveColor)
      : new THREE.Color(0xff4400); // More intense orange-red
    const emissiveIntensity = properties.emissiveIntensity ?? 0.15; // Increased intensity

    // Use factory for WebGPU, legacy material for WebGL
    if (this.rendererBackend === "webgpu") {
      return GasGiantMaterialFactory.createMaterial({
        rendererBackend: this.rendererBackend,
        baseColor: baseColor,
        cloudColor: cloudColor,
        emissiveColor: emissiveColor,
        emissiveIntensity: emissiveIntensity,
        roughness: 0.7,
        metalness: 0.0,
      });
    } else {
      return new ClassVMaterial({
        baseColor: baseColor,
        cloudColor: cloudColor,
        emissiveColor: emissiveColor,
        emissiveIntensity: emissiveIntensity,
        stormMap: undefined,
      });
    }
  }
}
