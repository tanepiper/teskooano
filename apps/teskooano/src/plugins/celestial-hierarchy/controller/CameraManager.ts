import type { CameraManagerState } from "@teskooano/data-types";
import type { CompositeEnginePanel } from "../../engine-panel/panels/composite-panel/CompositeEnginePanel.js";
import { FocusInteractionManager } from "./focus-interactions.js";

export interface CameraStateHandlers {
  onFocusChanged: (focusedId: string | null) => void;
  onFollowChanged: (followedId: string | null) => void;
}

/**
 * Manages camera state, focus, and follow functionality for the celestial hierarchy.
 */
export class CameraManager {
  private _treeListContainer: HTMLUListElement;
  private _parentPanel: CompositeEnginePanel | null = null;
  private _currentFocusedId: string | null = null;
  private _currentFollowedId: string | null = null;
  private _cameraStateSubscription: any = null;
  private _handlers: CameraStateHandlers;
  private _focusInteractionManager: FocusInteractionManager;

  constructor(
    treeListContainer: HTMLUListElement,
    handlers: CameraStateHandlers,
  ) {
    this._treeListContainer = treeListContainer;
    this._handlers = handlers;
    this._focusInteractionManager = new FocusInteractionManager(null);
  }

  public setParentPanel(panel: CompositeEnginePanel): void {
    this._parentPanel = panel;
    this._focusInteractionManager = new FocusInteractionManager(panel);
    this._setupCameraStateSubscription();
  }

  public getParentPanel(): CompositeEnginePanel | null {
    return this._parentPanel;
  }

  public getCurrentFocusedId(): string | null {
    return this._currentFocusedId;
  }

  public getCurrentFollowedId(): string | null {
    return this._currentFollowedId;
  }

  public requestFocus(objectId: string): boolean {
    const success = this._focusInteractionManager.handleFocusRequest(objectId);
    if (!success) {
      console.warn(`[CameraManager] handleFocusRequest failed for ${objectId}`);
    }
    return success;
  }

  public requestFollow(objectId: string): boolean {
    const success = this._focusInteractionManager.handleFollowRequest(objectId);

    if (success) {
      this._parentPanel
        ?.getRenderer()
        ?.renderingOrchestrator?.orbitManager?.highlightVisualization(objectId);
      this._currentFollowedId = objectId;
      this._updateFollowUI(objectId);
      this._handlers.onFollowChanged(objectId);
    } else {
      console.warn(
        `[CameraManager] handleFollowRequest failed for ${objectId}`,
      );
    }
    return success;
  }

  public publicFollowObject(objectId: string): boolean {
    if (!objectId) {
      console.warn(
        "[CameraManager] publicFollowObject called with no objectId.",
      );
      return false;
    }
    console.debug(
      `[CameraManager] Public follow object called for: ${objectId}`,
    );
    return this.requestFollow(objectId);
  }

  public clearFollow(): void {
    this._parentPanel
      ?.getRenderer()
      ?.renderingOrchestrator?.orbitManager?.highlightVisualization(null);
    this._currentFollowedId = null;
    this._clearFollowUI();
    this._handlers.onFollowChanged(null);
  }

  public dispose(): void {
    if (this._cameraStateSubscription) {
      this._cameraStateSubscription.unsubscribe();
      this._cameraStateSubscription = null;
    }
  }

  private _setupCameraStateSubscription(): void {
    if (this._parentPanel && this._parentPanel.cameraManager) {
      this._cameraStateSubscription?.unsubscribe();

      this._cameraStateSubscription = this._parentPanel.cameraManager
        .getCameraState$()
        .subscribe((state: CameraManagerState) => {
          this._updateFocusInternal(state.focusedObjectId);

          if (this._currentFollowedId && !state.focusedObjectId) {
            this._parentPanel
              ?.getRenderer()
              ?.renderingOrchestrator?.orbitManager?.highlightVisualization(
                null,
              );
          }
        });

      const initialState = this._parentPanel.cameraManager
        .getCameraState$()
        .getValue();
      this._updateFocusInternal(initialState.focusedObjectId);
    } else {
      console.warn(
        "[CameraManager] Parent panel or its CameraManager not available.",
      );
      this._cameraStateSubscription?.unsubscribe();
      this._cameraStateSubscription = null;
    }
  }

  private _updateFocusInternal(focusedId: string | null): void {
    if (this._currentFocusedId === focusedId) return;
    this._currentFocusedId = focusedId;
    this._handlers.onFocusChanged(focusedId);
  }

  private _updateFollowUI(objectId: string): void {
    this._treeListContainer
      ?.querySelectorAll(`celestial-row[following]`)
      .forEach((el) => el.removeAttribute("following"));
    const row = this._treeListContainer?.querySelector(
      `celestial-row[object-id="${objectId}"]`,
    );
    row?.toggleAttribute("following", true);
  }

  private _clearFollowUI(): void {
    this._treeListContainer
      ?.querySelectorAll(`celestial-row[following]`)
      .forEach((el) => el.removeAttribute("following"));
  }
}
