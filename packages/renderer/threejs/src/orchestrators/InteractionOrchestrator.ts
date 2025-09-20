import { ControlsManager } from "@teskooano/renderer-threejs-controls";
import {
  Layer2DManager,
  AuMarkerManager,
  CelestialLabelLayer,
  CSS2DLayerType,
} from "@teskooano/renderer-threejs-labels";
import type { RendererServices } from "../services/RendererServiceContainer";

/**
 * Orchestrates all user interaction and interface-related managers.
 *
 * This orchestrator groups managers responsible for user input and UI elements:
 * - Camera controls and user input
 * - 2D labels and overlays
 * - AU markers and distance indicators
 *
 * **Constructor Injection:**
 *
 * This orchestrator now uses constructor injection to receive all its dependencies,
 * eliminating the circular dependency issues and setDependencies() anti-pattern.
 */
export class InteractionOrchestrator {
  /**
   * All renderer services are injected via constructor.
   * This eliminates circular dependencies and provides clear service boundaries.
   */
  private readonly services: RendererServices;

  /**
   * Initializes the interaction orchestrator with injected services.
   */
  constructor(services: RendererServices) {
    this.services = services;

    // @ts-ignore
    if (window.teskooano) {
      // @ts-ignore
      window.teskooano.interactionOrchestrator = this;
    }
  }

  /**
   * Gets the controls manager for direct access when needed.
   */
  getControlsManager(): ControlsManager {
    return this.services.controlsManager;
  }

  /**
   * Gets the 2D layer manager for direct access when needed.
   */
  getLayer2DManager(): Layer2DManager {
    return this.services.css2DManager;
  }

  /**
   * Gets the AU marker manager for direct access when needed.
   */
  getAuMarkerManager(): AuMarkerManager | undefined {
    return this.services.auMarkerManager;
  }

  /**
   * Sets debug mode for interaction components.
   */
  setDebugMode(enabled: boolean): void {
    this.services.controlsManager.setDebugMode(enabled);
  }

  /**
   * Handles window resize events for all interaction components.
   */
  onResize(width: number, height: number): void {
    this.services.css2DManager?.onResize(width, height);
  }

  /**
   * Disposes all interaction resources.
   * Note: This orchestrator no longer manages disposal directly.
   * Disposal is handled by the service container.
   */
  dispose(): void {
    // Disposal is now handled by the service container
    // This method is kept for backward compatibility
    console.log(
      "[InteractionOrchestrator] Disposal handled by service container",
    );
  }
}
