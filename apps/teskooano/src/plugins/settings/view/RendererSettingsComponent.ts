import {
  StateSubscriptionMixin,
  simulationState$,
} from "@teskooano/core-state";
import type { RendererBackendConfig } from "@teskooano/data-types";

/**
 * Component for displaying renderer backend information.
 * Shows the current renderer backend (WebGL or WebGPU) and WebGPU availability.
 *
 * This component subscribes to simulation state changes to update the display
 * when the renderer backend configuration changes.
 */
export class RendererSettingsComponent extends StateSubscriptionMixin {
  private container: HTMLElement;

  /**
   * Creates a new RendererSettingsComponent.
   *
   * @param container - The HTML element to render the component into
   */
  constructor(container: HTMLElement) {
    super();
    this.container = container;
    this.render();
    this.subscribeToRendererChanges();
  }

  /**
   * Renders the component's HTML structure.
   * @private
   */
  private render(): void {
    this.container.innerHTML = `
      <div class="settings-section">
        <h3>Renderer Backend</h3>
        <div class="renderer-info">
          <div class="info-row">
            <span class="info-label">Current Backend:</span>
            <span id="current-backend" class="info-value badge">Detecting...</span>
          </div>
          <div class="info-row">
            <span class="info-label">WebGPU Available:</span>
            <span id="webgpu-available" class="info-value">Checking...</span>
          </div>
          <div class="info-note">
            <small>Renderer backend is detected on startup. New renderer panels will use WebGPU if available, otherwise WebGL.</small>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Subscribes to renderer backend changes in the simulation state.
   * @private
   */
  private subscribeToRendererChanges(): void {
    // Subscribe to simulation state for renderer backend info
    this.subscribeToState(simulationState$, (state) => {
      if (state.renderer?.backend) {
        this.updateRendererInfo(state.renderer.backend);
      }
    });
  }

  /**
   * Updates the renderer information display.
   *
   * @param config - The renderer backend configuration
   * @private
   */
  private updateRendererInfo(config: RendererBackendConfig): void {
    const backendEl = this.container.querySelector("#current-backend");
    const webgpuAvailEl = this.container.querySelector("#webgpu-available");

    if (backendEl) {
      backendEl.textContent = config.actual.toUpperCase();
      backendEl.className = `info-value badge ${config.actual}`;
    }

    if (webgpuAvailEl) {
      webgpuAvailEl.textContent = config.webgpuAvailable ? "Yes ✓" : "No ✗";
      webgpuAvailEl.className = `info-value ${config.webgpuAvailable ? "success" : "warning"}`;
    }
  }

  /**
   * Disposes of the component and cleans up subscriptions.
   */
  public dispose(): void {
    super.dispose();
  }
}
