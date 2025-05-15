import * as THREE from "three";
import type { CameraManager } from "../../camera-manager/CameraManager";
import type { CompositeEnginePanel } from "./CompositeEnginePanel";

/**
 * Manages camera operations specifically for a CompositeEnginePanel instance.
 * It acts as an intermediary between the panel and the global CameraManager,
 * adding panel-specific context like API ID for logging.
 */
export class EngineCameraManager {
  private _cameraManager: CameraManager;
  private _panelApiId: string | undefined;
  private _panelInstance: CompositeEnginePanel;

  constructor(
    cameraManager: CameraManager,
    panelInstance: CompositeEnginePanel,
    panelApiId?: string,
  ) {
    this._cameraManager = cameraManager;
    this._panelInstance = panelInstance;
    this._panelApiId = panelApiId;
  }

  /**
   * Sets the camera's Field of View (FOV).
   * @param fov - The new FOV value.
   */
  public setFov(fov: number): void {
    if (this._cameraManager) {
      this._cameraManager.setFov(fov);
    } else {
      console.warn(
        `[EngineCameraManager for Panel ${this._panelApiId || "N/A"}] setFov called but CameraManager is not available.`,
      );
    }
  }

  /**
   * Moves the camera to focus on a specific celestial object or clears focus.
   * Delegates the call to the CameraManager.
   * @param objectId - The unique ID of the object to focus on, or null to clear focus.
   * @param distance - Optional distance multiplier for the camera offset.
   */
  public focusOnObject(objectId: string | null, distance?: number): void {
    if (this._cameraManager) {
      this._cameraManager.followObject(objectId, distance);
    } else {
      console.warn(
        `[EngineCameraManager for Panel ${this._panelApiId || "N/A"}] focusOnObject called but CameraManager is not available.`,
      );
    }
  }

  /**
   * Resets the camera to its default position and target, clearing any focus.
   * Delegates the call to the CameraManager.
   */
  public resetCameraView(): void {
    if (this._cameraManager) {
      this._cameraManager.resetCameraView();
    } else {
      console.warn(
        `[EngineCameraManager for Panel ${this._panelApiId || "N/A"}] resetCameraView called but CameraManager is not available.`,
      );
    }
  }

  /**
   * Clears the current focus, equivalent to focusing on null.
   * Delegates the call to the CameraManager.
   */
  public clearFocus(): void {
    if (this._cameraManager) {
      this._cameraManager.clearFocus();
    } else {
      console.warn(
        `[EngineCameraManager for Panel ${this._panelApiId || "N/A"}] clearFocus called but CameraManager is not available.`,
      );
    }
  }

  /**
   * Points the camera towards a specific target position without changing
   * the camera's current position. Uses a smooth transition.
   * @param targetPosition - The world coordinates to point the camera at.
   */
  public pointCameraAt(targetPosition: THREE.Vector3): void {
    if (this._cameraManager) {
      this._cameraManager.pointCameraAt(targetPosition);
    } else {
      console.warn(
        `[EngineCameraManager for Panel ${this._panelApiId || "N/A"}] pointCameraAt called but CameraManager is not available.`,
      );
    }
  }

  /**
   * Perform any necessary cleanup.
   * For now, this class doesn't hold resources that need explicit cleanup beyond
   * what CameraManager itself handles or what the CompositeEnginePanel handles for CameraManager.
   */
  public dispose(): void {
    // If EngineCameraManager were to hold its own subscriptions or resources,
    // they would be cleaned up here.
    // For now, its dependencies (CameraManager) are managed by CompositeEnginePanel.
    console.debug(
      `[EngineCameraManager for Panel ${this._panelApiId || "N/A"}] dispose called.`,
    );
  }
}
