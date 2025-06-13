import {
  celestialDebugger,
  type SystemHierarchyNode,
} from "@teskooano/core-debug";
import type { CompositeEnginePanel } from "../../engine-panel/panels/composite-panel/CompositeEnginePanel";
import type { DebugPanel } from "../view/debug-panel.view";

/**
 * SVG icon for the debug panel toolbar button.
 * This is kept here to be co-located with the controller that uses it.
 */
const bugIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" style="width: 16px; height: 16px;">
  <path d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM8 2.5A1.5 1.5 0 1 0 8 5.5 1.5 1.5 0 0 0 8 2.5Z"/>
  <path d="M13.25 8A1.25 1.25 0 0 0 12 9.25v.432l-.22.66a5.53 5.53 0 0 0-1.047 1.638 1.25 1.25 0 1 0-2.322-.864 3.03 3.03 0 0 1 .52-1.378l.009-.015.015-.024.03-.046.052-.08A4.5 4.5 0 0 0 10 7.5H6a4.5 4.5 0 0 0-1.287 1.133l.052.08.03.046.015-.024.009.015c.13.21.298.44.473.682a3.03 3.03 0 0 1 .568 1.352 1.25 1.25 0 1 0-2.321-.864 5.53 5.53 0 0 0-1.048-1.638l-.22-.66V9.25A1.25 1.25 0 1 0 1.5 8v-.25a1.25 1.25 0 0 0-1-1.225V6a1 1 0 0 1 1-1h.5a1 1 0 0 1 1 1v.25a.25.25 0 0 0 .25.25h8.5a.25.25 0 0 0 .25-.25V6a1 1 0 0 1 1-1h.5a1 1 0 0 1 1 1v.525a1.25 1.25 0 0 0-1 1.225V8Z"/>
</svg>
`;

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
    console.log(
      "DebugPanelController initialized for parent:",
      this.parentPanel?.id,
    );
    this.updateData();
  }

  public dispose(): void {
    // No-op, interval is now managed by the view
  }

  public updateData(): void {
    console.log("[DebugPanel] Tick: Firing update...");
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
    console.log(
      `[DebugPanel] Stats updated. Trail Segments: ${trailSegmentCount}`,
    );
  }

  public renderSystemHierarchy(): void {
    const hierarchy = celestialDebugger.getSystemHierarchy();
    this.view.renderHierarchy(hierarchy);
  }

  // Methods to fetch and render data will be added here.
}
