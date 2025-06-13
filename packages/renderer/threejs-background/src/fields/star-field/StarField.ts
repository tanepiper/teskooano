import * as THREE from "three";
import { Field } from "../core/Field";
import { createStarField } from "./star-field.generator";
import { StarFieldLayerOptions, StarFieldOptions } from "./types";

/**
 * A concrete implementation of a Field that renders layers of stars.
 * It handles the creation, animation, parallax effects, and debugging of star fields.
 */
export class StarField extends Field {
  private starLayers: THREE.Points[] = [];
  private originalLayerColors: Map<number, Float32Array> = new Map();
  private rotationSpeed: number;
  private parallaxStrength: number;
  private baseDistance: number;

  /**
   * Constructs a new StarField.
   */
  constructor(options: StarFieldOptions) {
    super(options);
    this.rotationSpeed = options.rotationSpeed ?? 0.00000002;
    this.parallaxStrength = options.parallaxStrength ?? 0.1;
    this.baseDistance = options.baseDistance;
    this.createLayers(options.layers);
  }

  /**
   * Creates the individual star layers from the provided options.
   */
  private createLayers(layerOptions: StarFieldLayerOptions[]): void {
    this.disposeLayers();

    layerOptions.forEach((opts, index) => {
      const layer = createStarField(this.baseDistance, opts);
      this.starLayers.push(layer);
      this.object.add(layer);
      this.originalLayerColors.set(
        index,
        layer.geometry.attributes.color.array.slice() as Float32Array,
      );
    });
  }

  /**
   * Updates the star field's animation and parallax.
   */
  public update(deltaTime: number, camera?: THREE.PerspectiveCamera): void {
    this.animateLayers(deltaTime);
    if (camera) {
      this.applyParallax(camera);
    }
  }

  /**
   * Applies a subtle rotational animation to each layer.
   */
  private animateLayers(deltaTime: number): void {
    if (this.starLayers.length >= 3) {
      this.starLayers[0].rotation.y += this.rotationSpeed * deltaTime * 0.5;
      this.starLayers[1].rotation.y += this.rotationSpeed * deltaTime * 0.3;
      this.starLayers[2].rotation.y += this.rotationSpeed * deltaTime * 0.1;
    }
  }

  /**
   * Moves the field's object to simulate a parallax effect relative to the camera.
   */
  private applyParallax(camera: THREE.PerspectiveCamera): void {
    const cameraPos = camera.position;
    const parallaxX = -cameraPos.x * this.parallaxStrength;
    const parallaxY = -cameraPos.y * this.parallaxStrength;
    const parallaxZ = -cameraPos.z * this.parallaxStrength;
    this.object.position.set(parallaxX, parallaxY, parallaxZ);
  }

  /**
   * Toggles the debug view, changing star colors to highlight the different layers.
   */
  public toggleDebug(debug: boolean): void {
    this.isDebugMode = debug;
    if (this.starLayers.length < 3) return;

    const debugColors = [
      new THREE.Color("#FF0000"),
      new THREE.Color("#00FF00"),
      new THREE.Color("#0000FF"),
    ];

    this.starLayers.forEach((layer, index) => {
      let colorsArray: Float32Array;

      if (debug) {
        const count = layer.geometry.attributes.position.count;
        colorsArray = new Float32Array(count * 3);
        const color = debugColors[index];
        for (let i = 0; i < count; i++) {
          colorsArray[i * 3] = color.r;
          colorsArray[i * 3 + 1] = color.g;
          colorsArray[i * 3 + 2] = color.b;
        }
      } else {
        colorsArray = this.originalLayerColors.get(index)!;
      }

      layer.geometry.setAttribute(
        "color",
        new THREE.BufferAttribute(colorsArray, 3),
      );
      layer.geometry.attributes.color.needsUpdate = true;
    });
  }

  /**
   * Disposes of the resources used by the individual star layers.
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
   * Cleans up all resources used by the star field.
   */
  public dispose(): void {
    this.disposeLayers();
  }
}
