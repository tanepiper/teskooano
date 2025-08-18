import type { ModularSpaceRenderer } from "@teskooano/renderer-threejs";
import { CSS2DLayerType } from "@teskooano/renderer-threejs-labels";
import type { BehaviorSubject, Subscription } from "rxjs";
import type { CompositeEngineState } from "../../../plugins/engine-panel/panels/composite-panel/types";

/**
 * Manager: EngineViewStateManager
 * Applies engine-view state (labels, lines, grid, fov, debug) declaratively to a renderer.
 * It subscribes to a provided BehaviorSubject<CompositeEngineState> and updates the renderer.
 */
export class EngineViewStateManager {
  private renderer: ModularSpaceRenderer;
  private subscription: Subscription | null = null;

  constructor(options: { renderer: ModularSpaceRenderer }) {
    this.renderer = options.renderer;
  }

  /**
   * Subscribes to a panel's engine view state subject and applies updates declaratively.
   */
  public bindToState(subject: BehaviorSubject<CompositeEngineState>): void {
    // Clean up any prior binding
    this.subscription?.unsubscribe();
    this.subscription = subject.subscribe((state) => {
      this.applyFullState(state);
    });
  }

  /**
   * Applies a full state object to the renderer.
   */
  public applyFullState(state: CompositeEngineState): void {
    this.applyUpdates({
      showGrid: state.showGrid,
      showCelestialLabels: state.showCelestialLabels,
      showAuMarkers: state.showAuMarkers,
      showDebrisEffects: state.showDebrisEffects,
      showOrbitLines: state.showOrbitLines,
      showPredictionLines: state.showPredictionLines,
      fov: state.fov,
      isDebugMode: state.isDebugMode,
    });
  }

  /**
   * Applies partial updates to the renderer. Intended for internal use.
   */
  private applyUpdates(updates: Partial<CompositeEngineState>): void {
    const renderer = this.renderer;
    if (!renderer) return;

    if (updates.showGrid !== undefined) {
      renderer.renderingOrchestrator.gridManager.setVisible(updates.showGrid);
    }
    if (updates.showCelestialLabels !== undefined) {
      renderer.interactionOrchestrator
        .getLayer2DManager()
        .setLayerVisibility(
          CSS2DLayerType.CELESTIAL_LABELS,
          updates.showCelestialLabels,
        );
    }
    if (updates.showAuMarkers !== undefined) {
      renderer.interactionOrchestrator
        .getAuMarkerManager()
        ?.setVisible(updates.showAuMarkers);
    }
    if (updates.showDebrisEffects !== undefined) {
      renderer.renderingOrchestrator.objectManager.setDebrisEffectsEnabled(
        updates.showDebrisEffects,
      );
    }
    if (updates.showOrbitLines !== undefined) {
      renderer.renderingOrchestrator.orbitManager.setOrbitTrailsVisibility(
        updates.showOrbitLines,
      );
    }
    if (updates.showPredictionLines !== undefined) {
      renderer.renderingOrchestrator.orbitManager.setPredictionVisibility(
        updates.showPredictionLines,
      );
      renderer.interactionOrchestrator
        .getLayer2DManager()
        .setLayerVisibility(
          CSS2DLayerType.PREDICTION_LABELS,
          updates.showPredictionLines,
        );
    }
    if (updates.fov !== undefined) {
      renderer.camera.fov = updates.fov;
      renderer.camera.updateProjectionMatrix();
    }
    if (updates.isDebugMode !== undefined) {
      renderer.setDebugMode(updates.isDebugMode);
    }
  }

  public dispose(): void {
    this.subscription?.unsubscribe();
    this.subscription = null;
  }
}

