import * as THREE from "three";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import {
  CSS2DRendererService,
  CSS2DLabelFactory,
  CSS2DLayerManager,
  CSS2DLayerType,
} from "./css2d";

/**
 * Singleton facade for managing all CSS2D rendered UI elements.
 * Orchestrates CSS2DRendererService, CSS2DLabelFactory, and CSS2DLayerManager.
 */
export class CSS2DManager {
  private static instance: CSS2DManager;
  private scene: THREE.Scene;
  private rendererService: CSS2DRendererService;
  private labelFactory: CSS2DLabelFactory;
  private layerManager: CSS2DLayerManager;

  private constructor(scene: THREE.Scene, container: HTMLElement) {
    this.scene = scene;
    this.rendererService = CSS2DRendererService.getInstance();
    this.rendererService.initialize(container); // Initialize with the container

    this.labelFactory = new CSS2DLabelFactory(); // Not a singleton, can be instantiated
    this.layerManager = CSS2DLayerManager.getInstance();
  }

  /**
   * Get the singleton instance of the CSS2DManager.
   * Must be initialized once with `initialize` before use.
   */
  public static getInstance(
    scene?: THREE.Scene,
    container?: HTMLElement,
  ): CSS2DManager {
    if (!CSS2DManager.instance) {
      if (!scene || !container) {
        throw new Error(
          "[CSS2DManager] Singleton not initialized. Call initialize() first with scene and container.",
        );
      }
      CSS2DManager.instance = new CSS2DManager(scene, container);
    }
    return CSS2DManager.instance;
  }

  /**
   * Initializes the singleton instance of the CSS2DManager.
   * This method should be called once at the beginning of the application.
   * @param scene - The main THREE.Scene.
   * @param container - The HTMLElement that will contain the CSS2D renderer's DOM element.
   */
  public static initialize(
    scene: THREE.Scene,
    container: HTMLElement,
  ): CSS2DManager {
    if (CSS2DManager.instance) {
      console.warn(
        "[CSS2DManager] Already initialized. Returning existing instance.",
      );
      return CSS2DManager.instance;
    }
    CSS2DManager.instance = new CSS2DManager(scene, container);
    return CSS2DManager.instance;
  }

  /**
   * Create a celestial object label and add it to the appropriate layer and parent mesh.
   */
  createCelestialLabel(
    object: RenderableCelestialObject,
    parentMesh: THREE.Object3D,
  ): void {
    const existingLayerElements = this.layerManager.getLayerElements(
      CSS2DLayerType.CELESTIAL_LABELS,
    );
    if (existingLayerElements?.has(object.celestialObjectId)) {
      console.warn(
        `[CSS2DManager] Label already exists for ${object.celestialObjectId}. Skipping creation.`,
      );
      return;
    }

    const labelObject = this.labelFactory.createCelestialLabel(object);
    this.layerManager.addElement(
      CSS2DLayerType.CELESTIAL_LABELS,
      object.celestialObjectId,
      labelObject,
      parentMesh, // Attach to the parent mesh
    );
  }

  /**
   * Creates a label for an AU distance marker circle and adds it to the scene.
   */
  createAuMarkerLabel(
    id: string,
    auValue: number,
    position: THREE.Vector3,
  ): void {
    const existingLayerElements = this.layerManager.getLayerElements(
      CSS2DLayerType.AU_MARKERS,
    );
    if (existingLayerElements?.has(id)) {
      console.warn(
        `[CSS2DManager] AU Marker Label already exists for ${id}. Skipping creation.`,
      );
      return;
    }

    const labelObject = this.labelFactory.createAuMarkerLabel(
      id,
      auValue,
      position,
    );
    // AU markers are added directly to the scene, not a specific mesh parent
    this.scene.add(labelObject);
    this.layerManager.addElement(CSS2DLayerType.AU_MARKERS, id, labelObject);
  }

  /**
   * Remove an element by ID and layer type.
   */
  removeElement(layerType: CSS2DLayerType, id: string): void {
    this.layerManager.removeElement(layerType, id);
  }

  /**
   * Set visibility for a specific layer.
   */
  setLayerVisibility(layerType: CSS2DLayerType, visible: boolean): void {
    this.layerManager.setLayerVisibility(layerType, visible);
  }

  /**
   * Get visibility for a specific layer.
   */
  isLayerVisible(layerType: CSS2DLayerType): boolean {
    return this.layerManager.isLayerVisible(layerType);
  }

  /**
   * Shows a specific 2D label element within a layer.
   */
  showLabel(layer: CSS2DLayerType, id: string): void {
    this.layerManager.showLabel(layer, id);
  }

  /**
   * Hides a specific 2D label element within a layer.
   */
  hideLabel(layer: CSS2DLayerType, id: string): void {
    this.layerManager.hideLabel(layer, id);
  }

  /**
   * Clears all elements from a specific layer.
   */
  clearLayer(layerType: CSS2DLayerType): void {
    this.layerManager.clearLayer(layerType);
  }

  /**
   * Render visible layers.
   * This method also handles cleanup of orphaned labels.
   */
  render(camera: THREE.Camera): void {
    let orphanedIdsToRemove: { layer: CSS2DLayerType; id: string }[] = [];

    // Check for orphaned labels (labels whose parent is no longer in the scene)
    this.layerManager.forEachElement((element, id, layerType) => {
      let parentConnectedToScene = false;
      let current: THREE.Object3D | null = element.parent;

      // For AU markers and other scene-level elements, their direct parent is the scene.
      if (layerType === CSS2DLayerType.AU_MARKERS) {
        if (element.parent === this.scene) {
          parentConnectedToScene = true;
        }
      } else {
        // For other elements (like celestial labels), trace up to the scene.
        while (current) {
          if (current === this.scene) {
            parentConnectedToScene = true;
            break;
          }
          current = current.parent;
        }
      }

      if (!element.parent || !parentConnectedToScene) {
        console.warn(
          `[CSS2DManager] Found orphaned label ${id} in layer ${layerType}. Removing. Parent: ${element.parent}, Connected: ${parentConnectedToScene}`,
        );
        orphanedIdsToRemove.push({ layer: layerType, id: id });
        element.visible = false; // Hide it immediately
      }
    });

    orphanedIdsToRemove.forEach((orphan) => {
      this.layerManager.removeElement(orphan.layer, orphan.id);
    });

    // Ensure no visible CSS2DObjects are parentless just before render.
    // This is a safety check.
    this.scene.traverseVisible((object) => {
      if (object instanceof CSS2DObject) {
        if (!object.parent) {
          console.error(
            `[CSS2DManager] CRITICAL: Found visible CSS2DObject in scene WITHOUT parent just before render! Hiding. ID: ${object.uuid}`,
            object,
          );
          object.visible = false; // Hide to prevent render error
        }
      }
    });

    // Check if there are any visible elements across all managed layers
    let hasVisibleElements = false;
    for (const layerType of Object.values(CSS2DLayerType)) {
      if (this.layerManager.isLayerVisible(layerType)) {
        const layerMap = this.layerManager.getLayerElements(layerType);
        if (layerMap && layerMap.size > 0) {
          // Further check if any element in this visible layer is actually visible
          for (const element of layerMap.values()) {
            if (element.visible && element.element.style.display !== "none") {
              hasVisibleElements = true;
              break;
            }
          }
        }
      }
      if (hasVisibleElements) break;
    }

    if (hasVisibleElements) {
      this.rendererService.render(this.scene, camera);
    }
  }

  /**
   * Handle resize event.
   */
  onResize(width: number, height: number): void {
    this.rendererService.onResize(width, height);
  }

  /**
   * Clean up resources.
   */
  dispose(): void {
    this.layerManager.clearAllLayers();
    this.rendererService.dispose();
    // CSS2DManager.instance = undefined; // Allow re-initialization if needed
  }
}
