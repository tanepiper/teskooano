import TargetIcon from "@fluentui/svg-icons/icons/target_24_regular.svg?raw";
import { celestialObjects$, getCelestialObjects } from "@teskooano/core-state";
import { CelestialObject, CelestialStatus } from "@teskooano/data-types";
import { GroupPanelPartInitParameters, IContentRenderer } from "dockview-core";
import type { CompositeEnginePanel } from "../engine-panel/panels/CompositeEnginePanel.js";
import {
  handleFocusRequest,
  handleFollowRequest,
} from "./FocusControl.interactions.js";
import {
  populateFocusList,
  updateFocusHighlight,
  updateObjectStatusInList,
} from "./FocusControl.list.js";
import { template } from "./FocusControl.template.js";

import "./CelestialRow.js";
import { PanelToolbarItemConfig } from "@teskooano/ui-plugin";
import { Subscription } from "rxjs";
import { CameraManager } from "../camera-manager/CameraManager.js";
import type { CameraManagerState } from "../camera-manager/types.js";

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

  private _parentPanel: CompositeEnginePanel | null = null;

  private _currentFocusedId: string | null = null;
  private _currentFollowedId: string | null = null;

  private _handleObjectsLoaded: () => void;
  private _handleObjectDestroyed: () => void;
  private _handleObjectStatusChanged: (event: Event) => void;
  private _handleInfluencesChanged: () => void;
  private _handleTreeInteraction: (event: Event) => void;

  private _celestialObjectsUnsubscribe: Subscription | null = null;
  private _cameraStateSubscription: Subscription | null = null;
  private _previousObjectsState: Record<string, CelestialObject> = {};

  /** Unique identifier for registering this component with Dockview. */
  public static readonly componentName = "focus-control";

  /**
   * Generates the configuration required to add a button for this panel
   * to the EngineToolbar.
   * @returns {PanelToolbarButtonConfig} Configuration object for the toolbar button.
   */
  public static registerToolbarButtonConfig(): PanelToolbarItemConfig {
    return {
      id: "focus_control",
      target: "engine-toolbar",
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

  /**
   * Creates an instance of FocusControl.
   * Sets up the shadow DOM and binds event handlers.
   */
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));

    this._handleObjectsLoaded = this._populateListInternal.bind(this);
    this._handleObjectDestroyed = this._populateListInternal.bind(this);
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
    this._handleTreeInteraction = this.handleTreeInteraction.bind(this);
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
    this._populateListInternal();

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
  }

  /**
   * Sets the reference to the parent CompositeEnginePanel.
   * Required for interacting with the renderer and camera controls.
   * @param panel - The parent CompositeEnginePanel instance.
   */
  public setParentPanel(panel: CompositeEnginePanel): void {
    this._parentPanel = panel;
    if (this._parentPanel && this._parentPanel.cameraManager) {
      this._cameraStateSubscription?.unsubscribe();

      this._cameraStateSubscription = this._parentPanel.cameraManager
        .getCameraState$()
        .subscribe((state: CameraManagerState) => {
          this._updateHighlightInternal(state.focusedObjectId);
        });
      const initialState = this._parentPanel.cameraManager
        .getCameraState$()
        .getValue();
      this._updateHighlightInternal(initialState.focusedObjectId);
    } else {
      console.warn(
        "[FocusControl] Parent panel or its CameraManager not available on setParentPanel.",
      );
      this._cameraStateSubscription?.unsubscribe();
      this._cameraStateSubscription = null;
    }
  }

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
      return;
    }

    if (event.type === "focus-request" || event.type === "follow-request") {
      const customEvent = event as CustomEvent<{ objectId: string }>;
      const objectId = customEvent.detail?.objectId;
      if (!objectId) return;

      const currentObjects = getCelestialObjects();
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

        this.requestFocus(objectId);
      } else if (event.type === "follow-request") {
        console.debug(
          `[FocusControl] Follow requested via row event for: ${objectId}`,
        );

        this.requestFollow(objectId);
      }
    }
  }

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
      this.dispatchEvent.bind(this),
    );
    if (success) {
    } else {
      console.warn(`[FocusControl] handleFocusRequest failed for ${objectId}`);
    }
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

      const row = this.treeListContainer?.querySelector(
        `celestial-row[object-id="${objectId}"]`,
      );

      this.treeListContainer
        ?.querySelectorAll(`celestial-row[following]`)
        .forEach((el) => el.removeAttribute("following"));
      row?.toggleAttribute("following", true);
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
    // this.resetView(); // Consider if reset is needed before public follow
    return this.requestFollow(objectId);
  };

  /**
   * Adds necessary event listeners for the component.
   * Listens for clicks on reset/clear buttons and interactions within the tree list container.
   * @internal
   */
  private addEventListeners(): void {
    this.resetButton?.addEventListener("click", () =>
      this._parentPanel?.resetCameraView(),
    );
    this.clearButton?.addEventListener("click", () =>
      this._parentPanel?.clearFocus(),
    );

    if (this.treeListContainer) {
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
   * Populates the tree list display with celestial objects from the store.
   * Delegates the actual DOM manipulation to `populateFocusList`.
   * @internal
   */
  private _populateListInternal = (): void => {
    if (!this.treeListContainer) return;
    const objects = getCelestialObjects();
    populateFocusList(this.treeListContainer, objects, this._currentFocusedId);
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

    if (this._currentFocusedId === focusedId) return;
    this._currentFocusedId = focusedId;

    updateFocusHighlight(this.treeListContainer, this._currentFocusedId);

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
        parentLi = parentUl?.closest("li");
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
        this._parentPanel?.clearFocus();
      }

      if (isInactive && this._currentFollowedId === objectId) {
        this._currentFollowedId = null;

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
      if (!prevObj) needsListUpdate = true;
      else if (prevObj.status !== obj.status)
        this._updateObjectStatusInternal(id, obj.status);
      else if (prevObj.currentParentId !== obj.currentParentId)
        needsListUpdate = true;
    });
    Object.keys(this._previousObjectsState).forEach((id) => {
      if (!currentObjects[id]) needsListUpdate = true;
    });
    this._previousObjectsState = { ...currentObjects };
    if (needsListUpdate) this._populateListInternal();
  };

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
      typeof params.parentInstance === "object" &&
      typeof (params.parentInstance as any).focusOnObject === "function"
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
}

customElements.define("focus-control", FocusControl);
