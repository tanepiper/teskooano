import * as THREE from "three";
import type { ModularSpaceRenderer } from "@teskooano/renderer-threejs";
import { CSS2DLayerType } from "@teskooano/renderer-threejs-interaction";
import type { CompositeEngineState } from "./CompositeEnginePanel"; // Assuming CompositeEngineState is exported or can be moved too

/**
 * Applies specific view state updates directly to the renderer's components.
 * @param renderer - The ModularSpaceRenderer instance.
 * @param updates - The partial view state containing changes to apply.
 */
export function applyViewStateToRenderer(
  renderer: ModularSpaceRenderer | undefined,
  updates: Partial<CompositeEngineState>,
): void {
  if (!renderer) return;

  if (updates.showGrid !== undefined) {
    renderer.sceneManager?.setGridVisible(updates.showGrid);
  }
  if (updates.showCelestialLabels !== undefined && renderer.css2DManager) {
    renderer.css2DManager.setLayerVisibility(
      CSS2DLayerType.CELESTIAL_LABELS,
      updates.showCelestialLabels,
    );
  }
  if (updates.showAuMarkers !== undefined) {
    renderer.sceneManager.setAuMarkersVisible(updates.showAuMarkers);
  }
  if (updates.showOrbitLines !== undefined && renderer.orbitManager) {
    renderer.orbitManager.setVisibility(updates.showOrbitLines);
  }
  if (updates.fov !== undefined) {
    // Ensure sceneManager exists before calling setFov
    renderer.sceneManager?.setFov(updates.fov);
  }
  if (updates.isDebugMode !== undefined) {
    renderer.setDebugMode(updates.isDebugMode);
  }
}
