import * as THREE from "three";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
// import { CelestialType } from "@teskooano/data-types"; // Unused import
import {
  CSS2DRendererService,
  CSS2DLayerManager,
  CSS2DLayerType,
} from "./css2d";
import type {
  ILabelFactory,
  LabelCreationContext,
  CelestialLabelCreationContext,
  LabelUpdateContext,
  CelestialLabelUpdateContext,
} from "./css2d/ILabelFactory";

export type LabelFactoryMap = Map<CSS2DLayerType, ILabelFactory>;

/**
 * Facade for managing all CSS2D rendered UI elements.
 * Orchestrates CSS2DRendererService, CSS2DLayerManager, and configured ILabelFactory instances.
 */
export class CSS2DManager {
  // private static instance: CSS2DManager | undefined; // REMOVED singleton instance
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private rendererService: CSS2DRendererService;
  private layerManager: CSS2DLayerManager;
  private labelFactories: LabelFactoryMap;

  public constructor(
    // ENSURED public
    scene: THREE.Scene,
    camera: THREE.Camera,
    container: HTMLElement,
    labelFactories: LabelFactoryMap,
  ) {
    this.scene = scene;
    this.camera = camera;
    // Instantiate services directly
    this.rendererService = new CSS2DRendererService(container); // CHANGED
    // this.rendererService.initialize(container); // REMOVED - initialization handled in constructor
    this.layerManager = new CSS2DLayerManager(); // CHANGED
    this.labelFactories = labelFactories;

    if (!this.labelFactories || this.labelFactories.size === 0) {
      console.warn(
        "[CSS2DManager] Initialized without any label factories. No labels can be created.",
      );
    }
  }

  // REMOVED _reconfigure method
  // private _reconfigure(...) { ... }

  // REMOVED static getInstance method
  // public static getInstance(...) { ... }

  // REMOVED static initialize method
  // public static initialize(...) { ... }

  private getFactoryForLayer(
    layerType: CSS2DLayerType,
  ): ILabelFactory | undefined {
    const factory = this.labelFactories.get(layerType);
    if (!factory) {
      console.warn(
        `[CSS2DManager] No label factory configured for layer type: ${layerType}`,
      );
    }
    return factory;
  }

  createCelestialLabel(
    objectData: RenderableCelestialObject,
    parentMesh: THREE.Object3D,
    allRenderableObjects?: ReadonlyMap<string, RenderableCelestialObject>,
  ): void {
    const layerType = CSS2DLayerType.CELESTIAL_LABELS;
    const factory = this.getFactoryForLayer(layerType);
    if (!factory) return;

    const existingLayerElements = this.layerManager.getLayerElements(layerType);
    if (existingLayerElements?.has(objectData.celestialObjectId)) {
      const existingLabel = existingLayerElements.get(
        objectData.celestialObjectId,
      );
      if (existingLabel && factory.updateLabel) {
        let parentDataForUpdate: RenderableCelestialObject | undefined;
        if (objectData.parentId && allRenderableObjects) {
          parentDataForUpdate = allRenderableObjects.get(objectData.parentId);
        }
        const updateContext: CelestialLabelUpdateContext = {
          id: objectData.celestialObjectId,
          objectData: objectData,
          visualObject: parentMesh,
          parentData: parentDataForUpdate,
        };
        existingLabel.userData.factoryContext = updateContext; // Keep for consistency with old logic if needed
        factory.updateLabel(existingLabel, updateContext);
      }
      return;
    }

    let parentContextData: RenderableCelestialObject | undefined;
    if (objectData.parentId && allRenderableObjects) {
      parentContextData = allRenderableObjects.get(objectData.parentId);
    }

    const creationContext: CelestialLabelCreationContext = {
      id: objectData.celestialObjectId,
      objectData: objectData,
      visualObject: parentMesh,
      parentData: parentContextData,
    };

    const labelObject = factory.createLabel(creationContext);

    if (labelObject) {
      this.layerManager.addElement(
        layerType,
        objectData.celestialObjectId,
        labelObject,
        parentMesh,
      );
    } else {
      console.warn(
        `[CSS2DManager] Factory for layer ${layerType} failed to create label for ${objectData.name}.`,
      );
    }
  }

  createAuMarkerLabel(
    id: string,
    auValue: number,
    position: THREE.Vector3,
  ): void {
    const layerType = CSS2DLayerType.AU_MARKERS;
    const factory = this.getFactoryForLayer(layerType);
    if (!factory) return;

    const existingLayerElements = this.layerManager.getLayerElements(layerType);
    if (existingLayerElements?.has(id)) {
      console.warn(
        `[CSS2DManager] AU Marker Label already exists for ${id}. Skipping creation or update.`,
      );
      // Optionally, could update here if factory supports it and it makes sense for AU markers
      return;
    }

    // Assuming the generic CSS2DLabelFactory has a specific method or handles context for AU markers
    // If createAuMarkerLabel was moved to the generic factory, it will handle this.
    // Otherwise, construct context for generic createLabel:
    const labelDiv = document.createElement("div"); // Temporary for example
    labelDiv.className = "au-marker-label";
    labelDiv.textContent = `${auValue} AU`;
    labelDiv.style.color = "#ccc";
    labelDiv.style.fontSize = "10px";

    const creationContext: LabelCreationContext = {
      id: id,
      elementContent: labelDiv, // The generic factory expects HTMLElement or string
      position: position,
      userData: { isAuMarkerLabel: true, auValue: auValue },
    };

    const labelObject = factory.createLabel(creationContext);

    if (labelObject) {
      this.scene.add(labelObject); // AU markers are added directly to the scene
      this.layerManager.addElement(layerType, id, labelObject);
    } else {
      console.warn(
        `[CSS2DManager] Factory for layer ${layerType} failed to create AU marker label for ${id}.`,
      );
    }
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
   * This method also handles cleanup of orphaned labels and updates active ones.
   */
  render(
    camera: THREE.Camera, // Camera passed for rendering, also used by factories if they need it dynamically
    allRenderableObjects?: ReadonlyMap<string, RenderableCelestialObject>,
  ): void {
    let orphanedIdsToRemove: { layer: CSS2DLayerType; id: string }[] = [];

    this.layerManager.forEachElement((element, id, layerType) => {
      let parentConnectedToScene = false;
      let currentObject: THREE.Object3D | null = element.parent;
      if (layerType === CSS2DLayerType.AU_MARKERS) {
        // AU Markers are parented to the scene directly
        if (element.parent === this.scene) parentConnectedToScene = true;
      } else {
        // Other labels are parented to a mesh in the scene
        while (currentObject) {
          if (currentObject === this.scene) {
            parentConnectedToScene = true;
            break;
          }
          currentObject = currentObject.parent;
        }
      }
      if (!element.parent || !parentConnectedToScene) {
        orphanedIdsToRemove.push({ layer: layerType, id: id });
        element.visible = false;
      }

      // Generic update logic using the factory's updateLabel method if available
      const factory = this.labelFactories.get(layerType);
      if (
        factory?.updateLabel &&
        element.userData.factoryContext // Check if factoryContext exists for update
      ) {
        const currentObjectData = allRenderableObjects?.get(
          element.userData.celestialObjectId || element.userData.labelId, // Use appropriate ID field
        );

        // For CELESTIAL_LABELS, we need full CelestialLabelUpdateContext
        if (layerType === CSS2DLayerType.CELESTIAL_LABELS) {
          if (currentObjectData && element.parent) {
            // element.parent should be the visualObject
            let currentParentData: RenderableCelestialObject | undefined;
            if (currentObjectData.parentId && allRenderableObjects) {
              currentParentData = allRenderableObjects.get(
                currentObjectData.parentId,
              );
            }
            const updateContext: CelestialLabelUpdateContext = {
              id: currentObjectData.celestialObjectId,
              objectData: currentObjectData,
              visualObject: element.parent as THREE.Object3D,
              parentData: currentParentData,
            };
            element.userData.factoryContext = updateContext; // Update stored context
            factory.updateLabel(element, updateContext);
          } else if (!currentObjectData && element.visible) {
            // If celestial object data is gone, hide the label
            element.visible = false;
            if (
              element.element &&
              typeof (element.element as any).setVisibility === "function"
            ) {
              (element.element as any).setVisibility(false);
            }
          }
        } else if (element.userData.labelId) {
          // For other generic labels, use a generic context
          // If other label types need specific update contexts, expand this logic
          const genericUpdateContext: LabelUpdateContext = {
            id: element.userData.labelId,
            // Potentially add other updatable properties if needed for generic labels
            // e.g., position from element.userData.factoryContext.position if it changes
          };
          // Only call update if there's actually something to update based on context
          if (Object.keys(genericUpdateContext).length > 1) {
            // more than just 'id'
            factory.updateLabel(element, genericUpdateContext);
          }
        }
      } else if (
        !factory?.updateLabel &&
        element.visible &&
        layerType === CSS2DLayerType.CELESTIAL_LABELS &&
        !allRenderableObjects?.has(element.userData.celestialObjectId)
      ) {
        // If no updateLabel method but it's a celestial label and its object is gone, hide it.
        element.visible = false;
        if (
          element.element &&
          typeof (element.element as any).setVisibility === "function"
        ) {
          (element.element as any).setVisibility(false);
        }
      }
    });

    orphanedIdsToRemove.forEach((orphan) => {
      this.layerManager.removeElement(orphan.layer, orphan.id);
    });

    // Safety check for orphaned CSS2DObjects directly in scene (mostly for AU markers if mishandled)
    this.scene.traverseVisible((object) => {
      if (object instanceof CSS2DObject) {
        if (!object.parent) {
          console.error(
            `[CSS2DManager] CRITICAL: Found visible CSS2DObject in scene WITHOUT parent before render! Hiding. ID: ${object.uuid}, Name: ${object.name}`,
            object,
          );
          object.visible = false;
        }
      }
    });

    let hasVisibleElements = false;
    for (const layerTypeValue of Object.values(CSS2DLayerType)) {
      if (this.layerManager.isLayerVisible(layerTypeValue as CSS2DLayerType)) {
        const layerMap = this.layerManager.getLayerElements(
          layerTypeValue as CSS2DLayerType,
        );
        if (layerMap && layerMap.size > 0) {
          for (const element of layerMap.values()) {
            if (
              element.visible &&
              (element.element as HTMLElement).style.display !== "none"
            ) {
              hasVisibleElements = true;
              break;
            }
          }
        }
      }
      if (hasVisibleElements) break;
    }

    if (hasVisibleElements) {
      this.rendererService.render(this.scene, this.camera); // Use internal camera for rendering call
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
    // CSS2DManager.instance = undefined; // Decide on singleton re-init strategy
  }
}
