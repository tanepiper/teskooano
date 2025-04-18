import {
  celestialObjectsStore,
  panelRegistry
} from "@teskooano/core-state";
import {
  CelestialObject,
  CelestialStatus,
  CelestialType,
  scaleSize,
} from "@teskooano/data-types";
import * as THREE from "three"; // Needed for Vector3 calculations
// import { throttle } from 'lodash-es'; // Remove throttle for now
import { EnginePanel } from "../engine/EnginePanel"; // Use regular import and corrected path
// import { DockviewApi } from 'dockview-core'; // Need DockviewApi type potentially
// import { SeedForm } from './SeedForm'; // Import SeedForm for the API hack

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
      background-color: transparent; /* Ensure no hover/active background */
    }
    button.focus-item.destroyed:hover {
      background-color: transparent; /* Prevent hover effect */
    }
    button.focus-item.destroyed .celestial-icon {
      filter: grayscale(100%) opacity(50%);
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
  [CelestialType.GAS_GIANT]: 40, // Doubled from 20
  [CelestialType.PLANET]: 15, // Slightly increased
  [CelestialType.DWARF_PLANET]: 10, // Slightly increased
  [CelestialType.MOON]: 8, // Slightly increased
};
const DEFAULT_CAMERA_DISTANCE = 8; // Increased default distance
const CAMERA_OFFSET = new THREE.Vector3(0.8, 0.4, 1.0).normalize();
const DEFAULT_CAMERA_POSITION = new THREE.Vector3(0, 0, 300); // Simpler default
const DEFAULT_CAMERA_TARGET = new THREE.Vector3(0, 0, 0);

// Size-based scaling factors for different celestial types
const SIZE_BASED_SCALING: Partial<Record<CelestialType, number>> = {
  [CelestialType.STAR]: 5.0, // Stars need much more space due to brightness/size
  [CelestialType.GAS_GIANT]: 3.0, // Gas giants are large but not as bright
  [CelestialType.PLANET]: 2.0,
  [CelestialType.DWARF_PLANET]: 1.5,
  [CelestialType.MOON]: 1.2,
};
const DEFAULT_SIZE_SCALING = 1.5;
// --- End Constants ---

export class FocusControl extends HTMLElement {
  static get observedAttributes() {
    return ["engine-view-id"];
  }

  private listContainer: HTMLElement | null = null;
  private resetButton: HTMLButtonElement | null = null;
  private clearButton: HTMLButtonElement | null = null;

  private linkedEnginePanel: EnginePanel | null = null;
  private unsubscribeLinkedPanelState: (() => void) | null = null;
  private _engineViewId: string | null = null;
  private _linkCheckInterval: number | null = null;
  private _currentFocusedId: string | null = null;
  private _handleObjectsLoaded: () => void;
  private _handleObjectDestroyed: () => void;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));

    // Bind event handlers to maintain correct 'this' context
    this._handleObjectsLoaded = this.populateList.bind(this);
    this._handleObjectDestroyed = this.populateList.bind(this);
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null
  ): void {
    if (name === "engine-view-id" && oldValue !== newValue) {
      this._engineViewId = newValue;
      this.attemptLinkToEnginePanel(); // Link when ID changes
    }
  }

  connectedCallback() {
    this.listContainer = this.shadowRoot!.getElementById("target-list");
    this.resetButton = this.shadowRoot!.getElementById(
      "reset-view"
    ) as HTMLButtonElement;
    this.clearButton = this.shadowRoot!.getElementById(
      "clear-focus"
    ) as HTMLButtonElement;

    this.addEventListeners();

    // Initial population (run directly)
    this.populateList();

    // Instead of subscribing to ALL updates, just listen for specific events
    // that would require rebuilding the list
    document.addEventListener(
      "celestial-objects-loaded",
      this._handleObjectsLoaded
    );
    document.addEventListener(
      "celestial-object-destroyed",
      this._handleObjectDestroyed
    );

    // No longer subscribe to global simulationState for focus updates
    // Focus updates will come directly from the linked panel's view state

    // Subscribe to the event dispatched when influences change
    document.addEventListener(
      "planet-influences-changed",
      this.handleInfluencesChanged
    );

    // Attempt initial link if attribute is already set
    this._engineViewId = this.getAttribute("engine-view-id");
    this.attemptLinkToEnginePanel();
  }

  disconnectedCallback() {
    // Only unsubscribe from panel state, not simulation state
    this.unsubscribeLinkedPanelState?.();
    this.linkedEnginePanel = null;

    // Clean up event listeners
    document.removeEventListener(
      "celestial-objects-loaded",
      this._handleObjectsLoaded
    );
    document.removeEventListener(
      "celestial-object-destroyed",
      this._handleObjectDestroyed
    );
    // Unsubscribe from influence change events
    document.removeEventListener(
      "planet-influences-changed",
      this.handleInfluencesChanged
    );

    // Clear polling interval
    if (this._linkCheckInterval) {
      clearInterval(this._linkCheckInterval);
      this._linkCheckInterval = null;
    }
    this.removeEventListeners();
  }

  private addEventListeners(): void {
    this.listContainer?.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;

      // Get the button - either the target itself or its closest parent button
      let focusItemButton: HTMLButtonElement | null = null;

      // First check if target is already the button
      if (
        target.tagName === "BUTTON" &&
        target.classList.contains("focus-item") &&
        target.dataset.id
      ) {
        focusItemButton = target as HTMLButtonElement;
      } else {
        // Otherwise find closest parent button
        focusItemButton = target.closest(
          "button.focus-item[data-id]"
        ) as HTMLButtonElement | null;
      }

      // Check linked panel ID exists before dispatching
      if (focusItemButton && this._engineViewId) {
        const objectId = focusItemButton.dataset.id;
        if (objectId) {
          // Only send the command if the focus is actually changing
          if (objectId !== this._currentFocusedId) {
            // Get the object to calculate distance based on radius
            const objects = celestialObjectsStore.get();
            const focusObject = objects[objectId];
            let distance: number | undefined = undefined;

            if (focusObject) {
              // Calculate distance as radius + 10% of radius
              distance = this.calculateCameraDistance(focusObject);
            }
            // Else: distance remains undefined, panel can use default

            // *** DISPATCH CUSTOM EVENT INSTEAD OF DIRECT CALL ***
            const focusEvent = new CustomEvent("engine-focus-request", {
              detail: {
                targetPanelId: this._engineViewId,
                objectId: objectId,
                distance: distance, // Pass calculated distance or undefined
              },
              bubbles: true, // Allow event to bubble up if needed
              composed: true, // Allow event to cross shadow DOM boundaries
            });
            this.dispatchEvent(focusEvent);
          } else {
            console.trace(
              `[FocusControl] Item ${objectId} is already focused in panel ${this._engineViewId}. Ignoring click.`
            );
          }
        }
      } else if (focusItemButton && !this._engineViewId) {
        console.warn(
          `[FocusControl] Clicked focus item ${focusItemButton.dataset.id}, but no engine panel is linked.`
        );
      }
    });

    this.resetButton?.addEventListener("click", () => {
      if (this.linkedEnginePanel) {
        // Resetting view likely doesn't need event, direct update is fine?
        // Or could also dispatch an event 'engine-reset-view-request'
        this.linkedEnginePanel.updateViewState({
          cameraPosition: DEFAULT_CAMERA_POSITION.clone(),
          cameraTarget: DEFAULT_CAMERA_TARGET.clone(),
          focusedObjectId: null,
        });
      } else if (this._engineViewId) {
        // Dispatch event even if panel link isn't established yet?

        const resetEvent = new CustomEvent("engine-reset-view-request", {
          detail: { targetPanelId: this._engineViewId },
          bubbles: true,
          composed: true,
        });
        this.dispatchEvent(resetEvent);
      }
    });

    this.clearButton?.addEventListener("click", () => {
      // Clearing focus should also use the event system
      if (this._engineViewId) {
        const clearFocusEvent = new CustomEvent("engine-focus-request", {
          detail: {
            targetPanelId: this._engineViewId,
            objectId: null, // Signal to clear focus
            distance: undefined,
          },
          bubbles: true,
          composed: true,
        });
        this.dispatchEvent(clearFocusEvent);
      } else {
        console.warn(
          "[FocusControl] Cannot clear focus, no engine panel ID known."
        );
      }
    });
  }

  private removeEventListeners(): void {
    this.listContainer?.removeEventListener("click", () => {}); // Placeholder for removal logic if needed
    this.resetButton?.removeEventListener("click", () => {}); // Placeholder
    this.clearButton?.removeEventListener("click", () => {}); // Placeholder
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
        dynamicHierarchy
      );
      // Potentially add logic to display objects without hierarchy if roots aren't determined correctly
    } else if (objectMap.size === 0) {
      this.listContainer.innerHTML =
        '<div class="empty-message">No celestial objects loaded.</div>';
    } else {
      // Recursive function to add items
      const addItem = (obj: CelestialObject, indentLevel: number) => {
        // ... (existing item creation logic using obj.id, obj.name, obj.type) ...
        // --- Keep existing item creation logic ---
        const item = document.createElement("button");
        item.classList.add("focus-item");
        item.classList.toggle("active", obj.id === focusedId);
        item.dataset.id = obj.id;
        item.title = `${obj.name} (${obj.type})`;

        // --- Check status and apply styles/disable ---
        if (obj.status === CelestialStatus.DESTROYED) {
          item.classList.add("destroyed");
          item.disabled = true;
          item.title = `${obj.name} (Destroyed)`; // Update title
        } else {
          item.disabled = false;
          item.title = `${obj.name} (${obj.type})`; // Reset title if not destroyed
        }
        // --- End status check ---

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
        // --- End existing item creation logic ---

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

  private attemptLinkToEnginePanel(): void {
    // Clear previous state
    this.unsubscribeLinkedPanelState?.();
    this.unsubscribeLinkedPanelState = null;
    this.linkedEnginePanel = null;
    this.updateHighlight(null);
    if (this._linkCheckInterval) clearInterval(this._linkCheckInterval);
    this._linkCheckInterval = null;

    if (!this._engineViewId) {
      console.warn(
        "[FocusControl] Cannot link: engine-view-id attribute is missing or empty."
      );
      return;
    }

    // Try to get panel instance from registry
    const potentialEnginePanel = panelRegistry.getPanelInstance<EnginePanel>(
      this._engineViewId
    );

    // Check for required methods AND the new getter
    if (
      potentialEnginePanel &&
      typeof potentialEnginePanel.subscribeToViewState === "function" &&
      potentialEnginePanel.orbitManager
    ) {
      // Check if orbitManager getter returns a value

      this.linkedEnginePanel = potentialEnginePanel;
      const orbitManager = this.linkedEnginePanel.orbitManager; // Use the getter

      this.linkedEnginePanel.updateViewState({ focusedObjectId: null });

      this.unsubscribeLinkedPanelState =
        this.linkedEnginePanel.subscribeToViewState((viewState) => {
          // 1. Update the UI highlight
          this.updateHighlight(viewState.focusedObjectId);

          if (orbitManager) {
            orbitManager.highlightVisualization(viewState.focusedObjectId);
          } // No else needed due to outer check
        });
      // Trigger initial highlight sync
      const initialState = this.linkedEnginePanel.getViewState();
      this.updateHighlight(initialState.focusedObjectId);

      if (orbitManager) {
        // orbitManager confirmed available
        orbitManager.highlightVisualization(initialState.focusedObjectId);
      }

      // Stop polling if we were
      if (this._linkCheckInterval) {
        clearInterval(this._linkCheckInterval);
        this._linkCheckInterval = null;
      }
    } else {
      // Panel not registered yet, start polling if not already
      if (!this._linkCheckInterval) {
        // Use a longer interval (1000ms instead of 500ms) to reduce performance impact
        this._linkCheckInterval = window.setInterval(() => {
          this.attemptLinkToEnginePanel(); // Retry link
        }, 1000); // Increased poll rate to reduce CPU usage
      }
    }
  }

  /**
   * Calculate camera distance based on object radius and type
   * Uses both scaling factor and percentage from surface based on type
   * With improved handling for large objects like stars
   */
  private calculateCameraDistance(object: CelestialObject): number {
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
      radiusDistance = adjustedRadius * (1 + CAMERA_DISTANCE_SURFACE_PERCENTAGE);
      
      // Ensure minimum distance
      radiusDistance = Math.max(radiusDistance, MINIMUM_CAMERA_DISTANCE);
      
      // For stars specifically, ensure we're never too close
      if (object.type === CelestialType.STAR) {
        radiusDistance = Math.max(radiusDistance, CAMERA_DISTANCES[CelestialType.STAR] ?? 150);
      }
    }

    // Prefer radius-based distance if calculated, otherwise use type fallback, then default
    return radiusDistance ?? typeDistance ?? DEFAULT_CAMERA_DISTANCE;
  }
}

// Define the custom element
customElements.define("focus-control", FocusControl);
