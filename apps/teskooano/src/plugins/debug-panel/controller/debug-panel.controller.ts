import { celestialDebugger } from "@teskooano/core-debug";
import type { SystemHierarchyNode } from "@teskooano/core-debug";
import type { CompositeEnginePanel } from "../../engine-panel/panels/composite-panel/CompositeEnginePanel";

/**
 * Minimal view interface required by DebugPanelController.
 * Both the legacy HTMLElement view and the Svelte panel adapter implement this.
 */
export interface DebugPanelView {
  renderStats(stats: { drawCalls: number; triangles: number }): void;
  renderHierarchy(nodes: SystemHierarchyNode[]): void;
  getHierarchyStatsComponent(): { updateStats?: () => void } | null;
}

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
  private view: DebugPanelView;
  private parentPanel: CompositeEnginePanel | null;

  constructor(view: DebugPanelView, parentPanel: CompositeEnginePanel | null) {
    this.view = view;
    this.parentPanel = parentPanel;
    this.initialize();
  }

  private initialize(): void {
    this.updateData();
  }

  public dispose(): void {
    // No-op, interval is now managed by the view/panel
  }

  public updateData(): void {
    this.renderSystemHierarchy();
    this.renderRendererStats();
    this.renderHierarchyStats();
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

  public renderHierarchyStats(): void {
    const hierarchyStatsComponent = this.view.getHierarchyStatsComponent();
    if (
      hierarchyStatsComponent &&
      typeof hierarchyStatsComponent.updateStats === "function"
    ) {
      hierarchyStatsComponent.updateStats();
    }
  }
}
