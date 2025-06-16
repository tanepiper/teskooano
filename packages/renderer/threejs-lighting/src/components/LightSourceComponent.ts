import type { RenderableCelestialObject } from "@teskooano/data-types";
import * as THREE from "three";

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
  public readonly celestialObject: RenderableCelestialObject;

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
    this.light = options.light ?? new THREE.PointLight(0xffffff, 1, 0, 2);
    this.light.castShadow = options.castShadow ?? false;

    // Set the initial position
    this.update();
  }

  /**
   * Updates the light's properties based on the current state of its celestial object.
   * This should be called each frame.
   */
  public update(): void {
    this.light.position.copy(this.celestialObject.position);
    // Future logic to update color/intensity can be added here.
  }

  /**
   * Disposes of the underlying THREE.Light resources.
   */
  public dispose(): void {
    this.light.dispose();
  }
}
