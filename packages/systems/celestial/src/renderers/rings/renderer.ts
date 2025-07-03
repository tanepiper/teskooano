import type { RenderableCelestialObject } from "@teskooano/data-types";
import { CelestialType, RingSystemProperties } from "@teskooano/data-types";
import * as THREE from "three";
import type { LightSourcesMap } from "../base";
import { CelestialMeshOptions } from "../base/types";

import {
  isVisualizationEnabled,
  threeVectorDebug,
} from "@teskooano/core-debug";
import { LODLevel } from "@teskooano/renderer-threejs-lod";
import { BaseCelestialRenderer } from "../base/BaseCelestialRenderer";
import { RingMaterial } from "./material";
import { calculateKeplerianRotationRate } from "./utils";

/**
 * Renderer for planetary ring systems
 *
 * This renderer extends BaseCelestialRenderer to provide consistent behavior
 * with other celestial renderers and proper LOD support.
 */
export class RingSystemRenderer extends BaseCelestialRenderer {
  /**
   * Map of ring materials by object ID and ring index
   */
  private ringMaterials: Map<string, RingMaterial> = new Map();

  /**
   * Parent renderer that owns this ring system
   * Used for material registration and coordination
   */
  private parentRenderer?: BaseCelestialRenderer;

  /**
   * Create a new ring system renderer
   *
   * @param parentRenderer Optional parent renderer that owns this ring system
   */
  constructor(parentRenderer?: BaseCelestialRenderer) {
    super();
    this.parentRenderer = parentRenderer;
  }

  /**
   * Creates and returns LOD levels for the ring system
   *
   * @param object The celestial object with ring properties
   * @param options Options for creating the mesh, including parentLODDistances for backward compatibility
   * @returns Array of LOD levels
   */
  getLODLevels(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions & { parentLODDistances?: number[] },
  ): LODLevel[] {
    const properties = object.properties as RingSystemProperties;

    if (!properties?.rings || properties.rings.length === 0) {
      console.warn(
        `[RingSystemRenderer] No ring data found for ${object.celestialObjectId}`,
      );
      return [{ object: new THREE.Group(), distance: 0 }];
    }

    // Check if we should use the legacy mode with parentLODDistances
    if (options?.parentLODDistances && options.parentLODDistances.length > 0) {
      return this._createLegacyLODLevels(object, options);
    }

    // Create LOD levels with different detail
    const highDetailGroup = this._createRingGroup(object, {
      ...options,
      detailLevel: "high",
      segments: options?.segments ?? 256,
    });

    const mediumDetailGroup = this._createRingGroup(object, {
      ...options,
      detailLevel: "medium",
      segments: options?.segments ? Math.floor(options.segments / 2) : 128,
    });

    const lowDetailGroup = this._createRingGroup(object, {
      ...options,
      detailLevel: "low",
      segments: options?.segments ? Math.floor(options.segments / 4) : 64,
    });

    // Calculate LOD distances based on object radius
    const objectRadius = object.radius ?? 1;
    const baseDistance = objectRadius * 10;

    return [
      { object: highDetailGroup, distance: 0 },
      { object: mediumDetailGroup, distance: baseDistance },
      { object: lowDetailGroup, distance: baseDistance * 3 },
    ];
  }

  /**
   * Creates LOD levels using the legacy approach with parentLODDistances
   * This maintains backward compatibility with existing parent renderers
   *
   * @param object The celestial object
   * @param options Options including parentLODDistances
   * @returns Array of LOD levels
   * @private
   */
  private _createLegacyLODLevels(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions & { parentLODDistances?: number[] },
  ): LODLevel[] {
    const detailedRingGroup = this._createRingGroup(object, options);
    const level0: LODLevel = { object: detailedRingGroup, distance: 0 };

    const lodLevels = [level0];

    if (options?.parentLODDistances && options.parentLODDistances.length > 0) {
      options.parentLODDistances.forEach((distance, index) => {
        if (distance > 0) {
          const emptyGroup = new THREE.Group();
          emptyGroup.name = `${object.celestialObjectId}-ring-lod-${
            index + 1
          }-empty`;
          lodLevels.push({ object: emptyGroup, distance: distance });
        } else if (index > 0) {
          console.warn(
            `[RingSystemRenderer] Parent LOD distance ${index} is 0, creating empty group anyway.`,
          );
          const emptyGroup = new THREE.Group();
          emptyGroup.name = `${object.celestialObjectId}-ring-lod-${
            index + 1
          }-empty`;

          lodLevels.push({ object: emptyGroup, distance: 0.001 * (index + 1) });
        }
      });
    } else {
      console.warn(
        `[RingSystemRenderer] No parentLODDistances provided for ${object.celestialObjectId}. Rings will always render at high detail.`,
      );
    }

    return lodLevels;
  }

  /**
   * Initialize the ring system for a celestial object
   *
   * @param object The celestial object
   * @param options Options for creating the mesh
   */
  public initialize(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): void {
    // Create LOD levels
    const lodLevels = this.getLODLevels(object, options);

    // Create THREE.LOD object
    const lod = new THREE.LOD();
    lod.name = `${object.celestialObjectId}-rings-lod`;

    // Add LOD levels
    lodLevels.forEach((level) => {
      lod.addLevel(level.object, level.distance);
    });

    // Store LOD object
    this.lods.set(object.celestialObjectId, lod);
  }

  /**
   * Create a ring group with the specified options
   *
   * @param object The celestial object
   * @param options Options for creating the mesh
   * @returns THREE.Group containing ring meshes
   * @private
   */
  private _createRingGroup(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): THREE.Group {
    const ringGroup = new THREE.Group();
    ringGroup.name = `${object.celestialObjectId}-rings`;
    const properties = object.properties as RingSystemProperties;

    if (!properties?.rings || properties.rings.length === 0) {
      console.warn(
        `[RingSystemRenderer] No ring data found for ${object.celestialObjectId}`,
      );
      return ringGroup;
    }

    const parentRadius = object.realRadius_m;
    if (!parentRadius) {
      console.warn(
        `[RingSystemRenderer] Cannot create rings for ${object.celestialObjectId} because it has no 'realRadius_m' property for scaling.`,
      );
      return ringGroup;
    }

    const sortedRings = [...properties.rings].sort(
      (a, b) => (a.innerRadius || 0) - (b.innerRadius || 0),
    );

    // Get segments based on detail level
    const segments =
      options?.segments ??
      this.getSegmentsForDetailLevel(options?.detailLevel, 128);

    sortedRings.forEach((ringProps, index) => {
      const scaledInnerRadius =
        (ringProps.innerRadius ?? parentRadius) / parentRadius;
      const scaledOuterRadius =
        (ringProps.outerRadius ?? parentRadius) / parentRadius;
      const ringColor = new THREE.Color(ringProps.color ?? 0xffffff);
      const ringOpacity = ringProps.opacity ?? 0.7;

      // Calculate rotation rate based on ring properties or use Keplerian calculation
      let rotationRate: number;

      if (ringProps.rotationRate !== undefined) {
        // Use provided rotation rate if available
        rotationRate = ringProps.rotationRate;
      } else {
        // Calculate rotation rate based on Keplerian mechanics
        rotationRate = calculateKeplerianRotationRate(
          ringProps.innerRadius ?? parentRadius,
          ringProps.outerRadius ?? parentRadius * 2,
        );
      }

      if (scaledOuterRadius <= scaledInnerRadius) {
        console.warn(
          `[RingSystemRenderer] Invalid ring dimensions for ${object.celestialObjectId}, ring ${index}: Outer radius must be greater than inner radius.`,
        );
        return;
      }

      const ringGeometry = new THREE.RingGeometry(
        scaledInnerRadius,
        scaledOuterRadius,
        segments,
        8,
        0,
        Math.PI * 2,
      );

      const ringMaterial = new RingMaterial(ringColor, {
        opacity: ringOpacity,
        rotationRate: rotationRate,
      });

      const materialKey = `${object.celestialObjectId}-ring-${index}`;
      this.ringMaterials.set(materialKey, ringMaterial);

      // Register material with parent renderer if available, otherwise with this renderer
      if (this.parentRenderer) {
        this.parentRenderer.registerMaterial(materialKey, ringMaterial);
      } else {
        this.registerMaterial(materialKey, ringMaterial);
      }

      const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
      ringMesh.name = `${object.celestialObjectId}-ring-${index}`;
      ringMesh.rotation.x = -Math.PI / 2;
      ringGroup.add(ringMesh);
    });

    return ringGroup;
  }

  /**
   * Update the ring system
   *
   * @param object The celestial object
   * @param time Current simulation time
   * @param timeScale Current time scale
   * @param lightSources Map of light sources
   * @param camera Scene camera
   * @param allObjects Map of all objects in the scene
   * @param allMeshes Map of all meshes in the scene
   */
  update(
    object: RenderableCelestialObject,
    time: number,
    timeScale: number,
    lightSources: LightSourcesMap,
    camera: THREE.Camera,
    allObjects?: Record<string, RenderableCelestialObject>,
    allMeshes?: Record<string, THREE.Object3D>,
  ): void {
    // Call parent update method to handle LOD updates
    super.update(
      object,
      time,
      timeScale,
      lightSources,
      camera,
      allObjects,
      allMeshes,
    );

    if (isVisualizationEnabled()) {
      threeVectorDebug.clearVectors(`ring-system-${object.celestialObjectId}`);
    }

    if (!lightSources || lightSources.size === 0) {
      return;
    }

    // --- Shadow Caster Calculation ---
    const shadowCasters: { position: THREE.Vector3; radius: number }[] = [];
    const parentBody = allObjects
      ? allObjects[object.celestialObjectId]
      : undefined;

    if (parentBody) {
      // The parent body itself is the primary shadow caster.
      shadowCasters.push({
        position: parentBody.position.clone(),
        radius: parentBody.radius ?? 0,
      });
    }

    // Find moons of the parent object to act as additional shadow casters.
    if (allObjects) {
      for (const other of Object.values(allObjects)) {
        if (
          other.parentId === object.celestialObjectId &&
          other.type === CelestialType.MOON
        ) {
          shadowCasters.push({
            position: other.position.clone(),
            radius: other.radius ?? 0,
          });
        }
      }
    }

    // Update all ring materials associated with this renderer
    this.ringMaterials.forEach((material) => {
      material.update(
        time,
        object.position.clone(),
        object.radius ?? 0,
        lightSources,
        shadowCasters,
      );
    });
  }

  /**
   * Clean up resources used by the renderer
   */
  dispose(): void {
    // Only dispose materials if this is not a child renderer
    if (!this.parentRenderer) {
      this.ringMaterials.forEach((material) => {
        material.dispose();
      });
    }

    this.ringMaterials.clear();

    // Call parent dispose method
    super.dispose();
  }
}
