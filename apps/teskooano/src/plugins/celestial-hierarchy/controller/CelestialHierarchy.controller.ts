import {
  celestialObjects$,
  getCelestialObjects,
  renderableStore,
  StateSubscriptionMixin,
} from "@teskooano/core-state";
import {
  CelestialObject,
  CelestialStatus,
  CustomEvents,
  METERS_TO_SCENE_UNITS,
} from "@teskooano/data-types";
import type { CompositeEnginePanel } from "../../engine-panel/panels/composite-panel/CompositeEnginePanel.js";
import type { CameraManagerState } from "@teskooano/app-simulation";
import type { CelestialHierarchy } from "../view/CelestialHierarchy.view.js";
import { FocusListManager } from "./FocusListManager.js";
import {
  handleFocusRequest,
  handleFollowRequest,
} from "./focus-interactions.js";
import * as THREE from "three";

/**
 * Controller for the CelestialHierarchy view.
 *
 * This class encapsulates all the business logic for the focus control panel.
 * It manages the list of celestial objects, handles user interactions
 * (focus, follow, expand/collapse), and communicates with the parent
 * engine panel to control the camera.
 */
export class CelestialHierarchyController extends StateSubscriptionMixin {
  private _view: CelestialHierarchy;
  private _treeListContainer: HTMLUListElement;
  private _resetButton: HTMLElement;
  private _clearButton: HTMLElement;

  private _listManager: FocusListManager;

  private _parentPanel: CompositeEnginePanel | null = null;
  private _currentFocusedId: string | null = null;
  private _currentFollowedId: string | null = null;

  private _handleObjectsLoaded: () => void;
  private _handleObjectDestroyed: () => void;
  private _handleObjectStatusChanged: (event: Event) => void;
  private _handleInfluencesChanged: () => void;
  private _handleTreeInteraction: (event: Event) => void;

  private _previousObjectsState: Record<string, CelestialObject> = {};
  private _listUpdateInterval: number | null = null;

  // Special subscription for camera state that has dynamic lifecycle
  private _cameraStateSubscription: any = null;

  /**
   * Creates an instance of CelestialHierarchyController.
   * @param view The CelestialHierarchy view instance this controller manages.
   * @param treeListContainer The UL element that will contain the object tree.
   * @param resetButton The button element to reset the camera view.
   * @param clearButton The button element to clear the camera focus.
   */
  constructor(
    view: CelestialHierarchy,
    treeListContainer: HTMLUListElement,
    resetButton: HTMLElement,
    clearButton: HTMLElement,
  ) {
    super();
    this._view = view;
    this._treeListContainer = treeListContainer;
    this._resetButton = resetButton;
    this._clearButton = clearButton;

    this._listManager = new FocusListManager(this._treeListContainer);

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
   * Initializes the controller.
   * Sets up event listeners and performs the initial population of the object list.
   */
  public initialize(): void {
    this.addEventListeners();
    this._populateListInternal();

    this._previousObjectsState = { ...getCelestialObjects() };
    // ✅ Using StateSubscriptionMixin for clean subscription management
    this.subscribeToState(
      celestialObjects$,
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

    this._listUpdateInterval = window.setInterval(
      () => this.updateAndReorderList(),
      500,
    );
  }

  /**
   * Cleans up the controller's resources.
   * Removes event listeners and unsubscribes from all RxJS streams.
   */
  public dispose(): void {
    this.removeEventListeners();
    // ✅ Using StateSubscriptionMixin for automatic subscription cleanup
    super.dispose();

    // Clean up special camera state subscription
    if (this._cameraStateSubscription) {
      this._cameraStateSubscription.unsubscribe();
      this._cameraStateSubscription = null;
    }

    if (this._listUpdateInterval) {
      window.clearInterval(this._listUpdateInterval);
      this._listUpdateInterval = null;
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
   * Sets the reference to the parent engine panel.
   * This is essential for communication, such as controlling the camera.
   * @param panel The parent `CompositeEnginePanel` instance.
   */
  public setParentPanel(panel: CompositeEnginePanel): void {
    this._parentPanel = panel;
    if (this._parentPanel && this._parentPanel.engineCameraManager) {
      this._cameraStateSubscription?.unsubscribe();

      this._cameraStateSubscription = this._parentPanel.engineCameraManager
        .getCameraState$()
        .subscribe((state: CameraManagerState) => {
          this._updateHighlightInternal(state.focusedObjectId);

          if (this._currentFollowedId && !state.focusedObjectId) {
            this._parentPanel?.orbitManager?.highlightVisualization(null);
          }
        });
      const initialState = this._parentPanel.engineCameraManager
        .getCameraState$()
        .getValue();
      this._updateHighlightInternal(initialState.focusedObjectId);
    } else {
      console.warn(
        "[CelestialHierarchyController] Parent panel or its EngineCameraManager not available on setParentPanel.",
      );
      this._cameraStateSubscription?.unsubscribe();
      this._cameraStateSubscription = null;
    }
  }

  /**
   * Handles all interactions within the celestial object tree.
   * This includes clicks on carets to expand/collapse nodes and
   * custom events for focusing or following an object.
   * @param event The DOM event triggered within the tree.
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

    if (
      event.type === CustomEvents.FOCUS_REQUEST ||
      event.type === CustomEvents.FOLLOW_REQUEST
    ) {
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
          `[CelestialHierarchyController] ${event.type} ignored for inactive object ${objectId}.`,
        );
        return;
      }

      if (event.type === CustomEvents.FOCUS_REQUEST) {
        console.debug(
          `[CelestialHierarchyController] Focus requested via row event for: ${objectId}`,
        );
        this.requestFocus(objectId);
      } else if (event.type === CustomEvents.FOLLOW_REQUEST) {
        console.debug(
          `[CelestialHierarchyController] Follow requested via row event for: ${objectId}`,
        );
        this.requestFollow(objectId);
      }
    }
  }

  /**
   * Initiates a request to point the camera at a specific object.
   * @param objectId The ID of the object to focus on.
   */
  private requestFocus(objectId: string): void {
    const success = handleFocusRequest(
      this._parentPanel,
      objectId,
      this._view.dispatchEvent.bind(this._view),
    );
    if (!success) {
      console.warn(
        `[CelestialHierarchyController] handleFocusRequest failed for ${objectId}`,
      );
    }
  }

  /**
   * Initiates a request to make the camera follow a specific object.
   * Also updates the UI to reflect the followed state.
   * @param objectId The ID of the object to follow.
   * @returns True if the follow request was successfully initiated.
   */
  private requestFollow(objectId: string): boolean {
    const success = handleFollowRequest(this._parentPanel, objectId);

    if (success) {
      this._parentPanel?.orbitManager?.highlightVisualization(objectId);

      this._currentFollowedId = objectId;
      this._treeListContainer
        ?.querySelectorAll(`celestial-row[following]`)
        .forEach((el) => el.removeAttribute("following"));
      const row = this._treeListContainer?.querySelector(
        `celestial-row[object-id="${objectId}"]`,
      );
      row?.toggleAttribute("following", true);
    } else {
      console.warn(
        `[CelestialHierarchyController] handleFollowRequest failed for ${objectId}`,
      );
    }
    return success;
  }

  /**
   * Public-facing method to request that an object be followed.
   * Intended to be called from the parent view.
   * @param objectId The ID of the object to follow.
   * @returns True if the follow request was successfully initiated.
   */
  public publicFollowObject = (objectId: string): boolean => {
    if (!objectId) {
      console.warn(
        "[CelestialHierarchyController] publicFollowObject called with no objectId.",
      );
      return false;
    }
    console.debug(
      `[CelestialHierarchyController] Public follow object called for: ${objectId}`,
    );
    return this.requestFollow(objectId);
  };

  /**
   * Adds all necessary event listeners for the controller to function.
   */
  private addEventListeners(): void {
    this._resetButton?.addEventListener("click", () =>
      this._parentPanel?.engineCameraManager?.resetCameraView(),
    );
    this._clearButton?.addEventListener("click", () =>
      this._parentPanel?.engineCameraManager?.clearFocus(),
    );

    if (this._treeListContainer) {
      this._treeListContainer.addEventListener(
        "click",
        this._handleTreeInteraction,
      );
      this._treeListContainer.addEventListener(
        CustomEvents.FOCUS_REQUEST,
        this._handleTreeInteraction,
      );
      this._treeListContainer.addEventListener(
        CustomEvents.FOLLOW_REQUEST,
        this._handleTreeInteraction,
      );
    }
  }

  /**
   * Removes all event listeners.
   * Note: This is simplified as the controller's lifecycle is tied to the view.
   */
  private removeEventListeners(): void {
    // Re-implementing remove with bound functions would be complex.
    // For now, the controller lives and dies with the view, so this is okay.
  }

  /**
   * Populates the list of celestial objects in the view.
   * This is the internal implementation, called by various event handlers.
   */
  private _populateListInternal = (): void => {
    if (!this._treeListContainer) return;
    const objects = getCelestialObjects();
    this._listManager.populate(objects, this._currentFocusedId);
  };

  /**
   * Updates the highlight in the view to mark the currently focused object.
   * It also ensures the focused item is visible by expanding its parent nodes.
   * @param focusedId The ID of the object to highlight, or null if none.
   */
  private _updateHighlightInternal(focusedId: string | null): void {
    if (!this._treeListContainer) return;
    if (this._currentFocusedId === focusedId) return;
    this._currentFocusedId = focusedId;

    this._listManager.updateHighlight(this._currentFocusedId);

    if (focusedId) {
      const elementToReveal =
        this._treeListContainer.querySelector<HTMLElement>(
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
   * Updates the visual status of a single object in the list (e.g., as 'destroyed').
   * If the object's parentage has changed, it triggers a full list refresh.
   * @param objectId The ID of the object to update.
   * @param status The new status of the object.
   */
  private _updateObjectStatusInternal(
    objectId: string,
    status: CelestialStatus,
  ): void {
    if (!this._treeListContainer) return;
    const needsFullRefresh = this._listManager.updateObjectStatus(
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
        this._parentPanel?.engineCameraManager?.clearFocus();
      }
      if (isInactive && this._currentFollowedId === objectId) {
        this._parentPanel?.orbitManager?.highlightVisualization(null);
        this._currentFollowedId = null;
        const row = this._treeListContainer?.querySelector(
          `celestial-row[object-id="${objectId}"]`,
        );
        row?.removeAttribute("following");
      }
    }
  }

  /**
   * Checks for changes in the celestial objects store.
   * It compares the new state against a previous snapshot to detect
   * new objects, destroyed objects, or changes in hierarchy.
   * @param currentObjects The latest collection of celestial objects.
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
   * Periodically updates the distance display for all visible celestial rows
   * and reorders the lists based on distance from the parent.
   */
  private updateAndReorderList(): void {
    if (!this._parentPanel) return;
    const renderer = this._parentPanel.getRenderer();
    if (!renderer) return;

    const allObjects = getCelestialObjects();
    if (Object.keys(allObjects).length === 0) return;

    const origin = new THREE.Vector3(0, 0, 0);
    const worldPosition = new THREE.Vector3();
    const parentWorldPosition = new THREE.Vector3();
    const SCENE_UNITS_TO_METERS = 1 / METERS_TO_SCENE_UNITS;

    // First, update all distances and store them on the LI elements
    const listItems =
      this._treeListContainer.querySelectorAll<HTMLLIElement>("li[data-id]");
    listItems.forEach((li) => {
      const id = li.dataset.id;
      if (!id) return;

      const celestialObj = allObjects[id];
      const sceneObject = renderer.objectManager.getObject(id);
      if (!celestialObj || !sceneObject) return;

      sceneObject.getWorldPosition(worldPosition);
      let distanceMeters = 0;

      const parentId = celestialObj.currentParentId ?? celestialObj.parentId;
      if (parentId) {
        const parentSceneObject = renderer.objectManager.getObject(parentId);
        if (parentSceneObject) {
          parentSceneObject.getWorldPosition(parentWorldPosition);
          distanceMeters =
            worldPosition.distanceTo(parentWorldPosition) *
            SCENE_UNITS_TO_METERS;
        }
      } else {
        // Fallback to distance from origin for root objects
        distanceMeters =
          worldPosition.distanceTo(origin) * SCENE_UNITS_TO_METERS;
      }

      li.dataset.distance = distanceMeters.toString();
      const row = li.querySelector<any>("celestial-row");
      if (row && typeof row.updateDistance === "function") {
        row.updateDistance(distanceMeters);
      }
    });

    // Now, reorder the children of each list (root and nested)
    const listsToSort =
      this._treeListContainer.querySelectorAll<HTMLUListElement>(
        "ul#focus-tree-list, ul.nested",
      );

    listsToSort.forEach((list) => {
      const currentChildren = Array.from(
        list.querySelectorAll<HTMLLIElement>(":scope > li[data-id]"),
      );

      // Create a new array that can be sorted without affecting the live NodeList
      const sortedChildren = [...currentChildren];
      sortedChildren.sort((a, b) => {
        const distA = parseFloat(a.dataset.distance ?? "0");
        const distB = parseFloat(b.dataset.distance ?? "0");
        return distA - distB;
      });

      // Check if the current DOM order matches the desired sorted order
      const orderHasChanged = currentChildren.some(
        (child, index) => child.dataset.id !== sortedChildren[index].dataset.id,
      );

      // Only manipulate the DOM if the order has actually changed
      if (orderHasChanged) {
        sortedChildren.forEach((child) => list.appendChild(child));
      }
    });
  }
}
