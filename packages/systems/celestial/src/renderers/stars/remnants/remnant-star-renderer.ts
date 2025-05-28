import * as THREE from "three";
import { BaseStarRenderer } from "../base/base-star";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import { LODLevel } from "../../index";
import type {
  CelestialMeshOptions,
  LightSourceData,
} from "../../common/CelestialRenderer";

import REMNANT_VERTEX_SHADER from "../../../shaders/star/remnants/vertex.glsl";
import REMNANT_FRAGMENT_SHADER from "../../../shaders/star/remnants/fragment.glsl";
import REMNANT_CORONA_FRAGMENT_SHADER from "../../../shaders/star/remnants/corona.glsl";

/**
 * Base material for remnant stars.
 */
export class RemnantStarMaterial extends THREE.ShaderMaterial {
  constructor(
    shaderParameters: {
      starColor?: THREE.Color;
      coronaIntensity?: number;
      pulseSpeed?: number;
      glowIntensity?: number;
      temperatureVariation?: number;
      metallicEffect?: number; // Less relevant, but for consistency
      time?: number;
    } = {},
    vertexShader: string = REMNANT_VERTEX_SHADER,
    fragmentShader: string = REMNANT_FRAGMENT_SHADER,
  ) {
    const uniforms = {
      time: { value: shaderParameters.time ?? 0.0 },
      starColor: {
        value: shaderParameters.starColor ?? new THREE.Color(0xaaaaff),
      }, // Default to a pale blue/white
      coronaIntensity: { value: shaderParameters.coronaIntensity ?? 0.1 },
      pulseSpeed: { value: shaderParameters.pulseSpeed ?? 0.05 },
      glowIntensity: { value: shaderParameters.glowIntensity ?? 0.3 },
      temperatureVariation: {
        value: shaderParameters.temperatureVariation ?? 0.1,
      },
      metallicEffect: { value: shaderParameters.metallicEffect ?? 0.0 },
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
 * Abstract base class for renderers of remnant stars.
 */
export abstract class RemnantStarRenderer extends BaseStarRenderer {
  protected effectMaterials: Map<string, THREE.Material | THREE.Material[]> =
    new Map();

  constructor(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ) {
    super(object, options);
  }

  protected getCoronaVertexShader(object: RenderableCelestialObject): string {
    return REMNANT_VERTEX_SHADER;
  }

  protected getCoronaFragmentShader(object: RenderableCelestialObject): string {
    return REMNANT_CORONA_FRAGMENT_SHADER;
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
  ): RemnantStarMaterial;

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
