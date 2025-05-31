import * as THREE from "three";
import { SCALE } from "@teskooano/data-types";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import type { CelestialMeshOptions, LODLevel } from "../../common/types";
import type { StarProperties } from "@teskooano/data-types";
import {
  EvolvedSpecialStarRenderer,
  EvolvedSpecialStarMaterial,
} from "./evolved-special-star-renderer";
import type { BaseStarUniformArgs } from "../main-sequence/main-sequence-star";

// Wolf-Rayet specific shaders (if any, otherwise uses EvolvedSpecialStarMaterial defaults)
import WOLF_RAYET_SHELL_VERTEX_SHADER from "../../../shaders/star/evolved-special/wolf-rayet/wolf-rayet-shell-vertex.glsl";
import WOLF_RAYET_SHELL_FRAGMENT_SHADER from "../../../shaders/star/evolved-special/wolf-rayet/wolf-rayet-shell-fragment.glsl";

/**
 * Renderer for Wolf-Rayet stars.
 * These are massive, evolved stars with strong stellar winds and emission lines.
 */
export class WolfRayetRenderer extends EvolvedSpecialStarRenderer {
  constructor(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ) {
    super(object, options);
  }

  protected getMaterial(
    object: RenderableCelestialObject,
  ): EvolvedSpecialStarMaterial {
    const color = this.getStarColor(object);
    const properties = object.properties as StarProperties;

    const classDefaults: Partial<BaseStarUniformArgs> & {
      timeOffset?: number;
    } = {
      coronaIntensity: 0.8, // Very bright, obscured star
      pulseSpeed: 0.2,
      glowIntensity: 0.9, // Intense glow from winds
      temperatureVariation: 0.1, // Hot, but winds dominate view
      metallicEffect: 0.1, // Less distinct surface features
      noiseEvolutionSpeed: 0.5, // Rapidly evolving winds
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

    return new EvolvedSpecialStarMaterial(color, finalMaterialOptions);
  }

  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    const properties = star.properties as StarProperties;
    if (properties?.color) {
      try {
        return new THREE.Color(properties.color);
      } catch (e) {
        console.warn(
          `[WolfRayetRenderer] Invalid color '${properties.color}' in star properties. Falling back to class default.`,
        );
      }
    }
    // Wolf-Rayet stars are typically very hot and blue, though often obscured by their winds.
    // The visual color can vary based on the wind composition (WN, WC, WO types).
    return new THREE.Color(0x60a0ff); // Default: Bright, slightly violet blue
  }

  protected getEffectLayer(
    object: RenderableCelestialObject,
    mainStarGroup: THREE.Group,
  ): THREE.Object3D | null {
    const starRadius = object.radius || 10; // Wolf-Rayets are large
    const shellOuterRadius = starRadius * 3; // Prominent stellar wind shell

    const shellGeometry = new THREE.SphereGeometry(shellOuterRadius, 48, 48);
    const shellMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        shellColor: { value: new THREE.Color(0x88aaff) }, // Bluish-white, slightly transparent wind
        density: { value: 0.3 }, // Lower density for a more ethereal look
        noiseScale: { value: 5.0 },
      },
      vertexShader: WOLF_RAYET_SHELL_VERTEX_SHADER,
      fragmentShader: WOLF_RAYET_SHELL_FRAGMENT_SHADER,
      transparent: true,
      blending: THREE.AdditiveBlending, // Good for luminous gas
      side: THREE.DoubleSide, // Render both sides for a volumetric feel
      depthWrite: false, // Allows transparency to work correctly with depth
    });
    this.effectMaterials.set(
      `${object.celestialObjectId}-wind-shell`,
      shellMaterial,
    );

    const shellMesh = new THREE.Mesh(shellGeometry, shellMaterial);
    shellMesh.name = `${object.celestialObjectId}-wind-shell`;
    return shellMesh;
  }

  protected getCustomLODs(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    const scale = typeof SCALE === "number" ? SCALE : 1;
    const highDetailGroup = this._createHighDetailGroup(object, {
      ...options,
      segments: 64,
    });
    const level0: LODLevel = { object: highDetailGroup, distance: 0 };

    const mediumStarOnlyGroup = super._createHighDetailGroup(object, {
      ...options,
      segments: 32,
      includeEffects: false, // Shell might be too complex or not visible at this range
    });
    mediumStarOnlyGroup.name = `${object.celestialObjectId}-medium-lod`;
    const level1: LODLevel = {
      object: mediumStarOnlyGroup,
      distance: 2000 * scale,
    };

    return [level0, level1];
  }

  protected getBillboardLODDistance(object: RenderableCelestialObject): number {
    const scale = typeof SCALE === "number" ? SCALE : 1;
    return 8000 * scale; // Wolf-Rayets are very luminous
  }
}
