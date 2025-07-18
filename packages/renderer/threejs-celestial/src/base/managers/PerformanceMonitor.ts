import { GeometryUtilities, type PerformanceConfig } from "./GeometryUtilities";
import type { DeviceTier } from "@teskooano/data-types";
import { simulationStateService } from "@teskooano/core-state";
import {
  IdleDetectionAPI,
  BatteryAPI,
  DeviceMemoryAPI,
} from "@teskooano/web-apis";

/**
 * Performance monitoring and optimization utility for celestial rendering
 * Automatically detects device capabilities and optimizes geometry segments accordingly
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private frameCount = 0;
  private lastTime = performance.now();
  private currentFPS = 60;
  private targetFPS = 60;
  private updateInterval = 1000; // Update FPS every second
  private lastUpdateTime = 0;
  private isEnabled = true;
  private isInitialized = false;
  private monitoringStarted = false;

  // Web API state tracking
  private deviceMemoryGB: number | null = null;
  private batteryLevel: number = 1;
  private isCharging: boolean = false;
  private isIdle: boolean = false;
  private isIdleDetectionSupported: boolean = false;

  // Subscription cleanup
  private subscriptions: (() => void)[] = [];

  private constructor() {
    // Initialize web API monitoring
    this.initializeWebAPIMonitoring();

    // Auto-initialize on first access
    this.autoConfigure();
    // Don't start monitoring immediately - let the renderer initialize first
    // this.startMonitoring();
  }

  /**
   * Gets the singleton instance of PerformanceMonitor
   */
  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Starts the performance monitoring loop
   */
  private _startMonitoringLoop(): void {
    if (!this.isEnabled) return;

    const updateFPS = () => {
      this.frameCount++;
      const currentTime = performance.now();

      // Update FPS calculation every second
      if (currentTime - this.lastUpdateTime >= this.updateInterval) {
        const elapsed = currentTime - this.lastUpdateTime;
        this.currentFPS = Math.round((this.frameCount * 1000) / elapsed);
        this.frameCount = 0;
        this.lastUpdateTime = currentTime;

        // Update geometry utilities with current performance data
        this.updateGeometryPerformance();
      }

      requestAnimationFrame(updateFPS);
    };

    requestAnimationFrame(updateFPS);
  }

  /**
   * Updates the geometry utilities with current performance data
   */
  private updateGeometryPerformance(): void {
    const config: Partial<PerformanceConfig> = {
      currentFPS: this.currentFPS,
      targetFPS: this.targetFPS,
      enablePerformanceOptimization: this.isEnabled,
    };

    GeometryUtilities.updatePerformanceConfig(config);
  }

  /**
   * Gets the current FPS
   */
  public getCurrentFPS(): number {
    return this.currentFPS;
  }

  /**
   * Sets the target FPS for performance calculations
   */
  public setTargetFPS(targetFPS: number): void {
    this.targetFPS = targetFPS;
    this.updateGeometryPerformance();
  }

  /**
   * Enables or disables performance optimization
   */
  public setPerformanceOptimization(enabled: boolean): void {
    this.isEnabled = enabled;
    this.updateGeometryPerformance();
  }

  /**
   * Sets the device performance tier
   */
  public setDeviceTier(tier: DeviceTier): void {
    GeometryUtilities.updatePerformanceConfig({ deviceTier: tier });
  }

  /**
   * Gets current performance statistics
   */
  public getPerformanceStats(): {
    currentFPS: number;
    targetFPS: number;
    isOptimizationEnabled: boolean;
    performanceConfig: PerformanceConfig;
    deviceMemoryGB: number | null;
    batteryLevel: number;
    isCharging: boolean;
    isIdle: boolean;
    isIdleDetectionSupported: boolean;
  } {
    return {
      currentFPS: this.currentFPS,
      targetFPS: this.targetFPS,
      isOptimizationEnabled: this.isEnabled,
      performanceConfig: GeometryUtilities.getPerformanceConfig(),
      deviceMemoryGB: this.deviceMemoryGB,
      batteryLevel: this.batteryLevel,
      isCharging: this.isCharging,
      isIdle: this.isIdle,
      isIdleDetectionSupported: this.isIdleDetectionSupported,
    };
  }

  /**
   * Manually updates performance configuration
   */
  public updatePerformanceConfig(config: Partial<PerformanceConfig>): void {
    GeometryUtilities.updatePerformanceConfig(config);
  }

  /**
   * Initializes web API monitoring subscriptions
   */
  private initializeWebAPIMonitoring(): void {
    // Device Memory API
    if (DeviceMemoryAPI.isDeviceMemorySupported()) {
      const deviceMemorySub = DeviceMemoryAPI.deviceMemory$.subscribe(
        (state) => {
          this.deviceMemoryGB = state.memoryGB;
          this.updatePerformanceBasedOnDeviceState();
        },
      );
      this.subscriptions.push(() => deviceMemorySub.unsubscribe());
    }

    // Battery API
    const batterySub = BatteryAPI.batteryState$.subscribe((state) => {
      this.batteryLevel = state.level;
      this.isCharging = state.charging;
      this.updatePerformanceBasedOnDeviceState();
    });
    this.subscriptions.push(() => batterySub.unsubscribe());

    // Idle Detection API
    this.isIdleDetectionSupported = IdleDetectionAPI.isIdleDetectionSupported();
    if (this.isIdleDetectionSupported) {
      const idleSub = IdleDetectionAPI.createIdleStateObservable().subscribe(
        (state) => {
          this.isIdle = state.user === "idle";
          this.updatePerformanceBasedOnDeviceState();
        },
      );
      this.subscriptions.push(() => idleSub.unsubscribe());
    }
  }

  /**
   * Updates performance settings based on current device state
   */
  private updatePerformanceBasedOnDeviceState(): void {
    // Reduce performance when battery is low and not charging
    if (this.batteryLevel < 0.2 && !this.isCharging) {
      this.setTargetFPS(Math.min(this.targetFPS, 30));
      this.updatePerformanceConfig({
        performanceReductionMultiplier: 0.5,
        enableAdaptiveScaling: true,
      });
    }

    // Reduce performance when device is idle
    if (this.isIdle) {
      this.setTargetFPS(Math.min(this.targetFPS, 15));
      this.updatePerformanceConfig({
        performanceReductionMultiplier: 0.3,
        enableAdaptiveScaling: true,
      });
    }

    // Restore normal performance when conditions improve
    if (this.batteryLevel >= 0.5 && !this.isIdle) {
      this.autoConfigure(); // Re-apply device tier settings
    }
  }

  /**
   * Detects device performance tier based on hardware capabilities
   */
  public detectDeviceTier(): DeviceTier {
    // Check for WebGL capabilities
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext);

    if (!gl) {
      return "low";
    }

    // Get WebGL parameters
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
    const maxVertexUniformVectors = gl.getParameter(
      gl.MAX_VERTEX_UNIFORM_VECTORS,
    ) as number;
    const maxFragmentUniformVectors = gl.getParameter(
      gl.MAX_FRAGMENT_UNIFORM_VECTORS,
    ) as number;
    const maxVertexAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS) as number;

    // Check for mobile device
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      );

    // Enhanced device memory check using web API
    const hasLowMemory =
      this.deviceMemoryGB !== null && this.deviceMemoryGB < 4;
    const hasLowCores =
      navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;

    // Determine tier based on capabilities
    if (
      isMobile ||
      hasLowMemory ||
      hasLowCores ||
      maxTextureSize < 2048 ||
      maxVertexUniformVectors < 128
    ) {
      return "low";
    } else if (
      maxTextureSize >= 8192 &&
      maxVertexUniformVectors >= 512 &&
      maxVertexAttribs >= 16 &&
      maxFragmentUniformVectors >= 1024 &&
      !isMobile &&
      (this.deviceMemoryGB === null || this.deviceMemoryGB >= 8)
    ) {
      return "cosmic";
    } else if (
      maxTextureSize >= 4096 &&
      maxVertexUniformVectors >= 256 &&
      maxVertexAttribs >= 16
    ) {
      return "high";
    } else {
      return "medium";
    }
  }

  /**
   * Auto-configures performance settings based on device capabilities
   */
  public autoConfigure(): void {
    if (this.isInitialized) return;

    const deviceTier = this.detectDeviceTier();
    this.setDeviceTier(deviceTier);

    // Update the global state with the detected device tier
    simulationStateService.setPerformanceProfile(deviceTier);

    // Set appropriate target FPS based on device tier
    switch (deviceTier) {
      case "low":
        this.setTargetFPS(30);
        this.updatePerformanceConfig({
          performanceReductionMultiplier: 0.7,
          minimumSegments: 3,
          enableAdaptiveScaling: true,
          distanceReductionFactor: 0.6,
        });
        break;
      case "medium":
        this.setTargetFPS(45);
        this.updatePerformanceConfig({
          performanceReductionMultiplier: 0.6,
          minimumSegments: 4,
          enableAdaptiveScaling: true,
          distanceReductionFactor: 0.8,
        });
        break;
      case "high":
        this.setTargetFPS(60);
        this.updatePerformanceConfig({
          performanceReductionMultiplier: 0.5,
          minimumSegments: 6,
          enableAdaptiveScaling: true,
          distanceReductionFactor: 0.9,
        });
        break;
      case "cosmic":
        this.setTargetFPS(60);
        this.updatePerformanceConfig({
          performanceReductionMultiplier: 0.3,
          minimumSegments: 8,
          enableAdaptiveScaling: false,
          distanceReductionFactor: 1.0,
        });
        break;
    }

    this.isInitialized = true;
    console.log(
      `[PerformanceMonitor] Auto-configured for ${deviceTier} tier device`,
    );
  }

  /**
   * Forces re-initialization of performance settings
   */
  public reinitialize(): void {
    this.isInitialized = false;
    this.autoConfigure();
  }

  /**
   * Starts performance monitoring after renderer is initialized
   * This should be called after the main renderer is ready
   */
  public startMonitoring(): void {
    if (this.isEnabled && !this.monitoringStarted) {
      this.monitoringStarted = true;
      this._startMonitoringLoop();
    }
  }

  /**
   * Stops performance monitoring
   */
  public stopMonitoring(): void {
    this.isEnabled = false;
    this.monitoringStarted = false;
    this.frameCount = 0;
    this.lastUpdateTime = 0;
    this.currentFPS = 0;
  }

  /**
   * Cleans up all subscriptions and resources
   */
  public dispose(): void {
    this.stopMonitoring();

    // Clean up web API subscriptions
    this.subscriptions.forEach((unsubscribe) => unsubscribe());
    this.subscriptions = [];

    // Reset instance
    PerformanceMonitor.instance = null as any;
  }
}
