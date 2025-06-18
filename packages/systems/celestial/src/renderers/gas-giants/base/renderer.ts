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
} from "../../base/CelestialRenderer";
import { BaseCelestialRenderer } from "../../base/BaseCelestialRenderer";
import { RingSystemRenderer } from "../../rings/rings";
import { BaseGasGiantMaterial, BasicGasGiantMaterial } from "./material";
import {
  calculateDistantSpriteSize,
  createBillboardSprite,
} from "../../billboards";

const MAX_LIGHTS = 4;

/**
 * Base renderer for gas giants, implementing the LOD system.
 */
export abstract class BaseGasGiantRenderer extends BaseCelestialRenderer {
  protected textureLoader: THREE.TextureLoader = new THREE.TextureLoader();
  protected ringSystemRenderer: RingSystemRenderer | null = null;
  public lod: THREE.LOD | undefined;

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
  public abstract getMaterial(
    object: RenderableCelestialObject,
  ): BaseGasGiantMaterial;

  /**
   * Creates and returns the THREE.LOD object for the gas giant.
   * This method builds the LOD levels and stores a reference to the final
   * LOD object within the renderer instance.
   */
  public createLOD(
    object: RenderableCelestialObject,
    createLodObject: (
      object: RenderableCelestialObject,
      levels: LODLevel[],
    ) => THREE.LOD,
    options?: CelestialMeshOptions,
  ): THREE.LOD {
    const planetLODs = this._createPlanetLODs(object, options);

    let finalLODs = planetLODs;

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

    this.lod = createLodObject(object, finalLODs);
    return this.lod;
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
  ): void {
    super.update(object, time, timeScale, lightSources, camera);
    this.elapsedTime = time;

    // The main material is on the first LOD level's object.
    const highDetailMesh = this.lod?.levels[0]?.object.children[0]
      ?.children[0] as THREE.Mesh<THREE.SphereGeometry, BaseGasGiantMaterial>;

    const material = highDetailMesh?.material;

    if (material) {
      const lightsForShader: {
        direction: THREE.Vector3;
        color: THREE.Color;
        intensity: number;
      }[] = [];

      if (lightSources && lightSources.size > 0) {
        const sortedLights = Array.from(lightSources.values())
          .map((component) => ({
            component,
            distanceSq: object.position.distanceToSquared(component.position),
          }))
          .sort((a, b) => a.distanceSq - b.distanceSq)
          .slice(0, MAX_LIGHTS);

        sortedLights.forEach(({ component, distanceSq }) => {
          // Calculate direction from planet to light
          const direction = new THREE.Vector3()
            .subVectors(component.position, object.position)
            .normalize();

          // Simple distance attenuation - this can be made more sophisticated
          const attenuation = 1.0 / (1.0 + distanceSq * 0.00000000000000000001);

          lightsForShader.push({
            direction: direction,
            color: component.color,
            intensity: (component.intensity ?? 1.0) * attenuation,
          });
        });
      }
      material.update(this.elapsedTime, timeScale, lightsForShader, camera);
    }

    if (this.ringSystemRenderer) {
      this.ringSystemRenderer.update(
        object,
        this.elapsedTime,
        timeScale,
        lightSources,
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
