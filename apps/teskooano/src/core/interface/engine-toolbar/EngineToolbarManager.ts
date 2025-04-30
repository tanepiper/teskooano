// Placeholder for the Engine Toolbar Manager service
// Logic from EngineToolbar.ts and EngineToolbar.store.ts will be moved here.

import type { DockviewApi } from "dockview-core";
import { BehaviorSubject, Observable } from "rxjs";
import { EngineToolbar } from "./EngineToolbar"; // Keep reference for now
import type { CompositeEnginePanel } from "../../../plugins/engine-panel/panels/CompositeEnginePanel";

// TODO: Define internal state structure (e.g., Map<apiId, EngineToolbarInstance>)
// TODO: Move state management logic from EngineToolbar.store.ts
// TODO: Move toolbar creation/manipulation logic from EngineToolbar.ts

export class EngineToolbarManager {
  private dockviewApi: DockviewApi | null = null; // Dependency injection needed
  // Map to store active toolbar instances, keyed by panel API ID
  private activeToolbars: Map<string, EngineToolbar> = new Map();
  // Map to store expansion state Subjects per toolbar instance (apiId -> Subject<isExpanded>)
  private toolbarExpansionStateSubjects: Map<string, BehaviorSubject<boolean>> =
    new Map();

  constructor() {
    console.log("[EngineToolbarManager] Initialized");
    // TODO: Move more state management logic from EngineToolbar.store.ts
  }

  public createToolbarForPanel(
    apiId: string,
    parentElement: HTMLElement,
    dockviewController: any, // Pass dependencies needed by EngineToolbar
    parentEngine: CompositeEnginePanel, // Pass dependencies needed by EngineToolbar
  ): EngineToolbar | null {
    console.log(
      `[EngineToolbarManager] Request to create toolbar for ${apiId}`,
    );

    // 1. Check if toolbar already exists for apiId
    if (this.activeToolbars.has(apiId)) {
      console.warn(
        `[EngineToolbarManager] Toolbar already exists for ${apiId}. Returning existing instance.`,
      );
      return this.activeToolbars.get(apiId) || null;
    }

    try {
      // Create and store the BehaviorSubject FIRST
      const expansionSubject = new BehaviorSubject<boolean>(true); // Default to expanded
      this.toolbarExpansionStateSubjects.set(apiId, expansionSubject);
      console.log(
        `[EngineToolbarManager] Expansion state subject created for ${apiId}`,
      );

      // Now instantiate the EngineToolbar
      const newToolbar = new EngineToolbar(
        apiId,
        dockviewController,
        parentEngine,
      );
      // Toolbar constructor will call subscribeToExpansionState, which should now find the subject

      this.activeToolbars.set(apiId, newToolbar);

      // 4. Append the toolbar element to parentElement
      parentElement.appendChild(newToolbar.element);
      console.log(
        `[EngineToolbarManager] Toolbar created and appended for ${apiId}`,
      );

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
    console.log(
      `[EngineToolbarManager] Request to dispose toolbar for ${apiId}`,
    );
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
        console.log(`[EngineToolbarManager] Toolbar disposed for ${apiId}`);
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
    // 4. TODO: Remove related state from EngineToolbar.store.ts (or internal state)
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
      console.log(
        `[EngineToolbarManager] Toggled expansion for ${apiId} to ${newState}`,
      );
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
    console.log("[EngineToolbarManager] Dependencies set.");
  }

  // TODO: Add methods corresponding to EngineToolbar.store.ts actions if needed externally,
  // e.g., toggleToolbar(apiId), registerButton(apiId, config), etc.
  // OR keep that logic internal if only managed via ToolbarRegistration.
}
