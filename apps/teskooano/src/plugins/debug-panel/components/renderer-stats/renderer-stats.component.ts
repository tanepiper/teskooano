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
        <tr>
          <td>Prediction Lines</td>
          <td id="stat-prediction-lines">...</td>
        </tr>
        <tr>
          <td>Prediction Segments</td>
          <td id="stat-prediction-segments">...</td>
        </tr>
        <tr>
          <td>Trail Lines</td>
          <td id="stat-trail-lines">...</td>
        </tr>
        <tr>
          <td>Trail Segments</td>
          <td id="stat-trail-segments">...</td>
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

  public renderStats(stats: {
    predictionLines: number;
    predictionSegments: number;
    trailLines: number;
    trailSegments: number;
    drawCalls: number;
    triangles: number;
  }): void {
    const safeUpdate = (id: string, value: string | number) => {
      const el = this.shadowRoot?.getElementById(id);
      if (el) el.textContent = String(value);
    };

    safeUpdate("stat-draw-calls", stats.drawCalls.toLocaleString());
    safeUpdate("stat-triangles", stats.triangles.toLocaleString());
    safeUpdate("stat-prediction-lines", stats.predictionLines.toLocaleString());
    safeUpdate(
      "stat-prediction-segments",
      stats.predictionSegments.toLocaleString(),
    );
    safeUpdate("stat-trail-lines", stats.trailLines.toLocaleString());
    safeUpdate("stat-trail-segments", stats.trailSegments.toLocaleString());
  }
}
