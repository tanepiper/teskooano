import { renderableStore } from "@teskooano/core-state";
import type { GasGiantProperties } from "@teskooano/data-types";
import { SCALE } from "@teskooano/data-types";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import type { LODLevel } from "@teskooano/renderer-threejs-lod";
import * as THREE from "three";
import {
  CelestialMeshOptions,
  type LightSourcesMap,
} from "../base/CelestialRenderer";

import basicFragmentShader from "../../shaders/gas-giants/basic.fragment.glsl";
import basicVertexShader from "../../shaders/gas-giants/basic.vertex.glsl";
import { BaseCelestialRenderer } from "../base/BaseCelestialRenderer";

/**
 * Base material for gas giants
 */
export abstract class BaseGasGiantMaterial extends THREE.ShaderMaterial {
  updateLOD(lodLevel: number): void {}

  /**
   * Update the material with current time
   */
  update(time: number, lightSourcePosition?: THREE.Vector3): void {
    if (this.uniforms.time) {
      this.uniforms.time.value = time;
    }
    if (this.uniforms.sunPosition && lightSourcePosition) {
      this.uniforms.sunPosition.value = lightSourcePosition;
    }
  }

  dispose(): void {}
}

/**
 * Basic Gas Giant Material using the simple shaders
 */
export class BasicGasGiantMaterial extends BaseGasGiantMaterial {
  constructor(baseColor: THREE.Color = new THREE.Color(0xffffff)) {
    super({
      uniforms: {
        baseColor: { value: baseColor },
        sunPosition: { value: new THREE.Vector3(1, 1, 1) },
        time: { value: 0 },
      },
      vertexShader: basicVertexShader,
      fragmentShader: basicFragmentShader,
    });
  }
}

/**
 * Base renderer for gas giants, implementing the LOD system.
 */
export abstract class BaseGasGiantRenderer extends BaseCelestialRenderer {
  protected textureLoader: THREE.TextureLoader = new THREE.TextureLoader();

  /**
   * Child classes must implement this method to return the appropriate material
   * for the highest detail LOD level.
   */
  protected abstract getMaterial(
    object: RenderableCelestialObject,
  ): BaseGasGiantMaterial;

  /**
   * Creates and returns an array of LOD levels for the gas giant object.
   */
  getLODLevels(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    const scale = typeof SCALE === "number" ? SCALE : 1;
    const baseRadius = object.radius ?? 10;

    const highDetailSegments = options?.segments ?? 64;
    const highDetailGeometry = new THREE.SphereGeometry(
      baseRadius,
      highDetailSegments,
      highDetailSegments,
    );
    const highDetailMaterial = this.getMaterial(object);
    this.registerMaterial(object.celestialObjectId, highDetailMaterial);

    const highDetailMesh = new THREE.Mesh(
      highDetailGeometry,
      highDetailMaterial,
    );
    highDetailMesh.name = `${object.celestialObjectId}-high-lod`;
    const level0Group = new THREE.Group();
    level0Group.add(highDetailMesh);
    const level0: LODLevel = { object: level0Group, distance: 0 };

    const mediumSegments = 32;
    const mediumGeometry = new THREE.SphereGeometry(
      baseRadius,
      mediumSegments,
      mediumSegments,
    );
    const mediumMaterial = new BasicGasGiantMaterial(
      this._getBaseGasGiantColor(object),
    );
    const mediumMesh = new THREE.Mesh(mediumGeometry, mediumMaterial);
    mediumMesh.name = `${object.celestialObjectId}-medium-lod`;
    const level1Group = new THREE.Group();
    level1Group.add(mediumMesh);
    const level1: LODLevel = { object: level1Group, distance: 150 * scale };

    const lowSegments = 16;
    const lowGeometry = new THREE.SphereGeometry(
      baseRadius,
      lowSegments,
      lowSegments,
    );
    const lowMaterial = new THREE.MeshBasicMaterial({
      color: this._getBaseGasGiantColor(object),
      wireframe: false,
    });
    const lowMesh = new THREE.Mesh(lowGeometry, lowMaterial);
    lowMesh.name = `${object.celestialObjectId}-low-lod`;
    const level2Group = new THREE.Group();
    level2Group.add(lowMesh);
    const level2: LODLevel = { object: level2Group, distance: 800 * scale };

    return [level0, level1, level2];
  }

  /**
   * Helper to get a representative base color for the gas giant.
   * @internal
   */
  private _getBaseGasGiantColor(
    object: RenderableCelestialObject,
  ): THREE.Color {
    const properties = object.properties as GasGiantProperties | undefined;

    try {
      if (properties?.atmosphereColor) {
        return new THREE.Color(properties.atmosphereColor);
      }
    } catch (e) {
      console.warn(
        `[BaseGasGiantRenderer] Invalid atmosphereColor property for ${object.celestialObjectId}:`,
        properties?.atmosphereColor,
      );
    }

    return new THREE.Color(0xccaa88);
  }

  /**
   * Update the materials stored by this renderer.
   */
  update(
    object: RenderableCelestialObject,
    time: number,
    timeScale: number,
    lightSources?: LightSourcesMap,
    camera?: THREE.Camera,
  ): void {
    super.update(object, time, timeScale, lightSources, camera);

    const material = this.materials.get(
      object.celestialObjectId,
    ) as BaseGasGiantMaterial;
    if (!material) return;

    const primaryLightData = this.findPrimaryLightSource(object, lightSources);
    const lightSourcePosition = primaryLightData
      ? primaryLightData.position
      : new THREE.Vector3(1e11, 0, 0);

    material.update(this.elapsedTime, lightSourcePosition);
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    super.dispose();
  }
}
