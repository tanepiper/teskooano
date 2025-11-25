import type { RendererBackendConfig } from "@teskooano/data-types";

/**
 * Detects WebGPU availability.
 * WebGPU is the only supported renderer backend in this codebase.
 *
 * This class uses caching to avoid repeated GPU adapter requests, which can be
 * expensive operations. The cache can be cleared for testing purposes.
 */
export class WebGPUDetection {
  private static cachedResult?: RendererBackendConfig;

  /**
   * Detects WebGPU support and returns renderer backend configuration.
   * Throws an error if WebGPU is not available.
   *
   * @returns Promise resolving to the renderer backend configuration
   * @throws Error if WebGPU is not available
   *
   * @example
   * ```typescript
   * try {
   *   const config = await WebGPUDetection.detectBackend();
   *   console.log('WebGPU is available and initialized');
   * } catch (error) {
   *   console.error('WebGPU not supported:', error);
   * }
   * ```
   */
  static async detectBackend(): Promise<RendererBackendConfig> {
    // Return cached result if available
    if (this.cachedResult) {
      return this.cachedResult;
    }

    const webgpuAvailable = await this.isWebGPUAvailable();

    if (!webgpuAvailable) {
      throw new Error(
        "[WebGPU] WebGPU is not available. " +
          "This application requires a modern browser with WebGPU support. " +
          "Please update your browser or use Chrome/Edge 113+, Firefox 127+, or Safari 18+.",
      );
    }

    const config: RendererBackendConfig = {
      backend: "webgpu",
      webgpuAvailable: true,
      initialized: false,
    };

    this.cachedResult = config;
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
