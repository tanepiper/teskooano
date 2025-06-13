import * as THREE from "three";
import { Field } from "../core/Field";
import { createStarField } from "./star-field.generator";
import { StarFieldLayerOptions, StarFieldOptions } from "./types";

const DEBUG_COLORS = [
  new THREE.Color("#FF0000"), // Red
  new THREE.Color("#00FF00"), // Green
  new THREE.Color("#0000FF"), // Blue
  new THREE.Color("#FFFF00"), // Yellow
  new THREE.Color("#FF00FF"), // Magenta
  new THREE.Color("#00FFFF"), // Cyan
];

/**
 * A concrete implementation of a `Field` that renders layers of stars to create
 * a rich, deep-space background. It handles the procedural generation of multiple
 * star layers, animates them, and applies a parallax effect relative to the
 * camera's movement.
 */
export class StarField extends Field {
  /** The individual star layers, each represented as a `THREE.Points` object. */
  private starLayers: THREE.Points[] = [];

  /**
   * A cache of the original colors for each layer, used to restore their
   * appearance after toggling debug mode off. The key is the layer index.
   */
  private originalLayerColors: Map<number, Float32Array> = new Map();

  /** The base speed for the rotational animation of the star layers. */
  private rotationSpeed: number;

  /** The intensity of the parallax effect. */
  private parallaxStrength: number;

  /** The base distance used to calculate the depth of the layers. */
  private baseDistance: number;

  /**
   * Constructs a new StarField instance.
   * @param options The configuration for the star field.
   */
  constructor(options: StarFieldOptions) {
    super(options);
    this.rotationSpeed = options.rotationSpeed ?? 0.00000002;
    this.parallaxStrength = options.parallaxStrength ?? 0.1;
    this.baseDistance = options.baseDistance;
    this.createLayers(options.layers);
  }

  /**
   * Generates the individual star layers based on the provided configuration.
   * This method clears any existing layers before creating new ones.
   * @param layerOptions An array of configurations, one for each star layer.
   */
  private createLayers(layerOptions: StarFieldLayerOptions[]): void {
    this.disposeLayers();

    layerOptions.forEach((opts, index) => {
      const layer = createStarField(this.baseDistance, opts);
      this.starLayers.push(layer);
      this.object.add(layer);
      this.originalLayerColors.set(
        index,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (layer.geometry.attributes as any).color.array.slice(),
      );
    });
  }

  /**
   * Updates the star field's state for the current frame.
   * This includes animating the layers and applying the parallax effect.
   * @param deltaTime The time elapsed since the last frame, in seconds.
   * @param camera The scene's camera, used to calculate parallax.
   */
  public update(deltaTime: number, camera?: THREE.PerspectiveCamera): void {
    this.animateLayers(deltaTime);
    if (camera) {
      this.applyParallax(camera);
    }
  }

  /**
   * Applies a subtle, independent rotational animation to each star layer
   * to create a dynamic background.
   * @param deltaTime The time elapsed since the last frame.
   */
  private animateLayers(deltaTime: number): void {
    this.starLayers.forEach((layer, index) => {
      // Each layer rotates at a slightly different speed for a better effect.
      const speedMultiplier = 1 - index / this.starLayers.length;
      layer.rotation.y += this.rotationSpeed * deltaTime * speedMultiplier;
    });
  }

  /**
   * Simulates a parallax effect by shifting the field's position in the
   * opposite direction of the camera's movement.
   * @param camera The scene's perspective camera.
   */
  private applyParallax(camera: THREE.PerspectiveCamera): void {
    const cameraPos = camera.position;
    const parallaxX = -cameraPos.x * this.parallaxStrength;
    const parallaxY = -cameraPos.y * this.parallaxStrength;
    const parallaxZ = -cameraPos.z * this.parallaxStrength;
    this.object.position.set(parallaxX, parallaxY, parallaxZ);
  }

  /**
   * Toggles the debug visualization, coloring each layer with a distinct solid
   * color to make them easily identifiable.
   * @param debug `true` to enable debug mode, `false` to disable it.
   */
  public toggleDebug(debug: boolean): void {
    this.isDebugMode = debug;

    this.starLayers.forEach((layer, index) => {
      let colorsArray: Float32Array;

      if (debug) {
        const count = layer.geometry.attributes.position.count;
        colorsArray = new Float32Array(count * 3);
        const color = DEBUG_COLORS[index % DEBUG_COLORS.length];
        for (let i = 0; i < count; i++) {
          colorsArray[i * 3] = color.r;
          colorsArray[i * 3 + 1] = color.g;
          colorsArray[i * 3 + 2] = color.b;
        }
      } else {
        const originalColors = this.originalLayerColors.get(index);
        if (!originalColors) return;
        colorsArray = originalColors;
      }

      layer.geometry.setAttribute(
        "color",
        new THREE.BufferAttribute(colorsArray, 3),
      );
      layer.geometry.attributes.color.needsUpdate = true;
    });
  }

  /**
   * Disposes of all Three.js resources used by the star layers to free up memory.
   */
  private disposeLayers(): void {
    this.starLayers.forEach((layer) => {
      layer.geometry.dispose();
      (layer.material as THREE.Material).dispose();
      this.object.remove(layer);
    });
    this.starLayers = [];
    this.originalLayerColors.clear();
  }

  /**
   * Cleans up all resources managed by this `StarField` instance.
   */
  public dispose(): void {
    this.disposeLayers();
  }
}
