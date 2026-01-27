import {
  celestialObjects$,
  StateAccessor,
  StateSubscriptionMixin,
} from "@teskooano/core-state";
import { CelestialObject, CelestialStatus } from "@teskooano/data-types";
import type { CompositeEnginePanel } from "../../engine-panel/panels/composite-panel/CompositeEnginePanel";
import type { CelestialInfo } from "../view/CelestialInfo.view";
import { CelestialInfoViewManager } from "./CelestialInfoViewManager";

/**
 * Controller for the CelestialInfo view.
 * Encapsulates all business logic for the celestial info panel, including
 * state subscriptions, event handling, and managing the view manager.
 */
export class CelestialInfoController extends StateSubscriptionMixin {
  private _view: CelestialInfo;
  private _viewManager: CelestialInfoViewManager;
  private _currentSelectedId: string | null = null;
  private _parentPanel: CompositeEnginePanel | null = null;

  /**
   * Creates an instance of CelestialInfoController.
   * @param view The CelestialInfo view instance.
   * @param container The HTML element that will contain the info components.
   * @param placeholder The HTML element used for placeholder messages.
   */
  constructor(
    view: CelestialInfo,
    container: HTMLElement,
    placeholder: HTMLElement,
  ) {
    super();
    this._view = view;
    this._viewManager = new CelestialInfoViewManager(container, placeholder);
  }

  /**
   * Initializes the controller, setting up listeners for state changes and
   * focus events.
   */
  public initialize(): void {
    // ✅ Using StateSubscriptionMixin for clean subscription management
    this.subscribeToState(celestialObjects$, this.handleObjectStoreUpdate);

    document.addEventListener(
      "renderer-focus-changed",
      this.handleRendererFocusChange,
    );

    document.addEventListener(
      "focus-request-initiated",
      this.handleFocusRequestInitiated,
    );
  }

  public setParentPanel(panel: CompositeEnginePanel): void {
    this._parentPanel = panel;
    this._viewManager.setParentPanel(panel);
  }

  /**
   * Handles the initial selection of an object when the panel is created.
   * @param selectedId The ID of the initially focused object, if any.
   */
  public handleInitialSelection(selectedId: string | null): void {
    // If no specific object is provided, check if there's a currently followed object
    if (!selectedId) {
      // Try to get the currently focused object from the camera manager
      // This will work for both focused and followed objects since they both set focusedObjectId
      const currentFocusedId = this._getCurrentFocusedObjectId();
      if (currentFocusedId) {
        selectedId = currentFocusedId;
      }
    }

    this.handleSelectionChange(selectedId);
  }

  /**
   * Cleans up resources, unsubscribing from streams and removing event
   * listeners to prevent memory leaks.
   */
  public dispose(): void {
    // ✅ Using StateSubscriptionMixin for automatic subscription cleanup
    super.dispose();

    document.removeEventListener(
      "renderer-focus-changed",
      this.handleRendererFocusChange,
    );

    document.removeEventListener(
      "focus-request-initiated",
      this.handleFocusRequestInitiated,
    );
  }

  /**
   * Handles the `renderer-focus-changed` event.
   * @param event The custom event containing the focused object's ID.
   */
  private handleRendererFocusChange = (event: Event): void => {
    const customEvent = event as CustomEvent<{
      focusedObjectId: string | null;
    }>;
    if (customEvent.detail) {
      if (this._currentSelectedId !== customEvent.detail.focusedObjectId) {
        this.handleSelectionChange(customEvent.detail.focusedObjectId);
      }
    }
  };

  /**
   * Handles the `focus-request-initiated` event, which fires when a user
   * clicks an item in the focus list.
   * @param event The custom event containing the requested object's ID.
   */
  private handleFocusRequestInitiated = (event: Event): void => {
    const customEvent = event as CustomEvent<{ objectId: string | null }>;
    if (customEvent.detail?.objectId) {
      if (this._currentSelectedId !== customEvent.detail.objectId) {
        this.handleSelectionChange(customEvent.detail.objectId);
      }
    }
  };

  /**
   * Handles updates from the celestial objects store. If the currently selected
   * object has changed, it re-renders the info.
   * @param allCelestials A record of all celestial objects.
   */
  private handleObjectStoreUpdate = (
    allCelestials: Record<string, CelestialObject>,
  ): void => {
    if (this._currentSelectedId) {
      const currentObject = allCelestials[this._currentSelectedId];
      if (!currentObject) {
        this._viewManager.showPlaceholder("Selected object data not found.");
        this._currentSelectedId = null;
      } else if (
        currentObject.status &&
        currentObject.status === CelestialStatus.DESTROYED
      ) {
        this._viewManager.showPlaceholder(
          `Object '${currentObject.name}' has been destroyed.`,
        );
        this._currentSelectedId = null;
      }
    }
  };

  /**
   * Gets the currently focused object ID from the panel-specific camera manager.
   * @returns The ID of the currently focused/followed object, or null if none.
   */
  private _getCurrentFocusedObjectId(): string | null {
    // Try to get from the panel-specific camera manager using parent panel ID
    if (!this._parentPanel?.panelId) {
      return null;
    }

    try {
      const cameraManager = StateAccessor.getCameraManager(
        this._parentPanel.panelId,
      );
      return cameraManager.getFocusedObject();
    } catch (error) {
      console.warn(
        `[CelestialInfoController] Could not access camera state for panel ${this._parentPanel.panelId}:`,
        error,
      );
    }

    // Fallback: try to get from the global state
    try {
      const allCelestials = StateAccessor.getCelestialObjects();
      // Look for any object that might be currently focused
      // This is a heuristic - we'll check if there's only one object or if there's a clear "main" object
      const celestialIds = Object.keys(allCelestials);
      if (celestialIds.length === 1) {
        return celestialIds[0];
      }
      // If there are multiple objects, look for the main star (usually the first one)
      const mainStar = Object.values(allCelestials).find(
        (obj) => obj.type === "STAR" && (obj.properties as any)?.isMainStar,
      );
      if (mainStar) {
        return mainStar.id;
      }
    } catch (error) {
      console.warn(
        "[CelestialInfoController] Could not determine current focused object:",
        error,
      );
    }

    return null;
  }

  /**
   * Central logic for handling a change in the selected object.
   * @param selectedId The ID of the newly selected celestial object, or null.
   */
  private handleSelectionChange(selectedId: string | null): void {
    if (selectedId === this._currentSelectedId) return;
    this._currentSelectedId = selectedId;

    if (!selectedId) {
      this._viewManager.showPlaceholder("Select a celestial object...");
      return;
    }

    const celestialData = StateAccessor.getCelestialObject(selectedId);

    if (celestialData) {
      if (celestialData.status === CelestialStatus.DESTROYED) {
        this._viewManager.showPlaceholder(
          `Object '${celestialData.name}' has been destroyed.`,
        );
      } else {
        this._viewManager.renderInfo(celestialData);
      }
    } else {
      this._viewManager.showPlaceholder("Selected object data not found.");
    }
  }
}
