import { getCelestialObjects, renderableStore } from "@teskooano/core-state";
import { CelestialStatus, CelestialType } from "@teskooano/data-types";
import * as THREE from "three";
import type { CompositeEnginePanel } from "../engine-panel/panels/CompositeEnginePanel";
import { CustomEvents } from "@teskooano/data-types";

/**
 * Handles the logic for requesting the camera to point at a specific object.
 *
 * @param parentPanel The parent engine panel containing the renderer.
 * @param objectId The ID of the object to focus on.
 * @param dispatchEventCallback Callback function to dispatch events from the component.
 * @returns {boolean} True if the focus request was successfully initiated, false otherwise.
 */
export function handleFocusRequest(
  parentPanel: CompositeEnginePanel | null,
  objectId: string,
  dispatchEventCallback: (event: CustomEvent) => void,
): boolean {
  if (!parentPanel) {
    console.error(
      "[FocusControl.interactions] Parent panel not set, cannot focus.",
    );
    return false;
  }
  const renderer = parentPanel.getRenderer();
  if (!renderer) {
    console.error(
      "[FocusControl.interactions] Renderer not available, cannot focus.",
    );
    return false;
  }

  const objects = getCelestialObjects();
  const targetObject = objects[objectId];
  if (
    !targetObject ||
    targetObject.type === CelestialType.ASTEROID_FIELD ||
    targetObject.type === CelestialType.OORT_CLOUD ||
    targetObject.status === CelestialStatus.DESTROYED ||
    targetObject.status === CelestialStatus.ANNIHILATED
  ) {
    console.warn(
      `[FocusControl.interactions] Cannot focus on object ${objectId}. Type or status invalid.`,
    );
    return false;
  }

  const currentRenderables = renderableStore.getRenderableObjects();
  const targetObjectRenderable = currentRenderables[objectId];
  if (
    !targetObjectRenderable ||
    !targetObjectRenderable.position ||
    !(targetObjectRenderable.position instanceof THREE.Vector3)
  ) {
    console.error(
      `[FocusControl.interactions] Invalid or missing renderable data for ${objectId}`,
    );
    return false;
  }

  // --- Update isFocused state in renderableStore ---
  const updatedRenderables = { ...currentRenderables }; // Create a shallow copy
  let storeNeedsUpdate = false;

  for (const id in updatedRenderables) {
    if (id === objectId) {
      if (!updatedRenderables[id].isFocused) {
        updatedRenderables[id] = { ...updatedRenderables[id], isFocused: true };
        storeNeedsUpdate = true;
      }
    } else {
      if (updatedRenderables[id].isFocused) {
        updatedRenderables[id] = {
          ...updatedRenderables[id],
          isFocused: false,
        };
        storeNeedsUpdate = true;
      }
    }
  }

  if (storeNeedsUpdate) {
    renderableStore.setAllRenderableObjects(updatedRenderables);
  }
  // --- End of isFocused update ---

  const targetPosition = targetObjectRenderable.position.clone();

  dispatchEventCallback(
    new CustomEvent(CustomEvents.FOCUS_REQUEST_INITIATED, {
      bubbles: true,
      composed: true,
      detail: { objectId },
    }),
  );

  parentPanel.engineCameraManager?.pointCameraAt(targetPosition);

  parentPanel.updateViewState({ focusedObjectId: objectId });

  console.debug(`[FocusControl.interactions] Focus pointed at ${objectId}`);
  return true;
}

/**
 * Handles the logic for requesting the camera to follow (track) a specific object.
 *
 * @param parentPanel The parent engine panel containing the renderer.
 * @param objectId The ID of the object to follow.
 * @returns {boolean} True if the follow request was successfully initiated, false otherwise.
 */
export function handleFollowRequest(
  parentPanel: CompositeEnginePanel | null,
  objectId: string,
): boolean {
  if (!parentPanel) {
    console.error(
      "[FocusControl.interactions] Parent panel not set, cannot follow.",
    );
    return false;
  }
  const renderer = parentPanel.getRenderer();
  if (!renderer) {
    console.error(
      "[FocusControl.interactions] Renderer not available, cannot follow.",
    );
    return false;
  }

  const objects = getCelestialObjects();
  const targetObject = objects[objectId];
  if (
    !targetObject ||
    targetObject.status === CelestialStatus.DESTROYED ||
    targetObject.status === CelestialStatus.ANNIHILATED
  ) {
    console.warn(
      `[FocusControl.interactions] Cannot follow object ${objectId}. Status invalid.`,
    );
    return false;
  }

  const currentRenderables = renderableStore.getRenderableObjects();
  const targetObjectRenderable = currentRenderables[objectId];
  if (
    !targetObjectRenderable ||
    !targetObjectRenderable.position ||
    !(targetObjectRenderable.position instanceof THREE.Vector3)
  ) {
    console.error(
      `[FocusControl.interactions] Invalid or missing renderable data for follow target ${objectId}`,
    );
    return false;
  }

  const objectToFollow = renderer.objectManager.getObject(objectId);
  if (!objectToFollow) {
    console.error(
      `[FocusControl.interactions] Could not find THREE object with ID '${objectId}' in renderer.objectManager.`,
    );
    return false;
  }

  const engineCameraManager = parentPanel.engineCameraManager;
  if (!engineCameraManager) {
    console.error(
      "[FocusControl.interactions] EngineCameraManager not available on parent panel, cannot follow.",
    );
    return false;
  }

  engineCameraManager.focusOnObject(objectId);

  console.debug(`[FocusControl.interactions] Follow initiated for ${objectId}`);
  return true;
}
