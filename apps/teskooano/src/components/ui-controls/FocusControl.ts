import { celestialObjectsStore } from "@teskooano/core-state";
import {
  CelestialObject,
  CelestialStatus,
  CelestialType,
  scaleSize,
} from "@teskooano/data-types";
import type { CompositeEnginePanel } from "../engine/CompositeEnginePanel"; // Import parent panel type
import * as THREE from "three";
import { renderableObjectsStore } from "@teskooano/core-state";
import { GroupPanelPartInitParameters } from "dockview-core";
import { panelRegistry } from "@teskooano/core-state";
import { IContentRenderer } from "dockview-core";

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: block;
      font-family: var(--font-family, sans-serif);
      font-size: 0.9em;
    }
    .control-section {
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--color-border, #4a4a6a);
    }
    .control-section:last-child {
       border-bottom: none;
       margin-bottom: 0;
       padding-bottom: 0;
    }
    .button-row {
      display: flex;
      gap: 8px;
    }
    /* Style for primary buttons like Reset/Clear */
    button#reset-view,
    button#clear-focus {
      flex-grow: 1;
      padding: 5px 8px;
      font-size: 0.95em;
      border: 1px solid var(--color-border-alt, #5a5a7a);
      background-color: var(--color-surface-alt, #3a3a4e);
      color: var(--color-text, #e0e0fc);
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s ease, border-color 0.2s ease;
    }
    button#reset-view:hover,
    button#clear-focus:hover {
      border-color: var(--color-primary-light, #9fa8da);
      background-color: var(--color-surface, #2a2a3e);
    }
    .target-list-container {
        max-height: 400px; /* Or adjust as needed */
        overflow-y: auto;
        padding-right: 5px; /* Space for scrollbar */
    }
    /* Styles for the focus item buttons */
    button.focus-item {
      /* Reset button defaults */
      border: none;
      background: none;
      margin: 0 0 2px 0; /* Add bottom margin */
      padding: 0; 
      font: inherit;
      color: inherit;
      text-align: left;
      cursor: pointer;
      width: 100%; /* Make button fill container width */
      
      /* Original focus-item styles */
      display: flex;
      align-items: center;
      padding: 4px 6px; /* Re-apply padding */
      border-radius: 3px;
      transition: background-color 0.15s ease;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    button.focus-item:hover {
      background-color: var(--color-surface-hover, rgba(255, 255, 255, 0.1));
    }
    button.focus-item.active {
      background-color: var(--color-primary, #6c63ff);
      color: white;
      font-weight: bold;
    }
    button.focus-item.active .celestial-icon {
       filter: brightness(0) invert(1); /* Make icon white on active */
    }
    .celestial-icon {
      width: 14px;
      height: 14px;
      margin-right: 6px;
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
      flex-shrink: 0;
      /* Basic placeholder colors */
      border-radius: 50%;
      display: inline-block;
    }
    .star-icon { background-color: yellow; }
    .planet-icon { background-color: skyblue; }
    .gas-giant-icon { background-color: orange; }
    .moon-icon { background-color: lightgrey; }
    .asteroid-field-icon { background-color: brown; }
    .oort-cloud-icon { background-color: darkgrey; }
    .default-icon { background-color: white; }

    /* Style for destroyed items */
    button.focus-item.destroyed {
      color: var(--color-text-disabled, #888);
      text-decoration: line-through;
      cursor: not-allowed;
      opacity: 0.6;
      background-color: transparent; /* Ensure no hover/active background */
    }
    button.focus-item.destroyed:hover {
      background-color: transparent; /* Prevent hover effect */
    }
    button.focus-item.destroyed .celestial-icon {
      filter: grayscale(100%) opacity(50%);
    }

    /* Style for annihilated items */
    button.focus-item.annihilated {
      color: var(--color-text-disabled, #888);
      text-decoration: line-through;
      cursor: not-allowed;
      opacity: 0.4; /* Even more faded than destroyed */
      background-color: transparent;
    }
    button.focus-item.annihilated:hover {
      background-color: transparent;
    }
    button.focus-item.annihilated .celestial-icon {
      filter: grayscale(100%) opacity(30%);
    }

    .indent-1 { margin-left: 15px; }
    .indent-2 { margin-left: 30px; }

    .empty-message {
        padding: 10px;
        color: var(--color-text-secondary, #aaa);
        text-align: center;
        font-style: italic;
    }

  </style>

  <div class="control-section">
    <div class="button-row">
      <button id="reset-view" title="Reset Camera View & Clear Focus">Reset View</button>
      <button id="clear-focus" title="Clear Camera Focus">Clear Focus</button>
    </div>
  </div>

  <div class="target-list-container" id="target-list">
    <!-- Object list populated here -->
  </div>
`;

// --- Constants for Camera Focusing ---
const CAMERA_DISTANCE_SURFACE_PERCENTAGE = 0.1; // 10% from surface
const MINIMUM_CAMERA_DISTANCE = 1;
// Enhanced distances with better defaults for stars and large bodies
const CAMERA_DISTANCES: Partial<Record<CelestialType, number>> = {
  [CelestialType.STAR]: 150, // Increased from 50 to allow better view of stars
  [CelestialType.GAS_GIANT]: 5, // Doubled from 20
  [CelestialType.PLANET]: 5, // Slightly increased
  [CelestialType.DWARF_PLANET]: 5, // Slightly increased
  [CelestialType.MOON]: 5, // Slightly increased
};
const DEFAULT_CAMERA_DISTANCE = 8; // Increased default distance

// Size-based scaling factors for different celestial types
const SIZE_BASED_SCALING: Partial<Record<CelestialType, number>> = {
  [CelestialType.STAR]: 5.0, // Stars need much more space due to brightness/size
  [CelestialType.GAS_GIANT]: 3.0, // Gas giants are large but not as bright
  [CelestialType.PLANET]: 1.5, // Reduced from 2.0
  [CelestialType.DWARF_PLANET]: 1.5,
  [CelestialType.MOON]: 1.0, // Reduced from 1.2
};
const DEFAULT_SIZE_SCALING = 1.5;
// --- End Constants ---

// --- ADD Interface for Params ---
interface FocusControlParams {
  parentEnginePanelId?: string;
}
// --- END Interface --- // FocusControl already implements IContentRenderer

export class FocusControl extends HTMLElement implements IContentRenderer {
  private listContainer: HTMLElement | null = null;
  private resetButton: HTMLButtonElement | null = null;
  private clearButton: HTMLButtonElement | null = null;

  private _parentPanel: CompositeEnginePanel | null = null; // Store parent panel instance

  private _currentFocusedId: string | null = null;
  private _handleObjectsLoaded: () => void;
  private _handleObjectDestroyed: () => void;
  private _handleRendererFocusChange: (event: Event) => void; // Store handler reference

  // Store subscription for automatic updates
  private _celestialObjectsUnsubscribe: (() => void) | null = null;
  private _previousObjectsState: Record<string, CelestialObject> = {};

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));

    // Bind event handlers to maintain correct 'this' context
    this._handleObjectsLoaded = this.populateList.bind(this);
    this._handleObjectDestroyed = this.populateList.bind(this);
    // Bind the focus change handler
    this._handleRendererFocusChange = (event: Event): void => {
      const customEvent = event as CustomEvent<{
        focusedObjectId: string | null;
      }>;
      if (customEvent.detail) {
        this.updateHighlight(customEvent.detail.focusedObjectId);
      }
    };
  }

  connectedCallback() {
    this.listContainer = this.shadowRoot!.getElementById("target-list");
    this.resetButton = this.shadowRoot!.getElementById(
      "reset-view",
    ) as HTMLButtonElement;
    this.clearButton = this.shadowRoot!.getElementById(
      "clear-focus",
    ) as HTMLButtonElement;

    this.addEventListeners();

    // Initial population (run directly)
    this.populateList();

    // Subscribe to celestial objects store for automatic updates
    this._previousObjectsState = { ...celestialObjectsStore.get() };
    this._celestialObjectsUnsubscribe = celestialObjectsStore.subscribe(
      (objects) => {
        this.checkForStatusChanges(objects);
      },
    );

    // Listen for celestial object load/destroy events to repopulate list
    document.addEventListener(
      "celestial-objects-loaded",
      this._handleObjectsLoaded,
    );
    document.addEventListener(
      "celestial-object-destroyed",
      this._handleObjectDestroyed,
    );

    // Listen for object status changes (like when an object is destroyed)
    document.addEventListener(
      "celestial-object-status-changed",
      this.handleObjectStatusChanged,
    );

    // If we need to react to influence changes for list display
    document.addEventListener(
      "celestial-influences-changed",
      this.handleInfluencesChanged,
    );

    // ADD LISTENER FOR FOCUS CHANGES *FROM* THE RENDERER/CONTROLS
    document.addEventListener(
      "renderer-focus-changed",
      this._handleRendererFocusChange,
    );
  }

  disconnectedCallback() {
    this.removeEventListeners();

    // Unsubscribe from store
    if (this._celestialObjectsUnsubscribe) {
      this._celestialObjectsUnsubscribe();
      this._celestialObjectsUnsubscribe = null;
    }
  }

  /**
   * Public method for the parent component (CompositeEnginePanel)
   * to provide its instance.
   */
  public setParentPanel(panel: CompositeEnginePanel): void {
    this._parentPanel = panel;
    // TODO: Subscribe to parent panel's view state for focus changes?
    // Or rely on the renderer-focus-changed event?
  }

  public tourFocus = (): void => {
    // Find an active (non-destroyed) object to focus on
    const activeButtons = Array.from(
      this.listContainer!.querySelectorAll("button.focus-item:not([disabled])"),
    );

    if (activeButtons.length === 0) {
      console.warn("[FocusControl] No active objects found for tour focus");
      return;
    }

    // Pick a random active button
    const randomButton = activeButtons[
      Math.floor(Math.random() * activeButtons.length)
    ] as HTMLElement;
    if (randomButton) {
      randomButton.click();
    }
  };

  /**
   * Get a random active object ID from the celestial objects store
   * This can be used by tours to focus on a valid object
   * @returns A tuple of [objectId: string, engineViewId: string | null]
   */
  public getRandomActiveObjectId = (): [string | null, string | null] => {
    const objects = celestialObjectsStore.get();
    // Filter out destroyed or annihilated objects
    const activeObjects = Object.values(objects).filter(
      (obj) =>
        obj.status !== CelestialStatus.DESTROYED &&
        obj.status !== CelestialStatus.ANNIHILATED,
    );

    if (activeObjects.length === 0) {
      console.warn("[FocusControl] No active objects available");
      return [null, null];
    }

    // Select a random active object
    const randomObject =
      activeObjects[Math.floor(Math.random() * activeObjects.length)];
    return [randomObject.id, null];
  };

  public focusOnObject = (objectId: string): boolean => {
    if (!this._parentPanel) {
      return false;
    }
    const objects = celestialObjectsStore.get();
    const targetObject = objects[objectId];

    if (!targetObject) {
      console.warn(`[FocusControl] Target object ${objectId} not found.`);
      return false;
    }

    // Check if object is a type we don't want to directly focus (e.g., fields)
    if (
      targetObject.type === CelestialType.ASTEROID_FIELD ||
      targetObject.type === CelestialType.OORT_CLOUD
    ) {
      console.warn(
        `[FocusControl] Direct focus disallowed for type: ${targetObject.type}`,
      );
      // Optionally, focus on the parent object instead?
      // if (targetObject.parentId) { return this.focusOnObject(targetObject.parentId); }
      return false; // Prevent focusing for now
    }

    // Check if object is destroyed or annihilated
    if (
      targetObject.status === CelestialStatus.DESTROYED ||
      targetObject.status === CelestialStatus.ANNIHILATED
    ) {
      console.warn(
        `[FocusControl] Cannot focus on object ${objectId} with status ${targetObject.status}`,
      );
      return false; // Prevent focusing on destroyed/annihilated objects
    }

    const distance = this.calculateCameraDistance(targetObject);

    // Call parent panel's focus method
    this._parentPanel.focusOnObject(objectId, distance);

    return true; // Indicate focus request was sent
  };

  private addEventListeners(): void {
    if (this.resetButton) {
      this.resetButton.addEventListener("click", () => {
        this._parentPanel?.resetCameraView();
      });
    }
    if (this.clearButton) {
      this.clearButton.addEventListener("click", () => {
        this._parentPanel?.clearFocus();
      });
    }

    // Keep list item click listener
    this.shadowRoot!.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;
      const button = target.closest("button.focus-item") as HTMLButtonElement;

      if (button && button.dataset.id) {
        const objectId = button.dataset.id;

        // First check if button itself is marked as disabled or destroyed
        if (
          button.disabled ||
          button.classList.contains("destroyed") ||
          button.classList.contains("annihilated")
        ) {
          return; // Do nothing if clicked on a disabled item
        }

        // Double-check current state from the store
        const currentObjects = celestialObjectsStore.get();
        const currentObject = currentObjects[objectId];
        if (
          !currentObject ||
          currentObject.status === CelestialStatus.DESTROYED ||
          currentObject.status === CelestialStatus.ANNIHILATED
        ) {
          console.warn(
            `[FocusControl] Click ignored for object ${objectId}: Object no longer active in current state.`,
          );
          // Trigger immediate list refresh to update the UI
          this.populateList();
          return; // Stop processing the click
        }

        // Dispatch event *before* initiating focus to allow immediate UI updates
        this.dispatchEvent(
          new CustomEvent("focus-request-initiated", {
            bubbles: true, // Allow event to bubble up
            composed: true, // Allow event to cross shadow DOM boundaries
            detail: { objectId },
          }),
        );

        // --- Start rendering logic ---
        // Fetch from renderableObjectsStore to get live position data
        const currentRenderables = renderableObjectsStore.get();
        const targetObjectRenderable = currentRenderables[objectId];

        if (!targetObjectRenderable) {
          console.warn(
            `[FocusControl] Could not find renderable object data for ${objectId} in store.`,
          );
          return;
        }

        // 1. Get Target Position (Should be THREE.Vector3 directly from renderable store)
        const targetPosition = targetObjectRenderable.position; // Access position directly
        if (!targetPosition || !(targetPosition instanceof THREE.Vector3)) {
          console.error(
            `[FocusControl] Invalid or missing position data on renderable object ${objectId}`,
          );
          return;
        }

        // Reset camera zoom before calculating position
        const renderer = this._parentPanel?.getRenderer();
        if (
          renderer?.camera &&
          "zoom" in renderer.camera &&
          "updateProjectionMatrix" in renderer.camera
        ) {
          const cameraWithZoom = renderer.camera as
            | THREE.PerspectiveCamera
            | THREE.OrthographicCamera;
          cameraWithZoom.zoom = 1;
          cameraWithZoom.updateProjectionMatrix();
        }

        // 2. Calculate desired Camera Position
        const desiredDistance = this.calculateCameraDistance(currentObject);

        // Get current camera position to determine direction
        if (!renderer?.camera?.position) {
          console.error(
            "[FocusControl] Cannot get renderer or camera position.",
          );
          return;
        }
        const currentCameraPosition = renderer.camera.position.clone(); // Now safe to access

        // Calculate direction from target back towards current camera
        // Handle potential zero vector if camera is already at the target
        const direction = currentCameraPosition.clone().sub(targetPosition);
        if (direction.lengthSq() < 0.0001) {
          // Camera is already at the target, use a default direction (e.g., up)
          direction.set(0, 1, 0);
        } else {
          direction.normalize();
        }

        // Calculate final camera position (Use cloned position)
        const cameraPosition = targetPosition
          .clone() // Clone before modifying
          .addScaledVector(direction, desiredDistance);

        // 3. Call Renderer with new signature (Use cloned position)
        renderer?.setFollowTarget(
          objectId,
          targetPosition.clone(),
          cameraPosition,
        );

        // Update the parent panel's central view state
        this._parentPanel?.updateViewState({ focusedObjectId: objectId });

        // --- End rendering logic ---
      }
    });

    // Listen for celestial object load/destroy events to repopulate list
    document.addEventListener(
      "celestial-objects-loaded",
      this._handleObjectsLoaded,
    );
    document.addEventListener(
      "celestial-object-destroyed",
      this._handleObjectDestroyed,
    );
    // If we need to react to influence changes for list display
    document.addEventListener(
      "celestial-influences-changed",
      this.handleInfluencesChanged,
    );

    // ADD LISTENER FOR FOCUS CHANGES *FROM* THE RENDERER/CONTROLS
    // This assumes the renderer or its controls emit an event when focus changes
    // Or, alternatively, subscribe to the CompositeEnginePanel's viewStateStore if it tracks focus
    // Example using a custom event:
    document.addEventListener(
      "renderer-focus-changed",
      this._handleRendererFocusChange,
    );
  }

  private removeEventListeners(): void {
    // Remove listeners added in addEventListeners
    document.removeEventListener(
      "celestial-objects-loaded",
      this._handleObjectsLoaded,
    );
    document.removeEventListener(
      "celestial-object-destroyed",
      this._handleObjectDestroyed,
    );
    document.removeEventListener(
      "celestial-influences-changed",
      this.handleInfluencesChanged,
    );
    document.removeEventListener(
      "renderer-focus-changed",
      this._handleRendererFocusChange,
    );
    document.removeEventListener(
      "celestial-object-status-changed",
      this.handleObjectStatusChanged,
    );
    // Note: Button listeners are implicitly removed when the component disconnects
  }

  private populateList = (): void => {
    if (!this.listContainer) return;

    const objects = celestialObjectsStore.get();
    // Use celestialHierarchyStore for INITIAL hierarchy if needed for base structure,
    // but use currentParentId from objects for dynamic parenting display.
    // const hierarchy = celestialHierarchyStore.get();
    const focusedId = this._currentFocusedId;

    this.listContainer.innerHTML = ""; // Clear previous list

    // Create a map for easy lookup
    const objectMap = new Map(Object.entries(objects));

    // Build a dynamic hierarchy based on currentParentId
    const dynamicHierarchy = new Map<string | null, string[]>();
    objectMap.forEach((obj, id) => {
      // Use currentParentId if available, otherwise parentId, fallback to null
      const parentKey = obj.currentParentId ?? obj.parentId ?? null;
      if (!dynamicHierarchy.has(parentKey)) {
        dynamicHierarchy.set(parentKey, []);
      }
      dynamicHierarchy.get(parentKey)!.push(id);
    });

    // Find root objects (those whose parent is null or not in the map)
    const rootIds = dynamicHierarchy.get(null) || [];
    // Also add objects whose parent ID exists but the parent itself isn't in the objectMap (orphans?)
    dynamicHierarchy.forEach((children, parentId) => {
      if (parentId !== null && !objectMap.has(parentId)) {
        rootIds.push(...children);
      }
    });
    // Ensure stars without parents are roots
    objectMap.forEach((obj, id) => {
      if (
        obj.type === CelestialType.STAR &&
        obj.parentId === undefined &&
        obj.currentParentId === undefined
      ) {
        if (!rootIds.includes(id)) {
          rootIds.push(id);
        }
      }
    });

    // Sort roots (e.g., stars first)
    rootIds.sort((a, b) => {
      const objA = objectMap.get(a);
      const objB = objectMap.get(b);
      if (
        objA?.type === CelestialType.STAR &&
        objB?.type !== CelestialType.STAR
      )
        return -1;
      if (
        objA?.type !== CelestialType.STAR &&
        objB?.type === CelestialType.STAR
      )
        return 1;
      return (objA?.name ?? "").localeCompare(objB?.name ?? "");
    });

    if (rootIds.length === 0 && objectMap.size > 0) {
      this.listContainer.innerHTML =
        '<div class="empty-message">Loading hierarchy...</div>';
      console.warn(
        "[FocusControl] No root objects found in dynamic hierarchy, but objects exist.",
        dynamicHierarchy,
      );
      // Potentially add logic to display objects without hierarchy if roots aren't determined correctly
    } else if (objectMap.size === 0) {
      this.listContainer.innerHTML =
        '<div class="empty-message">No celestial objects loaded.</div>';
    } else {
      // Recursive function to add items
      const addItem = (obj: CelestialObject, indentLevel: number) => {
        // --- MODIFIED CHECK: Include destroyed/annihilated objects but mark them appropriately --- //
        const isDestroyed = obj.status === CelestialStatus.DESTROYED;
        const isAnnihilated = obj.status === CelestialStatus.ANNIHILATED;

        const item = document.createElement("button");
        item.classList.add("focus-item");
        item.dataset.id = obj.id;

        // Apply disabled state for destroyed or annihilated objects
        if (isDestroyed || isAnnihilated) {
          item.disabled = true; // Make the button non-interactive
          item.classList.add(isDestroyed ? "destroyed" : "annihilated");
          item.title = `${obj.name} (${obj.type}) - ${obj.status}`;
        } else {
          item.disabled = false;
          item.title = `${obj.name} (${obj.type})`;
          item.classList.toggle("active", obj.id === focusedId);
        }

        // Icon based on type
        const icon = document.createElement("span");
        icon.classList.add("celestial-icon");
        icon.classList.add(this.getIconClass(obj.type));
        item.appendChild(icon);

        // Text label
        const label = document.createElement("span");
        label.textContent = obj.name;
        item.appendChild(label);

        // Apply indentation
        if (indentLevel > 0) {
          item.style.marginLeft = `${indentLevel * 15}px`;
        }

        this.listContainer!.appendChild(item);

        // Recursively add children from dynamic hierarchy
        const childrenIds = dynamicHierarchy.get(obj.id) || [];
        // Sort children alphabetically
        childrenIds.sort((a, b) => {
          const childA = objectMap.get(a);
          const childB = objectMap.get(b);
          return (childA?.name ?? "").localeCompare(childB?.name ?? "");
        });
        childrenIds.forEach((childId) => {
          const childObj = objectMap.get(childId);
          if (childObj) {
            addItem(childObj, indentLevel + 1);
          }
        });
      };
      // Start recursion from roots
      rootIds.forEach((id) => {
        const rootObj = objectMap.get(id);
        if (rootObj) {
          addItem(rootObj, 0);
        }
      });
    }
  };

  // --- Add handler for the influence change event ---
  private handleInfluencesChanged = (): void => {
    // Trigger a refresh of the list to reflect potential hierarchy changes
    this.populateList();
  };
  // --- End handler ---

  private getIconClass(type: CelestialType): string {
    switch (type) {
      case CelestialType.STAR:
        return "star-icon";
      case CelestialType.PLANET:
        return "planet-icon";
      case CelestialType.GAS_GIANT:
        return "gas-giant-icon";
      case CelestialType.DWARF_PLANET:
        return "planet-icon";
      case CelestialType.MOON:
        return "moon-icon";
      case CelestialType.ASTEROID_FIELD:
        return "asteroid-field-icon";
      case CelestialType.OORT_CLOUD:
        return "oort-cloud-icon";
      default:
        return "default-icon";
    }
  }

  private updateHighlight(focusedId: string | null): void {
    if (!this.listContainer) return;

    // Only update if we have a new value
    if (this._currentFocusedId === focusedId) return;
    this._currentFocusedId = focusedId;

    // Update selector to target buttons
    this.listContainer.querySelectorAll("button.focus-item").forEach((el) => {
      const item = el as HTMLElement;
      const itemId = item.dataset.id;

      // Only toggle class if needed (already active but shouldn't be, or not active but should be)
      const isActive = item.classList.contains("active");
      const shouldBeActive = itemId === focusedId;

      if (isActive !== shouldBeActive) {
        item.classList.toggle("active", shouldBeActive);
      }
    });
  }

  /**
   * Calculate camera distance based on object mesh bounds or fallback to real radius.
   * Uses both scaling factor and percentage from surface based on type
   * With improved handling for large objects like stars
   */
  private calculateCameraDistance(object: CelestialObject): number {
    // --- Try Mesh Bounding Box First ---
    const renderer = this._parentPanel?.getRenderer();
    const mesh = renderer?.getObjectById(object.id); // ASSUMPTION: Method exists

    if (mesh) {
      try {
        const box = new THREE.Box3().setFromObject(mesh);
        const size = new THREE.Vector3();
        box.getSize(size);

        // Calculate effective radius from the largest dimension of the bounding box
        const effectiveRadius = Math.max(size.x, size.y, size.z) / 2;

        // Check if calculation was valid
        if (!isNaN(effectiveRadius) && effectiveRadius > 0) {
          let distance =
            effectiveRadius * (1 + CAMERA_DISTANCE_SURFACE_PERCENTAGE);

          // Apply type-specific scaling and minimum distance
          const scaleFactor =
            SIZE_BASED_SCALING[object.type] ?? DEFAULT_SIZE_SCALING;
          const minTypeDistance =
            CAMERA_DISTANCES[object.type] ?? DEFAULT_CAMERA_DISTANCE;

          distance *= scaleFactor;
          distance = Math.max(distance, minTypeDistance); // Ensure type-specific min distance
          console.debug(
            `[FocusControl] Applied type scaling (${scaleFactor.toFixed(1)}x) and min distance (${minTypeDistance}). New Distance: ${distance.toFixed(2)}`,
          );

          // Ensure general minimum distance for all types
          distance = Math.max(distance, MINIMUM_CAMERA_DISTANCE);

          console.debug(
            `[FocusControl] Using mesh bounds for ${object.name}. Effective Radius: ${effectiveRadius.toFixed(2)}, Distance: ${distance.toFixed(2)}`,
          );
          return distance;
        } else {
          console.warn(
            `[FocusControl] Mesh bounds calculation resulted in invalid radius for ${object.name}. Falling back.`,
          );
        }
      } catch (error) {
        console.error(
          `[FocusControl] Error calculating mesh bounds for ${object.name}:`,
          error,
          ". Falling back.",
        );
      }
    }

    // --- Fallback to Real Radius Calculation ---
    console.debug(
      `[FocusControl] Falling back to realRadius_m calculation for ${object.name}`,
    );
    // Get type-specific scaling factor (or default)
    const sizeScaling = SIZE_BASED_SCALING[object.type] ?? DEFAULT_SIZE_SCALING;

    // Get type-specific fallback distance
    const typeDistance = CAMERA_DISTANCES[object.type];

    // Calculate distance based on REAL radius (if available)
    let radiusDistance: number | undefined = undefined;

    // Access the correct property: realRadius_m
    if (object.realRadius_m) {
      // Convert real radius to scaled renderer units
      const scaledRadius = scaleSize(object.realRadius_m, object.type);

      // Apply type-specific scaling to ensure proper framing in camera view
      // For stars and large bodies, we need to be much further away
      const adjustedRadius = scaledRadius * sizeScaling;

      // Calculate distance as scaled radius + percentage margin
      radiusDistance =
        adjustedRadius * (1 + CAMERA_DISTANCE_SURFACE_PERCENTAGE);

      // Ensure minimum distance
      radiusDistance = Math.max(radiusDistance, MINIMUM_CAMERA_DISTANCE);

      // For stars specifically, ensure we're never too close
      if (object.type === CelestialType.STAR) {
        radiusDistance = Math.max(
          radiusDistance,
          CAMERA_DISTANCES[CelestialType.STAR] ?? 150,
        );
      }
    }

    // Prefer radius-based distance if calculated, otherwise use type fallback, then default
    return radiusDistance ?? typeDistance ?? DEFAULT_CAMERA_DISTANCE;
  }

  // --- Add this method for handling object status updates ---
  private updateObjectStatus(objectId: string, status: CelestialStatus): void {
    if (!this.listContainer) return;

    // Find button for the specified object
    const button = this.listContainer.querySelector(
      `button.focus-item[data-id="${objectId}"]`,
    ) as HTMLButtonElement;
    if (!button) {
      console.warn(
        `[FocusControl] Button for object ${objectId} not found in DOM, will refresh list`,
      );
      this.populateList(); // If button not found, refresh the entire list
      return;
    }

    // Skip if button already has the correct state
    const isDestroyedNow = status === CelestialStatus.DESTROYED;
    const isAnnihilatedNow = status === CelestialStatus.ANNIHILATED;
    const wasDestroyedBefore = button.classList.contains("destroyed");
    const wasAnnihilatedBefore = button.classList.contains("annihilated");

    if (
      (isDestroyedNow && wasDestroyedBefore) ||
      (isAnnihilatedNow && wasAnnihilatedBefore)
    ) {
      return; // Already has the correct status
    }

    // Update button based on status
    if (isDestroyedNow || isAnnihilatedNow) {
      button.disabled = true;

      // Remove active class if this was the focused object
      if (button.classList.contains("active")) {
        button.classList.remove("active");
      }

      // Add appropriate status class
      button.classList.remove("destroyed", "annihilated");
      button.classList.add(isDestroyedNow ? "destroyed" : "annihilated");

      // Update title
      const objects = celestialObjectsStore.get();
      const obj = objects[objectId];
      if (obj) {
        button.title = `${obj.name} (${obj.type}) - ${status}`;
      }

      // If this was the focused object, clear the focus
      if (this._currentFocusedId === objectId) {
        this._parentPanel?.clearFocus();
      }
    }
  }

  // --- Add event handler for object status changes ---
  private handleObjectStatusChanged = (event: Event): void => {
    const customEvent = event as CustomEvent<{
      objectId: string;
      status: CelestialStatus;
    }>;
    if (customEvent.detail) {
      const { objectId, status } = customEvent.detail;
      this.updateObjectStatus(objectId, status);
    }
  };

  // Check for status changes between previous and current state
  private checkForStatusChanges(
    currentObjects: Record<string, CelestialObject>,
  ): void {
    // No need to check if we don't have previous state
    if (Object.keys(this._previousObjectsState).length === 0) {
      this._previousObjectsState = { ...currentObjects };
      return;
    }

    let needsFullRefresh = false;

    // Check for objects whose status has changed
    Object.entries(currentObjects).forEach(([id, obj]) => {
      const prevObj = this._previousObjectsState[id];

      // If object is new or status changed
      if (!prevObj || prevObj.status !== obj.status) {
        if (
          obj.status === CelestialStatus.DESTROYED ||
          obj.status === CelestialStatus.ANNIHILATED
        ) {
          this.updateObjectStatus(id, obj.status);

          // If this was the focused object, clear focus
          if (this._currentFocusedId === id) {
            this._parentPanel?.clearFocus();
            needsFullRefresh = true;
          }
        }
      }
    });

    // Check for objects that were removed
    Object.keys(this._previousObjectsState).forEach((id) => {
      if (!currentObjects[id]) {
        // Object was removed
        if (this._currentFocusedId === id) {
          this._parentPanel?.clearFocus();
          needsFullRefresh = true;
        }
      }
    });

    // Update previous state for next comparison
    this._previousObjectsState = { ...currentObjects };

    // If something significant changed, do a full refresh
    if (needsFullRefresh) {
      this.populateList();
    }
  }

  // Dockview panel lifecycle method
  public init(parameters: GroupPanelPartInitParameters): void {
    // const params = parameters.params as FocusControlParams; // REMOVE THIS LINE
    // Define params type inline or import if available
    const params = parameters.params as {
      parentInstance?: CompositeEnginePanel;
    }; // ADD THIS LINE

    // Check for the directly passed instance
    if (params?.parentInstance) {
      // Ideally, add a type check here if possible, although TypeScript might handle it
      if (
        params.parentInstance instanceof Object &&
        "focusOnObject" in params.parentInstance
      ) {
        // Basic check
        this.setParentPanel(params.parentInstance); // Use existing method
      } else {
        console.error(
          "[FocusControl] Received parentInstance, but it doesn't seem to be a valid CompositeEnginePanel.",
        );
      }
    } else {
      console.error(
        "[FocusControl] Initialization parameters did not include 'parentInstance'. Cannot link to parent.",
      );
    }
  }

  // Add required getter for IContentRenderer
  get element(): HTMLElement {
    return this;
  }
}

// Define the custom element
customElements.define("focus-control", FocusControl);
