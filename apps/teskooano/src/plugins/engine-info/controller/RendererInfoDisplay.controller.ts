import { ModularSpaceRenderer } from "@teskooano/renderer-threejs";
import type { RendererStats } from "@teskooano/renderer-threejs-core";
import type { CompositeEnginePanel } from "../../engine-panel/panels/composite-panel/CompositeEnginePanel.js";
import { formatMemory, formatNumber, formatVector } from "../utils/formatters";
import type { RendererInfoDisplay } from "../view/RendererInfoDisplay.view.js";

const UPDATE_INTERVAL_MS = 1000;
const MAX_CONNECTION_ATTEMPTS = 10;
const CONNECTION_ATTEMPT_DELAY_MS = 2000;

const FPS_THRESHOLDS = {
  GOOD: 50,
  WARN: 30,
};

export class RendererInfoDisplayController {
  private _view: RendererInfoDisplay;
  private _fpsValue: HTMLElement;
  private _drawCallsValue: HTMLElement;
  private _trianglesValue: HTMLElement;
  private _memoryValue: HTMLElement;
  private _camPosValue: HTMLElement;
  private _fovValue: HTMLElement;
  private _connectionStatus: HTMLElement;
  private _refreshButton: HTMLButtonElement;

  private _renderer: ModularSpaceRenderer | null = null;
  private _updateInterval: number | null = null;
  private _parentPanel: CompositeEnginePanel | null = null;
  private _boundHandleRendererReady: (event: Event) => void;
  private _connectionAttemptCount: number = 0;
  private _connectionAttemptTimer: number | null = null;

  constructor(
    view: RendererInfoDisplay,
    elements: {
      fpsValue: HTMLElement;
      drawCallsValue: HTMLElement;
      trianglesValue: HTMLElement;
      memoryValue: HTMLElement;
      camPosValue: HTMLElement;
      fovValue: HTMLElement;
      connectionStatus: HTMLElement;
      refreshButton: HTMLButtonElement;
    },
  ) {
    this._view = view;
    this._fpsValue = elements.fpsValue;
    this._drawCallsValue = elements.drawCallsValue;
    this._trianglesValue = elements.trianglesValue;
    this._memoryValue = elements.memoryValue;
    this._camPosValue = elements.camPosValue;
    this._fovValue = elements.fovValue;
    this._connectionStatus = elements.connectionStatus;
    this._refreshButton = elements.refreshButton;

    this._boundHandleRendererReady = this.handleRendererReady.bind(this);
    this.handleRefreshClick = this.handleRefreshClick.bind(this);
    this.updateDisplay = this.updateDisplay.bind(this);
  }

  public initialize(): void {
    this._refreshButton.addEventListener("click", this.handleRefreshClick);

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

  public dispose(): void {
    this.stopUpdateTimer();
    this.stopConnectionAttempts();
    this._refreshButton.removeEventListener("click", this.handleRefreshClick);

    if (this._parentPanel?.element) {
      this._parentPanel.element.removeEventListener(
        "renderer-ready",
        this._boundHandleRendererReady,
      );
    }
  }

  public setParentPanel(panel: CompositeEnginePanel): void {
    this._parentPanel = panel;
    this.tryConnectToRenderer();
  }

  private handleRefreshClick(): void {
    if (this._renderer) {
      this.updateConnectionStatus("Manual refresh triggered...");
      this.fetchAndUpdateDisplay();
    } else {
      this.updateConnectionStatus("Attempting reconnect on refresh...");
      this.tryConnectToRenderer();
    }
  }

  private updateConnectionStatus(
    message: string,
    isError: boolean = false,
  ): void {
    if (this._connectionStatus) {
      this._connectionStatus.textContent = message;
      this._connectionStatus.style.color = isError
        ? "var(--color-error, #f44336)"
        : "var(--color-text-secondary, #aaa)";
    }
    if (this._refreshButton) {
      this._refreshButton.disabled = isError || !this._renderer;
    }
  }

  private setRenderer(renderer: ModularSpaceRenderer): void {
    this._renderer = renderer;
    this.stopConnectionAttempts();

    if (this._renderer && this._view.isConnected) {
      this.updateConnectionStatus("Renderer connected.");
      this.startUpdateTimer();
      this.fetchAndUpdateDisplay();
    } else {
      this.updateConnectionStatus(
        this._view.isConnected
          ? "Renderer connection failed."
          : "Component disconnected.",
        true,
      );
    }
  }

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
      `Connecting... (Attempt ${
        this._connectionAttemptCount + 1
      }/${MAX_CONNECTION_ATTEMPTS})`,
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
        // If we have a parent panel, we should be listening to the 'renderer-ready' event.
        // No need for a timeout loop in that case.
        this.stopConnectionAttempts();
      } else {
        this.stopConnectionAttempts();
        this._connectionAttemptTimer = window.setTimeout(() => {
          this.tryConnectToRenderer();
        }, CONNECTION_ATTEMPT_DELAY_MS);
      }
    }
  }

  private stopConnectionAttempts(): void {
    if (this._connectionAttemptTimer !== null) {
      clearTimeout(this._connectionAttemptTimer);
      this._connectionAttemptTimer = null;
    }
  }

  private startUpdateTimer(): void {
    this.stopUpdateTimer();
    this._updateInterval = window.setInterval(
      this.fetchAndUpdateDisplay.bind(this),
      UPDATE_INTERVAL_MS,
    );
    this.fetchAndUpdateDisplay();
  }

  private stopUpdateTimer(): void {
    if (this._updateInterval !== null) {
      clearInterval(this._updateInterval);
      this._updateInterval = null;
    }
  }

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
        this._connectionStatus?.style.color !== "var(--color-error, #f44336)"
      ) {
        this.updateConnectionStatus("Stats updated.");
      }
    } catch (error) {
      console.error("[RendererInfoDisplay] Error fetching stats:", error);
      this.updateConnectionStatus("Error fetching stats.", true);
      this.updateDisplay(null);
    }
  }

  private updateDisplay = (stats: RendererStats | null): void => {
    if (!this._view.isConnected) return;

    const fps = stats?.fps;
    const drawCalls = stats?.drawCalls;
    const triangles = stats?.triangles;
    const memory = stats?.memory?.usedJSHeapSize;
    const camPos = stats?.camera?.position;
    const fov = stats?.camera?.fov;

    if (this._fpsValue) {
      this._fpsValue.textContent = formatNumber(fps);
      if (fps != null && Number.isFinite(fps)) {
        if (fps >= FPS_THRESHOLDS.GOOD) {
          this._fpsValue.style.color = "var(--color-success, #4caf50)";
        } else if (fps >= FPS_THRESHOLDS.WARN) {
          this._fpsValue.style.color = "var(--color-warning, #ff9800)";
        } else {
          this._fpsValue.style.color = "var(--color-error, #f44336)";
        }
      } else {
        this._fpsValue.style.color = "var(--color-text-secondary, #aaa)";
      }
    }

    if (this._drawCallsValue)
      this._drawCallsValue.textContent = formatNumber(drawCalls);
    if (this._trianglesValue)
      this._trianglesValue.textContent = formatNumber(triangles);
    if (this._memoryValue) this._memoryValue.textContent = formatMemory(memory);
    if (this._camPosValue)
      this._camPosValue.textContent = formatVector(camPos, 1);
    if (this._fovValue) this._fovValue.textContent = fov?.toFixed(0) ?? "-";
  };

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
}
