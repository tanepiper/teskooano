import * as THREE from "three";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import { CelestialType } from "@teskooano/data-types";
import {
  CSS2DRendererService,
  CSS2DLayerManager,
  CSS2DLayerType,
} from "./index";
import type {
  ILabelFactory,
  LabelCreationContext,
  CelestialLabelCreationContext,
  LabelUpdateContext,
  CelestialLabelUpdateContext,
} from "./ILabelFactory";

export type LabelFactoryMap = Map<CSS2DLayerType, ILabelFactory>;

/**
 * Singleton facade for managing all CSS2D rendered UI elements.
 * Orchestrates CSS2DRendererService, CSS2DLayerManager, and configured ILabelFactory instances.
 */
export class CSS2DManager {
  private static instance: CSS2DManager | undefined;
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private rendererService: CSS2DRendererService;
  private layerManager: CSS2DLayerManager;
  private labelFactories: LabelFactoryMap;

  private constructor(
    scene: THREE.Scene,
    camera: THREE.Camera,
    container: HTMLElement,
    labelFactories: LabelFactoryMap,
  ) {
    this.scene = scene;
    this.camera = camera;
    this.rendererService = CSS2DRendererService.getInstance();
    this.rendererService.initialize(container);
    this.layerManager = CSS2DLayerManager.getInstance();
    this.labelFactories = labelFactories;

    if (!this.labelFactories || this.labelFactories.size === 0) {
      console.warn(
        "[CSS2DManager] Initialized without any label factories. No labels can be created.",
      );
    }
  }

  private _reconfigure(
    scene: THREE.Scene,
    camera: THREE.Camera,
    container: HTMLElement,
    labelFactories: LabelFactoryMap,
  ): void {
    this.scene = scene;
    this.camera = camera;
    this.rendererService.initialize(container);
    this.labelFactories = labelFactories;
    console.log(
      "[CSS2DManager] Reconfigured with new scene, camera, container, and factories.",
    );
  }

  public static getInstance(
    scene?: THREE.Scene,
    camera?: THREE.Camera,
    container?: HTMLElement,
    labelFactories?: LabelFactoryMap,
  ): CSS2DManager {
    if (!CSS2DManager.instance) {
      if (!scene || !camera || !container || !labelFactories) {
        throw new Error(
          "[CSS2DManager] Singleton not initialized. Call initialize() first with scene, camera, container, and labelFactories.",
        );
      }
      CSS2DManager.instance = new CSS2DManager(
        scene,
        camera,
        container,
        labelFactories,
      );
    }
    return CSS2DManager.instance;
  }

  public static initialize(
    scene: THREE.Scene,
    camera: THREE.Camera,
    container: HTMLElement,
    labelFactories: LabelFactoryMap,
  ): CSS2DManager {
    if (CSS2DManager.instance) {
      console.warn(
        "[CSS2DManager] Instance already exists. Reconfiguring with new parameters.",
      );
      CSS2DManager.instance._reconfigure(
        scene,
        camera,
        container,
        labelFactories,
      );
      return CSS2DManager.instance;
    }
    CSS2DManager.instance = new CSS2DManager(
      scene,
      camera,
      container,
      labelFactories,
    );
    console.log("[CSS2DManager] Initialized new instance with factories.");
    return CSS2DManager.instance;
  }

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
        existingLabel.userData.factoryContext = updateContext;
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
      return;
    }

    const creationContext: LabelCreationContext = {
      id: id,
      position: position,
      userData: {
        isAuMarkerLabel: true,
        auValue: auValue,
        textContent: `${auValue} AU`,
      },
    };

    const labelObject = factory.createLabel(creationContext);

    if (labelObject) {
      this.scene.add(labelObject);
      this.layerManager.addElement(layerType, id, labelObject);
    } else {
      console.warn(
        `[CSS2DManager] Factory for layer ${layerType} failed to create AU marker label for ${id}.`,
      );
    }
  }

  removeElement(layerType: CSS2DLayerType, id: string): void {
    this.layerManager.removeElement(layerType, id);
  }

  setLayerVisibility(layerType: CSS2DLayerType, visible: boolean): void {
    this.layerManager.setLayerVisibility(layerType, visible);
  }

  isLayerVisible(layerType: CSS2DLayerType): boolean {
    return this.layerManager.isLayerVisible(layerType);
  }

  showLabel(layer: CSS2DLayerType, id: string): void {
    this.layerManager.showLabel(layer, id);
  }

  hideLabel(layer: CSS2DLayerType, id: string): void {
    this.layerManager.hideLabel(layer, id);
  }

  clearLayer(layerType: CSS2DLayerType): void {
    this.layerManager.clearLayer(layerType);
  }

  render(
    camera: THREE.Camera,
    allRenderableObjects?: ReadonlyMap<string, RenderableCelestialObject>,
  ): void {
    let orphanedIdsToRemove: { layer: CSS2DLayerType; id: string }[] = [];

    this.layerManager.forEachElement(
      (element: CSS2DObject, id: string, layerType: CSS2DLayerType) => {
        let parentConnectedToScene = false;
        let currentObject: THREE.Object3D | null = element.parent;
        if (layerType === CSS2DLayerType.AU_MARKERS) {
          if (element.parent === this.scene) parentConnectedToScene = true;
        } else {
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

        const factory = this.labelFactories.get(layerType);
        if (factory?.updateLabel && element.userData.factoryContext) {
          const objectIdToUpdate =
            element.userData.celestialObjectId || element.userData.labelId;
          const currentObjectData = allRenderableObjects?.get(objectIdToUpdate);

          if (layerType === CSS2DLayerType.CELESTIAL_LABELS) {
            if (currentObjectData && element.parent) {
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
              element.userData.factoryContext = updateContext;
              factory.updateLabel(element, updateContext);
            } else if (!currentObjectData && element.visible) {
              element.visible = false;
              if (
                element.element &&
                typeof (element.element as any).setVisibility === "function"
              ) {
                (element.element as any).setVisibility(false);
              }
            }
          } else if (element.userData.labelId) {
            const genericUpdateContext: LabelUpdateContext = {
              id: element.userData.labelId,
              ...(element.userData.factoryContext || {}),
            };
            if (
              Object.keys(genericUpdateContext).length > 1 ||
              factory.updateLabel.length === 2
            ) {
              factory.updateLabel(element, genericUpdateContext);
            }
          }
        } else if (
          !factory?.updateLabel &&
          element.visible &&
          layerType === CSS2DLayerType.CELESTIAL_LABELS &&
          !allRenderableObjects?.has(element.userData.celestialObjectId)
        ) {
          element.visible = false;
          if (
            element.element &&
            typeof (element.element as any).setVisibility === "function"
          ) {
            (element.element as any).setVisibility(false);
          }
        }
      },
    );

    orphanedIdsToRemove.forEach((orphan) => {
      this.layerManager.removeElement(orphan.layer, orphan.id);
    });

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
      this.rendererService.render(this.scene, this.camera);
    }
  }

  onResize(width: number, height: number): void {
    this.rendererService.onResize(width, height);
  }

  dispose(): void {
    this.layerManager.clearAllLayers();
    this.rendererService.dispose();
  }
}
