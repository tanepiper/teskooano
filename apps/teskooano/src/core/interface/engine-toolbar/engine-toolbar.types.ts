import type {
  DockviewApi,
  IDockviewPanel,
  DockviewPanelApi,
} from "dockview-core";
import type { Observable } from "rxjs";

/**
 * Defines the essential Dockview API controls that EngineToolbar needs
 * from its hosting DockviewController or a similar provider.
 */
export interface IDockviewPanelControls {
  api: DockviewApi;
  addFloatingPanel: (
    options: any, // Replace with specific AddPanelOptions from Dockview if possible
    position?: { top: number; left: number; width: number; height: number },
  ) => DockviewPanelApi | null;
  onPanelRemoved$: Observable<string>; // Observable emitting the ID of the removed panel
}
