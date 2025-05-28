import * as THREE from "three";
import { BaseStarRenderer } from "../base/base-star";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import { LODLevel } from "../../index";
import type {
  CelestialMeshOptions,
  LightSourceData,
} from "../../common/CelestialRenderer";

// Assuming direct .glsl imports work as strings in your Vite setup
import PRE_MAIN_SEQUENCE_VERTEX_SHADER from "../../../shaders/star/pre-main-sequence/vertex.glsl";
import PRE_MAIN_SEQUENCE_FRAGMENT_SHADER from "../../../shaders/star/pre-main-sequence/fragment.glsl";
import PRE_MAIN_SEQUENCE_CORONA_FRAGMENT_SHADER from "../../../shaders/star/pre-main-sequence/corona.glsl";

/**
 * Base material for pre-main-sequence stars.
 * Uses shared vertex and fragment shaders for this category.
 */
export class PreMainSequenceStarMaterial extends THREE.ShaderMaterial {
  constructor(
    shaderParameters: {
      starColor?: THREE.Color;
      coronaIntensity?: number;
      pulseSpeed?: number;
      glowIntensity?: number;
      temperatureVariation?: number;
      metallicEffect?: number; // Though less relevant for young stars, keep for consistency
      time?: number;
    } = {},
    vertexShader: string = PRE_MAIN_SEQUENCE_VERTEX_SHADER,
    fragmentShader: string = PRE_MAIN_SEQUENCE_FRAGMENT_SHADER,
  ) {
    const uniforms = {
      time: { value: shaderParameters.time ?? 0.0 },
      starColor: {
        value: shaderParameters.starColor ?? new THREE.Color(0xffddaa),
      }, // Young stars are often reddish/orange
      coronaIntensity: { value: shaderParameters.coronaIntensity ?? 0.2 },
      pulseSpeed: { value: shaderParameters.pulseSpeed ?? 0.3 },
      glowIntensity: { value: shaderParameters.glowIntensity ?? 0.6 },
      temperatureVariation: {
        value: shaderParameters.temperatureVariation ?? 0.5,
      }, // Can be quite turbulent
      metallicEffect: { value: shaderParameters.metallicEffect ?? 0.05 },
    };

    super({
      uniforms: uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }

  update(time: number): void {
    if (this.uniforms.time) {
      this.uniforms.time.value = time;
    }
  }
}

/**
 * Abstract base class for renderers of pre-main-sequence stars.
 * These stars are still forming and often have accretion disks or jets.
 */
export abstract class PreMainSequenceStarRenderer extends BaseStarRenderer {
  protected effectMaterials: Map<string, THREE.Material | THREE.Material[]> =
    new Map();

  constructor(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ) {
    super(object, options);
  }

  protected getCoronaVertexShader(object: RenderableCelestialObject): string {
    return PRE_MAIN_SEQUENCE_VERTEX_SHADER;
  }

  protected getCoronaFragmentShader(object: RenderableCelestialObject): string {
    return PRE_MAIN_SEQUENCE_CORONA_FRAGMENT_SHADER;
  }

  protected abstract getEffectLayer(
    object: RenderableCelestialObject,
    mainStarGroup: THREE.Group,
  ): THREE.Object3D | null;

  protected override _createHighDetailGroup(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): THREE.Group {
    const group = super._createHighDetailGroup(object, options);
    const effectLayer = this.getEffectLayer(object, group);
    if (effectLayer) {
      group.add(effectLayer);
    }
    return group;
  }

  protected abstract override getCustomLODs(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[];

  protected abstract override getBillboardLODDistance(
    object: RenderableCelestialObject,
  ): number;

  protected abstract override getMaterial(
    object: RenderableCelestialObject,
  ): PreMainSequenceStarMaterial;

  override update(
    time: number,
    lightSources?: Map<string, LightSourceData>,
    camera?: THREE.Camera,
  ): void {
    super.update(time, lightSources, camera);
    const currentTime =
      time === undefined ? Date.now() / 1000 - this.startTime : time;
    this.effectMaterials.forEach((materialOrMaterials) => {
      const materials = Array.isArray(materialOrMaterials)
        ? materialOrMaterials
        : [materialOrMaterials];
      materials.forEach((material: any) => {
        if (material && typeof material.update === "function") {
          material.update(currentTime);
        } else if (material && material.uniforms && material.uniforms.time) {
          material.uniforms.time.value = currentTime;
        }
      });
    });
  }

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
