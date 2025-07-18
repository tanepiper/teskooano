import { celestialDebugger } from "@teskooano/core-debug";
import type { CompositeEnginePanel } from "../../engine-panel/panels/composite-panel/CompositeEnginePanel";
import type { DebugPanel } from "../view/debug-panel.view";

/**
 * Controller for the Debug Panel.
 *
 * This class will be responsible for:
 * - Fetching data from the debug services (`celestialDebugger`, `globalStateDebugger`).
 * - Managing the state of the panel.
 * - Handling user interactions.
 * - Updating the view with new data.
 */
export class DebugPanelController {
  private view: DebugPanel;
  private parentPanel: CompositeEnginePanel | null;

  constructor(view: DebugPanel, parentPanel: CompositeEnginePanel | null) {
    this.view = view;
    this.parentPanel = parentPanel;
    this.initialize();
  }

  private initialize(): void {
    this.updateData();
  }

  public dispose(): void {
    // No-op, interval is now managed by the view
  }

  public updateData(): void {
    this.renderSystemHierarchy();
    this.renderRendererStats();
  }

  private renderRendererStats(): void {
    const rendererStats = this.parentPanel?.getRendererStats();

    this.view.renderStats({
      drawCalls: rendererStats?.drawCalls ?? 0,
      triangles: rendererStats?.triangles ?? 0,
    });
  }

  public renderSystemHierarchy(): void {
    const hierarchy = celestialDebugger.getSystemHierarchy();
    this.view.renderHierarchy(hierarchy);
  }
}
