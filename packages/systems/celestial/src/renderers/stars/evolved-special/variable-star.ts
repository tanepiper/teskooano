import * as THREE from "three";
import {
  EvolvedSpecialStarRenderer,
  EvolvedSpecialStarMaterial,
} from "./evolved-special-star-renderer";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import { LODLevel } from "../../index";
import { SCALE, type StarProperties } from "@teskooano/data-types";
import type { CelestialMeshOptions } from "../../common/CelestialRenderer";

/**
 * Material for the main body of Variable stars.
 * Variability will primarily be controlled by modulating uniforms.
 */
export class VariableStarMaterial extends EvolvedSpecialStarMaterial {
  constructor(color: THREE.Color = new THREE.Color(0xffffcc)) {
    super({
      starColor: color,
      coronaIntensity: 0.5,
      pulseSpeed: 0.5, // Base pulse, can be modulated
      glowIntensity: 0.8, // Base glow, can be modulated
      temperatureVariation: 0.3, // Base temp variation
      metallicEffect: 0.2,
    });
  }
}

/**
 * Renderer for Variable stars - stars that change in brightness over time.
 */
export class VariableStarRenderer extends EvolvedSpecialStarRenderer {
  private lastBrightness: number = 1.0;
  private lastPulseSpeed: number = 0.5;

  protected getMaterial(
    object: RenderableCelestialObject,
  ): EvolvedSpecialStarMaterial {
    const color = this.getStarColor(object);
    // Could use object properties to set initial material parameters if needed
    return new VariableStarMaterial(color);
  }

  protected getStarColor(object: RenderableCelestialObject): THREE.Color {
    // Default to a yellowish-white, actual color might vary based on star type
    const starProps = object.properties as StarProperties;
    if (starProps?.color) {
      try {
        return new THREE.Color(starProps.color as THREE.ColorRepresentation);
      } catch (e) {
        // Fallback if color string is invalid
      }
    }
    return new THREE.Color(0xffffcc);
  }

  /**
   * Variable stars in this generic renderer don't add a distinct geometric effect layer.
   * Their variability is handled by modulating the main material's uniforms.
   * Specific variable star sub-types could override this to add shells (e.g., for Miras).
   */
  protected getEffectLayer(
    object: RenderableCelestialObject,
    mainStarGroup: THREE.Group,
  ): THREE.Object3D | null {
    return null; // No separate geometric effect layer for the generic variable star
  }

  // Override update to modulate material properties for variability
  override update(
    time: number,
    lightSources?: Map<string, any>,
    camera?: THREE.Camera,
  ): void {
    super.update(time, lightSources, camera); // Call base update for star body, corona, and any (null) effect layer

    // Example variability: A slow sine wave for brightness and pulse speed modulation
    // This is a very basic example. Real variable stars have complex light curves.
    const period = 10; // seconds for a full cycle
    const phase = (this.elapsedTime / period) * 2 * Math.PI;

    // Modulate glowIntensity (brightness)
    const minGlow = 0.5;
    const maxGlow = 1.2;
    const currentGlow =
      minGlow + (Math.sin(phase) * 0.5 + 0.5) * (maxGlow - minGlow);

    // Modulate pulseSpeed
    const minPulseSpeed = 0.2;
    const maxPulseSpeed = 0.8;
    const currentPulseSpeed =
      minPulseSpeed +
      (Math.cos(phase * 0.7) * 0.5 + 0.5) * (maxPulseSpeed - minPulseSpeed); // Different phase for variety

    this.materials.forEach((material: any) => {
      if (material instanceof EvolvedSpecialStarMaterial) {
        if (material.uniforms.glowIntensity) {
          material.uniforms.glowIntensity.value = currentGlow;
        }
        if (material.uniforms.pulseSpeed) {
          material.uniforms.pulseSpeed.value = currentPulseSpeed;
        }
        // Could also modulate starColor, temperatureVariation etc.
      }
    });
    // If there were effect materials that also needed dynamic updates based on variability:
    // this.effectMaterials.forEach( ... );
  }

  protected getBillboardLODDistance(object: RenderableCelestialObject): number {
    const scale = typeof SCALE === "number" ? SCALE : 1;
    return 10000 * scale;
  }

  protected getCustomLODs(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    const scale = typeof SCALE === "number" ? SCALE : 1;

    // High detail (no separate effect layer for this generic variable star)
    const highDetailGroup = this._createHighDetailGroup(object, {
      ...options,
      segments: 96,
    });
    const level0: LODLevel = { object: highDetailGroup, distance: 0 };

    // Medium detail
    const mediumStarOnlyGroup = super._createHighDetailGroup(object, {
      ...options,
      segments: 48,
    });
    mediumStarOnlyGroup.name = `${object.celestialObjectId}-medium-lod`;
    const level1: LODLevel = {
      object: mediumStarOnlyGroup,
      distance: 1200 * scale,
    };

    return [level0, level1];
  }
}
