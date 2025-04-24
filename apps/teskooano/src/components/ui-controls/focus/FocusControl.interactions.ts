import {
  celestialObjectsStore,
  renderableObjectsStore,
} from "@teskooano/core-state";
import { CelestialStatus, CelestialType } from "@teskooano/data-types";
import * as THREE from "three";
import type { CompositeEnginePanel } from "../../engine/CompositeEnginePanel";
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

  const objects = celestialObjectsStore.get();
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

  const currentRenderables = renderableObjectsStore.get();
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
  const targetPosition = targetObjectRenderable.position.clone();

  // Dispatch event *before* initiating focus (target change)
  dispatchEventCallback(
    new CustomEvent(CustomEvents.FOCUS_REQUEST_INITIATED, {
      bubbles: true,
      composed: true,
      detail: { objectId },
    }),
  );

  // Point Camera At Target
  parentPanel.pointCameraAt(targetPosition);

  // Update the view state to reflect the intended focus
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

  const objects = celestialObjectsStore.get();
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

  const currentRenderables = renderableObjectsStore.get();
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

  // Get the Three.js object to follow from the renderer's object manager
  const objectToFollow = renderer.objectManager.getObject(objectId);
  if (!objectToFollow) {
    console.error(
      `[FocusControl.interactions] Could not find THREE object with ID '${objectId}' in renderer.objectManager.`,
    );
    return false;
  }

  // Reset camera zoom before calculating position (if applicable)
  if (
    renderer.camera &&
    "zoom" in renderer.camera &&
    "updateProjectionMatrix" in renderer.camera
  ) {
    const cameraWithZoom = renderer.camera as
      | THREE.PerspectiveCamera
      | THREE.OrthographicCamera;
    cameraWithZoom.zoom = 1;
    cameraWithZoom.updateProjectionMatrix();
  }

  // We let the ControlsManager calculate the final position/distance
  // The `false` argument for `keepCurrentDistance` means it will calculate
  // a suitable distance instead of maintaining the current one.
  renderer.controlsManager.setFollowTarget(
    objectToFollow, // Pass the actual THREE.Object3D
    undefined, // Let ControlsManager determine target position from object
    false, // Don't keep current distance, calculate a new one
  );

  // Update the view state to reflect the intended focus/follow
  parentPanel.updateViewState({ focusedObjectId: objectId });

  console.debug(`[FocusControl.interactions] Follow initiated for ${objectId}`);
  return true;
}
