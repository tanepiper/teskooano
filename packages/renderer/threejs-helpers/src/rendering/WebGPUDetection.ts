import type {
  RendererBackend,
  RendererBackendConfig,
} from "@teskooano/data-types";

/**
 * Detects WebGPU availability and determines the renderer backend to use.
 * Provides automatic fallback from WebGPU to WebGL for browser compatibility.
 *
 * This class uses caching to avoid repeated GPU adapter requests, which can be
 * expensive operations. The cache can be cleared for testing purposes.
 */
export class WebGPUDetection {
  private static cachedResult?: RendererBackendConfig;

  /**
   * Detects WebGPU support and returns renderer backend configuration.
   * Will fallback to WebGL if WebGPU is not available.
   *
   * @param preferredBackend - The preferred renderer backend (defaults to 'webgpu')
   * @returns Promise resolving to the renderer backend configuration
   *
   * @example
   * ```typescript
   * const config = await WebGPUDetection.detectBackend('webgpu');
   * console.log(`Using ${config.actual} renderer`);
   * if (!config.webgpuAvailable && config.preferred === 'webgpu') {
   *   console.warn('WebGPU not available, using WebGL fallback');
   * }
   * ```
   */
  static async detectBackend(
    preferredBackend: RendererBackend = "webgpu",
  ): Promise<RendererBackendConfig> {
    // Return cached result if available
    if (this.cachedResult) {
      return this.cachedResult;
    }

    const webgpuAvailable = await this.isWebGPUAvailable();

    const config: RendererBackendConfig = {
      preferred: preferredBackend,
      actual:
        preferredBackend === "webgpu" && webgpuAvailable ? "webgpu" : "webgl",
      webgpuAvailable,
    };

    this.cachedResult = config;

    if (config.preferred === "webgpu" && !webgpuAvailable) {
      console.warn(
        "[WebGPU] WebGPU not available, falling back to WebGL. " +
          "WebGPU requires a modern browser with GPU support.",
      );
    }

    return config;
  }

  /**
   * Checks if WebGPU is available in the current environment.
   *
   * @returns Promise resolving to true if WebGPU is supported, false otherwise
   *
   * @private
   */
  private static async isWebGPUAvailable(): Promise<boolean> {
    // Check if navigator.gpu exists
    if (!navigator.gpu) {
      return false;
    }

    try {
      // Try to request a GPU adapter
      const adapter = await navigator.gpu.requestAdapter();
      return adapter !== null;
    } catch (error) {
      console.warn("[WebGPU] GPU adapter request failed:", error);
      return false;
    }
  }

  /**
   * Clears the cached detection result.
   * Useful for testing or when you need to re-detect capabilities.
   *
   * @example
   * ```typescript
   * // In tests or when browser state changes
   * WebGPUDetection.clearCache();
   * const newConfig = await WebGPUDetection.detectBackend();
   * ```
   */
  static clearCache(): void {
    this.cachedResult = undefined;
  }
}
