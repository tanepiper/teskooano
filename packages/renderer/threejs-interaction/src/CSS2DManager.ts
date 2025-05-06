import * as THREE from "three";
import {
  CSS2DRenderer,
  CSS2DObject,
} from "three/examples/jsm/renderers/CSS2DRenderer.js";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import { CelestialType, SCALE } from "@teskooano/data-types";
import type { OortCloudProperties } from "@teskooano/data-types";

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

  private elements: Map<CSS2DLayerType, Map<string, CSS2DObject>> = new Map();

  private layerVisibility: Map<CSS2DLayerType, boolean> = new Map();

  /**
   * Create a new CSS2DManager
   */
  constructor(scene: THREE.Scene, container: HTMLElement) {
    this.scene = scene;
    this.container = container;

    this.renderer = new CSS2DRenderer();
    this.renderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight,
    );
    this.renderer.domElement.style.position = "absolute";
    this.renderer.domElement.style.top = "0";
    this.renderer.domElement.style.zIndex = "1";
    this.renderer.domElement.style.pointerEvents = "none";

    if (this.renderer.domElement instanceof HTMLElement) {
      const styleElement = document.createElement("style");
      styleElement.textContent = `
        .css2d-renderer,
        .css2d-renderer * {
          pointer-events: none !important;
        }
        .celestial-label,
        .celestial-label * {
          pointer-events: none !important;
        }
      `;
      document.head.appendChild(styleElement);

      const allChildren = this.renderer.domElement.querySelectorAll("*");
      allChildren.forEach((child) => {
        if (child instanceof HTMLElement) {
          child.style.pointerEvents = "none";
        }
      });

      this.renderer.domElement.classList.add("css2d-renderer");
    }

    container.appendChild(this.renderer.domElement);

    Object.values(CSS2DLayerType).forEach((layerType) => {
      this.elements.set(layerType, new Map());
      this.layerVisibility.set(layerType, true);
    });

    const styleElement = document.createElement("style");
    styleElement.textContent = `
      .label-hidden {
        display: none !important;
      }
    `;
    document.head.appendChild(styleElement);
  }

  /**
   * Create a positioned label with customizable position
   * @private
   */
  private createPositionedLabel(
    text: string,
    position: THREE.Vector3,
    parentMesh: THREE.Object3D,
    options?: {
      className?: string;
      color?: string;
      backgroundColor?: string;
      layerType?: CSS2DLayerType;
      id?: string;
    },
  ): CSS2DObject {
    const labelDiv = document.createElement("div");
    labelDiv.className = options?.className || "celestial-label";
    labelDiv.textContent = text;
    labelDiv.style.color = options?.color || "white";
    labelDiv.style.backgroundColor =
      options?.backgroundColor || "rgba(0,0,0,0.5)";
    labelDiv.style.padding = "2px 5px";
    labelDiv.style.borderRadius = "3px";
    labelDiv.style.fontSize = "12px";
    labelDiv.style.pointerEvents = "none";

    const label = new CSS2DObject(labelDiv);
    label.position.copy(position);

    parentMesh.add(label);

    const layerType = options?.layerType || CSS2DLayerType.CELESTIAL_LABELS;
    const id = options?.id;
    if (id) {
      const labelsMap = this.elements.get(layerType);
      if (labelsMap) {
        labelsMap.set(id, label);
      }
    }

    const isVisible = this.layerVisibility.get(layerType) ?? true;
    label.visible = isVisible;

    return label;
  }

  /**
   * Determine label position for a celestial object
   * @private
   */
  private calculateLabelPosition(
    object: RenderableCelestialObject,
  ): THREE.Vector3 {
    if (
      object.type === CelestialType.OORT_CLOUD &&
      object.properties?.type === CelestialType.OORT_CLOUD
    ) {
      const oortCloudProps = object.properties as OortCloudProperties;
      const innerRadiusAU = oortCloudProps.innerRadiusAU;
      if (innerRadiusAU && typeof innerRadiusAU === "number") {
        const scaledInnerRadius = innerRadiusAU * SCALE.RENDER_SCALE_AU;

        const direction = new THREE.Vector3(0.7, 0.7, 0).normalize();
        return direction.multiplyScalar(scaledInnerRadius);
      } else {
        return new THREE.Vector3(100, 100, 0);
      }
    } else {
      const visualRadius = object.radius || 1;
      return new THREE.Vector3(0, visualRadius * 1.5, 0);
    }
  }

  /**
   * Create a celestial object label
   */
  createCelestialLabel(
    object: RenderableCelestialObject,
    parentMesh: THREE.Object3D,
  ): void {
    const labelsMap = this.elements.get(CSS2DLayerType.CELESTIAL_LABELS);
    if (labelsMap?.has(object.celestialObjectId)) {
      console.warn(
        `[CSS2DManager] Label already exists for ${object.celestialObjectId}. Skipping creation.`,
      );
      return;
    }

    const labelPosition = this.calculateLabelPosition(object);

    this.createPositionedLabel(object.name, labelPosition, parentMesh, {
      className: "celestial-label",
      layerType: CSS2DLayerType.CELESTIAL_LABELS,
      id: object.celestialObjectId,
    });
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
  ): void {
    const labelsMap = this.elements.get(CSS2DLayerType.AU_MARKERS);
    if (labelsMap?.has(id)) {
      console.warn(
        `[CSS2DManager] AU Marker Label already exists for ${id}. Skipping creation.`,
      );
      return;
    }

    const labelDiv = document.createElement("div");
    labelDiv.className = "au-marker-label";
    labelDiv.textContent = `${auValue} AU`;
    labelDiv.style.color = "#FFA500";
    labelDiv.style.backgroundColor = "rgba(0,0,0,0.6)";
    labelDiv.style.padding = "1px 4px";
    labelDiv.style.borderRadius = "2px";
    labelDiv.style.fontSize = "10px";
    labelDiv.style.pointerEvents = "none";
    labelDiv.style.whiteSpace = "nowrap";

    const label = new CSS2DObject(labelDiv);
    label.position.copy(position);

    this.scene.add(label);

    if (labelsMap) {
      labelsMap.set(id, label);
    }

    const isVisible =
      this.layerVisibility.get(CSS2DLayerType.AU_MARKERS) ?? true;
    label.visible = isVisible;

    if (label.element instanceof HTMLElement) {
      label.element.style.display = isVisible ? "" : "none";
    }
  }

  /**
   * Remove an element by ID and layer type
   */
  removeElement(layerType: CSS2DLayerType, id: string): void {
    const layerMap = this.elements.get(layerType);
    if (layerMap) {
      const element = layerMap.get(id);
      if (element) {
        element.removeFromParent();

        layerMap.delete(id);
      }
    }
  }

  /**
   * Set visibility for a specific layer
   */
  setLayerVisibility(layerType: CSS2DLayerType, visible: boolean): void {
    this.layerVisibility.set(layerType, visible);

    const layerMap = this.elements.get(layerType);
    if (layerMap) {
      layerMap.forEach((element) => {
        element.visible = visible;

        if (element.element instanceof HTMLElement) {
          element.element.style.display = visible ? "" : "none";
        }
      });
    }
  }

  /**
   * Render visible layers
   */
  render(camera: THREE.Camera): void {
    let orphanedIdsToRemove: { layer: CSS2DLayerType; id: string }[] = [];
    this.elements.forEach((layerMap, layerType) => {
      layerMap.forEach((element, id) => {
        let parentConnected = false;
        let current: THREE.Object3D | null = element.parent;
        while (current) {
          if (current === this.scene) {
            parentConnected = true;
            break;
          }
          current = current.parent;
        }

        if (!element.parent || !parentConnected) {
          console.warn(
            `[CSS2DManager] Found orphaned label ${id} in layer ${layerType}. Removing.`,
          );

          orphanedIdsToRemove.push({ layer: layerType, id: id });

          element.visible = false;
        }
      });
    });

    orphanedIdsToRemove.forEach((orphan) => {
      this.removeElement(orphan.layer, orphan.id);
    });

    this.scene.traverseVisible((object) => {
      if (object instanceof CSS2DObject) {
        if (!object.parent) {
          console.error(
            `[CSS2DManager] CRITICAL: Found visible CSS2DObject in scene WITHOUT parent just before render! Hiding.`,
            object,
          );
          object.visible = false;
        }
      }
    });

    let hasVisibleElements = false;

    for (const [layerType, isVisible] of this.layerVisibility.entries()) {
      const layerMap = this.elements.get(layerType);
      if (isVisible) {
        if (layerMap && layerMap.size > 0) {
          hasVisibleElements = true;
          break;
        }
      }
    }

    if (hasVisibleElements) {
      try {
        this.renderer.render(this.scene, camera);
      } catch (e) {
        console.error(
          "[CSS2DManager] Error during internal CSS2DRenderer.render call:",
          e,
        );
      }
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
    Object.values(CSS2DLayerType).forEach((layerType) => {
      this.clearLayer(layerType);
    });

    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }

  /**
   * Shows a specific 2D label element within a layer.
   * @param layer - The layer the element belongs to.
   * @param id - The unique ID of the element to show.
   */
  showLabel(layer: CSS2DLayerType, id: string): void {
    const layerMap = this.elements.get(layer);
    const cssObject = layerMap?.get(id);
    if (cssObject?.element instanceof HTMLElement) {
      cssObject.element.classList.remove("label-hidden");
    } else {
      console.warn(
        `[CSS2DManager]   showLabel: Could not find element or element is not HTMLElement for id=${id}`,
      );
    }
  }

  /**
   * Hides a specific 2D label element within a layer.
   * @param layer - The layer the element belongs to.
   * @param id - The unique ID of the element to hide.
   */
  hideLabel(layer: CSS2DLayerType, id: string): void {
    const layerMap = this.elements.get(layer);
    const cssObject = layerMap?.get(id);
    if (cssObject?.element instanceof HTMLElement) {
      cssObject.element.classList.add("label-hidden");
    }
  }

  /**
   * Clears all elements from a specific layer.
   * @param layerType - The layer to clear.
   */
  clearLayer(layerType: CSS2DLayerType): void {
    const layerMap = this.elements.get(layerType);
    if (layerMap) {
      layerMap.forEach((element) => {
        element.removeFromParent();
      });
      layerMap.clear();
    }
  }
}
