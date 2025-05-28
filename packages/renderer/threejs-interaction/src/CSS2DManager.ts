import * as THREE from "three";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import { CelestialType } from "@teskooano/data-types";
import {
  CSS2DRendererService,
  CSS2DLabelFactory,
  CSS2DLayerManager,
  CSS2DLayerType,
  CSS2DCelestialLabelFactory,
  type CelestialLabelFactoryContext,
  CelestialLabelComponent,
} from "./css2d";

/**
 * Singleton facade for managing all CSS2D rendered UI elements.
 * Orchestrates CSS2DRendererService, CSS2DSciFiLabelFactory, and CSS2DLayerManager.
 */
export class CSS2DManager {
  private static instance: CSS2DManager | undefined;
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private rendererService: CSS2DRendererService;
  private labelFactory: CSS2DCelestialLabelFactory;
  private layerManager: CSS2DLayerManager;

  private constructor(
    scene: THREE.Scene,
    camera: THREE.Camera,
    container: HTMLElement,
  ) {
    this.scene = scene;
    this.camera = camera;
    this.rendererService = CSS2DRendererService.getInstance();
    this.rendererService.initialize(container); // Initialize with the container

    this.labelFactory = new CSS2DCelestialLabelFactory(this.camera);
    this.layerManager = CSS2DLayerManager.getInstance();
  }

  private _reconfigure(
    scene: THREE.Scene,
    camera: THREE.Camera,
    container: HTMLElement,
  ): void {
    this.scene = scene;
    this.camera = camera;
    // Re-initialize renderer service with the new container.
    // The CSS2DRendererService.initialize method is now idempotent and handles container changes.
    this.rendererService.initialize(container);
    // Re-create label factory with the new camera
    this.labelFactory = new CSS2DCelestialLabelFactory(this.camera);
    // Layer manager can persist, but ensure it's clean for a new context if necessary
    // For now, assuming layers are cleared elsewhere when a system changes.
    // If not, might need: this.layerManager.clearAllLayers();
    console.log(
      "[CSS2DManager] Reconfigured with new scene, camera, and container.",
    );
  }

  /**
   * Get the singleton instance of the CSS2DManager.
   * Must be initialized once with `initialize` before use.
   */
  public static getInstance(
    scene?: THREE.Scene,
    camera?: THREE.Camera,
    container?: HTMLElement,
  ): CSS2DManager {
    if (!CSS2DManager.instance) {
      if (!scene || !camera || !container) {
        throw new Error(
          "[CSS2DManager] Singleton not initialized. Call initialize() first with scene, camera, and container.",
        );
      }
      CSS2DManager.instance = new CSS2DManager(scene, camera, container);
    }
    return CSS2DManager.instance;
  }

  /**
   * Initializes the singleton instance of the CSS2DManager.
   * This method should be called once at the beginning of the application.
   * @param scene - The main THREE.Scene.
   * @param camera - The main THREE.Camera.
   * @param container - The HTMLElement that will contain the CSS2D renderer's DOM element.
   */
  public static initialize(
    scene: THREE.Scene,
    camera: THREE.Camera,
    container: HTMLElement,
  ): CSS2DManager {
    if (CSS2DManager.instance) {
      console.warn(
        "[CSS2DManager] Instance already exists. Reconfiguring with new parameters.",
      );
      CSS2DManager.instance._reconfigure(scene, camera, container);
      return CSS2DManager.instance;
    }
    CSS2DManager.instance = new CSS2DManager(scene, camera, container);
    console.log("[CSS2DManager] Initialized new instance.");
    return CSS2DManager.instance;
  }

  /**
   * Create a celestial object label and add it to the appropriate layer and parent mesh.
   * @param objectData - The data for the celestial object for which to create the label.
   * @param parentMesh - The THREE.Object3D representing the celestial object in the scene.
   * @param allRenderableObjects - A map of all currently renderable objects, to look up parent data.
   */
  createCelestialLabel(
    objectData: RenderableCelestialObject,
    parentMesh: THREE.Object3D,
    allRenderableObjects?: ReadonlyMap<string, RenderableCelestialObject>,
  ): void {
    const existingLayerElements = this.layerManager.getLayerElements(
      CSS2DLayerType.CELESTIAL_LABELS,
    );
    if (existingLayerElements?.has(objectData.celestialObjectId)) {
      const existingLabel = existingLayerElements.get(
        objectData.celestialObjectId,
      );
      if (
        existingLabel &&
        this.labelFactory &&
        typeof this.labelFactory.updateCelestialLabel === "function"
      ) {
        let parentDataForUpdate: RenderableCelestialObject | undefined =
          undefined;
        if (objectData.parentId && allRenderableObjects) {
          parentDataForUpdate = allRenderableObjects.get(objectData.parentId);
        }
        const updateContext: CelestialLabelFactoryContext = {
          objectData: objectData,
          visualObject: parentMesh,
          parentData: parentDataForUpdate,
        };
        existingLabel.userData.factoryContext = updateContext;
        this.labelFactory.updateCelestialLabel(existingLabel);
      }
      return;
    }

    let parentData: RenderableCelestialObject | undefined = undefined;
    if (
      objectData.type === CelestialType.MOON &&
      objectData.parentId &&
      allRenderableObjects
    ) {
      parentData = allRenderableObjects.get(objectData.parentId);
    }

    const context: CelestialLabelFactoryContext = {
      objectData: objectData,
      visualObject: parentMesh,
      parentData: parentData,
    };

    const labelObject = this.labelFactory.createCelestialLabel(context);

    if (labelObject) {
      this.layerManager.addElement(
        CSS2DLayerType.CELESTIAL_LABELS,
        objectData.celestialObjectId,
        labelObject,
        parentMesh,
      );
    } else {
    }
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

    const genericLabelFactory = new CSS2DLabelFactory();
    const labelObject = genericLabelFactory.createAuMarkerLabel(
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
   * This method also handles cleanup of orphaned labels and updates active ones.
   */
  render(
    camera: THREE.Camera,
    allRenderableObjects?: ReadonlyMap<string, RenderableCelestialObject>,
  ): void {
    let orphanedIdsToRemove: { layer: CSS2DLayerType; id: string }[] = [];

    this.layerManager.forEachElement((element, id, layerType) => {
      let parentConnectedToScene = false;
      let current: THREE.Object3D | null = element.parent;
      if (layerType === CSS2DLayerType.AU_MARKERS) {
        if (element.parent === this.scene) parentConnectedToScene = true;
      } else {
        while (current) {
          if (current === this.scene) {
            parentConnectedToScene = true;
            break;
          }
          current = current.parent;
        }
      }
      if (!element.parent || !parentConnectedToScene) {
        orphanedIdsToRemove.push({ layer: layerType, id: id });
        element.visible = false;
      }

      if (
        layerType === CSS2DLayerType.CELESTIAL_LABELS &&
        element.userData.isCelestialLabel &&
        this.labelFactory &&
        typeof this.labelFactory.updateCelestialLabel === "function"
      ) {
        const currentObjectData = allRenderableObjects?.get(
          element.userData.celestialObjectId,
        );
        if (currentObjectData) {
          let currentParentData: RenderableCelestialObject | undefined =
            undefined;
          if (currentObjectData.parentId && allRenderableObjects) {
            currentParentData = allRenderableObjects.get(
              currentObjectData.parentId,
            );
          }
          const updatedContext: CelestialLabelFactoryContext = {
            objectData: currentObjectData,
            visualObject: element.parent as THREE.Object3D,
            parentData: currentParentData,
          };
          element.userData.factoryContext = updatedContext;
          this.labelFactory.updateCelestialLabel(element);
        } else {
          element.visible = false;
          if (element.element instanceof CelestialLabelComponent) {
            (element.element as CelestialLabelComponent).setVisibility(false);
          }
        }
      }
    });

    orphanedIdsToRemove.forEach((orphan) => {
      this.layerManager.removeElement(orphan.layer, orphan.id);
    });

    this.scene.traverseVisible((object) => {
      if (object instanceof CSS2DObject) {
        if (!object.parent) {
          console.error(
            `[CSS2DManager] CRITICAL: Found visible CSS2DObject in scene WITHOUT parent just before render! Hiding. ID: ${object.uuid}`,
            object,
          );
          object.visible = false;
        }
      }
    });

    let hasVisibleElements = false;
    for (const layerType of Object.values(CSS2DLayerType)) {
      if (this.layerManager.isLayerVisible(layerType)) {
        const layerMap = this.layerManager.getLayerElements(layerType);
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
      /** Use if we need to force update */
      // this.scene.updateMatrixWorld(true);
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
    // CSS2DManager.instance = undefined; // Keep instance for potential reconfiguration
  }
}
