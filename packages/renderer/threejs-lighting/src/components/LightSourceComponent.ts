import { StateAccessor } from "@teskooano/core-state";
import type {
  RenderableCelestialObject,
  StarProperties,
} from "@teskooano/data-types";
import { CelestialType } from "@teskooano/data-types";
import { LightingHelper } from "@teskooano/renderer-threejs-helpers";
import * as THREE from "three";
import { calculateVisualIntensity } from "../utils/intensity";

/**
 * @public
 * Configuration options for creating a new LightSourceComponent.
 */
export interface LightSourceOptions {
  /** The specific THREE.Light instance to use. Defaults to a PointLight. */
  light?: THREE.Light;
  /** Whether this light source should cast shadows. Defaults to false. */
  castShadow?: boolean;
}

/**
 * @public
 * A component that represents a single light source attached to a celestial object.
 * This class wraps a THREE.Light and manages its state based on the associated object.
 */
export class LightSourceComponent {
  /** The underlying THREE.Light instance. */
  public readonly light: THREE.Light;
  /** The celestial object this light source is attached to. */
  public celestialObject: RenderableCelestialObject;

  /**
   * Creates an instance of LightSourceComponent.
   * @param object - The celestial object this component is attached to.
   * @param options - Configuration options for the light source.
   */
  constructor(
    object: RenderableCelestialObject,
    options: LightSourceOptions = {},
  ) {
    this.celestialObject = object;

    if (options.light) {
      this.light = options.light;
    } else {
      // Defaults
      let color: THREE.ColorRepresentation = 0xffffff;
      let intensity = 1;

      // If it's a star, override defaults with its properties
      if (object.type === CelestialType.STAR) {
        const starProps = object.properties as StarProperties;
        if (starProps) {
          if (typeof starProps.color === "string") {
            // Convert hex string '#RRGGBB' to a number 0xRRGGBB
            color = parseInt(starProps.color.replace("#", "0x"), 16);
          } else if (typeof starProps.color === "number") {
            color = starProps.color;
          }
          intensity = starProps.luminosity
            ? calculateVisualIntensity(starProps.luminosity)
            : intensity;
        }
      }

      this.light = LightingHelper.createPointLight({
        color: color as number,
        intensity,
        decay: 2,
        distance: 0,
        castShadow: options.castShadow ?? false,
        shadowMapSize: 1024,
        name: `${object.id}-light`,
      });
    }

    // Set the initial position
    this.update();
  }

  /**
   * Updates the light's properties based on the current state of its celestial object.
   * This should be called each frame.
   */
  public update(): void {
    const objects = StateAccessor.getRenderableObjectsByIds([
      this.celestialObject.id,
    ]);
    const freshObject = objects.find((o) => o.id === this.celestialObject.id);

    if (freshObject) {
      this.celestialObject = freshObject; // Keep our reference fresh
      this.light.position.copy(freshObject.position);
    }
    this.updateLightProperties();
  }

  /**
   * Updates the light's color and intensity based on the celestial object's properties.
   * This is called by the main update loop.
   */
  private updateLightProperties(): void {
    if (this.celestialObject.type !== CelestialType.STAR) {
      return;
    }

    const starProps = this.celestialObject.properties as StarProperties;
    if (!starProps) {
      return;
    }

    // Update color
    if (starProps.color && this.light instanceof THREE.PointLight) {
      this.light.color.set(starProps.color);
    }

    // Update intensity - using luminosity directly for now.
    // A logarithmic scale might be better for realism later.
    if (
      starProps.luminosity !== undefined &&
      this.light instanceof THREE.PointLight
    ) {
      this.light.intensity = calculateVisualIntensity(starProps.luminosity);
    }
  }

  /**
   * Disposes of the underlying THREE.Light resources.
   */
  public dispose(): void {
    this.light.dispose();
  }
}
