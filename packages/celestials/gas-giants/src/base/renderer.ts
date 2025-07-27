import type {
  GasGiantProperties,
  RenderableCelestialObject,
  RingSystemProperties,
} from "@teskooano/data-types";
import { SCALE } from "@teskooano/data-types";
import type { LightingManager } from "@teskooano/renderer-threejs-lighting";
import type { LODLevel } from "@teskooano/renderer-threejs-lod";
import * as THREE from "three";
import { BaseCelestialRenderer } from "@teskooano/renderer-threejs-celestial";
import {
  type CelestialRenderer,
  type LightSourcesMap,
  type CelestialMeshOptions,
  LightArrayUtils,
  ShadowCasterUtils,
  GeometryUtilities,
} from "@teskooano/renderer-threejs-celestial";
import { RingSystemRenderer } from "@teskooano/celestials-rings";
import { BaseGasGiantMaterial, BasicGasGiantMaterial } from "./material";

export interface GasGiantRendererDeps {
  celestialRenderers: Map<string, CelestialRenderer>;
  lightingManager?: LightingManager;
}

/**
 * Base renderer for gas giants, implementing the LOD system.
 * Supports dynamic numbers of lights and shadow casters.
 * @template TGasGiantMaterial The specific gas giant material type this renderer works with
 */
export abstract class BaseGasGiantRenderer<
  TGasGiantMaterial extends BaseGasGiantMaterial = BaseGasGiantMaterial,
> extends BaseCelestialRenderer<TGasGiantMaterial> {
  protected textureLoader: THREE.TextureLoader = new THREE.TextureLoader();
  protected ringSystemRenderer: RingSystemRenderer | null = null;

  constructor(object: RenderableCelestialObject, deps: GasGiantRendererDeps) {
    super(object, { lightingManager: deps.lightingManager });
    deps.celestialRenderers.set(object.celestialObjectId, this);
  }

  /**
   * Abstract method for subclasses to create their specific gas giant material.
   * This is called by the base class's createAndRegisterMaterial method.
   */
  protected abstract createMaterial(
    object: RenderableCelestialObject,
  ): TGasGiantMaterial;

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
      this.ringSystemRenderer = new RingSystemRenderer(object, this);
    }
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
    const baseRadius = object.radius ?? 10;

    const highDetailSegments =
      options?.segments ??
      GeometryUtilities.getOptimizedHighDetailSegments(
        options?.detailLevel,
        64,
      );
    const highDetailGeometry = new THREE.SphereGeometry(
      baseRadius,
      highDetailSegments,
      highDetailSegments,
    );
    const highDetailMaterial = this.createAndRegisterMaterial(object);
    if (!highDetailMaterial) {
      throw new Error(
        `Failed to create material for gas giant ${object.celestialObjectId}`,
      );
    }

    const highDetailMesh = new THREE.Mesh(
      highDetailGeometry,
      highDetailMaterial,
    );
    highDetailMesh.name = `${object.celestialObjectId}-high-lod`;
    const level0Group = new THREE.Group();
    level0Group.name = `${object.celestialObjectId}-high-lod-group`;
    level0Group.add(highDetailMesh);

    const level0: LODLevel = { object: level0Group, distance: 0 };

    const mediumSegments = GeometryUtilities.getOptimizedHighDetailSegments(
      "medium",
      32,
    );
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
    level1Group.name = `${object.celestialObjectId}-medium-lod-group`;
    level1Group.add(mediumMesh);
    const level1: LODLevel = {
      object: level1Group,
      distance: 800 * baseRadius,
    };

    const color = this._getBaseGasGiantColor(object);
    const billboardDistance = 2000 * baseRadius;

    const level2 = this.billboardManager.createBillboardLOD(object, {
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
   * Now handles dynamic numbers of lights and shadow casters.
   */
  update(
    object: RenderableCelestialObject,
    time: number,
    timeScale: number,
    lightSources: LightSourcesMap,
    camera: THREE.PerspectiveCamera,
    allObjects?: Record<string, RenderableCelestialObject>,
  ): void {
    super.update(object, time, timeScale, lightSources, camera, allObjects);

    // Apply centralized light attenuation
    const attenuatedLightSources = this.applyLightAttenuation(
      object,
      lightSources,
    );

    // Calculate dynamic ambient light based on nearby stars
    const dynamicAmbientIntensity =
      this.lightingManager.calculateDynamicAmbientLightWithStarData(
        object,
        lightSources, // Use original light sources for ambient calculation, not attenuated
        allObjects,
      );

    // Convert light sources to shader format
    const lightsForShader = LightArrayUtils.toShaderFormat(
      attenuatedLightSources,
    );

    // Find shadow casters using centralized utility
    const shadowCasters = this.findShadowCasters(object, allObjects);

    // Convert shadow casters to shader format
    const shadowCastersForShader =
      ShadowCasterUtils.toShaderFormat(shadowCasters);

    // --- Update High-Detail Material ---
    const material = this.getMaterial(
      object.celestialObjectId,
    ) as TGasGiantMaterial;

    if (material) {
      // Update dynamic ambient lighting if the uniform exists
      if (material.uniforms.uDynamicAmbientIntensity) {
        material.uniforms.uDynamicAmbientIntensity.value =
          dynamicAmbientIntensity;
      }

      material.update(
        this.getElapsedTime(),
        timeScale,
        lightsForShader,
        camera,
        shadowCastersForShader,
      );
    }

    // --- Update Medium-Detail Material ---
    const mediumMaterial = this.getMaterial(
      `${object.celestialObjectId}-medium`,
    ) as TGasGiantMaterial;

    if (mediumMaterial) {
      // Update dynamic ambient lighting if the uniform exists
      if (mediumMaterial.uniforms.uDynamicAmbientIntensity) {
        mediumMaterial.uniforms.uDynamicAmbientIntensity.value =
          dynamicAmbientIntensity;
      }

      mediumMaterial.update(
        this.getElapsedTime(),
        timeScale,
        lightsForShader,
        camera,
        shadowCastersForShader,
      );
    }

    if (this.ringSystemRenderer) {
      this.ringSystemRenderer.update(
        object,
        time,
        timeScale,
        attenuatedLightSources,
        camera,
        allObjects,
      );
    }
  }

  /**
   * Dispose of all materials and textures.
   */
  /**
   * Registers ring shadow casters with the lighting manager if rings exist.
   * @param lightingManager The lighting manager to register with
   * @param object The celestial object
   */
  public registerRingShadowCasters(
    lightingManager: any,
    object: RenderableCelestialObject,
  ): void {
    if (this.ringSystemRenderer) {
      this.ringSystemRenderer.registerWithLightingManager(
        lightingManager,
        object,
        object, // parent object (same as object for gas giants)
        "high", // register the high detail level for shadow casting
      );
    }
  }

  dispose(): void {
    super.dispose();
    if (this.ringSystemRenderer) {
      this.ringSystemRenderer.dispose();
    }
  }
}
