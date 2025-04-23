import TargetIcon from "@fluentui/svg-icons/icons/target_24_regular.svg?raw";
import { celestialObjectsStore } from "@teskooano/core-state";
import { CelestialObject, CelestialStatus } from "@teskooano/data-types";
import { GroupPanelPartInitParameters, IContentRenderer } from "dockview-core";
import { PanelToolbarButtonConfig } from "../../../stores/toolbarStore"; // Import toolbar types
import type { CompositeEnginePanel } from "../../engine/CompositeEnginePanel"; // Import parent panel type
import {
  handleFocusRequest,
  handleFollowRequest,
} from "./FocusControl.interactions";
import {
  populateFocusList,
  updateFocusHighlight,
  updateObjectStatusInList,
} from "./FocusControl.list";
import { template } from "./FocusControl.template.js";

import "./CelestialRow";

/**
 * A custom element panel for Dockview that displays a hierarchical list
 * of celestial objects present in the simulation.
 * Allows users to focus (look at) or follow (track with camera) specific objects.
 * Interacts with the core state stores and the parent engine panel/renderer.
 */
export class FocusControl extends HTMLElement implements IContentRenderer {
  private treeListContainer: HTMLUListElement | null = null;
  private resetButton: HTMLElement | null = null;
  private clearButton: HTMLElement | null = null;

  private _parentPanel: CompositeEnginePanel | null = null; // Store parent panel instance

  private _currentFocusedId: string | null = null;
  private _currentFollowedId: string | null = null; // Added state for following

  // Event Handlers
  private _handleObjectsLoaded: () => void;
  private _handleObjectDestroyed: () => void;
  private _handleRendererFocusChange: (event: Event) => void;
  private _handleObjectStatusChanged: (event: Event) => void;
  private _handleInfluencesChanged: () => void;
  private _handleTreeInteraction: (event: Event) => void; // Combined tree handler

  // Store subscription for automatic updates
  private _celestialObjectsUnsubscribe: (() => void) | null = null;
  private _previousObjectsState: Record<string, CelestialObject> = {};

  // --- Static Configuration ---
  /** Unique identifier for registering this component with Dockview. */
  public static readonly componentName = "focus-control";

  /**
   * Generates the configuration required to add a button for this panel
   * to the EngineToolbar.
   * @returns {PanelToolbarButtonConfig} Configuration object for the toolbar button.
   */
  public static registerToolbarButtonConfig(): PanelToolbarButtonConfig {
    return {
      id: "focus_control", // Base ID
      iconSvg: TargetIcon,
      title: "Focus Control",
      type: "panel",
      componentName: this.componentName,
      panelTitle: "Focus Control",
      behaviour: "toggle",
      initialPosition: {
        top: 150,
        left: 50,
        width: 400,
        height: 650,
      },
    };
  }
  // --- End Static Configuration ---

  /**
   * Creates an instance of FocusControl.
   * Sets up the shadow DOM and binds event handlers.
   */
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));

    // Bind event handlers
    this._handleObjectsLoaded = this._populateListInternal.bind(this);
    this._handleObjectDestroyed = this._populateListInternal.bind(this);
    this._handleRendererFocusChange = (event: Event): void => {
      const customEvent = event as CustomEvent<{
        focusedObjectId: string | null;
      }>;
      // Renderer focus change updates our highlight state
      this._updateHighlightInternal(
        customEvent.detail?.focusedObjectId ?? null,
      );
    };
    this._handleObjectStatusChanged = (event: Event): void => {
      const customEvent = event as CustomEvent<{
        objectId: string;
        status: CelestialStatus;
      }>;
      if (customEvent.detail) {
        this._updateObjectStatusInternal(
          customEvent.detail.objectId,
          customEvent.detail.status,
        );
      }
    };
    this._handleInfluencesChanged = this._populateListInternal.bind(this);
    this._handleTreeInteraction = this.handleTreeInteraction.bind(this); // Bind combined handler
  }

  /**
   * Called when the element is added to the document's DOM.
   * Gets references to internal elements, adds event listeners,
   * populates the list initially, and subscribes to state changes.
   */
  connectedCallback() {
    this.treeListContainer = this.shadowRoot!.getElementById(
      "focus-tree-list",
    ) as HTMLUListElement;
    this.resetButton = this.shadowRoot!.getElementById("reset-view");
    this.clearButton = this.shadowRoot!.getElementById("clear-focus");

    if (!this.treeListContainer) {
      console.error("[FocusControl] Tree list container not found.");
      return;
    }

    this.addEventListeners();
    this._populateListInternal(); // Initial population

    // Subscribe to store
    this._previousObjectsState = { ...celestialObjectsStore.get() };
    this._celestialObjectsUnsubscribe = celestialObjectsStore.subscribe(
      this.checkForStatusChanges.bind(this),
    );

    // Global event listeners
    document.addEventListener(
      "celestial-objects-loaded",
      this._handleObjectsLoaded,
    );
    document.addEventListener(
      "celestial-object-destroyed",
      this._handleObjectDestroyed,
    );
    document.addEventListener(
      "celestial-object-status-changed",
      this._handleObjectStatusChanged,
    );
    document.addEventListener(
      "celestial-influences-changed",
      this._handleInfluencesChanged,
    );
    document.addEventListener(
      "renderer-focus-changed",
      this._handleRendererFocusChange,
    );
  }

  /**
   * Called when the element is removed from the document's DOM.
   * Removes event listeners and unsubscribes from state changes.
   */
  disconnectedCallback() {
    this.removeEventListeners();
    if (this._celestialObjectsUnsubscribe) {
      this._celestialObjectsUnsubscribe();
      this._celestialObjectsUnsubscribe = null;
    }
  }

  /**
   * Sets the reference to the parent CompositeEnginePanel.
   * Required for interacting with the renderer and camera controls.
   * @param panel - The parent CompositeEnginePanel instance.
   */
  public setParentPanel(panel: CompositeEnginePanel): void {
    this._parentPanel = panel;
  }

  // --- Combined Event Handler for Tree Interactions ---
  /**
   * Handles various user interactions within the tree list:
   * - Toggling expand/collapse carets.
   * - Responding to `focus-request` custom events from CelestialRow.
   * - Responding to `follow-request` custom events from CelestialRow.
   * @param event - The triggering event (e.g., click, focus-request, follow-request).
   * @internal
   */
  private handleTreeInteraction(event: Event): void {
    const target = event.target as HTMLElement;

    // --- Handle Caret Toggle ---
    const caret = target.closest(".caret") as HTMLElement | null;
    if (caret) {
      const parentLi = caret.closest("li");
      const isInactive =
        parentLi?.classList.contains("destroyed") ||
        parentLi?.classList.contains("annihilated");
      if (!isInactive) {
        const nestedList =
          parentLi?.querySelector<HTMLUListElement>(":scope > .nested");
        if (nestedList) {
          const isExpanded = nestedList.classList.toggle("active");
          caret.classList.toggle("caret-down", isExpanded);
          caret.setAttribute("aria-expanded", isExpanded.toString());
        }
      }
      return; // Stop further processing if caret was clicked
    }

    // --- Handle Custom Events from CelestialRow ---
    if (event.type === "focus-request" || event.type === "follow-request") {
      const customEvent = event as CustomEvent<{ objectId: string }>;
      const objectId = customEvent.detail?.objectId;
      if (!objectId) return;

      // Double-check state (might be redundant if row checks inactive)
      const currentObjects = celestialObjectsStore.get();
      const currentObject = currentObjects[objectId];
      if (
        !currentObject ||
        currentObject.status === CelestialStatus.DESTROYED ||
        currentObject.status === CelestialStatus.ANNIHILATED
      ) {
        console.warn(
          `[FocusControl] ${event.type} ignored for inactive object ${objectId}.`,
        );
        return;
      }

      if (event.type === "focus-request") {
        console.debug(
          `[FocusControl] Focus requested via row event for: ${objectId}`,
        );
        // Call the internal wrapper method
        this.requestFocus(objectId);
      } else if (event.type === "follow-request") {
        console.debug(
          `[FocusControl] Follow requested via row event for: ${objectId}`,
        );
        // Call the internal wrapper method
        this.requestFollow(objectId);
      }
    }
  }

  // --- Focus Request Logic (Wrapper) ---
  /**
   * Requests the parent renderer to point the camera towards a specific object.
   * Delegates the core logic to `handleFocusRequest`.
   * @param objectId - The ID of the celestial object to focus on.
   * @internal
   */
  private requestFocus(objectId: string): void {
    const success = handleFocusRequest(
      this._parentPanel,
      objectId,
      this.dispatchEvent.bind(this), // Pass dispatchEvent for the callback
    );
    if (success) {
      // Focus initiated successfully by the handler
      // Highlight update is driven by the 'renderer-focus-changed' event
      // or potentially the parent panel's updateViewState call within the handler.
    } else {
      console.warn(`[FocusControl] handleFocusRequest failed for ${objectId}`);
    }
  }

  // --- Follow Request Logic (Wrapper) ---
  /**
   * Requests the parent renderer to move the camera to track a specific object.
   * Delegates the core logic to `handleFollowRequest`.
   * Updates internal state and visual indicators upon successful initiation.
   * @param objectId - The ID of the celestial object to follow.
   * @internal
   */
  private requestFollow(objectId: string): void {
    const success = handleFollowRequest(this._parentPanel, objectId);

    if (success) {
      // Update internal state AFTER successfully telling renderer via handler
      this._currentFollowedId = objectId;

      // Add visual indicator to the row
      const row = this.treeListContainer?.querySelector(
        `celestial-row[object-id="${objectId}"]`,
      );
      // Clear previous following indicators
      this.treeListContainer
        ?.querySelectorAll(`celestial-row[following]`)
        .forEach((el) => el.removeAttribute("following"));
      row?.toggleAttribute("following", true); // Set attribute on the newly followed row
    } else {
      console.warn(`[FocusControl] handleFollowRequest failed for ${objectId}`);
      // Maybe clear follow state if it failed?
      // this._currentFollowedId = null;
      // this.treeListContainer?.querySelectorAll(`celestial-row[following]`) ... remove attribute
    }
  }

  /**
   * Focuses the camera on a random, active (not destroyed/annihilated) celestial object
   * from the list by simulating a click on its focus button.
   * Used for demonstration or testing purposes.
   */
  public tourFocus = (): void => {
    if (!this.treeListContainer) return;
    // Find active, non-inactive rows
    const activeRows = Array.from(
      this.treeListContainer.querySelectorAll<HTMLElement>(
        "celestial-row:not([inactive])",
      ),
    );
    if (activeRows.length === 0) {
      console.warn("[FocusControl] No active rows found for tour focus");
      return;
    }
    const randomRow = activeRows[Math.floor(Math.random() * activeRows.length)];
    const objectId = randomRow.getAttribute("object-id");
    if (objectId) {
      // Simulate clicking the focus button on the row
      const focusBtn = randomRow.shadowRoot?.getElementById("focus-btn");
      focusBtn?.click(); // Trigger the row's internal focus handler
    }
  };

  /**
   * Retrieves the ID of a random, active celestial object from the store.
   * @returns {[string | null, string | null]} A tuple containing the object ID (or null if none found) and null (placeholder for potential parent ID).
   * @internal Could be made public if needed for external testing/dev tools.
   */
  public getRandomActiveObjectId = (): [string | null, string | null] => {
    const objects = celestialObjectsStore.get();
    const activeObjects = Object.values(objects).filter(
      (obj) =>
        obj.status !== CelestialStatus.DESTROYED &&
        obj.status !== CelestialStatus.ANNIHILATED,
    );
    if (activeObjects.length === 0) {
      console.warn("[FocusControl] No active objects available");
      return [null, null];
    }
    const randomObject =
      activeObjects[Math.floor(Math.random() * activeObjects.length)];
    return [randomObject.id, null];
  };

  /**
   * Public method to trigger focusing on an object.
   * Primarily used for external calls (e.g., from other panels or dev tools).
   * Internally, UI interactions use `requestFocus` directly or via events.
   * @param objectId - The ID of the object to focus on.
   * @returns {boolean} Currently always returns true, indicating the request was made.
   * @deprecated Consider using direct UI interaction simulation or internal methods if calling from within the component scope.
   */
  public publicFocusOnObject = (objectId: string): boolean => {
    // Just call the main requestFocus method
    this.requestFocus(objectId);
    // Return true/false based on whether focus actually happened?
    // For now, assume it was requested successfully.
    return true;
  };

  /**
   * Adds necessary event listeners for the component.
   * Listens for clicks on reset/clear buttons and interactions within the tree list container.
   * @internal
   */
  private addEventListeners(): void {
    // Add listeners to Reset/Clear buttons
    this.resetButton?.addEventListener("click", () =>
      this._parentPanel?.resetCameraView(),
    );
    this.clearButton?.addEventListener("click", () =>
      this._parentPanel?.clearFocus(),
    );

    // Add the single interaction listener to the container
    if (this.treeListContainer) {
      // Listen for both standard clicks (for carets) and custom events from rows
      this.treeListContainer.addEventListener(
        "click",
        this._handleTreeInteraction,
      );
      this.treeListContainer.addEventListener(
        "focus-request",
        this._handleTreeInteraction,
      );
      this.treeListContainer.addEventListener(
        "follow-request",
        this._handleTreeInteraction,
      );
    }
  }

  /**
   * Removes event listeners added by `addEventListeners`.
   * Also removes global listeners added during `connectedCallback`.
   * @internal
   */
  private removeEventListeners(): void {
    // Remove interaction listeners
    if (this.treeListContainer) {
      this.treeListContainer.removeEventListener(
        "click",
        this._handleTreeInteraction,
      );
      this.treeListContainer.removeEventListener(
        "focus-request",
        this._handleTreeInteraction,
      );
      this.treeListContainer.removeEventListener(
        "follow-request",
        this._handleTreeInteraction,
      );
    }
    // Remove global listeners
    document.removeEventListener(
      "celestial-objects-loaded",
      this._handleObjectsLoaded,
    );
    document.removeEventListener(
      "celestial-object-destroyed",
      this._handleObjectDestroyed,
    );
    document.removeEventListener(
      "celestial-object-status-changed",
      this._handleObjectStatusChanged,
    );
    document.removeEventListener(
      "celestial-influences-changed",
      this._handleInfluencesChanged,
    );
    document.removeEventListener(
      "renderer-focus-changed",
      this._handleRendererFocusChange,
    );
  }

  /**
   * Populates the tree list display with celestial objects from the store.
   * Delegates the actual DOM manipulation to `populateFocusList`.
   * @internal
   */
  private _populateListInternal = (): void => {
    if (!this.treeListContainer) return;
    const objects = celestialObjectsStore.get();
    populateFocusList(
      this.treeListContainer,
      objects,
      this._currentFocusedId, // Pass current focus ID for initial render
    );
  };

  /**
   * Updates the visual highlighting in the list to reflect the currently focused object.
   * Delegates the DOM manipulation to `updateFocusHighlight`.
   * Expands parent nodes if a child node becomes focused.
   * @param focusedId - The ID of the object currently focused by the renderer, or null.
   * @internal
   */
  private _updateHighlightInternal(focusedId: string | null): void {
    if (!this.treeListContainer) return;
    // Update internal state ONLY if it changed
    if (this._currentFocusedId === focusedId) return;
    this._currentFocusedId = focusedId;

    // Update the visual highlight in the list
    updateFocusHighlight(this.treeListContainer, this._currentFocusedId);

    // Expand parents if a child is focused
    if (focusedId) {
      let elementToReveal = this.treeListContainer.querySelector<HTMLElement>(
        `celestial-row[object-id="${focusedId}"]`,
      );
      let parentLi = elementToReveal?.closest("li");
      while (parentLi) {
        const parentUl = parentLi.parentElement;
        if (
          parentUl &&
          parentUl.classList.contains("nested") &&
          !parentUl.classList.contains("active")
        ) {
          parentUl.classList.add("active");
          const parentLiOfUl = parentUl.closest("li");
          const caret = parentLiOfUl?.querySelector<HTMLElement>(
            ":scope > .list-item-content > .caret",
          );
          if (caret) {
            caret.classList.add("caret-down");
            caret.setAttribute("aria-expanded", "true");
          }
        }
        parentLi = parentUl?.closest("li"); // Move up the tree
      }
    }
  }

  /**
   * Updates the status display (e.g., inactive, annihilated) of a specific object in the list.
   * Delegates DOM manipulation to `updateObjectStatusInList`.
   * If the updated object was the currently focused or followed one, clears the focus/follow state.
   * May trigger a full list refresh if hierarchy changes.
   * @param objectId - The ID of the object whose status changed.
   * @param status - The new status of the object.
   * @internal
   */
  private _updateObjectStatusInternal(
    objectId: string,
    status: CelestialStatus,
  ): void {
    if (!this.treeListContainer) return;
    const needsFullRefresh = updateObjectStatusInList(
      this.treeListContainer,
      objectId,
      status,
    );
    if (needsFullRefresh) {
      this._populateListInternal();
    } else {
      const isInactive =
        status === CelestialStatus.DESTROYED ||
        status === CelestialStatus.ANNIHILATED;
      if (isInactive && this._currentFocusedId === objectId) {
        this._parentPanel?.clearFocus(); // Clear parent focus if the focused item becomes inactive
      }
      // If the *followed* item becomes inactive, stop following
      if (isInactive && this._currentFollowedId === objectId) {
        // TODO: Tell renderer to stop following
        console.log(
          `[FocusControl] Stopping follow for inactive object ${objectId}`,
        );
        this._currentFollowedId = null;
        // Remove visual indicator?
        const row = this.treeListContainer?.querySelector(
          `celestial-row[object-id="${objectId}"]`,
        );
        row?.removeAttribute("following");
      }
    }
  }

  /**
   * Callback for the celestial objects store subscription.
   * Compares the current state with the previous state to detect status or hierarchy changes.
   * Triggers appropriate updates (`_updateObjectStatusInternal` or `_populateListInternal`).
   * @param currentObjects - The latest state from the celestialObjectsStore.
   * @internal
   */
  private checkForStatusChanges = (
    currentObjects: Record<string, CelestialObject>,
  ): void => {
    if (Object.keys(this._previousObjectsState).length === 0) {
      this._previousObjectsState = { ...currentObjects };
      return;
    }
    let needsListUpdate = false;
    Object.entries(currentObjects).forEach(([id, obj]) => {
      const prevObj = this._previousObjectsState[id];
      if (!prevObj)
        needsListUpdate = true; // New object
      else if (prevObj.status !== obj.status)
        this._updateObjectStatusInternal(id, obj.status);
      else if (prevObj.currentParentId !== obj.currentParentId)
        needsListUpdate = true; // Hierarchy change
      // Check for other potential changes that might require a refresh if needed
    });
    Object.keys(this._previousObjectsState).forEach((id) => {
      if (!currentObjects[id]) needsListUpdate = true; // Removed object
    });
    this._previousObjectsState = { ...currentObjects };
    if (needsListUpdate) this._populateListInternal();
  };

  // --- Dockview Required Methods ---
  /**
   * Initializes the panel when added to Dockview.
   * Extracts the parent `CompositeEnginePanel` instance from the parameters.
   * @param parameters - Initialization parameters provided by Dockview.
   */
  public init(parameters: GroupPanelPartInitParameters): void {
    const params = parameters.params as {
      parentInstance?: CompositeEnginePanel;
    };
    if (
      params?.parentInstance &&
      typeof params.parentInstance === "object" && // More robust check
      typeof (params.parentInstance as any).focusOnObject === "function" // Check method existence
    ) {
      this.setParentPanel(params.parentInstance);
    } else {
      console.error(
        "[FocusControl] Initialization parameters did not include a valid 'parentInstance'. Cannot link to parent.",
      );
    }
  }

  /**
   * Required by Dockview's IContentRenderer interface.
   * Returns the root HTML element of this component.
   */
  get element(): HTMLElement {
    return this;
  }
  // --- End Dockview Required Methods ---
}

customElements.define("focus-control", FocusControl);
