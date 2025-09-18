import type { CelestialDebugger } from "@teskooano/core-debug";
import "../../../../core/components/card/index.js";

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: block;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin: 10px 0;
    }
    .stat-item {
      background: var(--color-surface-2);
      padding: 8px;
      border-radius: 4px;
      text-align: center;
    }
    .stat-value {
      font-size: 1.2em;
      font-weight: bold;
      color: var(--color-primary);
    }
    .stat-label {
      font-size: 0.9em;
      color: var(--color-text-secondary);
    }
    .hierarchy-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    .hierarchy-table th,
    .hierarchy-table td {
      padding: 4px 8px;
      text-align: left;
      border-bottom: 1px solid var(--color-border);
    }
    .hierarchy-table th {
      background: var(--color-surface-2);
      font-weight: bold;
    }
    .depth-indicator {
      display: inline-block;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      margin-right: 4px;
    }
    .depth-0 { background: #ff6b6b; }
    .depth-1 { background: #4ecdc4; }
    .depth-2 { background: #45b7d1; }
    .depth-3 { background: #96ceb4; }
    .depth-4 { background: #feca57; }
    .depth-5+ { background: #ff9ff3; }
  </style>
  <teskooano-card>
    <span slot="title">Hierarchy Statistics</span>
    <div class="stats-grid">
      <div class="stat-item">
        <div class="stat-value" id="total-objects">0</div>
        <div class="stat-label">Total Objects</div>
      </div>
      <div class="stat-item">
        <div class="stat-value" id="max-depth">0</div>
        <div class="stat-label">Max Depth</div>
      </div>
      <div class="stat-item">
        <div class="stat-value" id="root-count">0</div>
        <div class="stat-label">Root Objects</div>
      </div>
      <div class="stat-item">
        <div class="stat-value" id="avg-children">0</div>
        <div class="stat-label">Avg Children</div>
      </div>
    </div>
    <div id="hierarchy-details"></div>
  </teskooano-card>
`;

export class HierarchyStatsComponent extends HTMLElement {
  private celestialDebugger: CelestialDebugger;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));

    // Get the celestial debugger instance
    this.celestialDebugger = (window as any).celestialDebugger;
  }

  public updateStats(): void {
    if (!this.celestialDebugger) return;

    const stats = this.celestialDebugger.getHierarchyStats();
    const debugInfo = this.celestialDebugger.getHierarchyDebugInfo();

    // Update basic stats
    this.shadowRoot!.getElementById("total-objects")!.textContent =
      stats.totalObjects.toString();
    this.shadowRoot!.getElementById("max-depth")!.textContent =
      stats.maxDepth.toString();
    this.shadowRoot!.getElementById("root-count")!.textContent =
      stats.rootCount.toString();
    this.shadowRoot!.getElementById("avg-children")!.textContent =
      stats.averageChildrenPerParent.toFixed(1);

    // Update detailed hierarchy table
    this.renderHierarchyTable(debugInfo.entries);
  }

  private renderHierarchyTable(entries: any[]): void {
    const container = this.shadowRoot!.getElementById("hierarchy-details");
    if (!container) return;

    if (entries.length === 0) {
      container.innerHTML = "<p>No hierarchy data available.</p>";
      return;
    }

    const table = document.createElement("table");
    table.className = "hierarchy-table";

    // Create header
    const header = document.createElement("thead");
    header.innerHTML = `
      <tr>
        <th>Object</th>
        <th>Type</th>
        <th>Depth</th>
        <th>Children</th>
        <th>Descendants</th>
        <th>Parent</th>
      </tr>
    `;
    table.appendChild(header);

    // Create body
    const body = document.createElement("tbody");
    entries.forEach((entry) => {
      const row = document.createElement("tr");

      const depthClass = entry.depth > 5 ? "depth-5+" : `depth-${entry.depth}`;
      const depthIndicator = `<span class="depth-indicator ${depthClass}"></span>`;

      row.innerHTML = `
        <td>${depthIndicator}${entry.name}</td>
        <td>${entry.type}</td>
        <td>${entry.depth}</td>
        <td>${entry.childrenCount}</td>
        <td>${entry.descendantCount}</td>
        <td>${entry.parentId || "Root"}</td>
      `;
      body.appendChild(row);
    });

    table.appendChild(body);
    container.innerHTML = "";
    container.appendChild(table);
  }
}

customElements.define("hierarchy-stats", HierarchyStatsComponent);
