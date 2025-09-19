import { ObjectManager } from "@teskooano/renderer-threejs-objects";

import * as THREE from "three";
import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { BaseLabelLayer } from "./layers/BaseLabelLayer";

/**
 * Layer types enum for different UI elements
 */
export enum CSS2DLayerType {
  CELESTIAL_LABELS = "celestial-labels",
  TOOLTIPS = "tooltips",
  AU_MARKERS = "au-markers",
  PREDICTION_LABELS = "prediction-labels",
}

/**
 * Manages all CSS2D rendered UI elements, organized into distinct layers.
 * It handles the core CSS2DRenderer and provides an interface for registering
 * different types of label layers, each with their own components and logic.
 */
export class Layer2DManager {
  private renderer: CSS2DRenderer;
  private container: HTMLElement;
  private scene: THREE.Scene;
  private layers: Map<CSS2DLayerType, BaseLabelLayer> = new Map();

  /**
   * Creates a new Layer2DManager.
   * @param scene The main Three.js scene.
   * @param container The HTML element that will host the renderer's canvas.
   */
  constructor(scene: THREE.Scene, container: HTMLElement) {
    this.scene = scene;
    this.container = container;
    this.renderer = this.createRenderer();
    container.appendChild(this.renderer.domElement);
  }

  /**
   * Registers a new layer with the manager.
   * This will also automatically register any web components required by the layer.
   * @param layerType The enum key for the layer.
   * @param layer The layer instance to register.
   */
  public registerLayer(layerType: CSS2DLayerType, layer: BaseLabelLayer): void {
    if (this.layers.has(layerType)) {
      console.warn(
        `Layer for type ${layerType} already registered. Overwriting.`,
      );
      this.layers.get(layerType)?.clear();
    }
    this.layers.set(layerType, layer);

    // Register components required by the layer
    layer.getRequiredComponents().forEach(({ tagName, componentClass }) => {
      if (!customElements.get(tagName)) {
        customElements.define(tagName, componentClass);
      }
    });
  }

  private createRenderer(): CSS2DRenderer {
    const renderer = new CSS2DRenderer();
    renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.left = "0";
    renderer.domElement.style.zIndex = "1";
    renderer.domElement.style.pointerEvents = "none";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    return renderer;
  }

  /**
   * Retrieves a registered layer instance.
   * @param layerType The enum key for the layer to retrieve.
   * @returns The layer instance, or undefined if not found.
   */
  public getLayer(layerType: CSS2DLayerType): BaseLabelLayer | undefined {
    return this.layers.get(layerType);
  }

  /**
   * Update method to be called each frame
   */
  update(camera: THREE.PerspectiveCamera, objectManager: ObjectManager): void {
    this.layers.forEach((layer) => layer.update(camera, objectManager));
  }

  /**
   * Remove an element by ID and layer type
   */
  removeElement(layerType: CSS2DLayerType, id: string): void {
    this.layers.get(layerType)?.removeElement(id);
  }

  /**
   * Set visibility for a specific layer
   */
  setLayerVisibility(layerType: CSS2DLayerType, visible: boolean): void {
    const layer = this.layers.get(layerType);
    if (layer) {
      layer.setVisibility(visible);

      // Special handling for celestial labels layer to pass global state
      if (
        layerType === CSS2DLayerType.CELESTIAL_LABELS &&
        "setGlobalLabelsEnabled" in layer
      ) {
        (layer as any).setGlobalLabelsEnabled(visible);
      }
    }
  }

  /**
   * Renders the CSS2D scene
   * @param camera The camera to use for rendering
   */
  render(camera: THREE.PerspectiveCamera): void {
    // The update logic is now in the update method, so we just render here.
    this.renderer.render(this.scene, camera);
  }

  /**
   * Handle resize event
   */
  onResize(width: number, height: number): void {
    this.renderer.setSize(width, height);
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.layers.forEach((layer) => layer.clear());
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(
        this.renderer.domElement,
      );
    }
  }

  /**
   * Shows a specific 2D instance within a layer.
   * @param layer The layer the instance belongs to.
   * @param id The unique ID of the instance to show.
   */
  showInstance(layer: CSS2DLayerType, id: string): void {
    const layerInstance = this.layers.get(layer);
    if (layerInstance?.isVisible) {
      const cssObject = layerInstance.getElement(id);
      if (cssObject) {
        cssObject.visible = true;
      }
    }
  }

  /**
   * Hides a specific 2D instance within a layer.
   * @param layer The layer the instance belongs to.
   * @param id The unique ID of the instance to hide.
   */
  hideInstance(layer: CSS2DLayerType, id: string): void {
    const cssObject = this.layers.get(layer)?.getElement(id);
    if (cssObject) {
      cssObject.visible = false;
    }
  }

  /**
   * Clears all elements from a specific layer.
   * @param layerType - The layer to clear.
   */
  clearLayer(layerType: CSS2DLayerType): void {
    this.layers.get(layerType)?.clear();
  }
}
