import { ModularSpaceRenderer } from "@teskooano/renderer-threejs";
// Import the shared RendererStats type
import type { RendererStats } from "@teskooano/renderer-threejs-core";

// Helper to format vectors nicely
function formatVector(
  vec?: { x: number; y: number; z: number },
  precision: number = 0,
): string {
  if (!vec) return "(?, ?, ?)";
  const factor = Math.pow(10, precision);
  const x = Math.round(vec.x * factor) / factor;
  const y = Math.round(vec.y * factor) / factor;
  const z = Math.round(vec.z * factor) / factor;
  return `(${x.toLocaleString()}, ${y.toLocaleString()}, ${z.toLocaleString()})`;
}

// Helper to format large numbers
function formatNumber(num?: number): string {
  return num?.toLocaleString() ?? "-";
}

// Helper to format memory
function formatMemory(bytes?: number): string {
  if (bytes === undefined) return "- MB";
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
        display: block;
        font-family: var(--font-family-monospace, monospace);
        font-size: 0.9em;
        color: var(--color-text, #e0e0fc);
    }
    .info-grid {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 4px 10px; /* Row gap, Column gap */
        align-items: center;
    }
    .label {
        color: var(--color-text-secondary, #aaa);
        text-align: right;
    }
    .value {
        font-weight: bold;
        color: var(--color-primary-light, #9fa8da);
    }
    #fps-value {
      /* Dynamic color set in update */
    }
  </style>
  <div class="info-grid">
      <span class="label">FPS:</span>
      <span class="value" id="fps-value">-</span>

      <span class="label">Draw Calls:</span>
      <span class="value" id="draw-calls-value">-</span>

      <span class="label">Triangles:</span>
      <span class="value" id="triangles-value">-</span>

      <span class="label">Memory:</span>
      <span class="value" id="memory-value">-</span>

      <span class="label">Cam Pos:</span>
      <span class="value" id="cam-pos-value">-</span>

      <span class="label">FOV:</span>
      <span class="value" id="fov-value">-</span>
  </div>
`;

export class RendererInfoDisplay extends HTMLElement {
  private fpsValue: HTMLElement | null = null;
  private drawCallsValue: HTMLElement | null = null;
  private trianglesValue: HTMLElement | null = null;
  private memoryValue: HTMLElement | null = null;
  private camPosValue: HTMLElement | null = null;
  private fovValue: HTMLElement | null = null;

  private _renderer: ModularSpaceRenderer | null = null;
  private _updateInterval: number | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    this.fpsValue = this.shadowRoot!.getElementById("fps-value");
    this.drawCallsValue = this.shadowRoot!.getElementById("draw-calls-value");
    this.trianglesValue = this.shadowRoot!.getElementById("triangles-value");
    this.memoryValue = this.shadowRoot!.getElementById("memory-value");
    this.camPosValue = this.shadowRoot!.getElementById("cam-pos-value");
    this.fovValue = this.shadowRoot!.getElementById("fov-value");

    if (this._renderer) {
      this.startUpdateTimer();
    }
  }

  disconnectedCallback() {
    this.stopUpdateTimer();
  }

  public setRenderer(renderer: ModularSpaceRenderer): void {
    this._renderer = renderer;
    if (this.isConnected) {
      this.startUpdateTimer();
    }
  }

  private startUpdateTimer(): void {
    this.stopUpdateTimer();
    this._updateInterval = window.setInterval(() => {
      this.fetchAndUpdateDisplay();
    }, 1000);
    this.fetchAndUpdateDisplay();
  }

  private stopUpdateTimer(): void {
    if (this._updateInterval) {
      window.clearInterval(this._updateInterval);
      this._updateInterval = null;
    }
  }

  private fetchAndUpdateDisplay(): void {
    if (!this._renderer?.animationLoop) return;

    const stats = this._renderer.animationLoop.getCurrentStats();
    this.updateDisplay(stats);
  }

  private updateDisplay = (stats: RendererStats | null): void => {
    // --- FPS ---
    const fps = stats?.fps;
    if (this.fpsValue) {
      this.fpsValue.textContent = fps?.toFixed(0) ?? "-";
      if (fps === undefined) {
        this.fpsValue.style.color = "var(--color-text-secondary)";
      } else if (fps >= 55) {
        this.fpsValue.style.color = "var(--color-success, #a5d6a7)"; // Green
      } else if (fps >= 30) {
        this.fpsValue.style.color = "var(--color-warning, #ffcc80)"; // Orange
      } else {
        this.fpsValue.style.color = "var(--color-error, #ef9a9a)"; // Red
      }
    }

    // --- Draw Calls ---
    if (this.drawCallsValue) {
      this.drawCallsValue.textContent = formatNumber(stats?.drawCalls);
    }

    // --- Triangles ---
    if (this.trianglesValue) {
      this.trianglesValue.textContent = formatNumber(stats?.triangles);
    }

    // --- Memory ---
    if (this.memoryValue) {
      this.memoryValue.textContent = formatMemory(
        stats?.memory?.usedJSHeapSize,
      );
    }

    // --- Camera Position ---
    const cameraInfo = stats?.camera;
    if (this.camPosValue) {
      this.camPosValue.textContent = formatVector(cameraInfo?.position, 0);
    }

    // --- FOV ---
    if (this.fovValue) {
      this.fovValue.textContent = cameraInfo?.fov
        ? `${cameraInfo.fov.toFixed(0)}°`
        : "-";
    }
  };
}

// Define the custom element
const ELEMENT_TAG = "renderer-info-display";
if (!customElements.get(ELEMENT_TAG)) {
  customElements.define(ELEMENT_TAG, RendererInfoDisplay);
}

// Export the class if needed elsewhere, though definition is the main part
// export { RendererInfoDisplay };
