import { StateAccessor, renderableStore } from "@teskooano/core-state";
import {
  CelestialStatus,
  CelestialType,
  CustomEvents,
} from "@teskooano/data-types";
import type { CompositeEnginePanel } from "../../engine-panel/panels/composite-panel/CompositeEnginePanel";
import * as THREE from "three";
import { AU_METERS, METERS_TO_SCENE_UNITS } from "@teskooano/data-values";

/**
 * Handles the logic for requesting the camera to point at a specific object.
 * @param parentPanel The parent engine panel containing the renderer.
 * @param objectId The ID of the object to focus on.
 * @param dispatchEventCallback Callback to dispatch events from the component.
 * @returns True if the focus request was successfully initiated.
 */
export function handleFocusRequest(
  parentPanel: CompositeEnginePanel | null,
  objectId: string,
  dispatchEventCallback: (event: CustomEvent) => void,
): boolean {
  if (!parentPanel) {
    console.error("[handleFocusRequest] Parent panel not set, cannot focus.");
    return false;
  }
  const renderer = parentPanel.getRenderer();
  if (!renderer) {
    console.error("[handleFocusRequest] Renderer not available, cannot focus.");
    return false;
  }

  const objects = StateAccessor.getCurrentCelestialObjects();
  const targetObject = objects[objectId];
  if (
    !targetObject ||
    targetObject.type === CelestialType.ASTEROID_FIELD ||
    targetObject.type === CelestialType.OORT_CLOUD ||
    targetObject.status === CelestialStatus.DESTROYED ||
    targetObject.status === CelestialStatus.ANNIHILATED
  ) {
    console.warn(
      `[handleFocusRequest] Cannot focus on object ${objectId}. Type or status invalid.`,
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
      `[handleFocusRequest] Invalid or missing renderable data for ${objectId}`,
    );
    return false;
  }
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

  console.debug(`[handleFocusRequest] Focus pointed at ${objectId}`);
  return true;
}

/**
 * Handles the logic for requesting the camera to follow (track) a specific object.
 * @param parentPanel The parent engine panel containing the renderer.
 * @param objectId The ID of the object to follow.
 * @returns True if the follow request was successfully initiated.
 */
export function handleFollowRequest(
  parentPanel: CompositeEnginePanel | null,
  objectId: string,
): boolean {
  if (!parentPanel) {
    console.error("[handleFollowRequest] Parent panel not set, cannot follow.");
    return false;
  }
  const renderer = parentPanel.getRenderer();
  if (!renderer) {
    console.error(
      "[handleFollowRequest] Renderer not available, cannot follow.",
    );
    return false;
  }

  const objects = StateAccessor.getCurrentCelestialObjects();
  const targetObject = objects[objectId];
  if (
    !targetObject ||
    targetObject.status === CelestialStatus.DESTROYED ||
    targetObject.status === CelestialStatus.ANNIHILATED
  ) {
    console.warn(
      `[handleFollowRequest] Cannot follow object ${objectId}. Status invalid.`,
    );
    return false;
  }

  const objectToFollow =
    renderer.renderingOrchestrator.objectManager.getObject(objectId);
  if (!objectToFollow) {
    console.warn(
      `[handleFollowRequest] Could not find THREE object with ID '${objectId}' in renderer.objectManager. The camera will attempt to follow it once it appears.`,
    );
  }

  const engineCameraManager = parentPanel.engineCameraManager;
  if (!engineCameraManager) {
    console.error(
      "[handleFollowRequest] EngineCameraManager not available on parent panel, cannot follow.",
    );
    return false;
  }

  // Special handling for asteroid fields and oort clouds - travel to inner radius
  if (
    targetObject.type === CelestialType.ASTEROID_FIELD ||
    targetObject.type === CelestialType.OORT_CLOUD
  ) {
    let innerRadiusMeters = 0;
    let innerRadiusAU = 0;

    if (targetObject.properties) {
      const props = targetObject.properties as any;
      if (props.innerRadiusAU !== undefined) {
        innerRadiusAU = props.innerRadiusAU;
        innerRadiusMeters = props.innerRadiusAU * AU_METERS;
      }
    }

    if (innerRadiusMeters > 0) {
      // Convert to scene units
      const innerRadiusSceneUnits = innerRadiusMeters * METERS_TO_SCENE_UNITS;

      // Set target position at the inner radius edge (on the XY plane)
      const targetPosition = new THREE.Vector3(innerRadiusSceneUnits, 0, 0);

      // Calculate camera position with an offset for a good viewing angle
      // Use a normalized offset vector similar to the default camera behavior
      const cameraOffset = new THREE.Vector3(0.3, 0.2, 0.5).normalize();
      const offsetDistance = innerRadiusSceneUnits * 0.1; // 10% of the inner radius as offset
      const cameraPosition = targetPosition
        .clone()
        .add(cameraOffset.multiplyScalar(offsetDistance));

      // Use the new moveToPosition method to smoothly travel there
      engineCameraManager.moveToPosition(cameraPosition, targetPosition);

      console.debug(
        `[handleFollowRequest] Traveling to inner radius of ${objectId} (${innerRadiusAU} AU)`,
      );
      return true;
    }
  }

  // Default behavior for other object types
  engineCameraManager.focusOnObject(objectId);

  console.debug(`[handleFollowRequest] Follow initiated for ${objectId}`);
  return true;
}
