import type {
  GasGiantProperties,
  RenderableCelestialObject,
  RingSystemProperties,
} from "@teskooano/data-types";
import { SCALE } from "@teskooano/data-types";
import { LightingManager } from "@teskooano/renderer-threejs-lighting";
import type { LODLevel } from "@teskooano/renderer-threejs-lod";
import * as THREE from "three";
import { BaseCelestialRenderer } from "../../base/BaseCelestialRenderer";
import {
  CelestialMeshOptions,
  type CelestialRenderer,
  type LightSourcesMap,
} from "../../base/CelestialRenderer";
import { RingSystemRenderer } from "../../rings/rings";
import { BaseGasGiantMaterial, BasicGasGiantMaterial } from "./material";

const MAX_LIGHTS = 4;

export interface GasGiantRendererDeps {
  celestialRenderers: Map<string, CelestialRenderer>;
  lightingManager?: LightingManager;
}

/**
 * Base renderer for gas giants, implementing the LOD system.
 */
export abstract class BaseGasGiantRenderer extends BaseCelestialRenderer {
  protected textureLoader: THREE.TextureLoader = new THREE.TextureLoader();
  protected ringSystemRenderer: RingSystemRenderer | null = null;

  constructor(object: RenderableCelestialObject, deps: GasGiantRendererDeps) {
    super({ lightingManager: deps.lightingManager });
    deps.celestialRenderers.set(object.celestialObjectId, this);
  }

  /**
   * Child classes must implement this method to return the appropriate material
   * for the highest detail LOD level.
   */
  public abstract getMaterial(
    object: RenderableCelestialObject,
  ): BaseGasGiantMaterial;

  /**
   * Creates and returns the array of LOD levels for the gas giant.
   * This method builds the LOD levels which will be used to construct a
   * THREE.LOD object externally.
   */
  public getLODLevels(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    const planetLODs = this._createPlanetLODs(object, options);
    const properties = object.properties as RingSystemProperties;

    let finalLODs = planetLODs;

    // LAZY INITIALIZATION: Create the ring renderer only when it's first needed.
    if (
      !this.ringSystemRenderer &&
      properties?.rings &&
      properties.rings.length > 0
    ) {
      this.ringSystemRenderer = new RingSystemRenderer(this);
    }

    console.log("BaseGasGiantRenderer getLODLevels", this.ringSystemRenderer);
    console.log("BaseGasGiantRenderer planetProps", properties);

    if (this.ringSystemRenderer) {
      const ringLODs = this.ringSystemRenderer.getLODLevels(object, {
        ...options,
        parentLODDistances: planetLODs.map((l) => l.distance),
      });

      // Combine planet and ring LODs
      finalLODs = planetLODs.map((planetLOD, index) => {
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
    console.log("BaseGasGiantRenderer finalLODs", finalLODs);

    return finalLODs;
  }

  /**
   * Creates the array of LOD levels for the planet body itself.
   * @internal
   */
  protected _createPlanetLODs(
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
    const level1: LODLevel = { object: level1Group, distance: 800 * scale };

    const color = this._getBaseGasGiantColor(object);
    const billboardDistance = 2000 * scale;

    const level2 = this._createBillboardLOD(object, {
      distance: billboardDistance,
      size: 0.02,
      color: color,
      albedo: object.albedo,
    });

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
    lightSources: LightSourcesMap,
    camera: THREE.Camera,
    allObjects?: Record<string, RenderableCelestialObject>,
  ): void {
    super.update(object, time, timeScale, lightSources, camera, allObjects);
    this.elapsedTime = time;

    // The material for the high-detail mesh is stored in our own map.
    const material = this.materials.get(
      object.celestialObjectId,
    ) as BaseGasGiantMaterial;

    if (material) {
      const lightsForShader: {
        direction: THREE.Vector3;
        color: THREE.Color;
        intensity: number;
      }[] = [];

      // The lightSources map is pre-filtered by the RendererUpdater to only contain
      // the most influential lights for this specific object.
      if (lightSources && lightSources.size > 0) {
        lightSources.forEach((lightData) => {
          // Calculate direction from planet to light
          const direction = new THREE.Vector3()
            .subVectors(lightData.position, object.position)
            .normalize();

          // Physically-based distance attenuation using inverse-square law,
          // scaled for solar system distances. A larger factor creates
          // a more dramatic and visible falloff.
          const FALLOFF_FACTOR = 0.00000001; // Tunable factor
          const distanceSq = object.position.distanceToSquared(
            lightData.position,
          );
          const attenuation = 1.0 / (1.0 + distanceSq * FALLOFF_FACTOR);

          lightsForShader.push({
            direction: direction,
            color: lightData.color,
            intensity: (lightData.intensity ?? 1.0) * attenuation,
          });
        });
      }

      const shadowCasters: { position: THREE.Vector3; radius: number }[] = [];
      if (allObjects) {
        for (const other of Object.values(allObjects)) {
          if (
            other.parentId === object.celestialObjectId &&
            other.radius &&
            other.position
          ) {
            shadowCasters.push({
              position: other.position,
              radius: other.radius,
            });
          }
        }
      }

      material.update(
        this.elapsedTime,
        timeScale,
        lightsForShader,
        camera,
        shadowCasters,
      );
    }

    if (this.ringSystemRenderer) {
      this.ringSystemRenderer.update(
        object,
        time,
        timeScale,
        lightSources,
        allObjects,
      );
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
