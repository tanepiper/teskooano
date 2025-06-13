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
      display: block;
      height: 100%;
      width: 100%;
      overflow: auto;
      padding: 1rem;
      box-sizing: border-box;
    }
  </style>
  <div class="container">
    <h2>System Hierarchy</h2>
    <div id="hierarchy-container"></div>
  </div>
`;

export class DebugPanel extends HTMLElement implements IContentRenderer {
  private controller!: DebugPanelController;
  readonly element = this;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
  }

  // Dockview API
  init(params: GroupPanelPartInitParameters): void {
    const parentPanel = (params.params as any)
      ?.parentInstance as CompositeEnginePanel;
    this.controller = new DebugPanelController(this, parentPanel);
  }

  // Standard web component lifecycle
  connectedCallback(): void {
    // Controller is initialized in init() by Dockview
  }

  /**
   * Renders the celestial system hierarchy as a nested list.
   * @param nodes - The root nodes of the system hierarchy.
   */
  public renderHierarchy(nodes: SystemHierarchyNode[]): void {
    const container = this.shadowRoot!.getElementById("hierarchy-container");
    if (!container) return;

    if (nodes.length === 0) {
      container.innerHTML = "<p>No celestial objects loaded.</p>";
      return;
    }

    const buildList = (nodes: SystemHierarchyNode[]): HTMLUListElement => {
      const ul = document.createElement("ul");
      ul.style.paddingLeft = "20px";
      nodes.forEach((node) => {
        const li = document.createElement("li");
        li.textContent = `${node.name} (${node.type})`;
        li.dataset.id = node.id;
        if (node.children && node.children.length > 0) {
          li.appendChild(buildList(node.children));
        }
        ul.appendChild(li);
      });
      return ul;
    };

    container.innerHTML = ""; // Clear previous content
    container.appendChild(buildList(nodes));
  }
}
