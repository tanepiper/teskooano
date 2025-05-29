import * as THREE from "three";
import { BaseStarRenderer } from "../base/base-star";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import { LODLevel } from "../../index";
import type {
  CelestialMeshOptions,
  LightSourceData,
} from "../../common/CelestialRenderer";
import { AU_METERS } from "@teskooano/data-types";

// Assuming direct .glsl imports work as strings in your Vite setup
import EVOLVED_SPECIAL_VERTEX_SHADER from "../../../shaders/star/evolved-special/vertex.glsl";
import EVOLVED_SPECIAL_FRAGMENT_SHADER from "../../../shaders/star/evolved-special/fragment.glsl";
import EVOLVED_SPECIAL_CORONA_FRAGMENT_SHADER from "../../../shaders/star/evolved-special/corona.glsl";

/**
 * Base material for evolved special stars.
 * Uses shared vertex and fragment shaders for this category.
 */
export class EvolvedSpecialStarMaterial extends THREE.ShaderMaterial {
  constructor(
    shaderParameters: {
      starColor?: THREE.Color;
      coronaIntensity?: number;
      pulseSpeed?: number;
      glowIntensity?: number;
      temperatureVariation?: number;
      metallicEffect?: number;
      time?: number; // Optional initial time
      noiseEvolutionSpeed?: number; // Added for controlling noise animation speed
      timeOffset?: number; // Added
    } = {},
    vertexShader: string = EVOLVED_SPECIAL_VERTEX_SHADER,
    fragmentShader: string = EVOLVED_SPECIAL_FRAGMENT_SHADER,
  ) {
    const uniforms = {
      time: { value: shaderParameters.time ?? 0.0 },
      starColor: {
        value: shaderParameters.starColor ?? new THREE.Color(0xffccaa),
      },
      coronaIntensity: { value: shaderParameters.coronaIntensity ?? 0.5 },
      pulseSpeed: { value: shaderParameters.pulseSpeed ?? 0.1 },
      glowIntensity: { value: shaderParameters.glowIntensity ?? 0.7 },
      temperatureVariation: {
        value: shaderParameters.temperatureVariation ?? 0.2,
      },
      metallicEffect: { value: shaderParameters.metallicEffect ?? 0.3 },
      noiseEvolutionSpeed: {
        value: shaderParameters.noiseEvolutionSpeed ?? 1.0,
      }, // Default to 1.0
      timeOffset: {
        value: shaderParameters.timeOffset ?? Math.random() * 1000.0,
      }, // Added
    };

    super({
      uniforms: uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      transparent: false,
      blending: THREE.NoBlending,
      depthWrite: true,
    });
  }

  update(time: number): void {
    if (this.uniforms.time) {
      this.uniforms.time.value = time;
    }
  }
}

/**
 * Abstract base class for renderers of evolved special stars.
 * These stars have unique visual characteristics, often including an additional effect layer.
 */
export abstract class EvolvedSpecialStarRenderer extends BaseStarRenderer {
  protected effectMaterials: Map<string, THREE.Material | THREE.Material[]> =
    new Map();

  protected getCoronaVertexShader(object: RenderableCelestialObject): string {
    return EVOLVED_SPECIAL_VERTEX_SHADER;
  }

  protected getCoronaFragmentShader(object: RenderableCelestialObject): string {
    return EVOLVED_SPECIAL_CORONA_FRAGMENT_SHADER;
  }

  /**
   * Calculate the appropriate billboard sprite size based on the star's real radius.
   * This can be overridden by specific star type renderers to customize billboard scaling.
   *
   * @param object The renderable celestial object
   * @returns The calculated sprite size
   */
  protected calculateBillboardSize(object: RenderableCelestialObject): number {
    const starRadius_AU = object.radius / AU_METERS;

    // Evolved special stars may have varied sizes
    const minSpriteSize = 0.08;
    const maxSpriteSize = 0.5;

    // Linear scaling with modest exponential component for evolved stars
    const calculatedSpriteSize = 0.1 + starRadius_AU * 0.15;

    return Math.max(
      minSpriteSize,
      Math.min(maxSpriteSize, calculatedSpriteSize),
    );
  }

  /**
   * Creates and returns an additional effect layer for this specific star type.
   * This could be a wind shell, dust cloud, etc.
   * Subclasses must implement this.
   * The returned object will be added to the star's main group.
   */
  protected abstract getEffectLayer(
    object: RenderableCelestialObject,
    mainStarGroup: THREE.Group,
  ): THREE.Object3D | null;

  /**
   * Overridden to include the custom effect layer.
   */
  protected override _createHighDetailGroup(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): THREE.Group {
    const group = super._createHighDetailGroup(object, options); // Create base star (body + corona)
    const effectLayer = this.getEffectLayer(object, group);
    if (effectLayer) {
      group.add(effectLayer);
    }
    return group;
  }

  // Note: If medium/low LODs also need the effect layer, their respective
  // creation methods (_createMediumDetailGroup, _createBillboardLODLevel etc. if overridden)
  // would also need to call getEffectLayer. For now, adding to high detail.

  // These remain abstract
  protected abstract override getCustomLODs(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[];

  protected abstract override getBillboardLODDistance(
    object: RenderableCelestialObject,
  ): number;

  protected abstract override getMaterial(
    object: RenderableCelestialObject,
  ): EvolvedSpecialStarMaterial; // Ensure correct material type

  // Override update to also update effect materials if they have an update method
  override update(
    time: number,
    lightSources?: Map<string, LightSourceData>, // Added LightSourceData import
    camera?: THREE.Camera,
  ): void {
    super.update(time, lightSources, camera); // Update base star and corona

    const currentTime =
      time === undefined ? Date.now() / 1000 - this.startTime : time;
    this.effectMaterials.forEach((materialOrMaterials) => {
      const materials = Array.isArray(materialOrMaterials)
        ? materialOrMaterials
        : [materialOrMaterials];
      materials.forEach((material: any) => {
        if (material && typeof material.update === "function") {
          material.update(currentTime); // Pass time to the effect material's update
        } else if (material && material.uniforms && material.uniforms.time) {
          material.uniforms.time.value = currentTime;
        }
      });
    });
  }

  // Override dispose to also dispose of effect materials
  override dispose(): void {
    super.dispose();
    this.effectMaterials.forEach((materialOrMaterials) => {
      const materials = Array.isArray(materialOrMaterials)
        ? materialOrMaterials
        : [materialOrMaterials];
      materials.forEach((material: any) => {
        if (material && typeof material.dispose === "function") {
          material.dispose();
        }
      });
    });
    this.effectMaterials.clear();
  }
}
