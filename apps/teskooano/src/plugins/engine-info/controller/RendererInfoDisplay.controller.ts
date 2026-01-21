import { ModularSpaceRenderer } from "@teskooano/renderer-threejs";
import type { RendererStats } from "@teskooano/renderer-threejs-core";
import type { CompositeEnginePanel } from "../../engine-panel/panels/composite-panel/CompositeEnginePanel.js";
import { PerformanceMonitor } from "@teskooano/renderer-threejs-celestial";
import {
  BatteryAPI,
  IdleDetectionAPI,
  DeviceMemoryAPI,
} from "@teskooano/web-apis";
import { formatVector } from "../utils/formatters";
import type { RendererInfoDisplay } from "../view/RendererInfoDisplay.view.js";
import { WebGLCapabilitiesDisplay } from "../view/WebGLCapabilitiesDisplay.view.js";

const UPDATE_INTERVAL_MS = 1000;

/**
 * Controller for the RendererInfoDisplay view.
 *
 * This class encapsulates all the business logic for the renderer info panel.
 * It manages the connection to the renderer, periodically fetches statistics,
 * and updates the view with the formatted data.
 */
export class RendererInfoDisplayController {
  private _view: RendererInfoDisplay;
  private _camPosValue: HTMLElement;
  private _fovValue: HTMLElement;
  private _devicePerformanceElement?: HTMLElement;

  private _renderer: ModularSpaceRenderer | null = null;
  private _updateInterval: number | null = null;
  private _parentPanel: CompositeEnginePanel | null = null;
  private _boundHandleRendererReady: (event: Event) => void;
  private _performanceMonitor: PerformanceMonitor;

  // Battery, idle state, and device memory tracking
  private _batteryLevel: number = 1;
  private _isCharging: boolean = false;
  private _isIdle: boolean = false;
  private _isIdleDetectionSupported: boolean = false;
  private _deviceMemoryGB: number | null = null;

  /**
   * Creates an instance of RendererInfoDisplayController.
   * @param view The RendererInfoDisplay view instance this controller manages.
   * @param elements A record of the HTML elements from the view's shadow DOM.
   */
  constructor(
    view: RendererInfoDisplay,
    elements: {
      camPosValue: HTMLElement;
      fovValue: HTMLElement;
    },
  ) {
    this._view = view;
    this._camPosValue = elements.camPosValue;
    this._fovValue = elements.fovValue;
    this._performanceMonitor = PerformanceMonitor.getInstance();

    // Get device performance element from shadow DOM
    const shadowRoot = (this._view as any).shadowRoot;
    if (shadowRoot) {
      this._devicePerformanceElement = shadowRoot.querySelector(
        "#device-performance",
      );
    }

    this._boundHandleRendererReady = this.handleRendererReady.bind(this);
    this.updateDisplay = this.updateDisplay.bind(this);

    // Subscribe to web APIs
    this._subscribeToWebAPIs();
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
      const stats =
        this._renderer.sceneManager?.animationLoop?.getCurrentStats();
      this.updateDisplay(stats);
      // Also update device performance display
      this._updateDevicePerformanceDisplay();
    } catch (error) {
      console.error("[RendererInfoDisplay] Error fetching stats:", error);
      this.updateDisplay(null);
    }
  }

  private updateDisplay = (stats: RendererStats | null): void => {
    if (!this._view.isConnected) return;

    const camPos = stats?.camera?.position;
    const fov = stats?.camera?.fov;

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

  /**
   * Subscribes to battery, idle detection, and device memory APIs
   */
  private _subscribeToWebAPIs(): void {
    // Subscribe to battery state changes
    BatteryAPI.batteryState$.subscribe((batteryState) => {
      this._batteryLevel = batteryState.level;
      this._isCharging = batteryState.charging;
      this._updateDevicePerformanceDisplay();
    });

    // Subscribe to device memory changes
    DeviceMemoryAPI.deviceMemory$.subscribe((deviceMemoryState) => {
      this._deviceMemoryGB = deviceMemoryState.memoryGB;
      this._updateDevicePerformanceDisplay();
    });

    // Subscribe to idle state changes
    this._isIdleDetectionSupported =
      IdleDetectionAPI.isIdleDetectionSupported();
    if (this._isIdleDetectionSupported) {
      IdleDetectionAPI.idleState$.subscribe((idleState) => {
        this._isIdle = idleState.user === "idle";
        this._updateDevicePerformanceDisplay();
      });
    }
  }

  /**
   * Updates the device performance display with data from PerformanceMonitor and web APIs
   */
  private _updateDevicePerformanceDisplay(): void {
    if (!this._devicePerformanceElement) return;

    const stats = this._performanceMonitor.getPerformanceStats();

    // Get current renderer stats if available
    let rendererStats = null;
    if (this._renderer) {
      try {
        rendererStats =
          this._renderer.sceneManager?.animationLoop?.getCurrentStats();
      } catch (error) {
        console.error(
          "[RendererInfoDisplay] Error getting renderer stats:",
          error,
        );
      }
    }

    // Get prediction and trail data from orbits manager
    let predictionLines = 0;
    let predictionSegments = 0;
    let trailLines = 0;
    let trailSegments = 0;

    if (this._parentPanel?.orbitManager) {
      const orbitsManager = this._parentPanel.orbitManager;
      const predictionManager = orbitsManager.getPredictionManager();
      const trailManager = orbitsManager.getTrailManager();

      predictionLines = predictionManager?.predictionLines?.size ?? 0;
      if (predictionManager?.predictionLines) {
        for (const line of predictionManager.predictionLines.values()) {
          predictionSegments += line.geometry.drawRange.count;
        }
      }

      trailLines = trailManager?.trailLines?.size ?? 0;
      if (trailManager?.trailLines) {
        for (const line of trailManager.trailLines.values()) {
          trailSegments += line.geometry.drawRange.count;
        }
      }
    }

    // Enhance stats with our tracked data and renderer stats
    const enhancedStats = {
      ...stats,
      // Add renderer stats - use renderer FPS if available and non-zero, otherwise fallback to monitor FPS
      currentFPS:
        rendererStats?.fps && rendererStats.fps > 0
          ? rendererStats.fps
          : stats.currentFPS,
      drawCalls: rendererStats?.drawCalls,
      triangles: rendererStats?.triangles,
      memory: rendererStats?.memory,
      // Add prediction and trail data
      predictionLines,
      predictionSegments,
      trailLines,
      trailSegments,
      // Add our tracked data
      batteryLevel: this._batteryLevel,
      isCharging: this._isCharging,
      isIdle: this._isIdle,
      isIdleDetectionSupported: this._isIdleDetectionSupported,
      deviceMemoryGB: this._deviceMemoryGB,
    };

    this._devicePerformanceElement.innerHTML =
      WebGLCapabilitiesDisplay.renderDevicePerformanceSection(enhancedStats);
  }
}
