import {
  celestialObjects$,
  StateAccessor,
  StateSubscriptionMixin,
} from "@teskooano/core-state";
import { CelestialObject, CelestialStatus } from "@teskooano/data-types";
import type { CompositeEnginePanel } from "../../engine-panel/panels/composite-panel/CompositeEnginePanel.js";
import { FocusListManager } from "./FocusListManager.js";
import { EventManager, type EventHandlers } from "./EventManager.js";
import { CameraManager, type CameraStateHandlers } from "./CameraManager.js";
import { DistanceUpdateManager } from "./DistanceUpdateManager.js";
import {
  TreeInteractionManager,
  type TreeInteractionHandlers,
} from "./TreeInteractionManager.js";

/**
 * Controller for the CelestialHierarchy view.
 *
 * This class orchestrates specialized managers to handle different aspects
 * of the celestial hierarchy functionality.
 */
export class CelestialHierarchyController extends StateSubscriptionMixin {
  private _listManager: FocusListManager;
  private _eventManager: EventManager;
  private _cameraManager: CameraManager;
  private _distanceManager: DistanceUpdateManager;
  private _treeInteractionManager: TreeInteractionManager;

  private _previousObjectsState: Record<string, CelestialObject> = {};

  /**
   * Creates an instance of CelestialHierarchyController.
   */
  constructor(
    treeListContainer: HTMLUListElement,
    destroyedListContainer: HTMLUListElement,
    resetButton: HTMLElement,
    clearButton: HTMLElement,
  ) {
    super();

    // Initialize managers
    this._listManager = new FocusListManager(
      treeListContainer,
      destroyedListContainer,
    );

    this._eventManager = new EventManager(
      treeListContainer,
      resetButton,
      clearButton,
      this._createEventHandlers(),
    );

    this._cameraManager = new CameraManager(
      treeListContainer,
      this._createCameraStateHandlers(),
    );

    this._distanceManager = new DistanceUpdateManager(
      treeListContainer,
      destroyedListContainer,
      () => StateAccessor.getCelestialObjects(),
    );

    this._treeInteractionManager = new TreeInteractionManager(
      treeListContainer,
      this._createTreeInteractionHandlers(),
    );
  }

  /**
   * Initializes the controller and all its managers.
   */
  public initialize(): void {
    this._eventManager.setupEventListeners();
    this._populateListInternal();
    this._distanceManager.startPeriodicUpdates();

    this._previousObjectsState = {
      ...StateAccessor.getCelestialObjects(),
    };

    // Subscribe to state changes
    this.subscribeToState(
      celestialObjects$,
      this.checkForStatusChanges.bind(this),
    );
  }

  /**
   * Cleans up the controller and all its managers.
   */
  public dispose(): void {
    this._eventManager.removeEventListeners();
    this._cameraManager.dispose();
    this._distanceManager.stopPeriodicUpdates();
    super.dispose();
  }

  /**
   * Sets the reference to the parent engine panel.
   */
  public setParentPanel(panel: CompositeEnginePanel): void {
    this._eventManager.setParentPanel(panel);
    this._cameraManager.setParentPanel(panel);
    this._distanceManager.setParentPanel(panel);
    this._listManager.setParentPanel(panel);
  }

  /**
   * Public-facing method to request that an object be followed.
   */
  public publicFollowObject = (objectId: string): boolean => {
    return this._cameraManager.publicFollowObject(objectId);
  };

  // --- Private methods ---

  private _createEventHandlers(): EventHandlers {
    return {
      onObjectsLoaded: this._populateListInternal.bind(this),
      onObjectDestroyed: this._populateListInternal.bind(this),
      onObjectStatusChanged: this._updateObjectStatusInternal.bind(this),
      onInfluencesChanged: this._populateListInternal.bind(this),
      onHierarchyChanged: this._populateListInternal.bind(this), // Simplified - just re-render
      onTreeInteraction: this._handleTreeInteraction.bind(this),
    };
  }

  private _createCameraStateHandlers(): CameraStateHandlers {
    return {
      onFocusChanged: this._updateHighlightInternal.bind(this),
      onFollowChanged: this._handleFollowChanged.bind(this),
    };
  }

  private _createTreeInteractionHandlers(): TreeInteractionHandlers {
    return {
      onFocusRequest: this._handleFocusRequest.bind(this),
      onFollowRequest: this._handleFollowRequest.bind(this),
    };
  }

  private _populateListInternal = (): void => {
    const objects = StateAccessor.getCelestialObjects();
    this._listManager.populate(
      objects,
      this._cameraManager.getCurrentFocusedId(),
    );
  };

  private _updateHighlightInternal(focusedId: string | null): void {
    this._listManager.updateHighlight(focusedId);
    if (focusedId) {
      this._treeInteractionManager.expandTreeToReveal(focusedId);
    }
  }

  private _updateObjectStatusInternal(
    objectId: string,
    status: CelestialStatus,
  ): void {
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
      if (
        isInactive &&
        this._cameraManager.getCurrentFocusedId() === objectId
      ) {
        // Focus will be cleared by camera manager subscription
      }
      if (
        isInactive &&
        this._cameraManager.getCurrentFollowedId() === objectId
      ) {
        this._cameraManager.clearFollow();
      }
    }
  }

  private _handleTreeInteraction(event: Event): void {
    this._treeInteractionManager.handleTreeInteraction(event);
  }

  private _handleFocusRequest(objectId: string): void {
    // Validate object before requesting focus using pre-filtered active objects
    const activeObjects = StateAccessor.getActiveObjects();
    const currentObject = activeObjects[objectId];
    if (!currentObject) {
      console.warn(
        `[CelestialHierarchyController] Focus ignored for inactive object ${objectId}.`,
      );
      return;
    }
    this._cameraManager.requestFocus(objectId);
  }

  private _handleFollowRequest(objectId: string): void {
    // Validate object before requesting follow using pre-filtered active objects
    const activeObjects = StateAccessor.getActiveObjects();
    const currentObject = activeObjects[objectId];
    if (!currentObject) {
      console.warn(
        `[CelestialHierarchyController] Follow ignored for inactive object ${objectId}.`,
      );
      return;
    }
    this._cameraManager.requestFollow(objectId);
  }

  private _handleFollowChanged(followedId: string | null): void {
    // Handle any additional logic when follow state changes
    console.debug(
      `[CelestialHierarchyController] Follow changed to: ${followedId}`,
    );
  }

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
      // Check if hierarchy changed
      else if (prevObj.parentId !== obj.parentId) needsListUpdate = true;
    });
    Object.keys(this._previousObjectsState).forEach((id) => {
      if (!currentObjects[id]) needsListUpdate = true;
    });
    this._previousObjectsState = { ...currentObjects };
    if (needsListUpdate) this._populateListInternal();
  };
}
