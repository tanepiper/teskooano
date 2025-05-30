import * as THREE from "three";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { CSS2DLayerType } from "./CSS2DLayerType";

/**
 * Manages CSS2D layers, their visibility, and the elements within them.
 */
export class CSS2DLayerManager {
  private elements: Map<CSS2DLayerType, Map<string, CSS2DObject>> = new Map();
  private layerVisibility: Map<CSS2DLayerType, boolean> = new Map();
  private _hasAnyVisibleElements: boolean = false;

  constructor() {
    Object.values(CSS2DLayerType).forEach((layerType) => {
      this.elements.set(layerType, new Map());
      this.layerVisibility.set(layerType, true); // Layers are visible by default
    });

    // Inject global styles for label visibility - ensure this happens only once per application load
    if (!document.head.querySelector("style[data-css2d-layer-styles]")) {
      const styleElement = document.createElement("style");
      styleElement.setAttribute("data-css2d-layer-styles", "true");
      styleElement.textContent = `
        .label-hidden {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
          width: 0 !important;
          height: 0 !important;
          overflow: hidden !important;
          position: absolute !important;
          z-index: -9999 !important;
          clip: rect(0, 0, 0, 0) !important;
        }
        .celestial-label,
        .celestial-label *,
        .au-marker-label,
        .au-marker-label * {
          pointer-events: none !important;
        }
      `;
      document.head.appendChild(styleElement);
    }
    this._recalculateOverallVisibility(); // Initial calculation
  }

  /**
   * Checks if there are any visible elements across all managed layers.
   * @returns True if at least one element is visible, false otherwise.
   */
  public hasAnyVisibleElements(): boolean {
    return this._hasAnyVisibleElements;
  }

  private _recalculateOverallVisibility(): void {
    this._hasAnyVisibleElements = false;
    for (const layerType of Object.values(CSS2DLayerType)) {
      if (this.isLayerVisible(layerType)) {
        const layerElements = this.elements.get(layerType);
        if (layerElements) {
          for (const element of layerElements.values()) {
            if (
              element.visible &&
              element.element instanceof HTMLElement &&
              element.element.style.display !== "none"
            ) {
              this._hasAnyVisibleElements = true;
              return; // Found one, no need to check further
            }
          }
        }
      }
    }
  }

  /**
   * Adds a CSS2DObject to a specified layer.
   * @param layerType - The type of layer to add the element to.
   * @param id - The unique ID for the element within the layer.
   * @param element - The CSS2DObject to add.
   * @param parentMesh - The THREE.Object3D to attach this label to (for celestial labels).
   *                     For scene-level labels (like AU markers), this can be omitted if added directly to scene later.
   */
  public addElement(
    layerType: CSS2DLayerType,
    id: string,
    element: CSS2DObject,
    parentMesh?: THREE.Object3D,
  ): void {
    const layerMap = this.elements.get(layerType);
    if (!layerMap) {
      console.warn(
        `[CSS2DLayerManager] Layer type ${layerType} not initialized.`,
      );
      return;
    }
    if (layerMap.has(id)) {
      console.warn(
        `[CSS2DLayerManager] Element with id ${id} already exists in layer ${layerType}. Overwriting. `,
      );
      this.removeElement(layerType, id); // Remove existing before adding new
    }

    if (parentMesh) {
      parentMesh.add(element);
    }
    // else, it's assumed to be added to the scene directly (e.g. AU Markers)

    layerMap.set(id, element);
    this.updateElementVisibility(element, layerType);
    this._recalculateOverallVisibility();
  }

  /**
   * Removes an element from a specified layer by its ID.
   * @param layerType - The layer from which to remove the element.
   * @param id - The ID of the element to remove.
   */
  public removeElement(layerType: CSS2DLayerType, id: string): void {
    const layerMap = this.elements.get(layerType);
    const element = layerMap?.get(id);
    if (element) {
      element.removeFromParent();
      element.element.remove(); // Clean up the DOM element itself
      layerMap?.delete(id);
      this._recalculateOverallVisibility();
    }
  }

  /**
   * Sets the visibility of an entire layer.
   * @param layerType - The layer to update.
   * @param visible - True to show the layer, false to hide.
   */
  public setLayerVisibility(layerType: CSS2DLayerType, visible: boolean): void {
    this.layerVisibility.set(layerType, visible);
    const layerMap = this.elements.get(layerType);
    layerMap?.forEach((element) => {
      this.updateElementVisibility(element, layerType);
    });
    this._recalculateOverallVisibility();
  }

  /**
   * Gets the visibility state of a layer.
   */
  public isLayerVisible(layerType: CSS2DLayerType): boolean {
    return this.layerVisibility.get(layerType) ?? false;
  }

  /**
   * Updates the visibility of a single CSS2DObject based on its layer's visibility.
   * @param element - The CSS2DObject to update.
   * @param layerType - The layer type this element belongs to.
   */
  private updateElementVisibility(
    element: CSS2DObject,
    layerType: CSS2DLayerType,
  ): void {
    const layerIsVisible = this.layerVisibility.get(layerType) ?? true;

    // element.visible controls THREE.js rendering of the object
    // Only change element.visible if layer visibility dictates it
    // Individual show/hideLabel methods will manage element.visible directly if layer is visible
    if (!layerIsVisible) {
      element.visible = false;
    } else if (
      layerIsVisible &&
      !element.visible &&
      !(element.element as HTMLElement).classList.contains("label-hidden")
    ) {
      // If layer is visible, and element was previously hidden by layer, make it visible
      // unless it was explicitly hidden by hideLabel (which adds label-hidden)
      element.visible = true;
    }

    // HTML element display style for actual browser rendering
    if (element.element instanceof HTMLElement) {
      if (layerIsVisible) {
        // Show element: remove hiding class and explicitly set display/visibility/opacity
        element.element.classList.remove("label-hidden");
        element.element.style.display = ""; // Default display (e.g., 'flex' or 'block' from its own styles)
        element.element.style.visibility = "visible";
        element.element.style.opacity = "1";
        element.element.style.pointerEvents = "none"; // Specific to labels
        element.element.style.width = ""; // Revert to default
        element.element.style.height = ""; // Revert to default
        element.element.style.overflow = ""; // Revert to default
        element.element.style.position = "absolute"; // CSS2DObject default
        element.element.style.zIndex = ""; // Revert to default (or what CSS2DRenderer assigns)

        // For celestial labels with shadow DOM, make sure inner elements are also visible
        if (
          layerType === CSS2DLayerType.CELESTIAL_LABELS &&
          element.element.shadowRoot
        ) {
          const content = element.element.shadowRoot.querySelector(
            ".celestial-label-content",
          );
          if (content instanceof HTMLElement) {
            content.style.display = "";
            content.style.visibility = "visible";
            content.style.opacity = "1";
          }
        }

        // For custom elements with a setVisibility method, call it
        if (typeof (element.element as any).setVisibility === "function") {
          (element.element as any).setVisibility(true);
        }
      } else {
        // Hide element with multiple techniques
        element.element.classList.add("label-hidden"); // This class should have !important
        element.element.style.display = "none";
        element.element.style.visibility = "hidden";
        element.element.style.opacity = "0";
        element.element.style.pointerEvents = "none";
        element.element.style.width = "0px"; // Explicitly set to 0
        element.element.style.height = "0px"; // Explicitly set to 0
        element.element.style.overflow = "hidden";
        // Position and z-index are mostly handled by .label-hidden now

        // For celestial labels with shadow DOM, make sure inner elements are also hidden
        if (
          layerType === CSS2DLayerType.CELESTIAL_LABELS &&
          element.element.shadowRoot
        ) {
          const content = element.element.shadowRoot.querySelector(
            ".celestial-label-content",
          );
          if (content instanceof HTMLElement) {
            content.style.display = "none";
            content.style.visibility = "hidden";
            content.style.opacity = "0";
          }
        }

        // For custom elements with a setVisibility method, call it
        if (typeof (element.element as any).setVisibility === "function") {
          (element.element as any).setVisibility(false);
        }
      }
    }
  }

  /**
   * Retrieves all elements from a specific layer.
   */
  public getLayerElements(
    layerType: CSS2DLayerType,
  ): Map<string, CSS2DObject> | undefined {
    return this.elements.get(layerType);
  }

  /**
   * Clears all elements from a specific layer.
   */
  public clearLayer(layerType: CSS2DLayerType): void {
    const layerMap = this.elements.get(layerType);
    if (layerMap) {
      layerMap.forEach((element) => {
        element.removeFromParent();
        element.element.remove();
      });
      layerMap.clear();
      this._recalculateOverallVisibility();
    }
  }

  /**
   * Clears all elements from all layers.
   */
  public clearAllLayers(): void {
    Object.values(CSS2DLayerType).forEach((layerType) => {
      this.clearLayer(layerType);
    });
    // Potentially redundant, but ensures correct state if clearLayer logic changes
    this._recalculateOverallVisibility();
  }

  /**
   * Shows a specific 2D label element within a layer by applying display style.
   */
  public showLabel(layerType: CSS2DLayerType, id: string): void {
    const element = this.elements.get(layerType)?.get(id);
    if (element?.element instanceof HTMLElement) {
      // Only proceed if the layer itself is visible
      if (this.isLayerVisible(layerType)) {
        element.element.classList.remove("label-hidden");
        element.element.style.display = ""; // Revert to default display
        element.element.style.visibility = "visible";
        element.element.style.opacity = "1";
        // Ensure pointer events are correctly set if they were globally none for the component type
        if (element.element.matches(".celestial-label, .au-marker-label")) {
          element.element.style.pointerEvents = "none";
        } else {
          element.element.style.pointerEvents = ""; // Or "auto" or whatever default is
        }
        element.visible = true; // Also ensure THREE object is visible
        this._recalculateOverallVisibility();
      }
    }
  }

  /**
   * Hides a specific 2D label element within a layer by applying display style.
   */
  public hideLabel(layerType: CSS2DLayerType, id: string): void {
    const element = this.elements.get(layerType)?.get(id);
    if (element?.element instanceof HTMLElement) {
      element.element.classList.add("label-hidden");
      // Explicitly set styles for hiding, as .label-hidden might be overridden or take time to apply
      element.element.style.display = "none";
      element.element.style.visibility = "hidden";
      element.element.style.opacity = "0";
      element.element.style.pointerEvents = "none";
      element.visible = false; // Also ensure THREE object is hidden
      this._recalculateOverallVisibility();
    }
  }

  /**
   * Iterates over all elements in all layers.
   * @param callback - A function to call for each element.
   */
  public forEachElement(
    callback: (
      element: CSS2DObject,
      id: string,
      layerType: CSS2DLayerType,
    ) => void,
  ): void {
    this.elements.forEach((layerMap, layerType) => {
      layerMap.forEach((element, id) => {
        callback(element, id, layerType);
      });
    });
  }
}
