import * as THREE from "three";
import type { ModularSpaceRenderer } from "@teskooano/renderer-threejs";
import { CSS2DLayerType } from "@teskooano/renderer-threejs-interaction";
import type { CompositeEngineState } from "../types";

/**
 * The default FOV for the panel state, aligning with SceneManager's default
 */
export const DEFAULT_PANEL_FOV = 75;

export const createDefaultViewState = (): CompositeEngineState => ({
  cameraPosition: new THREE.Vector3(200, 200, 200),
  cameraTarget: new THREE.Vector3(0, 0, 0),
  focusedObjectId: null,
  showGrid: true,
  showCelestialLabels: true,
  showAuMarkers: true,
  showDebrisEffects: false,
  showOrbitLines: true,
  isDebugMode: false,
  fov: DEFAULT_PANEL_FOV,
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
    renderer.setGridVisible(updates.showGrid);
  }
  if (updates.showCelestialLabels !== undefined) {
    renderer.setCelestialLabelsVisible(updates.showCelestialLabels);
  }
  if (updates.showAuMarkers !== undefined) {
    renderer.setAuMarkersVisible(updates.showAuMarkers);
  }
  if (updates.showDebrisEffects !== undefined) {
    renderer.setDebrisEffectsEnabled(updates.showDebrisEffects);
  }
  if (updates.showOrbitLines !== undefined) {
    renderer.setOrbitsVisible(updates.showOrbitLines);
  }
  if (updates.fov !== undefined) {
    renderer.sceneManager?.setFov(updates.fov);
  }
  if (updates.isDebugMode !== undefined) {
    renderer.setDebugMode(updates.isDebugMode);
  }
}
