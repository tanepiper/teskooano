import { OSVector3 } from "@teskooano/core-math";
import { CameraStore } from "../stores/CameraStore";
import type { CameraState } from "../types";

/**
 * @class CameraManager
 * @description Manages camera state including position, target, FOV, selected objects,
 * and focused objects. Each engine panel should have its own instance.
 */
export class CameraManager {
  /**
   * The panel ID this camera manager is associated with.
   */
  private readonly panelId: string;

  /**
   * The camera store instance for this camera manager.
   */
  private readonly cameraStore: CameraStore;

  /**
   * Creates a new CameraManager instance for a specific panel.
   * @param panelId Unique identifier for the panel this camera manager belongs to.
   * @param initialState Optional initial camera state. If not provided, uses default values.
   */
  constructor(panelId: string, initialState?: Partial<CameraState>) {
    this.panelId = panelId;
    this.cameraStore = CameraStore.getInstance(panelId, initialState);
  }

  /**
   * Gets a camera manager instance for a specific panel.
   * Creates a new instance if one doesn't exist for the given panel ID.
   * @param panelId Unique identifier for the panel.
   * @param initialState Optional initial camera state for new instances.
   * @returns The camera manager instance for the panel.
   */
  public static getInstance(
    panelId: string,
    initialState?: Partial<CameraState>,
  ): CameraManager {
    return new CameraManager(panelId, initialState);
  }

  /**
   * Gets the panel ID this camera manager is associated with.
   * @returns The panel ID.
   */
  public getPanelId(): string {
    return this.panelId;
  }

  /**
   * Gets the current, instantaneous snapshot of the camera state.
   * @returns The current camera state object.
   */
  public getCameraState(): CameraState {
    return this.cameraStore.getCameraState();
  }

  /**
   * Gets the camera state observable for reactive subscriptions.
   * @returns Observable of camera state changes.
   */
  public getCameraState$() {
    return this.cameraStore.cameraState$;
  }

  /**
   * Sets the currently selected celestial object.
   * This is typically used for displaying information about an object in the UI.
   * @param objectId The unique ID of the object to select, or null to deselect.
   */
  public selectObject(objectId: string | null): void {
    this.cameraStore.updateCameraState({
      selectedObject: objectId,
    });
  }

  /**
   * Gets the currently selected object ID.
   * @returns The selected object ID or null if none is selected.
   */
  public getSelectedObject(): string | null {
    return this.cameraStore.getCameraState().selectedObject;
  }

  /**
   * Sets the object that the camera should be focused on or following.
   * @param objectId The unique ID of the object to focus, or null to unfocus.
   */
  public setFocusedObject(objectId: string | null): void {
    this.cameraStore.updateCameraState({
      focusedObjectId: objectId,
    });
  }

  /**
   * Gets the currently focused object ID.
   * @returns The focused object ID or null if none is focused.
   */
  public getFocusedObject(): string | null {
    return this.cameraStore.getCameraState().focusedObjectId;
  }

  /**
   * Updates the camera's position and target in the camera state.
   * @param position The new position of the camera.
   * @param target The new point the camera should look at.
   */
  public updateCamera(position: OSVector3, target: OSVector3): void {
    this.cameraStore.updateCameraState({
      position,
      target,
    });
  }

  /**
   * Sets the camera position.
   * @param position The new position of the camera.
   */
  public setCameraPosition(position: OSVector3): void {
    this.cameraStore.updateCameraState({
      position,
    });
  }

  /**
   * Gets the current camera position.
   * @returns The current camera position.
   */
  public getCameraPosition(): OSVector3 {
    return this.cameraStore.getCameraState().position;
  }

  /**
   * Sets the camera target (the point the camera looks at).
   * @param target The new target point.
   */
  public setCameraTarget(target: OSVector3): void {
    this.cameraStore.updateCameraState({
      target,
    });
  }

  /**
   * Gets the current camera target.
   * @returns The current camera target.
   */
  public getCameraTarget(): OSVector3 {
    return this.cameraStore.getCameraState().target;
  }

  /**
   * Sets the camera field of view.
   * @param fov The new field of view in degrees.
   */
  public setCameraFov(fov: number): void {
    const validatedFov = Math.max(1, Math.min(179, fov)); // Clamp between 1 and 179 degrees
    this.cameraStore.updateCameraState({
      fov: validatedFov,
    });
  }

  /**
   * Gets the current camera field of view.
   * @returns The current field of view in degrees.
   */
  public getCameraFov(): number {
    return this.cameraStore.getCameraState().fov;
  }

  /**
   * Resets the camera to the initial default state.
   */
  public resetCamera(): void {
    this.cameraStore.resetToInitialState();
  }

  /**
   * Resets only the camera position and target to defaults.
   */
  public resetCameraPosition(): void {
    this.cameraStore.updateCameraState({
      position: new OSVector3().setFromArray([0, 100, 100]),
      target: new OSVector3().setZero(),
    });
  }

  /**
   * Resets only the selection and focus to null.
   */
  public resetSelection(): void {
    this.cameraStore.updateCameraState({
      selectedObject: null,
      focusedObjectId: null,
    });
  }

  /**
   * Disposes of the manager and its store.
   */
  public dispose(): void {
    CameraStore.removeInstance(this.panelId);
  }
}
