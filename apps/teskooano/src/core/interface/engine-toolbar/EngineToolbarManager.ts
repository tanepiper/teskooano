import type { DockviewApi } from "dockview-core";
import { BehaviorSubject, Observable } from "rxjs";
import { EngineToolbar } from "./EngineToolbar";
import {
  EnginePanelWithToolbarToggle,
  IDockviewPanelControls,
} from "./engine-toolbar.types";

export class EngineToolbarManager {
  private dockviewApi: DockviewApi | null = null;

  private activeToolbars: Map<string, EngineToolbar> = new Map();

  private toolbarExpansionStateSubjects: Map<string, BehaviorSubject<boolean>> =
    new Map();

  constructor() {}

  public createToolbarForPanel(
    apiId: string,
    parentElement: HTMLElement,
    dockviewController: IDockviewPanelControls,
    parentEngine: EnginePanelWithToolbarToggle,
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
        dockviewController,
        parentEngine,
      );

      this.activeToolbars.set(apiId, newToolbar);

      parentElement.appendChild(newToolbar.element);

      return newToolbar;
    } catch (error) {
      console.error(
        `[EngineToolbarManager] Failed to create toolbar for ${apiId}:`,
        error,
      );

      return null;
    }
  }

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

  public setDependencies(dependencies: { dockviewApi: DockviewApi }): void {
    this.dockviewApi = dependencies.dockviewApi;
  }
}
