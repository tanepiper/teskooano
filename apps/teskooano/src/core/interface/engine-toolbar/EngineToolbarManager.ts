import type { DockviewApi } from "dockview-core";
import { BehaviorSubject, Observable } from "rxjs";
import { EngineToolbar } from "./EngineToolbar"; // Keep reference for now
import type { CompositeEnginePanel } from "../../../plugins/engine-panel/panels/CompositeEnginePanel";

export class EngineToolbarManager {
  private dockviewApi: DockviewApi | null = null; // Dependency injection needed
  // Map to store active toolbar instances, keyed by panel API ID
  private activeToolbars: Map<string, EngineToolbar> = new Map();
  // Map to store expansion state Subjects per toolbar instance (apiId -> Subject<isExpanded>)
  private toolbarExpansionStateSubjects: Map<string, BehaviorSubject<boolean>> =
    new Map();

  constructor() {}

  public createToolbarForPanel(
    apiId: string,
    parentElement: HTMLElement,
    dockviewController: any,
    parentEngine: CompositeEnginePanel,
  ): EngineToolbar | null {
    // 1. Check if toolbar already exists for apiId
    if (this.activeToolbars.has(apiId)) {
      console.warn(
        `[EngineToolbarManager] Toolbar already exists for ${apiId}. Returning existing instance.`,
      );
      return this.activeToolbars.get(apiId) || null;
    }

    try {
      const expansionSubject = new BehaviorSubject<boolean>(true); // Default to expanded
      this.toolbarExpansionStateSubjects.set(apiId, expansionSubject);

      const newToolbar = new EngineToolbar(
        apiId,
        dockviewController,
        parentEngine,
      );

      this.activeToolbars.set(apiId, newToolbar);

      // 4. Append the toolbar element to parentElement
      parentElement.appendChild(newToolbar.element);

      // 5. Return the instance
      return newToolbar;
    } catch (error) {
      console.error(
        `[EngineToolbarManager] Failed to create toolbar for ${apiId}:`,
        error,
      );
      // 5. Handle errors
      return null;
    }
  }

  public disposeToolbarForPanel(apiId: string): void {
    // 1. Find the toolbar instance for apiId
    const toolbarInstance = this.activeToolbars.get(apiId);
    const expansionSubject = this.toolbarExpansionStateSubjects.get(apiId);

    // Complete and remove the subject
    if (expansionSubject) {
      expansionSubject.complete();
      this.toolbarExpansionStateSubjects.delete(apiId);
    }

    // Dispose the toolbar instance
    if (toolbarInstance) {
      try {
        // 2. Call dispose() on the EngineToolbar instance
        toolbarInstance.dispose();
        // 3. Remove the instance from internal tracking
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
   * @param apiId The API ID of the toolbar instance.
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
   * @param apiId The API ID of the toolbar instance.
   * @returns True if expanded, false if collapsed (defaults to true if state unknown).
   */
  public getToolbarExpansionState(apiId: string): boolean {
    // Return current value, default to true if subject doesn't exist (shouldn't happen)
    return this.toolbarExpansionStateSubjects.get(apiId)?.getValue() ?? true;
  }

  /**
   * Gets the expansion state as an Observable for a specific toolbar.
   * @param apiId The API ID of the toolbar instance.
   * @returns An Observable emitting the expansion state (boolean), or undefined if not found.
   */
  public getExpansionState$(apiId: string): Observable<boolean> | undefined {
    return this.toolbarExpansionStateSubjects.get(apiId)?.asObservable();
  }

  // Method to receive dependencies (alternative to constructor injection if needed later)
  public setDependencies(dependencies: { dockviewApi: DockviewApi }): void {
    this.dockviewApi = dependencies.dockviewApi;
  }
}
