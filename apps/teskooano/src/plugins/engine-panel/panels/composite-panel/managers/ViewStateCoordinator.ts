import { BehaviorSubject, Subscription } from "rxjs";
import type { ModularSpaceRenderer } from "@teskooano/renderer-threejs";
import type { CompositeEngineState } from "../../types";
import {
  createDefaultViewState,
  applyViewStateToRenderer,
} from "../CompositeEnginePanel.utils";

/**
 * Simple coordinator for managing view state in the CompositeEnginePanel.
 * Handles the _viewStateSubject and applies state changes to the renderer.
 * Focused on core functionality without over-engineering.
 */
export class ViewStateCoordinator {
  private readonly _viewStateSubject: BehaviorSubject<CompositeEngineState>;
  private _renderer: ModularSpaceRenderer | undefined;

  constructor(initialState?: CompositeEngineState) {
    this._viewStateSubject = new BehaviorSubject<CompositeEngineState>(
      initialState || createDefaultViewState(),
    );
  }

  /** Observable of current view state */
  public get viewState$() {
    return this._viewStateSubject.asObservable();
  }

  /**
   * Set the renderer instance for applying state changes
   */
  public setRenderer(renderer: ModularSpaceRenderer): void {
    this._renderer = renderer;
  }

  /**
   * Get current view state
   */
  public getViewState(): Readonly<CompositeEngineState> {
    return this._viewStateSubject.getValue();
  }

  /**
   * Update view state and apply changes to renderer
   */
  public updateViewState(updates: Partial<CompositeEngineState>): void {
    const currentState = this._viewStateSubject.getValue();
    const newState = { ...currentState, ...updates };

    this._viewStateSubject.next(newState);

    // Apply changes to renderer if available
    if (this._renderer) {
      applyViewStateToRenderer(this._renderer, updates);
    }
  }

  /**
   * Subscribe to view state changes
   */
  public subscribeToViewState(
    callback: (state: CompositeEngineState) => void,
  ): Subscription {
    return this._viewStateSubject.subscribe(callback);
  }

  /**
   * Get the BehaviorSubject for direct access (for compatibility)
   */
  public get viewStateSubject(): BehaviorSubject<CompositeEngineState> {
    return this._viewStateSubject;
  }

  /**
   * Dispose of the coordinator
   */
  public dispose(): void {
    this._viewStateSubject.complete();
    this._renderer = undefined;
  }
}
