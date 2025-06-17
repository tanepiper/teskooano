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
    const orbitsManager = this.parentPanel?.orbitManager;
    const rendererStats = this.parentPanel?.getRendererStats();

    if (!orbitsManager) {
      return;
    }

    const predictionManager = orbitsManager.getPredictionManager();
    const trailManager = orbitsManager.getTrailManager();

    const predictionLineCount = predictionManager.predictionLines.size;
    let predictionSegmentCount = 0;
    for (const line of predictionManager.predictionLines.values()) {
      predictionSegmentCount += line.geometry.drawRange.count;
    }

    const trailLineCount = trailManager.trailLines.size;
    let trailSegmentCount = 0;
    for (const line of trailManager.trailLines.values()) {
      trailSegmentCount += line.geometry.drawRange.count;
    }

    this.view.renderStats({
      predictionLines: predictionLineCount,
      predictionSegments: predictionSegmentCount,
      trailLines: trailLineCount,
      trailSegments: trailSegmentCount,
      drawCalls: rendererStats?.drawCalls ?? 0,
      triangles: rendererStats?.triangles ?? 0,
    });
  }

  public renderSystemHierarchy(): void {
    const hierarchy = celestialDebugger.getSystemHierarchy();
    this.view.renderHierarchy(hierarchy);
  }
}
