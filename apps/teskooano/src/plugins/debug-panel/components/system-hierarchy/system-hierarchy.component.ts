import type { SystemHierarchyNode } from "@teskooano/core-debug";
import "../../../../core/components/card/index.js";

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: block;
    }
    #hierarchy-content ul {
      padding-left: 20px;
      margin: 0;
      list-style-type: none;
    }
    #hierarchy-content li {
      padding: 2px 0;
    }
  </style>
  <teskooano-card>
    <span slot="title">System Hierarchy</span>
    <div id="hierarchy-content"></div>
  </teskooano-card>
`;

export class SystemHierarchyComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
  }

  public renderHierarchy(nodes: SystemHierarchyNode[]): void {
    const container = this.shadowRoot!.getElementById("hierarchy-content");
    if (!container) return;

    if (nodes.length === 0) {
      container.innerHTML = "<p>No celestial objects loaded.</p>";
      return;
    }

    const buildList = (nodes: SystemHierarchyNode[]): HTMLUListElement => {
      const ul = document.createElement("ul");
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
