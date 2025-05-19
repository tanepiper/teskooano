import { RingSystemProperties } from "@teskooano/data-types";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import * as THREE from "three";
import type {
  CelestialMeshOptions,
  CelestialRenderer,
  LODLevel,
} from "../index";

import ringFragmentShader from "../../shaders/ring/ring.fragment.glsl";
import ringVertexShader from "../../shaders/ring/ring.vertex.glsl";

import {
  threeVectorDebug,
  isVisualizationEnabled,
} from "@teskooano/core-debug";
import { renderableStore } from "@teskooano/core-state";

/**
 * Material for celestial object rings
 * Works for all ring types with configuration options
 */
export class RingMaterial extends THREE.ShaderMaterial {
  constructor(
    ringColor: THREE.Color = new THREE.Color(0xeeddaa),
    options: {
      opacity?: number;
      textureMap?: THREE.Texture;
      detailLevel?: "high" | "medium" | "low" | "very-low";
      ringIndex?: number;
      ringType?: "default" | "detailed_saturn";
    } = {},
  ) {
    const detailLevel = options.detailLevel || "high";
    const qualityFactors = {
      high: 1.0,
      medium: 0.75,
      low: 0.5,
      "very-low": 0.25,
    };
    const qualityFactor = qualityFactors[detailLevel];

    const ringType = options.ringType || "default";

    const typeCoef = ringType === "detailed_saturn" ? 1.0 : 0.0;

    super({
      uniforms: {
        color: { value: ringColor },
        opacity: { value: options.opacity ?? 0.8 },
        time: { value: 0 },
        textureMap: { value: options.textureMap ?? null },
        hasTexture: { value: options.textureMap ? 1.0 : 0.0 },
        uSunPosition: { value: new THREE.Vector3(1e11, 0, 0) },
        uParentPosition: { value: new THREE.Vector3(0, 0, 0) },
        uParentRadius: { value: 1.0 },
        qualityFactor: { value: qualityFactor },
        rotationRate: { value: 0.0 },
        ringIndex: { value: options.ringIndex ?? 0 },
        ringType: { value: typeCoef },
      },
      vertexShader: ringVertexShader,
      fragmentShader: ringFragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }

  /**
   * Update material uniforms, e.g., time for animation, light source changes.
   * @param time Current time (e.g., from animation loop).
   * @param sunPosition World space POSITION of the primary light source (sun).
   * @param parentPosition World position of the celestial body the rings belong to.
   * @param parentRadius Radius of the celestial body the rings belong to.
   */
  update(
    time: number,
    sunPosition?: THREE.Vector3,
    parentPosition?: THREE.Vector3,
    parentRadius?: number,
  ) {
    this.uniforms.time.value = time;
    if (sunPosition) {
      this.uniforms.uSunPosition.value.copy(sunPosition);
    }
    if (parentPosition) {
      this.uniforms.uParentPosition.value.copy(parentPosition);
    }
    if (parentRadius !== undefined) {
      this.uniforms.uParentRadius.value = parentRadius;
    }
  }

  dispose(): void {
    if (this.uniforms.textureMap.value) {
      (this.uniforms.textureMap.value as THREE.Texture).dispose();
    }
    super.dispose();
  }
}

export class RingSystemRenderer implements CelestialRenderer {
  protected materials: Map<string, RingMaterial[]> = new Map();
  protected objectIds: Set<string> = new Set();
  protected textureLoader: THREE.TextureLoader = new THREE.TextureLoader();

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

    const sortedRings = [...properties.rings].sort(
      (a, b) => (a.innerRadius || 0) - (b.innerRadius || 0),
    );

    sortedRings.forEach((ringProps, index) => {
      const scaledInnerRadius = ringProps.innerRadius ?? 1;
      const scaledOuterRadius = ringProps.outerRadius ?? 1;
      const ringColor = new THREE.Color(ringProps.color ?? 0xffffff);
      const ringOpacity = ringProps.opacity ?? 0.7;

      if (scaledOuterRadius <= scaledInnerRadius) {
        console.warn(
          `[RingSystemRenderer] Invalid ring dimensions for ${object.celestialObjectId}, ring ${index}: Outer radius must be greater than inner radius.`,
        );
        return;
      }

      const segments = options?.segments ?? 128;
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
        ringIndex: index,
        detailLevel: options?.detailLevel || "high",
      });

      const materialKey = `${object.celestialObjectId}-ring-${index}`;
      this.materials.set(materialKey, [ringMaterial]);

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
    this.objectIds.add(object.celestialObjectId);

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
    time: number,
    lightSources?: Map<
      string,
      { position: THREE.Vector3; color: THREE.Color; intensity?: number }
    >,
  ): void {
    const currentRenderableObjects = renderableStore.getRenderableObjects();

    if (isVisualizationEnabled()) {
      this.objectIds.forEach((id) => {
        threeVectorDebug.clearVectors(`ring-system-${id}`);
      });
    }

    this.materials.forEach((materialArray, materialKey) => {
      const ringSystemId = materialKey.split("-ring-")[0];
      const ringSystemObject = currentRenderableObjects[ringSystemId];

      if (!ringSystemObject) {
        console.warn(
          `[RingSystemRenderer Update] Ring system object ${ringSystemId} not found in store.`,
        );
        return;
      }

      const parentId = ringSystemObject.parentId;
      if (!parentId) {
        console.warn(
          `[RingSystemRenderer Update] Parent ID not found for ring system ${ringSystemId}.`,
        );
        return;
      }

      const parentObject = currentRenderableObjects[parentId];
      if (!parentObject) {
        console.warn(
          `[RingSystemRenderer Update] Parent object ${parentId} not found for ring system ${ringSystemId}.`,
        );
        return;
      }

      const parentPosition = parentObject.position;
      const parentRadius = parentObject.radius;

      if (!parentPosition || parentRadius === undefined) {
        console.warn(
          `[RingSystemRenderer Update] Parent position or radius missing for parent ${parentId}. Skipping vector storage and material update.`,
        );
        return;
      }

      let primarySunPosition: THREE.Vector3 | undefined = undefined;
      const lightSourceId = parentObject.primaryLightSourceId;
      let primaryLightData = lightSources?.get(lightSourceId ?? "");

      if (!primaryLightData && lightSources && lightSources.size > 0) {
        primaryLightData = lightSources.values().next().value;
      }

      if (primaryLightData?.position) {
        primarySunPosition = primaryLightData.position.clone();
      } else {
        primarySunPosition = new THREE.Vector3(1e11, 0, 0);
      }

      if (isVisualizationEnabled() && primarySunPosition) {
        threeVectorDebug.setVectors(`ring-system-${ringSystemId}`, {
          sunDir: primarySunPosition.clone().normalize(),
          parentPos: parentPosition.clone(),
        });
      }

      materialArray.forEach((material) => {
        material.update(time, primarySunPosition, parentPosition, parentRadius);
      });
    });
  }

  dispose(): void {
    this.materials.forEach((materialArray) => {
      materialArray.forEach((material) => material.dispose());
    });
    this.materials.clear();

    if (isVisualizationEnabled()) {
      this.objectIds.forEach((id) => {
        threeVectorDebug.clearVectors(`ring-system-${id}`);
      });
    }

    this.objectIds.clear();
  }
}
