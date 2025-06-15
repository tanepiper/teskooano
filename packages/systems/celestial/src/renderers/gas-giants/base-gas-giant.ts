import { renderableStore } from "@teskooano/core-state";
import type {
  GasGiantProperties,
  RingSystemProperties,
} from "@teskooano/data-types";
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
import { RingMaterial, RingSystemRenderer } from "../rings/rings";

/**
 * Base material for gas giants
 */
export abstract class BaseGasGiantMaterial extends THREE.ShaderMaterial {
  updateLOD(lodLevel: number): void {}

  /**
   * Update the material with current time
   */
  update(
    time: number,
    timeScale: number,
    lightSources?: LightSourcesMap,
    camera?: THREE.Camera,
  ): void {
    this.uniforms.time.value = time;

    if (lightSources && lightSources.size > 0) {
      const firstLight = lightSources.values().next().value;
      if (firstLight) {
        if (this.uniforms.sunPosition) {
          this.uniforms.sunPosition.value = firstLight.position;
        }
        if (this.uniforms.lightPosition) {
          this.uniforms.lightPosition.value.copy(firstLight.position);
        }
      }
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
  protected ringSystemRenderer: RingSystemRenderer | null = null;

  /**
   * Initializes the renderer, creating the ring system if data is present.
   * This must be called after the constructor.
   * @param object - The celestial object data.
   */
  initialize(object: RenderableCelestialObject): void {
    const properties = object.properties as RingSystemProperties;
    if (properties?.rings && properties.rings.length > 0) {
      this.ringSystemRenderer = new RingSystemRenderer(this);
    }
  }

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
    const planetLODs = this._createPlanetLODs(object, options);

    if (this.ringSystemRenderer) {
      const ringLODs = this.ringSystemRenderer.getLODLevels(object, {
        ...options,
        parentLODDistances: planetLODs.map((l) => l.distance),
      });

      // Combine planet and ring LODs
      return planetLODs.map((planetLOD, index) => {
        const ringLOD = ringLODs[index] || ringLODs[ringLODs.length - 1];
        const combinedGroup = new THREE.Group();
        combinedGroup.name = `${object.celestialObjectId}-lod-${index}-combined`;
        combinedGroup.add(planetLOD.object);
        if (ringLOD?.object) {
          combinedGroup.add(ringLOD.object);
        }
        return {
          object: combinedGroup,
          distance: planetLOD.distance,
        };
      });
    }

    return planetLODs;
  }

  /**
   * Creates the array of LOD levels for the planet body itself.
   * @internal
   */
  private _createPlanetLODs(
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
    this.registerMaterial(`${object.celestialObjectId}-medium`, mediumMaterial);
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
    this.registerMaterial(`${object.celestialObjectId}-low`, lowMaterial);
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
   * Update the gas giant's appearance.
   */
  update(
    object: RenderableCelestialObject,
    time: number,
    timeScale: number,
    lightSources?: LightSourcesMap,
    camera?: THREE.Camera,
  ): void {
    super.update(object, time, timeScale, lightSources, camera);
    this.elapsedTime = time;

    const material = this.materials.get(
      object.celestialObjectId,
    ) as BaseGasGiantMaterial;

    const lightSourcePosition =
      this.findPrimaryLightSource(object, lightSources)?.position ??
      new THREE.Vector3(1e11, 0, 0);

    if (material) {
      material.update(this.elapsedTime, timeScale, lightSources, camera);
    }

    if (this.ringSystemRenderer) {
      this.ringSystemRenderer.update(object, time, timeScale, lightSources);
    }
  }

  /**
   * Dispose of all materials and textures.
   */
  dispose(): void {
    super.dispose();
    if (this.ringSystemRenderer) {
      this.ringSystemRenderer.dispose();
    }
  }
}
