import "../../../../core/components/card/index.js";

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: block;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th,
    td {
      padding: 0.25rem 0.5rem;
      text-align: left;
      border-bottom: 1px solid var(--border-color-soft);
    }
    th {
      font-weight: var(--font-weight-bold);
      color: var(--text-color-secondary);
    }
    tbody tr:last-child td {
      border-bottom: none;
    }
    td:last-child {
      text-align: right;
    }
  </style>
  <teskooano-card variant="fluid">
    <span slot="title">Renderer Stats</span>
    <table>
      <thead>
        <tr>
          <th>Property</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Draw Calls</td>
          <td id="stat-draw-calls">...</td>
        </tr>
        <tr>
          <td>Triangles</td>
          <td id="stat-triangles">...</td>
        </tr>
      </tbody>
    </table>
  </teskooano-card>
`;

export class RendererStatsComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
  }

  public renderStats(stats: { drawCalls: number; triangles: number }): void {
    const safeUpdate = (id: string, value: string | number) => {
      const el = this.shadowRoot?.getElementById(id);
      if (el) el.textContent = String(value);
    };

    safeUpdate("stat-draw-calls", stats.drawCalls.toLocaleString());
    safeUpdate("stat-triangles", stats.triangles.toLocaleString());
  }
}
