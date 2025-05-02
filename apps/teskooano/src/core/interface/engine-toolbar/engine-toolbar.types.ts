import type { DockviewPanelApi, DockviewApi } from "dockview-core";
import { Observable } from "rxjs";

/** Interface defining the required methods for toggling the toolbar's parent panel */
export interface EnginePanelWithToolbarToggle {
  requestToolbarToggle(): void;
}

/** Interface defining the required Dockview interactions for the toolbar */
export interface IDockviewPanelControls {
  readonly api: DockviewApi;
  readonly onPanelRemoved$: Observable<string>;
  addFloatingPanel(
    contentComponent: any,
    position?: { top: number; left: number; width: number; height: number },
  ): DockviewPanelApi | null;
}
