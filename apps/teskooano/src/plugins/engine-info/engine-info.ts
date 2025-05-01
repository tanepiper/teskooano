import { ModularSpaceRenderer } from "@teskooano/renderer-threejs";
import type { RendererStats } from "@teskooano/renderer-threejs-core";
import { GroupPanelPartInitParameters, IContentRenderer } from "dockview-core";
import { PanelToolbarItemConfig } from "@teskooano/ui-plugin";
import type { CompositeEnginePanel } from "../engine-panel/panels/CompositeEnginePanel";

import DataUsageIcon from "@fluentui/svg-icons/icons/data_usage_24_regular.svg?raw";
import type { RendererInfoParams } from "./types";
import { template } from "./engine-info.template";
import { formatVector, formatNumber, formatMemory } from "./utils/formatters";

/**
 * Frequency in milliseconds for updating renderer stats.
 */
const UPDATE_INTERVAL_MS = 1000;
/**
 * Maximum number of attempts to connect to the renderer before stopping.
 */
const MAX_CONNECTION_ATTEMPTS = 10;
/**
 * Delay in milliseconds between connection attempts.
 */
const CONNECTION_ATTEMPT_DELAY_MS = 2000;

/**
 * FPS thresholds for color coding.
 */
const FPS_THRESHOLDS = {
  GOOD: 50,
  WARN: 30,
};

/**
 * Custom Element `renderer-info-display`.
 *
 * Displays real-time statistics from the `ModularSpaceRenderer`, such as FPS,
 * draw calls, triangle count, memory usage, camera position, and FOV.
 * It attempts to connect to a renderer instance provided by its parent panel
 * and updates the displayed information periodically.
 *
 * Implements Dockview `IContentRenderer` to be used as panel content.
 */
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
  private refreshButton: HTMLButtonElement | null = null;

  private _renderer: ModularSpaceRenderer | null = null;
  private _updateInterval: number | null = null;
  private _parentPanel: CompositeEnginePanel | null = null;
  private _boundHandleRendererReady: (event: Event) => void;
  private _connectionAttemptCount: number = 0;
  private _connectionAttemptTimer: number | null = null;

  /**
   * Unique identifier for the custom element.
   */
  public static readonly componentName = "renderer-info-display";

  /**
   * Generates the configuration required to register this panel as a toolbar button.
   *
   * @returns {PanelToolbarItemConfig} Configuration object for the UI plugin manager.
   */
  public static registerToolbarButtonConfig(): PanelToolbarItemConfig {
    return {
      id: "renderer_info",
      target: "engine-toolbar",
      iconSvg: DataUsageIcon,
      title: "Renderer Info",
      type: "panel",
      componentName: this.componentName,
      panelTitle: "Renderer Info",
      behaviour: "toggle",
    };
  }

  /**
   * Constructs the RendererInfoDisplay panel.
   * Sets up the shadow DOM, applies the HTML template, and binds event handlers.
   */
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));

    this._boundHandleRendererReady = this.handleRendererReady.bind(this);
    this.handleRefreshClick = this.handleRefreshClick.bind(this);
    this.updateDisplay = this.updateDisplay.bind(this);
  }

  /**
   * Called when the element is added to the document's DOM.
   * Caches DOM element references and sets up initial event listeners
   * and connection attempts.
   */
  connectedCallback() {
    this.fpsValue = this.shadowRoot!.getElementById("fps-value");
    this.drawCallsValue = this.shadowRoot!.getElementById("draw-calls-value");
    this.trianglesValue = this.shadowRoot!.getElementById("triangles-value");
    this.memoryValue = this.shadowRoot!.getElementById("memory-value");
    this.camPosValue = this.shadowRoot!.getElementById("cam-pos-value");
    this.fovValue = this.shadowRoot!.getElementById("fov-value");
    this.connectionStatus =
      this.shadowRoot!.getElementById("connection-status");
    this.refreshButton = this.shadowRoot!.getElementById(
      "refresh-button",
    ) as HTMLButtonElement;

    if (this.refreshButton) {
      this.refreshButton.addEventListener("click", this.handleRefreshClick);
    }

    if (this._renderer) {
      if (!this._updateInterval) {
        this.startUpdateTimer();
      }
      return;
    }

    if (this._parentPanel && this._parentPanel.element) {
      this._parentPanel.element.removeEventListener(
        "renderer-ready",
        this._boundHandleRendererReady,
      );
      this._parentPanel.element.addEventListener(
        "renderer-ready",
        this._boundHandleRendererReady,
      );

      this.updateConnectionStatus("Listening for renderer...");
    } else if (!this._parentPanel) {
      this.tryConnectToRenderer();
    }
  }

  /**
   * Called when the element is removed from the document's DOM.
   * Cleans up timers and event listeners to prevent memory leaks.
   */
  disconnectedCallback() {
    this.stopUpdateTimer();
    this.stopConnectionAttempts();

    if (this.refreshButton) {
      this.refreshButton.removeEventListener("click", this.handleRefreshClick);
    }

    if (this._parentPanel?.element) {
      this._parentPanel.element.removeEventListener(
        "renderer-ready",
        this._boundHandleRendererReady,
      );
    }
  }

  /**
   * Handles clicks on the manual refresh button.
   * Fetches current stats if connected, otherwise attempts to reconnect.
   */
  private handleRefreshClick() {
    if (this._renderer) {
      this.updateConnectionStatus("Manual refresh triggered...");
      this.fetchAndUpdateDisplay();
    } else {
      this.updateConnectionStatus("Attempting reconnect on refresh...");
      this.tryConnectToRenderer();
    }
  }

  /**
   * Updates the text content of the connection status display area.
   *
   * @param {string} message - The status message to display.
   * @param {boolean} [isError=false] - If true, styles the message as an error.
   */
  private updateConnectionStatus(
    message: string,
    isError: boolean = false,
  ): void {
    if (this.connectionStatus) {
      this.connectionStatus.textContent = message;
      this.connectionStatus.style.color = isError
        ? "var(--color-error, #f44336)"
        : "var(--color-text-secondary, #aaa)";
    }
    if (this.refreshButton) {
      this.refreshButton.disabled = isError || !this._renderer;
    }
  }

  /**
   * Sets the renderer instance for this display.
   * Stops connection attempts and starts the periodic update timer if successful.
   *
   * @param {ModularSpaceRenderer} renderer - The renderer instance.
   */
  public setRenderer(renderer: ModularSpaceRenderer): void {
    this._renderer = renderer;
    this.stopConnectionAttempts();

    if (this._renderer && this.isConnected) {
      this.updateConnectionStatus("Renderer connected.");
      this.startUpdateTimer();
      this.fetchAndUpdateDisplay();
    } else {
      this.updateConnectionStatus(
        this.isConnected
          ? "Renderer connection failed."
          : "Component disconnected.",
        true,
      );
    }
  }

  /**
   * Attempts to establish a connection with the renderer, either via the parent panel
   * or by listening for the 'renderer-ready' event.
   * Retries automatically up to a maximum limit.
   */
  private tryConnectToRenderer(): void {
    if (
      this._renderer ||
      this._connectionAttemptCount >= MAX_CONNECTION_ATTEMPTS
    ) {
      if (
        !this._renderer &&
        this._connectionAttemptCount >= MAX_CONNECTION_ATTEMPTS
      ) {
        this.updateConnectionStatus(
          `Failed to connect after ${MAX_CONNECTION_ATTEMPTS} attempts.`,
          true,
        );
      }
      this.stopConnectionAttempts();
      return;
    }

    this.updateConnectionStatus(
      `Connecting... (Attempt ${this._connectionAttemptCount + 1}/${MAX_CONNECTION_ATTEMPTS})`,
    );
    this._connectionAttemptCount++;

    let foundRenderer = false;
    if (
      this._parentPanel &&
      typeof this._parentPanel.getRenderer === "function"
    ) {
      try {
        const renderer = this._parentPanel.getRenderer();
        if (renderer) {
          this.setRenderer(renderer);
          foundRenderer = true;
        } else {
        }
      } catch (error) {
        console.error(
          "[RendererInfoDisplay] Error calling getRenderer():",
          error,
        );
      }
    }

    if (!foundRenderer) {
      if (this._parentPanel) {
        this.stopConnectionAttempts();
      } else {
        this.stopConnectionAttempts();
        this._connectionAttemptTimer = window.setTimeout(() => {
          this.tryConnectToRenderer();
        }, CONNECTION_ATTEMPT_DELAY_MS);
      }
    }
  }

  /**
   * Stops the automatic connection retry timer.
   */
  private stopConnectionAttempts(): void {
    if (this._connectionAttemptTimer !== null) {
      clearTimeout(this._connectionAttemptTimer);
      this._connectionAttemptTimer = null;
    }
  }

  /**
   * Starts the periodic timer to fetch and update renderer stats.
   */
  private startUpdateTimer(): void {
    this.stopUpdateTimer();
    this._updateInterval = window.setInterval(() => {
      this.fetchAndUpdateDisplay();
    }, UPDATE_INTERVAL_MS);
    this.fetchAndUpdateDisplay();
  }

  /**
   * Stops the periodic stats update timer.
   */
  private stopUpdateTimer(): void {
    if (this._updateInterval !== null) {
      clearInterval(this._updateInterval);
      this._updateInterval = null;
    }
  }

  /**
   * Fetches the latest statistics from the connected renderer and updates the display.
   * Handles potential errors during fetching.
   */
  private fetchAndUpdateDisplay(): void {
    if (!this._renderer) {
      this.updateConnectionStatus(
        "Cannot fetch: Renderer not available.",
        true,
      );
      this.updateDisplay(null);
      return;
    }

    try {
      const stats = this._renderer.animationLoop?.getCurrentStats();
      if (!stats) {
        this.updateConnectionStatus("Could not retrieve stats.", true);
        this.updateDisplay(null);
        return;
      }
      this.updateDisplay(stats);
      if (
        this.connectionStatus?.style.color !== "var(--color-error, #f44336)"
      ) {
        this.updateConnectionStatus("Stats updated.");
      }
    } catch (error) {
      console.error("[RendererInfoDisplay] Error fetching stats:", error);
      this.updateConnectionStatus("Error fetching stats.", true);
      this.updateDisplay(null);
    }
  }

  /**
   * Updates the DOM elements with the fetched renderer statistics.
   *
   * @param {RendererStats | null} stats - The latest statistics object, or null if unavailable.
   */
  private updateDisplay = (stats: RendererStats | null): void => {
    if (!this.isConnected) return;

    const fps = stats?.fps;
    const drawCalls = stats?.drawCalls;
    const triangles = stats?.triangles;
    const memory = stats?.memory?.usedJSHeapSize;
    const camPos = stats?.camera?.position;
    const fov = stats?.camera?.fov;

    if (this.fpsValue) {
      this.fpsValue.textContent = formatNumber(fps);
      if (fps != null && Number.isFinite(fps)) {
        if (fps >= FPS_THRESHOLDS.GOOD) {
          this.fpsValue.style.color = "var(--color-success, #4caf50)";
        } else if (fps >= FPS_THRESHOLDS.WARN) {
          this.fpsValue.style.color = "var(--color-warning, #ff9800)";
        } else {
          this.fpsValue.style.color = "var(--color-error, #f44336)";
        }
      } else {
        this.fpsValue.style.color = "var(--color-text-secondary, #aaa)";
      }
    }

    if (this.drawCallsValue) {
      this.drawCallsValue.textContent = formatNumber(drawCalls);
    }
    if (this.trianglesValue) {
      this.trianglesValue.textContent = formatNumber(triangles);
    }
    if (this.memoryValue) {
      this.memoryValue.textContent = formatMemory(memory);
    }
    if (this.camPosValue) {
      this.camPosValue.textContent = formatVector(camPos, 1);
    }
    if (this.fovValue) {
      this.fovValue.textContent = fov?.toFixed(0) ?? "-";
    }
  };

  /**
   * Dockview panel initialization method.
   * Stores reference to the parent panel if provided.
   *
   * @param {GroupPanelPartInitParameters} parameters - Initialization parameters from Dockview.
   */
  public init(parameters: GroupPanelPartInitParameters): void {
    const params = parameters.params as RendererInfoParams;

    if (
      params.parentInstance &&
      typeof params.parentInstance.getRenderer === "function"
    ) {
      this._parentPanel = params.parentInstance;

      this.tryConnectToRenderer();
    } else {
      console.warn(
        `[RendererInfoDisplay] Parent instance not provided or invalid in init params.`,
      );
    }
  }

  /**
   * Handles the `renderer-ready` event dispatched by the parent panel.
   * Obtains the renderer instance from the event detail and sets it.
   *
   * @param {Event} event - The custom event containing the renderer instance.
   */
  private handleRendererReady(event: Event): void {
    if (
      event instanceof CustomEvent &&
      event.detail &&
      event.detail.renderer instanceof ModularSpaceRenderer
    ) {
      this.setRenderer(event.detail.renderer);
    } else {
      console.warn(
        "[RendererInfoDisplay] Received renderer-ready event with invalid detail.",
      );
    }
  }

  /**
   * Required by Dockview `IContentRenderer`.
   *
   * @returns {HTMLElement} The root element of the panel content.
   */
  get element(): HTMLElement {
    return this;
  }
}
