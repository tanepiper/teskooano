import type { RenderableCelestialObject } from "@teskooano/data-types";
import { CelestialType, RingSystemProperties } from "@teskooano/data-types";
import * as THREE from "three";
import type { CelestialMeshOptions, LightSourcesMap } from "../index";

import ringFragmentShader from "../../shaders/ring/ring.fragment.glsl";
import ringVertexShader from "../../shaders/ring/ring.vertex.glsl";

import {
  isVisualizationEnabled,
  threeVectorDebug,
} from "@teskooano/core-debug";
import { LODLevel } from "@teskooano/renderer-threejs-lod";
import { BaseCelestialRenderer } from "../base/BaseCelestialRenderer";
import { LightArrayUtils } from "../base/CelestialRenderer";

/**
 * Material for celestial object rings
 * Works for all ring types with configuration options
 */
export class RingMaterial extends THREE.ShaderMaterial {
  protected currentNumLights: number = 0;
  protected currentNumShadowCasters: number = 0;

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

    const MAX_LIGHTS = 4;
    const MAX_SHADOW_CASTERS = 4;

    super({
      defines: {
        MAX_LIGHTS: MAX_LIGHTS,
        MAX_SHADOW_CASTERS: MAX_SHADOW_CASTERS,
      },
      uniforms: {
        color: { value: ringColor },
        opacity: { value: options.opacity ?? 0.8 },
        time: { value: 0 },
        textureMap: { value: options.textureMap ?? null },
        hasTexture: { value: options.textureMap ? 1.0 : 0.0 },
        uParentPosition: { value: new THREE.Vector3(0, 0, 0) },
        uParentRadius: { value: 1.0 },
        qualityFactor: { value: qualityFactor },
        rotationRate: { value: 0.0 },
        ringIndex: { value: options.ringIndex ?? 0 },
        ringType: { value: typeCoef },
        uNumLights: { value: 0 },
        uLightSources: {
          value: LightArrayUtils.createLightSourceArray(MAX_LIGHTS),
        },
        uNumShadowCasters: { value: 0 },
        uShadowCasters: {
          value: LightArrayUtils.createShadowCasterArray(MAX_SHADOW_CASTERS),
        },
      },
      vertexShader: ringVertexShader,
      fragmentShader: ringFragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    this.currentNumLights = MAX_LIGHTS;
    this.currentNumShadowCasters = MAX_SHADOW_CASTERS;
  }

  private resizeLightArrays(newSize: number): void {
    this.uniforms.uLightSources.value = LightArrayUtils.resizeLightArray(
      this,
      newSize,
      this.uniforms.uLightSources.value,
    );
    this.currentNumLights = newSize;
  }

  private resizeShadowCasterArrays(newSize: number): void {
    this.uniforms.uShadowCasters.value =
      LightArrayUtils.resizeShadowCasterArray(
        this,
        newSize,
        this.uniforms.uShadowCasters.value,
      );
    this.currentNumShadowCasters = newSize;
  }

  update(
    time: number,
    parentPosition: THREE.Vector3,
    parentRadius: number,
    lightSources?: LightSourcesMap,
    shadowCasters?: { position: THREE.Vector3; radius: number }[],
  ) {
    this.uniforms.time.value = time;
    this.uniforms.uParentPosition.value.copy(parentPosition);
    this.uniforms.uParentRadius.value = parentRadius;

    const numLights = lightSources?.size ?? 0;
    if (numLights !== this.currentNumLights) {
      this.resizeLightArrays(numLights);
    }

    this.uniforms.uNumLights.value = numLights;
    if (lightSources) {
      let i = 0;
      for (const light of lightSources.values()) {
        const uniformLight = this.uniforms.uLightSources.value[i];
        uniformLight.position.copy(light.position);
        uniformLight.color.copy(light.color);
        uniformLight.intensity = light.intensity;
        i++;
      }
    }

    const numShadowCasters = shadowCasters?.length ?? 0;
    if (numShadowCasters !== this.currentNumShadowCasters) {
      this.resizeShadowCasterArrays(numShadowCasters);
    }

    this.uniforms.uNumShadowCasters.value = numShadowCasters;
    if (shadowCasters) {
      for (let i = 0; i < numShadowCasters; i++) {
        const uniformCaster = this.uniforms.uShadowCasters.value[i];
        uniformCaster.position.copy(shadowCasters[i].position);
        uniformCaster.radius = shadowCasters[i].radius;
      }
    }
  }

  dispose(): void {
    if (this.uniforms.textureMap.value) {
      (this.uniforms.textureMap.value as THREE.Texture).dispose();
    }
    super.dispose();
  }
}

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
