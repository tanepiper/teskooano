import * as THREE from "three";
import { SCALE } from "@teskooano/data-types";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import type { CelestialMeshOptions, LODLevel } from "../../common/types";
import type { StarProperties } from "@teskooano/data-types";
import {
  RemnantStarRenderer,
  RemnantStarMaterial,
} from "./remnant-star-renderer";
import type { BaseStarUniformArgs } from "../main-sequence/main-sequence-star";

/**
 * Renderer for White Dwarf stars.
 * These are dense remnants of low-to-medium mass stars.
 */
export class WhiteDwarfRenderer extends RemnantStarRenderer {
  constructor(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ) {
    super(object, options);
  }

  protected getMaterial(
    object: RenderableCelestialObject,
  ): RemnantStarMaterial {
    const color = this.getStarColor(object);
    const properties = object.properties as StarProperties;

    const classDefaults: Partial<BaseStarUniformArgs> & {
      timeOffset?: number;
    } = {
      coronaIntensity: 0.5, // Increased from 0.05
      pulseSpeed: 0.01, // Very slow pulsations, if any
      glowIntensity: 0.8, // Increased from 0.2
      temperatureVariation: 0.05, // Relatively stable surface
      metallicEffect: 0.0, // Not applicable
      noiseEvolutionSpeed: 0.01, // Almost static
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

    return new RemnantStarMaterial(color, finalMaterialOptions);
  }

  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    const properties = star.properties as StarProperties;
    if (properties?.color) {
      try {
        return new THREE.Color(properties.color);
      } catch (e) {
        console.warn(
          `[WhiteDwarfRenderer] Invalid color '${properties.color}' in star properties. Falling back to class default.`,
        );
      }
    }
    return new THREE.Color(0xf0f8ff); // Default White Dwarf color (Alice Blue - very pale blue/white)
  }

  // White dwarfs typically don't have prominent effect layers like disks or jets.
  protected getEffectLayer(
    object: RenderableCelestialObject,
    mainStarGroup: THREE.Group,
  ): THREE.Object3D | null {
    return null; // No specific effect layer for a typical white dwarf
  }

  protected getCustomLODs(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    const scale = typeof SCALE === "number" ? SCALE : 1;
    // White dwarfs are small, so their detailed mesh might not need to be visible from very far.
    const highDetailGroup = this._createHighDetailGroup(object, {
      ...options,
      segments: 32, // Can be lower detail as they are small and often featureless
    });
    const level0: LODLevel = { object: highDetailGroup, distance: 0 };

    // Medium detail might be the same as high detail or a slightly reduced segment sphere
    const mediumDetailGroup = super._createHighDetailGroup(object, {
      ...options,
      segments: 16,
      includeEffects: false,
    });
    mediumDetailGroup.name = `${object.celestialObjectId}-medium-lod`;
    const level1: LODLevel = {
      object: mediumDetailGroup,
      distance: 300 * scale,
    };

    return [level0, level1];
  }

  protected getBillboardLODDistance(object: RenderableCelestialObject): number {
    const scale = typeof SCALE === "number" ? SCALE : 1;
    return 1000 * scale; // White dwarfs are dim, so billboard appears sooner.
  }
}
