import type { ModularSpaceRenderer } from "@teskooano/renderer-threejs";
import type { CompositeEngineState } from "../types";
import { CSS2DLayerType } from "@teskooano/renderer-threejs-labels";

/**
 * The default FOV for the panel state, aligning with SceneManager's default
 */
export const DEFAULT_PANEL_FOV = 75;

export const createDefaultViewState = (): CompositeEngineState => ({
  showGrid: false,
  showCelestialLabels: true,
  showAuMarkers: true,
  showDebrisEffects: false,
  showOrbitLines: true,
  showPredictionLines: false,
  isDebugMode: false,
});

/**
 * Applies specific view state updates by calling the public API of the ModularSpaceRenderer.
 * This ensures that the renderer properly orchestrates all its sub-managers.
 * @param renderer - The ModularSpaceRenderer instance.
 * @param updates - The partial view state containing changes to apply.
 */
export function applyViewStateToRenderer(
  renderer: ModularSpaceRenderer | undefined,
  updates: Partial<CompositeEngineState>,
): void {
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
  if (updates.isDebugMode !== undefined) {
    renderer.setDebugMode(updates.isDebugMode);
  }
}
