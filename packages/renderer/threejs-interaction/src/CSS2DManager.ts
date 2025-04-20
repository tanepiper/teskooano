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

  // Organized by layer type then by object ID
  private elements: Map<CSS2DLayerType, Map<string, CSS2DObject>> = new Map();

  // Visibility state for each layer
  private layerVisibility: Map<CSS2DLayerType, boolean> = new Map();

  /**
   * Create a new CSS2DManager
   */
  constructor(scene: THREE.Scene, container: HTMLElement) {
    this.scene = scene;
    this.container = container;

    // Setup renderer
    this.renderer = new CSS2DRenderer();
    this.renderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight,
    );
    this.renderer.domElement.style.position = "absolute";
    this.renderer.domElement.style.top = "0";
    this.renderer.domElement.style.zIndex = "1";
    this.renderer.domElement.style.pointerEvents = "none";

    // Make sure all children have pointer-events: none
    if (this.renderer.domElement instanceof HTMLElement) {
      // Add CSS styles to ensure all elements have pointer-events: none
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

      // Also apply to initial elements
      const allChildren = this.renderer.domElement.querySelectorAll("*");
      allChildren.forEach((child) => {
        if (child instanceof HTMLElement) {
          child.style.pointerEvents = "none";
        }
      });

      // Add class for styling
      this.renderer.domElement.classList.add("css2d-renderer");
    }

    container.appendChild(this.renderer.domElement);

    // Initialize layer maps and visibility
    Object.values(CSS2DLayerType).forEach((layerType) => {
      this.elements.set(layerType, new Map());
      this.layerVisibility.set(layerType, true);
    });

    // --- BEGIN ADD CSS CLASS INJECTION ---
    const styleElement = document.createElement("style");
    styleElement.textContent = `
      .label-hidden {
        display: none !important;
      }
    `;
    document.head.appendChild(styleElement);
    // --- END ADD CSS CLASS INJECTION ---
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

    // Add label directly to the provided parent mesh
    parentMesh.add(label);

    // Store the label in the layer map if provided
    const layerType = options?.layerType || CSS2DLayerType.CELESTIAL_LABELS;
    const id = options?.id;
    if (id) {
      const labelsMap = this.elements.get(layerType);
      if (labelsMap) {
        labelsMap.set(id, label);
      }
    }

    // Set visibility based on layer visibility
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
    // Special case: Position Oort Cloud label at inner radius rather than at center
    if (
      object.type === CelestialType.OORT_CLOUD &&
      object.properties?.type === CelestialType.OORT_CLOUD
    ) {
      // Get inner radius from properties - this is in AU
      const oortCloudProps = object.properties as OortCloudProperties;
      const innerRadiusAU = oortCloudProps.innerRadiusAU;
      if (innerRadiusAU && typeof innerRadiusAU === "number") {
        // Convert AU to scene units
        const scaledInnerRadius = innerRadiusAU * SCALE.RENDER_SCALE_AU;

        // Position label slightly offset from parent star
        // Use a fixed direction vector toward upper right (+x, +y)
        // and multiply by inner radius to place at boundary
        const direction = new THREE.Vector3(0.7, 0.7, 0).normalize();
        return direction.multiplyScalar(scaledInnerRadius);
      } else {
        // Fallback for Oort Cloud without proper properties
        return new THREE.Vector3(100, 100, 0);
      }
    } else {
      // Regular object - position based on visual radius
      const visualRadius = object.radius || 1;
      return new THREE.Vector3(0, visualRadius * 1.5, 0); // Offset based on visual radius
    }
  }

  /**
   * Create a celestial object label
   */
  createCelestialLabel(
    object: RenderableCelestialObject,
    parentMesh: THREE.Object3D,
  ): void {
    // Check if a label already exists for this object ID within the layer
    const labelsMap = this.elements.get(CSS2DLayerType.CELESTIAL_LABELS);
    if (labelsMap?.has(object.celestialObjectId)) {
      console.warn(
        `[CSS2DManager] Label already exists for ${object.celestialObjectId}. Skipping creation.`,
      );
      return; // Avoid creating duplicate labels
    }

    // Calculate the appropriate position for this object type
    const labelPosition = this.calculateLabelPosition(object);

    // Create and position the label
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
    labelDiv.className = "au-marker-label"; // Use a specific class
    labelDiv.textContent = `${auValue} AU`;
    labelDiv.style.color = "#FFA500"; // Orange color for visibility against magenta
    labelDiv.style.backgroundColor = "rgba(0,0,0,0.6)";
    labelDiv.style.padding = "1px 4px";
    labelDiv.style.borderRadius = "2px";
    labelDiv.style.fontSize = "10px";
    labelDiv.style.pointerEvents = "none";
    labelDiv.style.whiteSpace = "nowrap"; // Prevent wrapping

    const label = new CSS2DObject(labelDiv);
    label.position.copy(position);

    // Add label directly to the scene
    this.scene.add(label);

    // Store the label in the AU markers layer
    if (labelsMap) {
      labelsMap.set(id, label);
    }

    // Set visibility based on layer visibility
    const isVisible =
      this.layerVisibility.get(CSS2DLayerType.AU_MARKERS) ?? true;
    label.visible = isVisible;
    // Also set initial display style
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
        // Use built-in method to remove from parent (handles null parent check)
        element.removeFromParent();

        // Always remove from our internal tracking map afterwards
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
        element.visible = visible; // Keep setting the Three.js flag
        // Also directly manipulate the DOM element's style for immediate effect
        if (element.element instanceof HTMLElement) {
          element.element.style.display = visible ? "" : "none"; // Use '' to revert to default display
        }
      });
    }
  }

  /**
   * Render visible layers
   */
  render(camera: THREE.Camera): void {
    // --- Pre-render check for orphaned labels ---
    let orphanedIdsToRemove: { layer: CSS2DLayerType; id: string }[] = [];
    this.elements.forEach((layerMap, layerType) => {
      layerMap.forEach((element, id) => {
        // Check if element still has a parent and if that parent is connected to the scene
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
          // Don't remove directly while iterating, mark for removal
          orphanedIdsToRemove.push({ layer: layerType, id: id });
          // Optionally hide it immediately to prevent rendering attempt this frame
          element.visible = false;
        }
      });
    });

    // Remove orphaned elements found during the check
    orphanedIdsToRemove.forEach((orphan) => {
      this.removeElement(orphan.layer, orphan.id); // Use existing remove method
    });
    // --- End pre-render check ---

    // --- Final Check: Validate parents of ALL CSS2DObjects in scene immediately before render ---
    this.scene.traverseVisible((object) => {
      // Check only visible objects
      if (object instanceof CSS2DObject) {
        if (!object.parent) {
          // This ideally shouldn't happen if removeElement works, but as a safeguard:
          console.error(
            `[CSS2DManager] CRITICAL: Found visible CSS2DObject in scene WITHOUT parent just before render! Hiding.`,
            object,
          );
          object.visible = false; // Hide it to hopefully prevent crash
        }
      }
    });
    // --- End Final Check ---

    // Only render if we have at least one visible layer with elements remaining
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
        // Add try-catch for extra safety
        this.renderer.render(this.scene, camera);
      } catch (e) {
        console.error(
          "[CSS2DManager] Error during internal CSS2DRenderer.render call:",
          e,
        );
        // If this still happens, the issue might be deeper within the library or scene state.
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
    // Clear all layers using the new clearLayer method
    Object.values(CSS2DLayerType).forEach((layerType) => {
      this.clearLayer(layerType);
    });

    // Remove the renderer DOM element
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
    } else {
      console.warn(
        `[CSS2DManager]   hideLabel: Could not find element or element is not HTMLElement for id=${id}`,
      );
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
        element.removeFromParent(); // Use built-in method
      });
      layerMap.clear();
    }
  }
}
