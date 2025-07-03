import type { RenderableCelestialObject } from "@teskooano/data-types";
import { CelestialType, RingSystemProperties } from "@teskooano/data-types";
import * as THREE from "three";
import type { CelestialMeshOptions, LightSourcesMap } from "../index";

import {
  isVisualizationEnabled,
  threeVectorDebug,
} from "@teskooano/core-debug";
import { LODLevel } from "@teskooano/renderer-threejs-lod";
import { BaseCelestialRenderer } from "../base/BaseCelestialRenderer";
import { RingMaterial } from "./material";
import { calculateKeplerianRotationRate } from "./utils";

export class RingSystemRenderer {
  private parentRenderer: BaseCelestialRenderer;
  private ringMaterials: Map<string, RingMaterial> = new Map();

  constructor(parentRenderer: BaseCelestialRenderer) {
    this.parentRenderer = parentRenderer;
  }

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

      const segments = 256;
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
      this.parentRenderer.registerMaterial(materialKey, ringMaterial);

      const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
      ringMesh.name = `${object.celestialObjectId}-ring-${index}`;
      ringMesh.rotation.x = -Math.PI / 2;
      ringGroup.add(ringMesh);
    });

    return ringGroup;
  }

  /**
   * Creates and returns an array of LOD levels for the ring system.
   * Level 0 contains the detailed rings.
   * Subsequent levels are empty groups, using distances from parentLODDistances.
   */
  getLODLevels(
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

  update(
    object: RenderableCelestialObject,
    time: number,
    timeScale: number,
    lightSources?: LightSourcesMap,
    allObjects?: Record<string, RenderableCelestialObject>,
  ): void {
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
   * Dispose of all materials created and managed by this renderer.
   */
  dispose(): void {
    this.ringMaterials.forEach((material) => {
      // The parentRenderer is responsible for the actual disposal
      // since the material was registered with it. We just clear our map.
      material.dispose();
    });
    this.ringMaterials.clear();
  }
}
