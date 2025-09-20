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
  private readonly _cameraManager: CameraManager;

  constructor(
    _: CompositeEnginePanel,
    cameraManagerInstance: CameraManager,
    _panelApiId: string,
  ) {
    this._cameraManager = cameraManagerInstance;
  }

  /** Sets the camera Field of View (FOV). */
  public setFov(fov: number): void {
    this._cameraManager.setFov(fov);
  }

  /** Focus/follow a specific object by ID. */
  public focusOnObject(objectId: string): void {
    this._cameraManager.followObject(objectId);
  }

  /** Clear any current focus/follow. */
  public clearFocus(): void {
    this._cameraManager.clearFocus();
  }

  /** Reset the camera to its default view. */
  public resetCameraView(): void {
    this._cameraManager.resetCameraView();
  }

  /** Point the camera towards a specific world position. */
  public pointCameraAt(position: THREE.Vector3): void {
    this._cameraManager.pointCameraAt(position);
  }

  /**
   * Smoothly move the camera to a given position and target.
   * Converts THREE.Vector3 to OSVector3 for the underlying controls.
   */
  public moveToPosition(
    cameraPosition: THREE.Vector3,
    targetPosition: THREE.Vector3,
  ): void {
    const cameraPositionOS = OSVector3.fromThreeJS(cameraPosition);
    const targetPositionOS = OSVector3.fromThreeJS(targetPosition);

    (this._cameraManager as any).renderer.controlsManager.moveToPosition(
      cameraPositionOS,
      targetPositionOS,
      true,
      { focusedObjectId: null },
    );
  }

  /**
   * Expose camera state observable for consumers that expect it (e.g., hierarchy panel).
   * Delegates to renderer CameraManager.
   */
  public getCameraState$(): BehaviorSubject<CameraManagerState> {
    return this._cameraManager.getCameraState$();
  }

  /** No-op cleanup hook (dependencies managed elsewhere). */
  public dispose(): void {
    // Intentionally empty: lifecycle handled by PanelCameraCoordinator/CompositeEnginePanel
  }
}
