import { ModularSpaceRenderer } from "@teskooano/renderer-threejs";
// Import the shared RendererStats type
import type { RendererStats } from "@teskooano/renderer-threejs-core";
// Import Dockview types and panel registry
import { GroupPanelPartInitParameters, IContentRenderer } from "dockview-core";
// Import the type from the UI Plugin package
import { PanelToolbarItemConfig } from "@teskooano/ui-plugin";
// Correct the import path for CompositeEnginePanel again
import type { CompositeEnginePanel } from "../engine-panel/panels/CompositeEnginePanel"; // Import for type checking

// Import Fluent UI Icons
import DataUsageIcon from "@fluentui/svg-icons/icons/data_usage_24_regular.svg?raw";

// Define expected params
interface RendererInfoParams {
  parentEnginePanelId?: string;
}

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
    .controls {
      margin-top: 8px;
      display: flex;
      justify-content: center;
    }
    button {
      background: var(--color-button-background, #444);
      color: var(--color-button-text, #fff);
      border: 1px solid var(--color-border, #555);
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 0.8em;
      cursor: pointer;
    }
    button:hover {
      background: var(--color-button-hover, #555);
    }
    .status {
      margin-top: 4px;
      font-size: 0.8em;
      color: var(--color-text-secondary, #aaa);
      text-align: center;
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
  <div class="controls">
    <button id="refresh-button">Refresh Stats</button>
  </div>
  <div class="status" id="connection-status">Waiting for renderer...</div>
`;

export class RendererInfoDisplay
  extends HTMLElement
  implements IContentRenderer
{
  private fpsValue: HTMLElement | null = null;
  private drawCallsValue: HTMLElement | null = null;
  private trianglesValue: HTMLElement | null = null;
  private memoryValue: HTMLElement | null = null;
  private camPosValue: HTMLElement | null = null;
  private fovValue: HTMLElement | null = null;
  private connectionStatus: HTMLElement | null = null;
  private refreshButton: HTMLElement | null = null;

  private _renderer: ModularSpaceRenderer | null = null;
  private _updateInterval: number | null = null;
  private _parentPanel: CompositeEnginePanel | null = null; // Store parent reference
  private _boundHandleRendererReady: (event: Event) => void; // Store bound listener
  private _attemptCount: number = 0;
  private _maxAttempts: number = 10;
  private _connectionAttemptTimer: number | null = null;

  // --- Static Configuration ---
  public static readonly componentName = "renderer-info-display";

  public static registerToolbarButtonConfig(): PanelToolbarItemConfig {
    return {
      id: "renderer_info", // Base ID
      target: "engine-toolbar", // Add the required target property
      iconSvg: DataUsageIcon,
      title: "Renderer Info",
      type: "panel",
      componentName: this.componentName,
      panelTitle: "Renderer Info",
      behaviour: "toggle",
    };
  }
  // --- End Static Configuration ---

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
    // Bind event handlers
    this._boundHandleRendererReady = this.handleRendererReady.bind(this);
    this.handleRefreshClick = this.handleRefreshClick.bind(this);
  }

  connectedCallback() {
    this.fpsValue = this.shadowRoot!.getElementById("fps-value");
    this.drawCallsValue = this.shadowRoot!.getElementById("draw-calls-value");
    this.trianglesValue = this.shadowRoot!.getElementById("triangles-value");
    this.memoryValue = this.shadowRoot!.getElementById("memory-value");
    this.camPosValue = this.shadowRoot!.getElementById("cam-pos-value");
    this.fovValue = this.shadowRoot!.getElementById("fov-value");
    this.connectionStatus =
      this.shadowRoot!.getElementById("connection-status");
    this.refreshButton = this.shadowRoot!.getElementById("refresh-button");

    if (this.refreshButton) {
      this.refreshButton.addEventListener("click", this.handleRefreshClick);
    }

    // Add listener if parent panel is already set
    if (this._parentPanel?.element) {
      this._parentPanel.element.addEventListener(
        "renderer-ready",
        this._boundHandleRendererReady,
      );

      this.updateConnectionStatus("Listening for renderer events...");
    }

    // Attempt to get renderer from parent if it exists
    this.tryConnectToRenderer();
  }

  disconnectedCallback() {
    this.stopUpdateTimer();
    this.stopConnectionAttempts();

    // Remove event listeners
    if (this.refreshButton) {
      this.refreshButton.removeEventListener("click", this.handleRefreshClick);
    }

    // Remove renderer-ready listener
    if (this._parentPanel?.element) {
      this._parentPanel.element.removeEventListener(
        "renderer-ready",
        this._boundHandleRendererReady,
      );
    }
  }

  private handleRefreshClick() {
    this.updateConnectionStatus("Manual refresh triggered");

    if (this._renderer) {
      this.fetchAndUpdateDisplay();
      this.updateConnectionStatus("Stats refreshed");
    } else {
      this.tryConnectToRenderer();
    }
  }

  private updateConnectionStatus(message: string): void {
    if (this.connectionStatus) {
      this.connectionStatus.textContent = message;
    }
  }

  public setRenderer(renderer: ModularSpaceRenderer): void {
    this._renderer = renderer;
    this.stopConnectionAttempts();

    if (this._renderer && this.isConnected) {
      this.updateConnectionStatus("Renderer connected! Starting updates...");
      this.startUpdateTimer();
    } else if (!renderer) {
      this.updateConnectionStatus("No renderer provided");
    } else if (!this.isConnected) {
      this.updateConnectionStatus("Component not connected to DOM");
    }
  }

  // Try multiple approaches to get the renderer
  private tryConnectToRenderer(): void {
    this.updateConnectionStatus(
      `Attempting to connect to renderer (${this._attemptCount + 1}/${this._maxAttempts})...`,
    );

    // Stop any existing attempts
    this.stopConnectionAttempts();

    // Three approaches to try:

    // 1. Try getting renderer directly from parent panel if set
    if (this._parentPanel) {
      try {
        // Check if parent has a getRenderer method
        if (typeof this._parentPanel.getRenderer === "function") {
          const renderer = this._parentPanel.getRenderer();
          if (renderer) {
            this.setRenderer(renderer);
            return;
          }
        }
      } catch (error) {
        console.error(
          "[RendererInfoDisplay] Error getting renderer from parent:",
          error,
        );
      }
    }

    // 2. Try finding the CompositeEnginePanel in the DOM
    if (!this._parentPanel) {
      const enginePanels = document.querySelectorAll("composite-engine-panel");
      if (enginePanels.length > 0) {
        // Try each panel
        for (let i = 0; i < enginePanels.length; i++) {
          const panel = enginePanels[i] as any;
          if (panel && typeof panel.getRenderer === "function") {
            try {
              const renderer = panel.getRenderer();
              if (renderer) {
                this._parentPanel = panel;
                this.setRenderer(renderer);
                return;
              }
            } catch (error) {
              console.error(
                `[RendererInfoDisplay] Error getting renderer from DOM panel ${i}:`,
                error,
              );
            }
          }
        }
      }
    }

    // If we've tried too many times, stop
    this._attemptCount++;
    if (this._attemptCount >= this._maxAttempts) {
      console.warn("[RendererInfoDisplay] Max connection attempts reached");
      this.updateConnectionStatus(
        "Could not connect to renderer after multiple attempts. Try refreshing manually.",
      );
      return;
    }

    // Schedule another attempt
    this._connectionAttemptTimer = window.setTimeout(() => {
      this.tryConnectToRenderer();
    }, 1000);
  }

  private stopConnectionAttempts(): void {
    if (this._connectionAttemptTimer !== null) {
      window.clearTimeout(this._connectionAttemptTimer);
      this._connectionAttemptTimer = null;
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
    if (!this._renderer?.animationLoop) {
      console.warn(
        "[RendererInfoDisplay] fetchAndUpdateDisplay: No renderer or animation loop found.",
      );
      this.updateConnectionStatus("No animation loop found");
      return;
    }

    try {
      const stats = this._renderer.animationLoop.getCurrentStats();

      this.updateDisplay(stats);
      this.updateConnectionStatus(
        "Stats updated at " + new Date().toLocaleTimeString(),
      );
    } catch (error) {
      console.error("[RendererInfoDisplay] Error fetching stats:", error);
      this.updateConnectionStatus(
        "Error fetching stats: " + (error as Error).message,
      );
    }
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

  // Dockview panel lifecycle method
  public init(parameters: GroupPanelPartInitParameters): void {
    const params = parameters.params as {
      parentInstance?: CompositeEnginePanel;
    };

    // Reset attempt counter
    this._attemptCount = 0;

    if (params?.parentInstance) {
      if (
        params.parentInstance instanceof Object &&
        "getRenderer" in params.parentInstance
      ) {
        // Store the parent instance
        this._parentPanel = params.parentInstance;

        this.updateConnectionStatus(
          "Parent panel found, attempting to connect...",
        );

        // Attempt direct connection first
        try {
          const renderer = params.parentInstance.getRenderer();
          if (renderer) {
            this.setRenderer(renderer);
            return; // Success!
          } else {
            console.warn(
              `[RendererInfoDisplay] Parent instance found, but getRenderer() returned undefined.`,
            );
          }
        } catch (error) {
          console.error(
            "[RendererInfoDisplay] Error getting renderer from parent:",
            error,
          );
        }

        // Add listener as backup
        if (this.isConnected && this._parentPanel?.element) {
          this._parentPanel.element.removeEventListener(
            "renderer-ready",
            this._boundHandleRendererReady,
          ); // Ensure no duplicates
          this._parentPanel.element.addEventListener(
            "renderer-ready",
            this._boundHandleRendererReady,
          );

          // Also try connecting through other methods
          this.tryConnectToRenderer();
        }
      } else {
        console.error(
          "[RendererInfoDisplay] Received parentInstance, but it doesn't seem to be a valid CompositeEnginePanel.",
        );
        this.updateConnectionStatus("Invalid parent panel reference");
        this.tryConnectToRenderer(); // Try other methods
      }
    } else {
      console.warn(
        "[RendererInfoDisplay] Initialization parameters did not include 'parentInstance'. Cannot link to renderer directly.",
      );
      this.updateConnectionStatus("No parent panel reference provided");
      this.tryConnectToRenderer(); // Try other methods
    }
  }

  // Event handler for when the parent's renderer is ready
  private handleRendererReady(event: Event): void {
    const customEvent = event as CustomEvent<{
      renderer: ModularSpaceRenderer;
    }>;
    if (customEvent.detail?.renderer) {
      this.updateConnectionStatus("Received renderer from ready event");
      this.setRenderer(customEvent.detail.renderer);
    } else {
      console.warn(
        "[RendererInfoDisplay] Received renderer-ready event without renderer detail.",
      );
      this.updateConnectionStatus("Received empty renderer event");
    }
  }

  // ADD REQUIRED GETTER FOR IContentRenderer
  get element(): HTMLElement {
    return this;
  }
}

// Define the custom element
const ELEMENT_TAG = "renderer-info-display";
if (!customElements.get(ELEMENT_TAG)) {
  customElements.define(ELEMENT_TAG, RendererInfoDisplay);
}

// Export the class if needed elsewhere, though definition is the main part
// export { RendererInfoDisplay };
