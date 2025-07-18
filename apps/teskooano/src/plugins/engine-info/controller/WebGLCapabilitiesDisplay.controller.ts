import { StateSubscriptionMixin } from "@teskooano/core-state";
import { rendererEvents } from "@teskooano/renderer-threejs-core";
import type {
  WebGLCapabilities,
  PerformanceOptimization,
} from "@teskooano/renderer-threejs-core";
import { PerformanceMonitor } from "@teskooano/renderer-threejs-celestial";
import {
  BatteryAPI,
  IdleDetectionAPI,
  DeviceMemoryAPI,
} from "@teskooano/web-apis";
import { WebGLCapabilitiesDisplay } from "../view/WebGLCapabilitiesDisplay.view.js";

/**
 * Controller for displaying WebGL capabilities and performance optimization information
 */
export class WebGLCapabilitiesDisplayController extends StateSubscriptionMixin {
  private _view: HTMLElement;
  private _capabilitiesElement?: HTMLElement;
  private _optimizationElement?: HTMLElement;
  private _performanceElement?: HTMLElement;
  private _devicePerformanceElement?: HTMLElement;
  private _performanceMonitor: PerformanceMonitor;
  private _updateInterval: number | null = null;

  // Battery, idle state, and device memory tracking
  private _batteryLevel: number = 1;
  private _isCharging: boolean = false;
  private _isIdle: boolean = false;
  private _isIdleDetectionSupported: boolean = false;
  private _deviceMemoryGB: number | null = null;

  constructor(view: HTMLElement) {
    super();
    this._view = view;
    this._performanceMonitor = PerformanceMonitor.getInstance();
    this._initializeElements();
    this._subscribeToEvents();
    this._subscribeToWebAPIs();
    this._startPerformanceMonitoring();
  }

  private _initializeElements(): void {
    // The view is a custom element with shadow DOM, so we need to access the shadow root
    const shadowRoot = (this._view as any).shadowRoot;

    if (shadowRoot) {
      this._capabilitiesElement =
        shadowRoot.querySelector("#webgl-capabilities") || undefined;
      this._optimizationElement =
        shadowRoot.querySelector("#performance-optimization") || undefined;
      this._devicePerformanceElement =
        shadowRoot.querySelector("#device-performance") || undefined;
    } else {
      // Fallback to regular querySelector if no shadow root
      this._capabilitiesElement =
        this._view.querySelector("#webgl-capabilities") || undefined;
      this._optimizationElement =
        this._view.querySelector("#performance-optimization") || undefined;
      this._devicePerformanceElement =
        this._view.querySelector("#device-performance") || undefined;
    }
  }

  private _subscribeToEvents(): void {
    // Subscribe to renderer ready event to get capabilities
    this._view.addEventListener("renderer-ready", (event: Event) => {
      if (event instanceof CustomEvent && event.detail?.renderer) {
        const sceneManager = event.detail.renderer.sceneManager;

        if (sceneManager) {
          try {
            const capabilities = sceneManager.getWebGLCapabilities();
            const optimization = sceneManager.getPerformanceOptimization();

            this._updateCapabilitiesDisplay(capabilities);
            this._updateOptimizationDisplay(optimization);
          } catch (error) {
            console.error(
              "[WebGLCapabilitiesDisplay] Error getting capabilities:",
              error,
            );
          }
        }
      }
    });

    // Subscribe to performance optimization changes
    this.subscribeToState(
      rendererEvents.performanceOptimizationChanged$,
      (optimization) => {
        this._updateOptimizationDisplay(optimization);
      },
    );
  }

  /**
   * Subscribes to battery, idle detection, and device memory APIs
   */
  private _subscribeToWebAPIs(): void {
    // Subscribe to battery state changes
    this.subscribeToState(BatteryAPI.batteryState$, (batteryState) => {
      this._batteryLevel = batteryState.level;
      this._isCharging = batteryState.charging;
    });

    // Subscribe to device memory changes
    this.subscribeToState(
      DeviceMemoryAPI.deviceMemory$,
      (deviceMemoryState) => {
        this._deviceMemoryGB = deviceMemoryState.memoryGB;
      },
    );

    // Subscribe to idle state changes
    this._isIdleDetectionSupported =
      IdleDetectionAPI.isIdleDetectionSupported();
    if (this._isIdleDetectionSupported) {
      this.subscribeToState(IdleDetectionAPI.idleState$, (idleState) => {
        this._isIdle = idleState.user === "idle";
      });
    }
  }

  /**
   * Initializes the controller
   */
  public initialize(): void {
    // Initial device performance update
    this._updateDevicePerformanceDisplay();
  }

  /**
   * Sets the parent panel to get access to the renderer
   */
  public setParentPanel(panel: any): void {
    // Try to get the renderer immediately if available
    if (panel && typeof panel.getRenderer === "function") {
      try {
        const renderer = panel.getRenderer();

        if (renderer?.sceneManager) {
          const capabilities = renderer.sceneManager.getWebGLCapabilities();
          const optimization =
            renderer.sceneManager.getPerformanceOptimization();

          this._updateCapabilitiesDisplay(capabilities);
          this._updateOptimizationDisplay(optimization);
        } else {
        }
      } catch (error) {
        console.error(
          "[WebGLCapabilitiesDisplay] Error getting renderer immediately:",
          error,
        );
      }
    } else {
      console.log(
        "[WebGLCapabilitiesDisplay] Panel or getRenderer not available",
      );
    }
  }

  private _updateCapabilitiesDisplay(capabilities: WebGLCapabilities): void {
    if (!this._capabilitiesElement) {
      return;
    }

    this._capabilitiesElement.innerHTML =
      WebGLCapabilitiesDisplay.renderCapabilitiesSection(capabilities);
  }

  private _updateOptimizationDisplay(
    optimization: PerformanceOptimization,
  ): void {
    if (!this._optimizationElement) {
      return;
    }

    this._optimizationElement.innerHTML =
      WebGLCapabilitiesDisplay.renderOptimizationSection(optimization);
  }

  /**
   * Starts performance monitoring and updates
   */
  private _startPerformanceMonitoring(): void {
    // Start the performance monitor if not already started
    this._performanceMonitor.startMonitoring();

    // Set up periodic updates for device performance data
    this._updateInterval = window.setInterval(() => {
      this._updateDevicePerformanceDisplay();
    }, 2000); // Update every 2 seconds
  }

  /**
   * Updates the device performance display with data from PerformanceMonitor
   */
  private _updateDevicePerformanceDisplay(): void {
    if (!this._devicePerformanceElement) return;

    const stats = this._performanceMonitor.getPerformanceStats();

    // Use PerformanceMonitor data as the primary source, but fall back to our tracked values if needed
    const enhancedStats = {
      ...stats,
      // Use our values if PerformanceMonitor has default/initial values
      batteryLevel:
        stats.batteryLevel === 1 && this._batteryLevel !== 1
          ? this._batteryLevel
          : stats.batteryLevel,
      isCharging:
        stats.isCharging === false && this._isCharging !== false
          ? this._isCharging
          : stats.isCharging,
      isIdle:
        stats.isIdle === false && this._isIdle !== false
          ? this._isIdle
          : stats.isIdle,
      isIdleDetectionSupported:
        stats.isIdleDetectionSupported === false &&
        this._isIdleDetectionSupported !== false
          ? this._isIdleDetectionSupported
          : stats.isIdleDetectionSupported,
      deviceMemoryGB:
        stats.deviceMemoryGB === null && this._deviceMemoryGB !== null
          ? this._deviceMemoryGB
          : stats.deviceMemoryGB,
    };

    this._devicePerformanceElement.innerHTML =
      WebGLCapabilitiesDisplay.renderDevicePerformanceSection(enhancedStats);
  }

  public dispose(): void {
    // Stop performance monitoring
    if (this._updateInterval) {
      clearInterval(this._updateInterval);
      this._updateInterval = null;
    }

    // Dispose of performance monitor
    this._performanceMonitor.dispose();

    super.dispose();
  }
}
