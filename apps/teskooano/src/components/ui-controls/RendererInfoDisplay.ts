import { simulationState } from "@teskooano/core-state";

// Helper to format vectors nicely
function formatVector(
  vec?: { x: number; y: number; z: number },
  precision: number = 0
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

// Assuming simulationState.get() provides data potentially matching this structure
interface ExtendedSimulationState {
  time?: number;
  timeScale?: number;
  paused?: boolean;
  physicsEngine?: string;
  camera?: {
    position?: { x: number; y: number; z: number };
    target?: { x: number; y: number; z: number };
    fov?: number;
  };
  renderer?: {
    fps?: number;
    drawCalls?: number;
    triangles?: number;
    memory?: { usedJSHeapSize?: number }; // Match structure from performance.memory
  };
}

export class RendererInfoDisplay extends HTMLElement {
  private fpsValue: HTMLElement | null = null;
  private drawCallsValue: HTMLElement | null = null;
  private trianglesValue: HTMLElement | null = null;
  private memoryValue: HTMLElement | null = null;
  private camPosValue: HTMLElement | null = null;
  private fovValue: HTMLElement | null = null;

  private unsubscribeSimState: (() => void) | null = null;

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

    // Subscribe to the simulation state
    this.unsubscribeSimState = simulationState.subscribe(this.updateDisplay);
    this.updateDisplay(); // Initial update

    // If renderer pushes updates less frequently than desired FPS display:
    // requestAnimationFrame(this.fpsTick); // Alternative: calculate FPS here
  }

  disconnectedCallback() {
    this.unsubscribeSimState?.();
  }

  // // --- Optional: FPS Calculation within component ---
  // // Use if state updates for FPS aren't frequent enough
  // private fpsTick = (now: number): void => {
  //     if (!this.isConnected) return; // Stop if disconnected
  //     this.frameCount++;
  //     if (now - this.lastFPSUpdate >= this.fpsUpdateInterval) {
  //         this.calculatedFPS = Math.round((this.frameCount * 1000) / (now - this.lastFPSUpdate));
  //         this.frameCount = 0;
  //         this.lastFPSUpdate = now;
  //         // Force update display if state doesn't trigger frequently enough
  //         if (!simulationState.get().renderer?.fps) {
  //              this.updateDisplay(simulationState.get()); // Pass current state
  //         }
  //     }
  //     requestAnimationFrame(this.fpsTick);
  // }
  // // --- End Optional FPS Calc ---

  private updateDisplay = (): void => {
    const state = simulationState.get() as ExtendedSimulationState; // Cast to locally defined interface
    const rendererStats = state.renderer;

    // --- FPS ---
    const fps = rendererStats?.fps;
    if (this.fpsValue) {
      this.fpsValue.textContent = fps?.toFixed(0) ?? "-";
      // Color coding based on value
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
      this.drawCallsValue.textContent = formatNumber(rendererStats?.drawCalls);
    }

    // --- Triangles ---
    if (this.trianglesValue) {
      this.trianglesValue.textContent = formatNumber(rendererStats?.triangles);
    }

    // --- Memory ---
    if (this.memoryValue) {
      this.memoryValue.textContent = formatMemory(
        rendererStats?.memory?.usedJSHeapSize
      );
    }

    // --- Camera Position ---
    if (this.camPosValue) {
      this.camPosValue.textContent = formatVector(state.camera?.position, 0);
    }

    // --- FOV ---
    if (this.fovValue) {
      this.fovValue.textContent = state.camera?.fov
        ? `${state.camera.fov.toFixed(0)}°`
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
