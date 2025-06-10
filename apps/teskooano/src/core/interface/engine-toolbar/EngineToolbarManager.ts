import type { PluginExecutionContext } from "@teskooano/ui-plugin";
import { BehaviorSubject, Observable } from "rxjs";
import { EngineToolbar } from "./EngineToolbar";

/**
 * Manages the lifecycle of multiple {@link EngineToolbar} instances.
 * This class acts as a factory and state manager for toolbars that are
 * associated with specific engine panels.
 *
 * This class is designed to be a singleton, instantiated via the
 * `engine-toolbar:initialize` plugin function, which provides the
 * required {@link PluginExecutionContext}.
 */
export class EngineToolbarManager {
  private activeToolbars: Map<string, EngineToolbar> = new Map();
  private toolbarExpansionStateSubjects: Map<string, BehaviorSubject<boolean>> =
    new Map();
  private _context: PluginExecutionContext;

  /**
   * Initializes a new instance of the EngineToolbarManager.
   * @param context - The plugin execution context from the PluginManager.
   * @remark This constructor should only be called by its initialization function.
   */
  constructor(context: PluginExecutionContext) {
    this._context = context;
  }

  /**
   * Creates and registers a new toolbar for a specific panel.
   * If a toolbar for the given ID already exists, it returns the existing instance.
   * @param apiId - A unique identifier for the panel, typically `panel.api.id`.
   * @param parentElement - The HTML element to which the toolbar will be appended.
   * @param parentEngine - A reference to the parent engine instance, passed to child panels.
   * @returns The created or existing {@link EngineToolbar} instance, or null on failure.
   */
  public createToolbarForPanel(
    apiId: string,
    parentElement: HTMLElement,
    parentEngine: any,
  ): EngineToolbar | null {
    if (this.activeToolbars.has(apiId)) {
      console.warn(
        `[EngineToolbarManager] Toolbar already exists for ${apiId}. Returning existing instance.`,
      );
      return this.activeToolbars.get(apiId) || null;
    }

    try {
      const expansionSubject = new BehaviorSubject<boolean>(true);
      this.toolbarExpansionStateSubjects.set(apiId, expansionSubject);

      const newToolbar = new EngineToolbar(
        apiId,
        this._context,
        parentEngine,
        this,
      );

      this.activeToolbars.set(apiId, newToolbar);

      // If parentElement is a web component with a shadowRoot, append to the shadowRoot.
      // Otherwise, append to the parentElement directly (legacy or non-shadowDOM components).
      const targetContainer =
        parentElement.shadowRoot instanceof ShadowRoot
          ? parentElement.shadowRoot
          : parentElement;
      targetContainer.appendChild(newToolbar.element);

      return newToolbar;
    } catch (error) {
      console.error(
        `[EngineToolbarManager] Failed to create toolbar for ${apiId}:`,
        error,
      );

      return null;
    }
  }

  /**
   * Disposes and cleans up a toolbar associated with a given panel ID.
   * This removes the toolbar from the DOM and releases any related resources.
   * @param apiId - The unique identifier of the toolbar to dispose.
   */
  public disposeToolbarForPanel(apiId: string): void {
    const toolbarInstance = this.activeToolbars.get(apiId);
    const expansionSubject = this.toolbarExpansionStateSubjects.get(apiId);

    if (expansionSubject) {
      expansionSubject.complete();
      this.toolbarExpansionStateSubjects.delete(apiId);
    }

    if (toolbarInstance) {
      try {
        toolbarInstance.dispose();

        this.activeToolbars.delete(apiId);
      } catch (error) {
        console.error(
          `[EngineToolbarManager] Error disposing toolbar for ${apiId}:`,
          error,
        );
      }
    } else {
      console.warn(
        `[EngineToolbarManager] Toolbar not found for disposal: ${apiId}`,
      );
    }
  }

  /**
   * Toggles the expansion state of a specific toolbar.
   * @param apiId - The API ID of the toolbar instance.
   */
  public toggleToolbarExpansion(apiId: string): void {
    const expansionSubject = this.toolbarExpansionStateSubjects.get(apiId);
    if (expansionSubject) {
      const newState = !expansionSubject.getValue();
      expansionSubject.next(newState);
    } else {
      console.warn(
        `[EngineToolbarManager] Could not find expansion state subject for ${apiId} to toggle.`,
      );
    }
  }

  /**
   * Gets the current expansion state of a specific toolbar.
   * @param apiId - The API ID of the toolbar instance.
   * @returns `true` if expanded, `false` if collapsed (defaults to `true` if state is unknown).
   */
  public getToolbarExpansionState(apiId: string): boolean {
    return this.toolbarExpansionStateSubjects.get(apiId)?.getValue() ?? true;
  }

  /**
   * Gets the expansion state as an Observable for a specific toolbar.
   * @param apiId - The API ID of the toolbar instance.
   * @returns An `Observable<boolean>` emitting the expansion state, or `undefined` if not found.
   */
  public getExpansionState$(apiId: string): Observable<boolean> | undefined {
    return this.toolbarExpansionStateSubjects.get(apiId)?.asObservable();
  }
}
