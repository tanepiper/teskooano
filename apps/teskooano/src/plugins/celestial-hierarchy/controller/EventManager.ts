import { CelestialStatus, CustomEvents } from "@teskooano/data-types";
import type { CompositeEnginePanel } from "../../engine-panel/panels/composite-panel/CompositeEnginePanel.js";
import type { CelestialHierarchy } from "../view/CelestialHierarchy.view.js";

export interface EventHandlers {
  onObjectsLoaded: () => void;
  onObjectDestroyed: () => void;
  onObjectStatusChanged: (objectId: string, status: CelestialStatus) => void;
  onInfluencesChanged: () => void;
  onHierarchyChanged: () => void;
  onTreeInteraction: (event: Event) => void;
}

/**
 * Manages all event handling for the celestial hierarchy controller.
 */
export class EventManager {
  private _view: CelestialHierarchy;
  private _treeListContainer: HTMLUListElement;
  private _resetButton: HTMLElement;
  private _clearButton: HTMLElement;
  private _parentPanel: CompositeEnginePanel | null = null;
  private _handlers: EventHandlers;

  constructor(
    view: CelestialHierarchy,
    treeListContainer: HTMLUListElement,
    resetButton: HTMLElement,
    clearButton: HTMLElement,
    handlers: EventHandlers,
  ) {
    this._view = view;
    this._treeListContainer = treeListContainer;
    this._resetButton = resetButton;
    this._clearButton = clearButton;
    this._handlers = handlers;
  }

  public setParentPanel(panel: CompositeEnginePanel): void {
    this._parentPanel = panel;
  }

  public setupEventListeners(): void {
    // Button event listeners
    this._resetButton?.addEventListener("click", () =>
      this._parentPanel?.engineCameraManager?.resetCameraView(),
    );
    this._clearButton?.addEventListener("click", () =>
      this._parentPanel?.engineCameraManager?.clearFocus(),
    );

    // Tree interaction listeners
    if (this._treeListContainer) {
      this._treeListContainer.addEventListener(
        "click",
        this._handlers.onTreeInteraction,
      );
      this._treeListContainer.addEventListener(
        "touchend",
        this._handlers.onTreeInteraction,
      );
      this._treeListContainer.addEventListener(
        CustomEvents.FOCUS_REQUEST,
        this._handlers.onTreeInteraction,
      );
      this._treeListContainer.addEventListener(
        CustomEvents.FOLLOW_REQUEST,
        this._handlers.onTreeInteraction,
      );
    }

    // Global document event listeners
    document.addEventListener(
      "celestial-objects-loaded",
      this._handlers.onObjectsLoaded,
    );
    document.addEventListener(
      "celestial-object-destroyed",
      this._handlers.onObjectDestroyed,
    );
    document.addEventListener(
      "celestial-object-status-changed",
      this._handleObjectStatusChanged,
    );
    document.addEventListener(
      "celestial-influences-changed",
      this._handlers.onInfluencesChanged,
    );
    document.addEventListener(
      "celestial-hierarchy-changed",
      this._handleHierarchyChanged,
    );
  }

  public removeEventListeners(): void {
    if (this._treeListContainer) {
      this._treeListContainer.removeEventListener(
        "click",
        this._handlers.onTreeInteraction,
      );
      this._treeListContainer.removeEventListener(
        "touchend",
        this._handlers.onTreeInteraction,
      );
      this._treeListContainer.removeEventListener(
        CustomEvents.FOCUS_REQUEST,
        this._handlers.onTreeInteraction,
      );
      this._treeListContainer.removeEventListener(
        CustomEvents.FOLLOW_REQUEST,
        this._handlers.onTreeInteraction,
      );
    }

    document.removeEventListener(
      "celestial-objects-loaded",
      this._handlers.onObjectsLoaded,
    );
    document.removeEventListener(
      "celestial-object-destroyed",
      this._handlers.onObjectDestroyed,
    );
    document.removeEventListener(
      "celestial-object-status-changed",
      this._handleObjectStatusChanged,
    );
    document.removeEventListener(
      "celestial-influences-changed",
      this._handlers.onInfluencesChanged,
    );
    document.removeEventListener(
      "celestial-hierarchy-changed",
      this._handleHierarchyChanged,
    );
  }

  private _handleObjectStatusChanged = (event: Event): void => {
    const customEvent = event as CustomEvent<{
      objectId: string;
      status: CelestialStatus;
    }>;
    if (customEvent.detail) {
      this._handlers.onObjectStatusChanged(
        customEvent.detail.objectId,
        customEvent.detail.status,
      );
    }
  };

  private _handleHierarchyChanged = (event: Event): void => {
    console.debug("[EventManager] Hierarchy changed event received.");
    this._handlers.onHierarchyChanged();
  };
}
