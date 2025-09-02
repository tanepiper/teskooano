import { StateAccessor, renderableStore } from "@teskooano/core-state";
import { CelestialStatus, CelestialType } from "@teskooano/data-types";
import type { CompositeEnginePanel } from "../../engine-panel/panels/composite-panel/CompositeEnginePanel";
import * as THREE from "three";
import { AU_METERS, METERS_TO_SCENE_UNITS } from "@teskooano/data-values";

/**
 * Handles camera focus and follow requests for celestial objects.
 */
export class FocusInteractionManager {
  private readonly enginePanel: CompositeEnginePanel | null;

  constructor(enginePanel: CompositeEnginePanel | null) {
    this.enginePanel = enginePanel;
  }

  /**
   * Handles the logic for requesting the camera to point at a specific object.
   * @param objectId The ID of the object to focus on.
   * @returns True if the focus request was successfully initiated.
   */
  public handleFocusRequest(objectId: string): boolean {
    if (!this.validateEnginePanel()) {
      return false;
    }

    if (!this.validateTargetObject(objectId)) {
      return false;
    }

    const targetPosition = this.getTargetPosition(objectId);
    if (!targetPosition) {
      return false;
    }

    this.enginePanel!.engineCameraManager?.pointCameraAt(targetPosition);

    console.debug(`[FocusInteractionManager] Focus pointed at ${objectId}`);
    return true;
  }

  /**
   * Handles the logic for requesting the camera to follow (track) a specific object.
   * @param objectId The ID of the object to follow.
   * @returns True if the follow request was successfully initiated.
   */
  public handleFollowRequest(objectId: string): boolean {
    if (!this.validateEnginePanel()) {
      return false;
    }

    if (!this.validateTargetObject(objectId, false)) {
      return false;
    }

    const renderer = this.enginePanel!.getRenderer()!;
    const objectToFollow =
      renderer.renderingOrchestrator.objectManager.getObject(objectId);
    if (!objectToFollow) {
      console.warn(
        `[FocusInteractionManager] Could not find THREE object with ID '${objectId}' in renderer.objectManager. The camera will attempt to follow it once it appears.`,
      );
    }

    const engineCameraManager = this.enginePanel!.engineCameraManager;
    if (!engineCameraManager) {
      console.error(
        "[FocusInteractionManager] EngineCameraManager not available on parent panel, cannot follow.",
      );
      return false;
    }

    const objects = StateAccessor.getCelestialObjects();
    const targetObject = objects[objectId];

    // Special handling for asteroid fields and oort clouds
    if (this.isSpecialObjectType(targetObject)) {
      return this.handleSpecialObjectFollow(targetObject, engineCameraManager);
    }

    // Default behavior for other object types
    engineCameraManager.focusOnObject(objectId);
    console.debug(`[FocusInteractionManager] Follow initiated for ${objectId}`);
    return true;
  }

  private validateEnginePanel(): boolean {
    if (!this.enginePanel) {
      console.error(
        "[FocusInteractionManager] Parent panel not set, cannot focus.",
      );
      return false;
    }

    const renderer = this.enginePanel.getRenderer();
    if (!renderer) {
      console.error(
        "[FocusInteractionManager] Renderer not available, cannot focus.",
      );
      return false;
    }

    return true;
  }

  private validateTargetObject(
    objectId: string,
    checkType: boolean = true,
  ): boolean {
    const objects = StateAccessor.getCelestialObjects();
    const targetObject = objects[objectId];

    if (!targetObject) {
      console.warn(
        `[FocusInteractionManager] Cannot focus on object ${objectId}. Object not found.`,
      );
      return false;
    }

    if (
      targetObject.status === CelestialStatus.DESTROYED ||
      targetObject.status === CelestialStatus.ANNIHILATED
    ) {
      console.warn(
        `[FocusInteractionManager] Cannot focus on object ${objectId}. Status invalid.`,
      );
      return false;
    }

    if (
      checkType &&
      (targetObject.type === CelestialType.ASTEROID_FIELD ||
        targetObject.type === CelestialType.OORT_CLOUD)
    ) {
      console.warn(
        `[FocusInteractionManager] Cannot focus on object ${objectId}. Type invalid.`,
      );
      return false;
    }

    return true;
  }

  private getTargetPosition(objectId: string): THREE.Vector3 | null {
    const currentRenderables = renderableStore.getRenderableObjects();
    const targetObjectRenderable = currentRenderables[objectId];

    if (!targetObjectRenderable || !targetObjectRenderable.position) {
      console.error(
        `[FocusInteractionManager] Invalid or missing renderable data for ${objectId}`,
      );
      return null;
    }

    return targetObjectRenderable.position.clone();
  }

  private isSpecialObjectType(targetObject: any): boolean {
    return (
      targetObject.type === CelestialType.ASTEROID_FIELD ||
      targetObject.type === CelestialType.OORT_CLOUD
    );
  }

  private handleSpecialObjectFollow(
    targetObject: any,
    engineCameraManager: any,
  ): boolean {
    let innerRadiusMeters = 0;
    let innerRadiusAU = 0;

    if (targetObject.properties) {
      const props = targetObject.properties as any;
      if (props.innerRadiusAU !== undefined) {
        innerRadiusAU = props.innerRadiusAU;
        innerRadiusMeters = props.innerRadiusAU * AU_METERS;
      }
    }

    if (innerRadiusMeters <= 0) {
      console.warn(
        `[FocusInteractionManager] No valid inner radius found for ${targetObject.id}`,
      );
      return false;
    }

    // Convert to scene units
    const innerRadiusSceneUnits = innerRadiusMeters * METERS_TO_SCENE_UNITS;

    // Set target position at the inner radius edge (on the XY plane)
    const targetPosition = new THREE.Vector3(innerRadiusSceneUnits, 0, 0);

    // Calculate camera position with an offset for a good viewing angle
    // Use 30% of the radius for consistency with the main camera system
    const cameraOffset = new THREE.Vector3(0.3, 0.2, 0.5).normalize();
    const offsetDistance = innerRadiusSceneUnits * 0.3; // 30% of the inner radius as offset
    const cameraPosition = targetPosition
      .clone()
      .add(cameraOffset.multiplyScalar(offsetDistance));

    // Use the new moveToPosition method to smoothly travel there
    engineCameraManager.moveToPosition(cameraPosition, targetPosition);

    console.debug(
      `[FocusInteractionManager] Traveling to inner radius of ${targetObject.id} (${innerRadiusAU} AU)`,
    );
    return true;
  }
}
