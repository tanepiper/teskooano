import { ControlsManager } from "@teskooano/renderer-threejs-controls";
import {
  Layer2DManager,
  AuMarkerManager,
  CelestialLabelLayer,
  CSS2DLayerType,
} from "@teskooano/renderer-threejs-labels";

/**
 * Orchestrates all user interaction and interface-related managers.
 *
 * This orchestrator groups managers responsible for user input and UI elements:
 * - Camera controls and user input
 * - 2D labels and overlays
 * - AU markers and distance indicators
 */
export class InteractionOrchestrator {
  private controlsManager: ControlsManager;
  private css2DManager: Layer2DManager;
  private auMarkerManager?: AuMarkerManager;

  constructor(
    container: HTMLElement,
    sceneManager: any, // We'll need to pass this from RenderingOrchestrator
  ) {
    // Initialize 2D layer manager
    this.css2DManager = new Layer2DManager(sceneManager.scene, container);
    const celestialLayer = new CelestialLabelLayer(sceneManager.scene);
    this.css2DManager.registerLayer(
      CSS2DLayerType.CELESTIAL_LABELS,
      celestialLayer,
    );

    // Initialize controls manager
    this.controlsManager = new ControlsManager(
      sceneManager.camera,
      sceneManager.renderer.domElement,
    );

    // Initialize AU marker manager
    this.auMarkerManager = new AuMarkerManager(
      sceneManager.scene,
      this.css2DManager,
    );
    this.auMarkerManager.createMarkers();
  }

  /**
   * Gets the controls manager for direct access when needed.
   */
  getControlsManager(): ControlsManager {
    return this.controlsManager;
  }

  /**
   * Gets the 2D layer manager for direct access when needed.
   */
  getLayer2DManager(): Layer2DManager {
    return this.css2DManager;
  }

  /**
   * Gets the AU marker manager for direct access when needed.
   */
  getAuMarkerManager(): AuMarkerManager | undefined {
    return this.auMarkerManager;
  }

  /**
   * Sets debug mode for interaction components.
   */
  setDebugMode(enabled: boolean): void {
    this.controlsManager.setDebugMode(enabled);
  }

  /**
   * Handles window resize events for all interaction components.
   */
  onResize(width: number, height: number): void {
    this.css2DManager?.onResize(width, height);
  }

  /**
   * Disposes all interaction resources.
   */
  dispose(): void {
    this.controlsManager.dispose();
    this.css2DManager?.dispose();
    this.auMarkerManager?.dispose();
  }
}
