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

// Shaders for carbon star effects (e.g., sooty atmosphere)
import CARBON_STAR_EFFECT_VERTEX_SHADER from "../../../shaders/star/evolved-special/carbon-star/carbon-shell-vertex.glsl";
import CARBON_STAR_EFFECT_FRAGMENT_SHADER from "../../../shaders/star/evolved-special/carbon-star/carbon-shell-fragment.glsl";

/**
 * Renderer for Carbon Stars.
 * These are typically Asymptotic Giant Branch (AGB) stars with carbon-rich atmospheres.
 */
export class CarbonStarRenderer extends EvolvedSpecialStarRenderer {
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
      coronaIntensity: 0.1, // Often obscured by sooty atmosphere
      pulseSpeed: 0.05, // Can be variable, but generally slow pulsations
      glowIntensity: 0.4, // Dimmed by carbon dust
      temperatureVariation: 0.3, // Large convective cells
      metallicEffect: 0.5, // Surface less distinct
      noiseEvolutionSpeed: 0.1,
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
          `[CarbonStarRenderer] Invalid color '${properties.color}' in star properties. Falling back to class default.`,
        );
      }
    }
    return new THREE.Color(0xff6347); // Default Carbon star color (Tomato - deep red)
  }

  protected getEffectLayer(
    object: RenderableCelestialObject,
    mainStarGroup: THREE.Group,
  ): THREE.Object3D | null {
    const starRadius = object.radius || 50; // Carbon stars are large (giants)
    const atmosphereOuterRadius = starRadius * 1.5; // Sooty outer atmosphere

    const atmosphereGeometry = new THREE.SphereGeometry(
      atmosphereOuterRadius,
      32,
      32,
    );
    const atmosphereMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        atmosphereColor: { value: new THREE.Color(0x402020) }, // Dark, sooty red-brown
        density: { value: 0.6 }, // Relatively dense, obscuring
      },
      vertexShader: CARBON_STAR_EFFECT_VERTEX_SHADER,
      fragmentShader: CARBON_STAR_EFFECT_FRAGMENT_SHADER,
      transparent: true,
      blending: THREE.NormalBlending, // Normal blending for a dusty/sooty look
      side: THREE.FrontSide, // Render only the front for a shell effect
      depthWrite: false,
    });
    this.effectMaterials.set(
      `${object.celestialObjectId}-sooty-atmosphere`,
      atmosphereMaterial,
    );

    const atmosphereMesh = new THREE.Mesh(
      atmosphereGeometry,
      atmosphereMaterial,
    );
    atmosphereMesh.name = `${object.celestialObjectId}-sooty-atmosphere`;
    return atmosphereMesh;
  }

  protected getCustomLODs(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    const scale = typeof SCALE === "number" ? SCALE : 1;
    const highDetailGroup = this._createHighDetailGroup(object, {
      ...options,
      segments: 48,
    });
    const level0: LODLevel = { object: highDetailGroup, distance: 0 };

    const mediumStarOnlyGroup = super._createHighDetailGroup(object, {
      ...options,
      segments: 24,
      includeEffects: false, // Atmosphere might be too subtle or costly for medium LOD
    });
    mediumStarOnlyGroup.name = `${object.celestialObjectId}-medium-lod`;
    const level1: LODLevel = {
      object: mediumStarOnlyGroup,
      distance: 2500 * scale,
    };

    return [level0, level1];
  }

  protected getBillboardLODDistance(object: RenderableCelestialObject): number {
    const scale = typeof SCALE === "number" ? SCALE : 1;
    return 7000 * scale; // Carbon stars are large and can be bright in infrared, but visually dimmer
  }
}
