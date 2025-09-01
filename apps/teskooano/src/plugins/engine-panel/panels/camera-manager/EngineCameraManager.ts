import { BehaviorSubject } from "rxjs";
import * as THREE from "three";
import { CameraManager } from "@teskooano/renderer-threejs-camera";
import type { CompositeEnginePanel } from "../../panels/composite-panel/CompositeEnginePanel";
import { OSVector3 } from "@teskooano/core-math";
import type { CameraManagerState } from "@teskooano/data-types";

/**
 * Thin façade over the renderer CameraManager for use by panel/UI code.
 * State wiring is handled by PanelCameraCoordinator; this class only delegates operations.
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

  /** Sets the camera Field of View (FOV). */
  public setFov(fov: number): void {
    if (this._cameraManager) {
      this._cameraManager.setFov(fov);
    } else {
      console.warn(
        `[EngineCameraManager for Panel ${this._panelApiId || "N/A"}] setFov called but CameraManager is not available.`,
      );
    }
  }

  /** Focus/follow a specific object by ID. */
  public focusOnObject(objectId: string): void {
    this._cameraManager?.followObject(objectId);
  }

  /** Clear any current focus/follow. */
  public clearFocus(): void {
    this._cameraManager?.clearFocus();
  }

  /** Reset the camera to its default view. */
  public resetCameraView(): void {
    this._cameraManager?.resetCameraView();
  }

  /** Point the camera towards a specific world position. */
  public pointCameraAt(position: THREE.Vector3): void {
    this._cameraManager?.pointCameraAt(position);
  }

  /**
   * Smoothly move the camera to a given position and target.
   * Converts THREE.Vector3 to OSVector3 for the underlying controls.
   */
  public moveToPosition(
    cameraPosition: THREE.Vector3,
    targetPosition: THREE.Vector3,
  ): void {
    if (
      this._cameraManager &&
      (this._cameraManager as any).renderer?.controlsManager
    ) {
      const cameraPositionOS = OSVector3.fromThreeJS(cameraPosition);
      const targetPositionOS = OSVector3.fromThreeJS(targetPosition);

      (this._cameraManager as any).renderer.controlsManager.moveToPosition(
        cameraPositionOS,
        targetPositionOS,
        true,
        { focusedObjectId: null },
      );
    } else {
      console.warn(
        `[EngineCameraManager for Panel ${
          this._panelApiId || "N/A"
        }] moveToPosition called but CameraManager or controlsManager is not available.`,
      );
    }
  }

  /**
   * Expose camera state observable for consumers that expect it (e.g., hierarchy panel).
   * Delegates to renderer CameraManager or provides a safe fallback.
   */
  public getCameraState$(): BehaviorSubject<CameraManagerState> {
    if (this._cameraManager) {
      return this._cameraManager.getCameraState$();
    }
    const errorState: CameraManagerState = {
      focusedObjectId: null,
      fov: 0,
      currentPosition: new OSVector3(),
      currentTarget: new OSVector3(),
    };
    return new BehaviorSubject<CameraManagerState>(errorState);
  }

  /** No-op cleanup hook (dependencies managed elsewhere). */
  public dispose(): void {
    // Intentionally empty: lifecycle handled by PanelCameraCoordinator/CompositeEnginePanel
  }
}
