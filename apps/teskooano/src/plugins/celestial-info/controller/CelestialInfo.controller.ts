import { celestialObjects$, getCelestialObjects } from "@teskooano/core-state";
import { CelestialObject, CelestialStatus } from "@teskooano/data-types";
import { Subscription } from "rxjs";
import type { CelestialInfo } from "../view/CelestialInfo.view";
import { CelestialInfoViewManager } from "./CelestialInfoViewManager";

/**
 * Controller for the CelestialInfo view.
 * Encapsulates all business logic for the celestial info panel, including
 * state subscriptions, event handling, and managing the view manager.
 */
export class CelestialInfoController {
  private _view: CelestialInfo;
  private _viewManager: CelestialInfoViewManager;
  private _celestialObjectsSubscription: Subscription | null = null;
  private _currentSelectedId: string | null = null;

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
    this._view = view;
    this._viewManager = new CelestialInfoViewManager(container, placeholder);
  }

  /**
   * Initializes the controller, setting up listeners for state changes and
   * focus events.
   */
  public initialize(): void {
    this._celestialObjectsSubscription = celestialObjects$.subscribe(
      this.handleObjectStoreUpdate,
    );

    document.addEventListener(
      "renderer-focus-changed",
      this.handleRendererFocusChange,
    );

    document.addEventListener(
      "focus-request-initiated",
      this.handleFocusRequestInitiated,
    );
  }

  /**
   * Cleans up resources, unsubscribing from streams and removing event
   * listeners to prevent memory leaks.
   */
  public dispose(): void {
    this._celestialObjectsSubscription?.unsubscribe();
    this._celestialObjectsSubscription = null;

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
      if (currentObject && currentObject.status !== CelestialStatus.DESTROYED) {
        this._viewManager.renderInfo(currentObject);
      } else if (!currentObject) {
        this._viewManager.showPlaceholder("Selected object data not found.");
        this._currentSelectedId = null;
      } else {
        this._viewManager.showPlaceholder(
          `Object '${currentObject.name}' has been destroyed.`,
        );
        this._currentSelectedId = null;
      }
    }
  };

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

    const celestialData = getCelestialObjects()[selectedId];

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
