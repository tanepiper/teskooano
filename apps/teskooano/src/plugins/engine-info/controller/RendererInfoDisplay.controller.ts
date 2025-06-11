import { ModularSpaceRenderer } from "@teskooano/renderer-threejs";
import type { RendererStats } from "@teskooano/renderer-threejs-core";
import type { CompositeEnginePanel } from "../../engine-panel/panels/composite-panel/CompositeEnginePanel.js";
import { formatMemory, formatNumber, formatVector } from "../utils/formatters";
import type { RendererInfoDisplay } from "../view/RendererInfoDisplay.view.js";

const UPDATE_INTERVAL_MS = 1000;

const FPS_THRESHOLDS = {
  GOOD: 50,
  WARN: 30,
};

/**
 * Controller for the RendererInfoDisplay view.
 *
 * This class encapsulates all the business logic for the renderer info panel.
 * It manages the connection to the renderer, periodically fetches statistics,
 * and updates the view with the formatted data.
 */
export class RendererInfoDisplayController {
  private _view: RendererInfoDisplay;
  private _fpsValue: HTMLElement;
  private _drawCallsValue: HTMLElement;
  private _trianglesValue: HTMLElement;
  private _memoryValue: HTMLElement;
  private _camPosValue: HTMLElement;
  private _fovValue: HTMLElement;

  private _renderer: ModularSpaceRenderer | null = null;
  private _updateInterval: number | null = null;
  private _parentPanel: CompositeEnginePanel | null = null;
  private _boundHandleRendererReady: (event: Event) => void;

  /**
   * Creates an instance of RendererInfoDisplayController.
   * @param view The RendererInfoDisplay view instance this controller manages.
   * @param elements A record of the HTML elements from the view's shadow DOM.
   */
  constructor(
    view: RendererInfoDisplay,
    elements: {
      fpsValue: HTMLElement;
      drawCallsValue: HTMLElement;
      trianglesValue: HTMLElement;
      memoryValue: HTMLElement;
      camPosValue: HTMLElement;
      fovValue: HTMLElement;
    },
  ) {
    this._view = view;
    this._fpsValue = elements.fpsValue;
    this._drawCallsValue = elements.drawCallsValue;
    this._trianglesValue = elements.trianglesValue;
    this._memoryValue = elements.memoryValue;
    this._camPosValue = elements.camPosValue;
    this._fovValue = elements.fovValue;

    this._boundHandleRendererReady = this.handleRendererReady.bind(this);
    this.updateDisplay = this.updateDisplay.bind(this);
  }

  /**
   * Initializes the controller.
   * Sets up event listeners and begins the process of connecting to the renderer.
   */
  public initialize(): void {
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
    } else if (!this._parentPanel) {
      this.tryConnectToRenderer();
    }
  }

  /**
   * Cleans up the controller's resources.
   * Removes event listeners and stops any active timers to prevent memory leaks.
   */
  public dispose(): void {
    this.stopUpdateTimer();

    if (this._parentPanel?.element) {
      this._parentPanel.element.removeEventListener(
        "renderer-ready",
        this._boundHandleRendererReady,
      );
    }
  }

  /**
   * Sets the reference to the parent engine panel.
   * This is the entry point for the controller to find the renderer.
   * @param panel The parent `CompositeEnginePanel` instance.
   */
  public setParentPanel(panel: CompositeEnginePanel): void {
    this._parentPanel = panel;
    this.tryConnectToRenderer();
  }

  private setRenderer(renderer: ModularSpaceRenderer): void {
    this._renderer = renderer;

    if (this._renderer && this._view.isConnected) {
      this.startUpdateTimer();
      this.fetchAndUpdateDisplay();
    }
  }

  private tryConnectToRenderer(): void {
    if (this._renderer) {
      return;
    }

    if (
      this._parentPanel &&
      typeof this._parentPanel.getRenderer === "function"
    ) {
      try {
        const renderer = this._parentPanel.getRenderer();
        if (renderer) {
          this.setRenderer(renderer);
        }
      } catch (error) {
        console.error(
          "[RendererInfoDisplay] Error calling getRenderer():",
          error,
        );
      }
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
      this.updateDisplay(null);
      return;
    }

    try {
      const stats = this._renderer.animationLoop?.getCurrentStats();
      this.updateDisplay(stats);
    } catch (error) {
      console.error("[RendererInfoDisplay] Error fetching stats:", error);
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
