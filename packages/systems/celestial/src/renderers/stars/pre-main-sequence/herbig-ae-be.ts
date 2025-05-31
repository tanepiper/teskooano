import * as THREE from "three";
import { SCALE } from "@teskooano/data-types";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import type { CelestialMeshOptions, LODLevel } from "../../common/types";
import type { StarProperties } from "@teskooano/data-types";
import {
  PreMainSequenceStarRenderer,
  PreMainSequenceStarMaterial,
} from "./pre-main-sequence-star-renderer";
import type { BaseStarUniformArgs } from "../main-sequence/main-sequence-star";

// Shaders (can reuse or specialize from pre-main-sequence)
import PMS_VERTEX_SHADER from "../../../shaders/star/pre-main-sequence/vertex.glsl";
import PMS_FRAGMENT_SHADER from "../../../shaders/star/pre-main-sequence/fragment.glsl";
import PMS_CORONA_FRAGMENT_SHADER from "../../../shaders/star/pre-main-sequence/corona.glsl";

/**
 * Renderer for Herbig Ae/Be stars.
 * These are young, intermediate-mass stars (2-8 M☉) with accretion disks and possibly jets.
 * They are hotter and more massive analogs of T-Tauri stars.
 */
export class HerbigAeBeRenderer extends PreMainSequenceStarRenderer {
  constructor(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ) {
    super(object, options);
  }

  protected getMaterial(
    object: RenderableCelestialObject,
  ): PreMainSequenceStarMaterial {
    const color = this.getStarColor(object);
    const properties = object.properties as StarProperties;

    const classDefaults: Partial<BaseStarUniformArgs> & {
      timeOffset?: number;
    } = {
      coronaIntensity: 0.4, // More intense than T-Tauri
      pulseSpeed: 0.4,
      glowIntensity: 0.7, // Brighter
      temperatureVariation: 0.4,
      metallicEffect: 0.01,
      noiseEvolutionSpeed: 0.25,
    };

    const propsUniforms = properties.shaderUniforms?.baseStar;
    const propsTimeOffset = properties.timeOffset;

    const finalMaterialOptions: Partial<BaseStarUniformArgs> & {
      timeOffset?: number;
    } = {
      ...classDefaults,
      ...(propsUniforms || {}),
      timeOffset:
        propsTimeOffset ?? classDefaults.timeOffset ?? Math.random() * 1000.0,
    };
    // Can explicitly pass PMS shaders if they are different from PreMainSequenceStarMaterial defaults
    return new PreMainSequenceStarMaterial(
      color,
      finalMaterialOptions,
      PMS_VERTEX_SHADER,
      PMS_FRAGMENT_SHADER,
    );
  }

  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    const properties = star.properties as StarProperties;
    if (properties?.color) {
      try {
        return new THREE.Color(properties.color);
      } catch (e) {
        console.warn(
          `[HerbigAeBeRenderer] Invalid color '${properties.color}' in star properties. Falling back to class default.`,
        );
      }
    }
    return new THREE.Color(0xd1e0ff); // Default Herbig Ae/Be color (Bluish-white to white)
  }

  // Herbig Ae/Be stars definitely have prominent accretion disks.
  protected getEffectLayer(
    object: RenderableCelestialObject,
    mainStarGroup: THREE.Group,
  ): THREE.Object3D | null {
    const starRadius = object.radius || 0.2; // Herbigs are larger
    const diskInnerRadius = starRadius * 1.8;
    const diskOuterRadius = starRadius * 12; // Larger, more substantial disks

    const diskGeometry = new THREE.RingGeometry(
      diskInnerRadius,
      diskOuterRadius,
      64,
      8,
      0,
      Math.PI * 2,
    );
    diskGeometry.rotateX(-Math.PI / 2);

    // Could use a specific Herbig disk shader, for now a basic material
    const diskMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xc0b0a0), // Dusty gray-brown, potentially with some emission
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
      roughness: 0.8,
      metalness: 0.1,
    });
    this.effectMaterials.set(`${object.celestialObjectId}-disk`, diskMaterial);

    const diskMesh = new THREE.Mesh(diskGeometry, diskMaterial);
    diskMesh.name = `${object.celestialObjectId}-herbig-disk`;
    return diskMesh;
  }

  // Override corona shaders if Herbig Ae/Be have a visually distinct corona
  protected getCoronaVertexShader(object: RenderableCelestialObject): string {
    return PMS_VERTEX_SHADER; // Or a specific Herbig corona vertex shader
  }

  protected getCoronaFragmentShader(object: RenderableCelestialObject): string {
    return PMS_CORONA_FRAGMENT_SHADER; // Or a specific Herbig corona fragment shader
  }

  protected getCustomLODs(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    const scale = typeof SCALE === "number" ? SCALE : 1;
    const highDetailGroup = this._createHighDetailGroup(object, {
      ...options,
      segments: 96, // Hotter, more defined stars
    });
    const level0: LODLevel = { object: highDetailGroup, distance: 0 };

    const mediumStarOnlyGroup = super._createHighDetailGroup(object, {
      ...options,
      segments: 48,
      includeEffects: false,
    });
    mediumStarOnlyGroup.name = `${object.celestialObjectId}-medium-lod`;
    const level1: LODLevel = {
      object: mediumStarOnlyGroup,
      distance: 1500 * scale,
    };

    return [level0, level1];
  }

  protected getBillboardLODDistance(object: RenderableCelestialObject): number {
    const scale = typeof SCALE === "number" ? SCALE : 1;
    return 6000 * scale; // Typically brighter and larger than T-Tauri
  }
}
