import type { GasGiantProperties } from "@teskooano/data-types";
import * as THREE from "three";
import { BaseGasGiantRenderer, BaseGasGiantMaterial, GasGiantRendererDeps } from "../base";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import { ClassIIIMaterial } from "./material";
import { CelestialMeshOptions } from "../../base/CelestialRenderer";
import { LODLevel } from "@teskooano/renderer-threejs-lod";

/**
 * Renderer for Class III gas giants
 */
export class ClassIIIGasGiantRenderer extends BaseGasGiantRenderer {
  constructor(object: RenderableCelestialObject, deps: GasGiantRendererDeps) {
    super(object, deps);
  }

  public getLODLevels(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    return this._createPlanetLODs(object, options);
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
      : new THREE.Color(0xafdbf5);

    return new ClassIIIMaterial({
      baseColor: baseColor,
      stormMap: undefined,
    });
  }
}
