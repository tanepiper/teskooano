import {
  type IContentRenderer,
  type GroupPanelPartInitParameters,
} from "dockview-core";
import type { SystemHierarchyNode } from "@teskooano/core-debug";
import { DebugPanelController } from "../controller/debug-panel.controller";
import type { CompositeEnginePanel } from "../../engine-panel/panels/composite-panel/CompositeEnginePanel";

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      height: 100%;
      width: 100%;
      overflow: auto;
      padding: 1rem;
      box-sizing: border-box;
      font-family: var(--font-family-monospace);
      font-size: var(--font-size-sm);
    }
  </style>
  <teskooano-renderer-stats></teskooano-renderer-stats>
  <teskooano-system-hierarchy></teskooano-system-hierarchy>
  <hierarchy-stats></hierarchy-stats>
`;

export class DebugPanel extends HTMLElement implements IContentRenderer {
  private controller!: DebugPanelController;
  private updateInterval: number | null = null;
  readonly element = this;

  // Component refs
  private statsComponent!: HTMLElement;
  private hierarchyComponent!: HTMLElement;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
  }

  // Dockview API
  init(params: GroupPanelPartInitParameters): void {
    // REQUIRE panel API ID - no fallback
    if (!params.api?.id) {
      throw new Error("[DebugPanel] Panel ID is required but not provided");
    }

    const parentPanel = (params.params as any)
      ?.parentInstance as CompositeEnginePanel;

    // Set data-panel-id attribute for declarative access
    // For child panels, use parent panel ID if available, otherwise use own ID
    const panelId = parentPanel?.panelId || params.api.id;
    this.setAttribute("data-panel-id", panelId);

    this.controller = new DebugPanelController(this, parentPanel);
  }

  // Standard web component lifecycle
  connectedCallback(): void {
    this.statsComponent = this.shadowRoot!.querySelector(
      "teskooano-renderer-stats",
    ) as HTMLElement;
    this.hierarchyComponent = this.shadowRoot!.querySelector(
      "teskooano-system-hierarchy",
    ) as HTMLElement;
    this.startUpdates();
  }

  disconnectedCallback(): void {
    this.stopUpdates();
    this.controller?.dispose();
  }

  private startUpdates(): void {
    if (this.updateInterval) return; // Already running
    this.updateInterval = window.setInterval(() => {
      this.controller?.updateData();
    }, 2000);
  }

  private stopUpdates(): void {
    if (this.updateInterval) {
      window.clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Updates the renderer statistics display.
   * @param stats - The statistics to render.
   */
  public renderStats(stats: { drawCalls: number; triangles: number }): void {
    (this.statsComponent as any)?.renderStats(stats);
  }

  /**
   * Renders the celestial system hierarchy as a nested list.
   * @param nodes - The root nodes of the system hierarchy.
   */
  public renderHierarchy(nodes: SystemHierarchyNode[]): void {
    (this.hierarchyComponent as any)?.renderHierarchy(nodes);
  }
}
