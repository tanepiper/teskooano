import TargetIcon from "@fluentui/svg-icons/icons/target_24_regular.svg?raw";
import { celestialObjects$, getCelestialObjects } from "@teskooano/core-state";
import {
  CelestialObject,
  CelestialStatus,
  CustomEvents,
} from "@teskooano/data-types";
import { GroupPanelPartInitParameters, IContentRenderer } from "dockview-core";
import type { CompositeEnginePanel } from "../engine-panel/panels/CompositeEnginePanel.js";
import {
  handleMoveToRequest,
  handleLookAtRequest,
  handleFollowRequest,
} from "./CelestialControls.interactions.js";
import { template } from "./CelestialControls.template.js";
import { StarDestructionHandler } from "./utils/star-destruction-handler.js";

import { PanelToolbarItemConfig } from "@teskooano/ui-plugin";
import { Subscription } from "rxjs";
import type { CameraManagerState } from "../camera-manager/types.js";
import "./components/destroyed-objects-list.js";
import type { DestroyedObjectsList } from "./components/destroyed-objects-list.js";
import "./components/focus-tree-list.js";
import type { FocusTreeList } from "./components/focus-tree-list.js";

/**
 * A custom element panel for Dockview that displays a hierarchical list
 * of celestial objects present in the simulation.
 * Allows users to focus (look at) or follow (track with camera) specific objects.
 * Interacts with the core state stores and the parent engine panel/renderer.
 */
export class CelestialControls extends HTMLElement implements IContentRenderer {
  private focusTreeList: FocusTreeList | null = null;
  private destroyedObjectsList: DestroyedObjectsList | null = null;
  private resetButton: HTMLElement | null = null;
  private clearButton: HTMLElement | null = null;
  private activeCountElement: HTMLElement | null = null;
  private destroyedCountElement: HTMLElement | null = null;

  private _parentPanel: CompositeEnginePanel | null = null;

  private _currentFocusedId: string | null = null;
  private _currentFollowedId: string | null = null;

  private _handleObjectsLoaded: () => void;
  private _handleObjectDestroyed: (event: Event) => void;
  private _handleObjectStatusChanged: (event: Event) => void;
  private _handleInfluencesChanged: () => void;
  private _handleMoveToRequest: (event: Event) => void;
  private _handleLookAtRequest: (event: Event) => void;
  private _handleFollowRequest: (event: Event) => void;

  private _celestialObjectsUnsubscribe: Subscription | null = null;
  private _cameraStateSubscription: Subscription | null = null;
  private _previousObjectsState: Record<string, CelestialObject> = {};

  /** Unique identifier for registering this component with Dockview. */
  public static readonly componentName = "teskooano-celestial-controls";

  /**
   * Generates the configuration required to add a button for this panel
   * to the EngineToolbar.
   * @returns {PanelToolbarButtonConfig} Configuration object for the toolbar button.
   */
  public static registerToolbarButtonConfig(): PanelToolbarItemConfig {
    return {
      id: "celestial_controls",
      target: "engine-toolbar",
      iconSvg: TargetIcon,
      title: "Celestial Controls",
      type: "panel",
      componentName: this.componentName,
      panelTitle: "Celestial Controls",
      behaviour: "toggle",
      initialPosition: {
        top: 150,
        left: 50,
        width: 400,
        height: 650,
      },
    };
  }

  /**
   * Creates an instance of FocusControl.
   * Sets up the shadow DOM and binds event handlers.
   */
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));

    this._handleObjectsLoaded = () => {
      const objects = getCelestialObjects();
      // If there are no objects, clear the destroyed list too (system was cleared)
      if (Object.keys(objects).length === 0) {
        this.destroyedObjectsList?.clear();
      }
      this._updateLists();
    };
    this._handleObjectDestroyed = this._handleStarDestructionEvent.bind(this);
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
    this._handleInfluencesChanged = this._updateLists.bind(this);

    this._handleMoveToRequest = (event: Event) => {
      const customEvent = event as CustomEvent<{ objectId: string }>;
      if (customEvent.detail?.objectId) {
        this.requestMoveTo(customEvent.detail.objectId);
      }
    };

    this._handleLookAtRequest = (event: Event) => {
      const customEvent = event as CustomEvent<{ objectId: string }>;
      if (customEvent.detail?.objectId) {
        this.requestLookAt(customEvent.detail.objectId);
      }
    };

    this._handleFollowRequest = (event: Event) => {
      const customEvent = event as CustomEvent<{ objectId: string }>;
      if (customEvent.detail?.objectId) {
        this.requestFollow(customEvent.detail.objectId);
      }
    };
  }

  /**
   * Called when the element is added to the document's DOM.
   * Gets references to internal elements, adds event listeners,
   * populates the list initially, and subscribes to state changes.
   */
  connectedCallback() {
    // Prevent multiple initializations
    if (this.focusTreeList || this.destroyedObjectsList) {
      console.warn(
        "[FocusControl] Already initialized, skipping connectedCallback",
      );
      return;
    }

    // Get references to containers
    const activeListContainer = this.shadowRoot!.getElementById(
      "active-list-container",
    );
    const destroyedListContainer = this.shadowRoot!.getElementById(
      "destroyed-list-container",
    );

    // Check if components already exist to prevent duplicates
    if (activeListContainer) {
      // Remove any existing focus-tree-list components
      const existingTreeList =
        activeListContainer.querySelector("focus-tree-list");
      if (existingTreeList) {
        existingTreeList.remove();
      }

      this.focusTreeList = document.createElement(
        "focus-tree-list",
      ) as FocusTreeList;
      activeListContainer.appendChild(this.focusTreeList);
    }

    if (destroyedListContainer) {
      // Remove any existing destroyed-objects-list components
      const existingDestroyedList = destroyedListContainer.querySelector(
        "destroyed-objects-list",
      );
      if (existingDestroyedList) {
        existingDestroyedList.remove();
      }

      this.destroyedObjectsList = document.createElement(
        "destroyed-objects-list",
      ) as DestroyedObjectsList;
      destroyedListContainer.appendChild(this.destroyedObjectsList);
    }

    this.resetButton = this.shadowRoot!.getElementById("reset-view");
    this.clearButton = this.shadowRoot!.getElementById("clear-focus");
    this.activeCountElement = this.shadowRoot!.getElementById("active-count");
    this.destroyedCountElement =
      this.shadowRoot!.getElementById("destroyed-count");

    if (!this.focusTreeList || !this.destroyedObjectsList) {
      console.error("[FocusControl] Failed to create web components.");
      return;
    }

    this.addEventListeners();
    this._updateLists();

    this._previousObjectsState = { ...getCelestialObjects() };
    this._celestialObjectsUnsubscribe = celestialObjects$.subscribe(
      this.checkForStatusChanges.bind(this),
    );

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
  }

  /**
   * Called when the element is removed from the document's DOM.
   * Removes event listeners and unsubscribes from state changes.
   */
  disconnectedCallback() {
    this.removeEventListeners();
    if (this._celestialObjectsUnsubscribe) {
      this._celestialObjectsUnsubscribe.unsubscribe();
      this._celestialObjectsUnsubscribe = null;
    }
    if (this._cameraStateSubscription) {
      this._cameraStateSubscription.unsubscribe();
      this._cameraStateSubscription = null;
    }

    // Clean up components
    this.focusTreeList?.remove();
    this.destroyedObjectsList?.remove();
    this.focusTreeList = null;
    this.destroyedObjectsList = null;
  }

  /**
   * Sets the reference to the parent CompositeEnginePanel.
   * Required for interacting with the renderer and camera controls.
   * @param panel - The parent CompositeEnginePanel instance.
   */
  public setParentPanel(panel: CompositeEnginePanel): void {
    this._parentPanel = panel;
    if (this._parentPanel && this._parentPanel.engineCameraManager) {
      this._cameraStateSubscription?.unsubscribe();

      this._cameraStateSubscription = this._parentPanel.engineCameraManager
        .getCameraState$()
        .subscribe((state: CameraManagerState) => {
          this._updateHighlightInternal(state.focusedObjectId);
        });
      const initialState = this._parentPanel.engineCameraManager
        .getCameraState$()
        .getValue();
      this._updateHighlightInternal(initialState.focusedObjectId);
    } else {
      console.warn(
        "[FocusControl] Parent panel or its EngineCameraManager not available on setParentPanel.",
      );
      this._cameraStateSubscription?.unsubscribe();
      this._cameraStateSubscription = null;
    }
  }

  /**
   * Requests the parent renderer to point the camera towards a specific object.
   * Delegates the core logic to `handleMoveToRequest`.
   * @param objectId - The ID of the celestial object to focus on.
   * @internal
   */
  private requestMoveTo(objectId: string): void {
    const success = handleMoveToRequest(
      this._parentPanel,
      objectId,
      (event: CustomEvent) => this.dispatchEvent(event),
    );
    if (!success) {
      console.warn(`[CelestialControls] requestMoveTo failed for ${objectId}`);
    }
    // Visual highlighting is managed by camera state subscription (_updateHighlightInternal)
  }

  /**
   * Initiates a "Look At" camera action for the specified object.
   * The camera pivots to look at the object from its current position.
   * @param objectId - The ID of the celestial object to look at.
   */
  private requestLookAt(objectId: string): void {
    const success = handleLookAtRequest(
      this._parentPanel,
      objectId,
      // No dispatchEventCallback needed as handleLookAtRequest is instantaneous and doesn't dispatch its own sub-events here
    );
    if (!success) {
      console.warn(`[CelestialControls] requestLookAt failed for ${objectId}`);
    }
    // Visual highlighting related to CameraManager's focusedObjectId will be handled by _updateHighlightInternal
  }

  /**
   * Requests the parent renderer to move the camera to track a specific object.
   * Delegates the core logic to `handleFollowRequest`.
   * Updates internal state and visual indicators upon successful initiation.
   * @param objectId - The ID of the celestial object to follow.
   * @internal
   */
  private requestFollow(objectId: string): boolean {
    const success = handleFollowRequest(this._parentPanel, objectId);

    if (success) {
      this._currentFollowedId = objectId;
      // Following visual state could be handled by the FocusTreeList component
    } else {
      console.warn(`[FocusControl] handleFollowRequest failed for ${objectId}`);
    }
    return success;
  }

  /**
   * Initiates a request to follow a specific celestial object.
   * @param objectId - The ID of the celestial object to follow.
   * @returns {boolean} True if the follow request was successfully initiated, false otherwise.
   */
  public publicFollowObject = (objectId: string): boolean => {
    if (!objectId) {
      console.warn(
        "[FocusControl] publicFollowObject called with no objectId.",
      );
      return false;
    }
    console.debug(
      `[FocusControl] Public follow object called for: ${objectId}`,
    );
    return this.requestFollow(objectId);
  };

  /**
   * Adds necessary event listeners for the component.
   * Listens for clicks on reset/clear buttons and interactions within the tree list container.
   * @internal
   */
  private addEventListeners(): void {
    this.resetButton?.addEventListener("click", () =>
      this._parentPanel?.engineCameraManager?.resetCameraView(),
    );
    this.clearButton?.addEventListener("click", () =>
      this._parentPanel?.engineCameraManager?.followCelestial(null),
    );

    if (this.focusTreeList) {
      this.focusTreeList.addEventListener(
        CustomEvents.MOVE_TO_REQUEST as keyof HTMLElementEventMap,
        this._handleMoveToRequest as EventListener,
      );
      this.focusTreeList.addEventListener(
        CustomEvents.LOOK_AT_REQUEST as keyof HTMLElementEventMap,
        this._handleLookAtRequest as EventListener,
      );
      this.focusTreeList.addEventListener(
        CustomEvents.FOLLOW_REQUEST as keyof HTMLElementEventMap,
        this._handleFollowRequest as EventListener,
      );
    }
  }

  /**
   * Removes event listeners added by `addEventListeners`.
   * Also removes global listeners added during `connectedCallback`.
   * @internal
   */
  private removeEventListeners(): void {
    this.resetButton?.removeEventListener("click", () =>
      this._parentPanel?.engineCameraManager?.resetCameraView(),
    );
    this.clearButton?.removeEventListener("click", () =>
      this._parentPanel?.engineCameraManager?.followCelestial(null),
    );

    if (this.focusTreeList) {
      this.focusTreeList.removeEventListener(
        CustomEvents.MOVE_TO_REQUEST as keyof HTMLElementEventMap,
        this._handleMoveToRequest as EventListener,
      );
      this.focusTreeList.removeEventListener(
        CustomEvents.LOOK_AT_REQUEST as keyof HTMLElementEventMap,
        this._handleLookAtRequest as EventListener,
      );
      this.focusTreeList.removeEventListener(
        CustomEvents.FOLLOW_REQUEST as keyof HTMLElementEventMap,
        this._handleFollowRequest as EventListener,
      );
    }

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
  }

  /**
   * Updates both the active and destroyed object lists
   * @internal
   */
  private _updateLists = (): void => {
    const objects = getCelestialObjects();
    const currentTime = Date.now() / 1000; // Convert to seconds

    // Update active objects in the tree
    if (this.focusTreeList) {
      const activeCount = this.focusTreeList.updateObjects(objects);
      if (this.activeCountElement) {
        this.activeCountElement.textContent = `(${activeCount})`;
      }
    }

    // Update destroyed objects list
    if (this.destroyedObjectsList) {
      this.destroyedObjectsList.updateDestroyedObjects(objects, currentTime);
      if (this.destroyedCountElement) {
        this.destroyedCountElement.textContent = `(${this.destroyedObjectsList.destroyedCount})`;
      }
    }
  };

  /**
   * Updates the visual highlighting in the list to reflect the currently focused object.
   * Delegates the DOM manipulation to the FocusTreeList component.
   * @param focusedId - The ID of the object currently focused by the renderer, or null.
   * @internal
   */
  private _updateHighlightInternal(focusedId: string | null): void {
    if (!this.focusTreeList) return;

    if (this._currentFocusedId === focusedId) return;
    this._currentFocusedId = focusedId;

    this.focusTreeList.setFocusedObject(focusedId);
  }

  /**
   * Updates the status of a specific object in the list.
   * Handles objects that are destroyed or annihilated.
   * @param objectId - The ID of the object whose status changed.
   * @param status - The new status of the object.
   * @internal
   */
  private _updateObjectStatusInternal(
    objectId: string,
    status: CelestialStatus,
  ): void {
    if (!this.focusTreeList) return;

    const isInactive =
      status === CelestialStatus.DESTROYED ||
      status === CelestialStatus.ANNIHILATED;

    if (isInactive) {
      // Update status in the active tree (it will be filtered out on next full update)
      this.focusTreeList.updateObjectStatus(objectId, status);
    }

    // Always refresh the lists
    this._updateLists();
  }

  /**
   * Callback for the celestial objects store subscription.
   * Compares the current state with the previous state to detect status or hierarchy changes.
   * Triggers appropriate updates (`_updateObjectStatusInternal` or `_updateLists`).
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
      if (!prevObj) {
        needsListUpdate = true;
      } else if (prevObj.status !== obj.status) {
        this._updateObjectStatusInternal(id, obj.status);
        needsListUpdate = true; // Always update list when status changes
      } else if (prevObj.currentParentId !== obj.currentParentId) {
        needsListUpdate = true;
      }
    });
    Object.keys(this._previousObjectsState).forEach((id) => {
      if (!currentObjects[id]) needsListUpdate = true;
    });
    this._previousObjectsState = { ...currentObjects };
    if (needsListUpdate) {
      this._updateLists();
    }
  };

  /**
   * Handles star destruction events by detecting when a root star is destroyed,
   * finding the new root star, and updating the UI hierarchy accordingly.
   * @param event - The destruction event
   * @internal
   */
  private _handleStarDestructionEvent = (event: Event): void => {
    const customEvent = event as CustomEvent<{ objectId: string }>;
    const destroyedObjectId = customEvent.detail?.objectId;

    if (!destroyedObjectId) {
      this._updateLists();
      return;
    }

    // Use the new service to handle star destruction logic
    const newRootStar =
      StarDestructionHandler.handleStarDestruction(destroyedObjectId);

    if (newRootStar) {
      console.debug(
        `[FocusControl] New root star identified: ${newRootStar.name} (${newRootStar.id})`,
      );

      // If the destroyed star was being focused or followed, switch to the new root star
      if (this._currentFocusedId === destroyedObjectId) {
        console.debug(
          `[FocusControl] Switching focus from destroyed star to new root star: ${newRootStar.id}`,
        );
        this.requestMoveTo(newRootStar.id);
      }

      if (this._currentFollowedId === destroyedObjectId) {
        console.debug(
          `[FocusControl] Switching follow from destroyed star to new root star: ${newRootStar.id}`,
        );
        this.requestFollow(newRootStar.id);
      }
    } else {
      // Clear focus/follow if they were on the destroyed object
      if (this._currentFocusedId === destroyedObjectId) {
        this._parentPanel?.engineCameraManager?.clearFocus();
      }
      if (this._currentFollowedId === destroyedObjectId) {
        this._currentFollowedId = null;
      }
    }

    // Always rebuild the list to reflect the new hierarchy
    this._updateLists();
  };

  /**
   * Initializes the panel when added to Dockview.
   * Extracts the parent `CompositeEnginePanel` instance from the parameters.
   * @param parameters - Initialization parameters provided by Dockview.
   */
  public init(parameters: GroupPanelPartInitParameters): void {
    const parent = (parameters.params as any)?.parentInstance as
      | CompositeEnginePanel
      | undefined;

    // Check if parentInstance is a CompositeEnginePanel by a stable method like getRenderer
    // and also check for engineCameraManager as its direct camera controls were moved there.
    if (
      parent &&
      typeof parent.getRenderer === "function" &&
      parent.engineCameraManager // Ensure the new manager is also present
    ) {
      this.setParentPanel(parent);
    } else {
      console.error(
        `[FocusControl] Initialization parameters did not include a valid 'parentInstance' (CompositeEnginePanel with an engineCameraManager). Cannot link to parent. Received params:`,
        parameters.params,
      );
      if (
        parent &&
        typeof parent.getRenderer === "function" &&
        !parent.engineCameraManager
      ) {
        console.error(
          `[FocusControl] 'parentInstance' was found and appears to be a CompositeEnginePanel, but 'parentInstance.engineCameraManager' is missing. This is required after recent refactoring.`,
        );
      }
    }
  }

  /**
   * Required by Dockview's IContentRenderer interface.
   * Returns the root HTML element of this component.
   */
  get element(): HTMLElement {
    return this;
  }
}
