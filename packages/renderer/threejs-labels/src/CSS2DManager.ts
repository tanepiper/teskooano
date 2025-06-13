import * as THREE from "three";
import { CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { type RenderableCelestialObject } from "@teskooano/data-types";
import {
  CelestialLabelComponent,
  CELESTIAL_LABEL_TAG,
} from "./components/celestial-label/CelestialLabelComponent";
import {
  AuMarkerLabelComponent,
  AU_MARKER_LABEL_TAG,
} from "./components/au-marker-label/AuMarkerLabelComponent";
import { AuMarkerLabelLayer } from "./layers/AuMarkerLabelLayer";
import { CelestialLabelLayer } from "./layers/CelestialLabelLayer";
import { BaseLabelLayer } from "./layers/BaseLabelLayer";

/**
 * Layer types enum for different UI elements
 */
export enum CSS2DLayerType {
  CELESTIAL_LABELS = "celestial-labels",
  TOOLTIPS = "tooltips",
  AU_MARKERS = "au-markers",
}

/**
 * Unified manager for all CSS2D rendered UI elements with support for different layers
 */
export class CSS2DManager {
  private renderer: CSS2DRenderer;
  private container: HTMLElement;
  private scene: THREE.Scene;
  private layers: Map<CSS2DLayerType, BaseLabelLayer>;

  /**
   * Create a new CSS2DManager
   */
  constructor(scene: THREE.Scene, container: HTMLElement) {
    this.scene = scene;
    this.container = container;

    this.registerWebComponents();

    this.renderer = this.createRenderer();
    container.appendChild(this.renderer.domElement);

    this.layers = new Map();
    this.layers.set(
      CSS2DLayerType.CELESTIAL_LABELS,
      new CelestialLabelLayer(scene),
    );
    this.layers.set(CSS2DLayerType.AU_MARKERS, new AuMarkerLabelLayer(scene));
  }

  private registerWebComponents(): void {
    if (!customElements.get(CELESTIAL_LABEL_TAG)) {
      customElements.define(CELESTIAL_LABEL_TAG, CelestialLabelComponent);
    }
    if (!customElements.get(AU_MARKER_LABEL_TAG)) {
      customElements.define(AU_MARKER_LABEL_TAG, AuMarkerLabelComponent);
    }
  }

  private createRenderer(): CSS2DRenderer {
    const renderer = new CSS2DRenderer();
    renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.zIndex = "1";
    renderer.domElement.style.pointerEvents = "none";
    return renderer;
  }

  /**
   * Create a celestial object label
   */
  createCelestialLabel(
    object: RenderableCelestialObject,
    parentMesh: THREE.Object3D,
  ): void {
    (
      this.layers.get(CSS2DLayerType.CELESTIAL_LABELS) as CelestialLabelLayer
    )?.createLabel(object, parentMesh);
  }

  /**
   * Creates a label for an AU distance marker circle.
   * @param id - A unique ID for this label (e.g., 'au-label-5').
   * @param auValue - The astronomical unit value to display (e.g., 5).
   * @param position - The THREE.Vector3 position in the scene where the label should appear.
   */
  createAuMarkerLabel(
    id: string,
    auValue: number,
    position: THREE.Vector3,
    color: string,
  ): void {
    (
      this.layers.get(CSS2DLayerType.AU_MARKERS) as AuMarkerLabelLayer
    )?.createLabel(id, auValue, position, color);
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
    this.layers.get(layerType)?.setVisibility(visible);
  }

  /**
   * Renders the CSS2D scene
   * @param camera The camera to use for rendering
   */
  render(camera: THREE.Camera): void {
    let hasAnyElements = false;
    for (const layer of this.layers.values()) {
      if (layer.hasElements()) {
        hasAnyElements = true;
        break;
      }
    }

    if (hasAnyElements) {
      this.renderer.render(this.scene, camera);
    }
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
   * Shows a specific 2D label element within a layer.
   * @param layer - The layer the element belongs to.
   * @param id - The unique ID of the element to show.
   */
  showLabel(layer: CSS2DLayerType, id: string): void {
    const layerInstance = this.layers.get(layer);
    if (layerInstance?.isVisible) {
      const cssObject = layerInstance.getElement(id);
      if (cssObject) {
        cssObject.visible = true;
      }
    }
  }

  /**
   * Hides a specific 2D label element within a layer.
   * @param layer - The layer the element belongs to.
   * @param id - The unique ID of the element to hide.
   */
  hideLabel(layer: CSS2DLayerType, id: string): void {
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
