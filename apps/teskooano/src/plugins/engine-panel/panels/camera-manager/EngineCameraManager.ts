import { BehaviorSubject } from "rxjs";
import * as THREE from "three";
import type {
  CameraManager,
  CameraManagerOptions,
  CameraManagerState,
} from "@teskooano/app-simulation";
import type { CompositeEnginePanel } from "../../panels/composite-panel/CompositeEnginePanel";

/**
 * Manages camera operations specifically for a CompositeEnginePanel instance.
 * It acts as an intermediary between the panel and a panel-specific CameraManager instance.
 */
export class EngineCameraManager {
  private _cameraManager: CameraManager | undefined;
  private _panelApiId: string | undefined;

  constructor(
    _: CompositeEnginePanel,
    cameraManagerInstance: CameraManager,
    panelApiId?: string,
  ) {
    this._cameraManager = cameraManagerInstance;
    this._panelApiId = panelApiId;

    if (!this._cameraManager) {
      console.error(
        `[EngineCameraManager for Panel ${
          this._panelApiId || "N/A"
        }] CameraManager instance was not provided! Camera controls will be unavailable.`,
      );
    }
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
  public focusOnObject(objectId: string): void {
    this._cameraManager?.followObject(objectId);
  }

  /**
   * Resets the camera to its default position and target, clearing any focus.
   * Delegates the call to the CameraManager.
   */
  public resetCameraView(): void {
    this._cameraManager?.resetCameraView();
  }

  /**
   * Clears the current focus, equivalent to focusing on null.
   * Delegates the call to the CameraManager.
   */
  public clearFocus(): void {
    this._cameraManager?.clearFocus();
  }

  /**
   * Points the camera towards a specific target position without changing
   * the camera's current position. Uses a smooth transition.
   * @param targetPosition - The world coordinates to point the camera at.
   */
  public pointCameraAt(position: THREE.Vector3): void {
    this._cameraManager?.pointCameraAt(position);
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

  /**
   * Sets dependencies for the underlying CameraManager.
   * @param options - Configuration options.
   */
  public setDependencies(options: CameraManagerOptions): void {
    if (this._cameraManager) {
      this._cameraManager.setDependencies(options);
    } else {
      console.error(
        `[EngineCameraManager for Panel ${this._panelApiId || "N/A"}] setDependencies called but CameraManager is not available.`,
      );
    }
  }

  /**
   * Initializes the camera position via the underlying CameraManager.
   */
  public initializeCameraPosition(): void {
    if (this._cameraManager) {
      this._cameraManager.initializeCameraPosition();
    } else {
      console.error(
        `[EngineCameraManager for Panel ${this._panelApiId || "N/A"}] initializeCameraPosition called but CameraManager is not available.`,
      );
    }
  }

  /**
   * Gets the camera state observable from the underlying CameraManager.
   * @returns The BehaviorSubject stream of camera state, or a new one emitting an error state if CameraManager is unavailable.
   */
  public getCameraState$(): BehaviorSubject<CameraManagerState> {
    if (this._cameraManager) {
      return this._cameraManager.getCameraState$();
    }
    console.error(
      `[EngineCameraManager for Panel ${
        this._panelApiId || "N/A"
      }] getCameraState$ called but CameraManager is not available. Returning a new subject.`,
    );
    const errorState: CameraManagerState = {
      focusedObjectId: null,
      fov: 0,
      currentPosition: new THREE.Vector3(),
      currentTarget: new THREE.Vector3(),
    };
    return new BehaviorSubject<CameraManagerState>(errorState);
  }
}
