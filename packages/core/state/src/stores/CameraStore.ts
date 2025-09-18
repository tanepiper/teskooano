import { OSVector3 } from "@teskooano/core-math";
import { BehaviorSubject, Observable } from "rxjs";
import { CameraState } from "../types";

/**
 * @class CameraStore
 * @description Instance-based store managing camera state including position, target, FOV,
 * selected objects, and focused objects. Each engine panel should have its own instance.
 */
export class CameraStore {
  /** Registry of all camera store instances, keyed by panel ID */
  private static instances = new Map<string, CameraStore>();

  /** The initial, default camera state. */
  private readonly _initialState: CameraState = {
    position: new OSVector3().setFromArray([200, 200, 200]),
    target: new OSVector3().setZero(),
    fov: 75,
    selectedObject: null,
    focusedObjectId: null,
  };

  /** The RxJS BehaviorSubject holding the current camera state. */
  private readonly _cameraState: BehaviorSubject<CameraState>;
  /** An observable that emits the current camera state whenever it changes. */
  public readonly cameraState$: Observable<CameraState>;

  /**
   * Creates a new CameraStore instance for a specific panel.
   * @param panelId Unique identifier for the panel this camera belongs to.
   * @param initialState Optional initial state. If not provided, uses default values.
   */
  constructor(panelId: string, initialState?: Partial<CameraState>) {
    const state: CameraState = {
      ...this._initialState,
      ...initialState,
    };

    this._cameraState = new BehaviorSubject<CameraState>(state);
    this.cameraState$ = this._cameraState.asObservable();

    // Register this instance
    CameraStore.instances.set(panelId, this);
  }

  /**
   * Gets a camera store instance for a specific panel.
   * Creates a new instance if one doesn't exist for the given panel ID.
   * @param panelId Unique identifier for the panel.
   * @param initialState Optional initial state for new instances.
   * @returns The camera store instance for the panel.
   */
  public static getInstance(
    panelId: string,
    initialState?: Partial<CameraState>,
  ): CameraStore {
    if (!CameraStore.instances.has(panelId)) {
      new CameraStore(panelId, initialState);
    }
    return CameraStore.instances.get(panelId)!;
  }

  /**
   * Gets all registered camera store instances.
   * @returns Map of panel ID to camera store instance.
   */
  public static getAllInstances(): Map<string, CameraStore> {
    return new Map(CameraStore.instances);
  }

  /**
   * Removes a camera store instance for a specific panel.
   * @param panelId Unique identifier for the panel.
   */
  public static removeInstance(panelId: string): void {
    const instance = CameraStore.instances.get(panelId);
    if (instance) {
      instance.dispose();
      CameraStore.instances.delete(panelId);
    }
  }

  /**
   * Gets the current, instantaneous snapshot of the camera state.
   * @returns The current camera state object.
   */
  public getCameraState(): CameraState {
    return this._cameraState.getValue();
  }

  /**
   * Overwrites the entire camera state with a new state object.
   * This is a powerful method and should be used with caution. For most updates,
   * prefer using the CameraManager methods.
   * @param newState The complete new camera state.
   */
  public setCameraState(newState: CameraState): void {
    this._cameraState.next(newState);
  }

  /**
   * Updates the camera state by merging with the current state.
   * @param updates Partial state updates to merge with current state.
   */
  public updateCameraState(updates: Partial<CameraState>): void {
    const currentState = this.getCameraState();
    this.setCameraState({
      ...currentState,
      ...updates,
    });
  }

  /**
   * Resets the camera state to the initial default values.
   */
  public resetToInitialState(): void {
    this.setCameraState(this._initialState);
  }

  /**
   * Disposes of the store and cleans up resources.
   */
  public dispose(): void {
    this._cameraState.complete();
  }
}
