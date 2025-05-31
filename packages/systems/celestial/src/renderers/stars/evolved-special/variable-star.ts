import * as THREE from "three";
import { SCALE } from "@teskooano/data-types";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import type {
  CelestialMeshOptions,
  LODLevel,
  LightSourceData,
} from "../../common/types";
import type { StarProperties } from "@teskooano/data-types";
import {
  EvolvedSpecialStarRenderer,
  EvolvedSpecialStarMaterial,
} from "./evolved-special-star-renderer";
import type { BaseStarUniformArgs } from "../main-sequence/main-sequence-star";

/**
 * Renderer for Variable Stars.
 * This is a broad category. Visuals can vary greatly (Cepheids, Mira variables, etc.).
 * The core EvolvedSpecialStarMaterial will handle general pulsation via pulseSpeed uniform.
 */
export class VariableStarRenderer extends EvolvedSpecialStarRenderer {
  private baseColor: THREE.Color = new THREE.Color(0xffcc99); // Default base color
  private lastPulseValue: number = 0;
  private variabilityPeriod_s: number = 86400; // Default 1 day period
  private variabilityMagnitude: number = 0.5; // Default 0.5 magnitude variation

  constructor(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ) {
    super(object, options);
    this.baseColor = this.getStarColor(object).clone(); // Store initial color
    const props = object.properties as StarProperties;
    // TODO: These characteristics should be defined in StarProperties.characteristics ideally
    this.variabilityPeriod_s =
      (props.characteristics?.variabilityPeriod_s as number) || 86400;
    this.variabilityMagnitude =
      (props.characteristics?.variabilityMagnitude as number) || 0.5;
  }

  protected getMaterial(
    object: RenderableCelestialObject,
  ): EvolvedSpecialStarMaterial {
    // Color is handled by getStarColor, which is now dynamic in update for variable stars
    const color = this.baseColor; // Use the stored base color for initial material creation
    const properties = object.properties as StarProperties;

    const classDefaults: Partial<BaseStarUniformArgs> & {
      timeOffset?: number;
    } = {
      coronaIntensity: 0.4,
      pulseSpeed: (2 * Math.PI) / this.variabilityPeriod_s, // Link pulseSpeed to variability period
      glowIntensity: 0.6, // Base glow, will be modulated
      temperatureVariation: 0.3, // Can have surface activity
      metallicEffect: 0.2,
      noiseEvolutionSpeed: 0.2,
    };

    const propsUniforms = properties.shaderUniforms?.baseStar;
    const propsTimeOffset = properties.timeOffset;

    const finalMaterialOptions: Partial<BaseStarUniformArgs> & {
      timeOffset?: number;
    } = {
      ...classDefaults,
      ...(propsUniforms || {}),
      glowIntensity:
        propsUniforms?.glowIntensity ?? classDefaults.glowIntensity, // Will be modulated in update
      timeOffset:
        propsTimeOffset ?? classDefaults.timeOffset ?? Math.random() * 1000.0,
    };

    return new EvolvedSpecialStarMaterial(color, finalMaterialOptions);
  }

  // getStarColor provides the base color. Brightness variation is handled in update.
  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    const properties = star.properties as StarProperties;
    if (properties?.color) {
      try {
        return new THREE.Color(properties.color);
      } catch (e) {
        console.warn(
          `[VariableStarRenderer] Invalid color '${properties.color}' in star properties. Falling back to default.`,
        );
      }
    }
    // Default for variable stars can be very broad, often G, K, M giants or supergiants
    return new THREE.Color(0xffcc99); // Default: Orangey yellow
  }

  // Variable stars don't typically have a persistent, distinct effect layer like a shell.
  // Their variability is intrinsic. Some, like Mira variables, have mass loss, but that's more complex.
  protected getEffectLayer(
    object: RenderableCelestialObject,
    mainStarGroup: THREE.Group,
  ): THREE.Object3D | null {
    return null;
  }

  // Override update to modulate brightness/color based on variability
  override update(
    time: number,
    lightSources?: Map<string, LightSourceData>,
    camera?: THREE.Camera,
  ): void {
    super.update(time, lightSources, camera); // Updates elapsedTime

    const phase = (this.elapsedTime * (2 * Math.PI)) / this.variabilityPeriod_s;
    // Simple sine wave for magnitude variation. Max brightness at sin = 1, min at sin = -1.
    // Magnitude is logarithmic, so a linear change in luminosity is more appropriate for shaders.
    // Let's assume variabilityMagnitude is a factor applied to base luminosity/glow.
    // A 0.5 mag variation means brightness changes by a factor of 10^(0.5/2.5) ~ 1.58x.
    // For simplicity, let pulse be factor from 0.5 to 1.5 (approx) around 1.
    const pulseFactor =
      1.0 + Math.sin(phase) * (this.variabilityMagnitude / 2.5) * 0.58; // Simplified factor variation
    this.lastPulseValue = pulseFactor;

    const mainMaterial = this.starBodyMaterials.get(
      this.object.celestialObjectId,
    ) as EvolvedSpecialStarMaterial;
    if (mainMaterial && mainMaterial.uniforms.glowIntensity) {
      const baseGlow =
        (this.object.properties as StarProperties).shaderUniforms?.baseStar
          ?.glowIntensity ?? 0.6;
      mainMaterial.uniforms.glowIntensity.value = baseGlow * pulseFactor;
      mainMaterial.needsUpdate = true;
    }
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
      includeEffects: false, // No specific effect layer
    });
    mediumStarOnlyGroup.name = `${object.celestialObjectId}-medium-lod`;
    const level1: LODLevel = {
      object: mediumStarOnlyGroup,
      distance: 3000 * scale,
    };

    return [level0, level1];
  }

  protected getBillboardLODDistance(object: RenderableCelestialObject): number {
    const scale = typeof SCALE === "number" ? SCALE : 1;
    // Variable stars can be quite luminous at their peak
    return 10000 * scale;
  }
}
