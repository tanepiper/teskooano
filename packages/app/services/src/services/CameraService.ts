import { OSVector3 } from "@teskooano/core-math";
import { StateAccessor, renderableStore } from "@teskooano/core-state";
import { CelestialType } from "@teskooano/data-types";
import { BehaviorSubject, Observable } from "rxjs";
import * as THREE from "three";

/**
 * Camera service state interface
 */
export interface CameraServiceState {
  /** The current position of the camera in world coordinates */
  currentPosition: OSVector3;
  /** The current target point the camera is looking at in world coordinates */
  currentTarget: OSVector3;
  /** The camera's current vertical Field of View (FOV) in degrees */
  fov: number;
  /** The unique ID of the object currently being focused on, or null if no object is focused */
  focusedObjectId: string | null;
  /** Whether the camera is currently transitioning */
  isTransitioning: boolean;
}

/**
 * Configuration options for CameraService
 */
export interface CameraServiceOptions {
  /** Optional initial Field of View (FOV) for the camera */
  initialFov?: number;
  /** Optional ID of an object to focus on initially */
  initialFocusedObjectId?: string | null;
  /** Optional initial position for the camera */
  initialCameraPosition?: OSVector3;
  /** Optional initial target point for the camera */
  initialCameraTarget?: OSVector3;
}

/**
 * Constants for camera defaults
 */
const DEFAULT_FOV = 75;
const DEFAULT_CAMERA_DISTANCE = 50;
const DEFAULT_CAMERA_POSITION = new OSVector3(0, 0, DEFAULT_CAMERA_DISTANCE);
const DEFAULT_CAMERA_TARGET = new OSVector3(0, 0, 0);
const CAMERA_OFFSET = 5;

/**
 * Centralized camera service for managing camera state and operations.
 * 
 * This service extracts the business logic from camera controllers and provides:
 * - Centralized camera state management
 * - Camera position and target calculations
 * - Focus operations and transitions
 * - Field of View management
 * - Observable state for reactive UI updates
 */
export class CameraService {
  private _state$: BehaviorSubject<CameraServiceState>;
  
  constructor(options: CameraServiceOptions = {}) {
    // Initialize camera state with defaults or provided options
    const initialState: CameraServiceState = {
      fov: options.initialFov ?? DEFAULT_FOV,
      focusedObjectId: options.initialFocusedObjectId ?? null,
      currentPosition: options.initialCameraPosition ?? DEFAULT_CAMERA_POSITION.clone(),
      currentTarget: options.initialCameraTarget ?? DEFAULT_CAMERA_TARGET.clone(),
      isTransitioning: false,
    };
    
    this._state$ = new BehaviorSubject<CameraServiceState>(initialState);
    
    // If an initial focus object is specified, calculate its position
    if (initialState.focusedObjectId) {
      this._updateFocusTarget(initialState.focusedObjectId);
    }
  }
  
  /**
   * Get the current camera state as an observable
   */
  public get state$(): Observable<CameraServiceState> {
    return this._state$.asObservable();
  }
  
  /**
   * Get the current camera state value
   */
  public getCurrentState(): CameraServiceState {
    return this._state$.getValue();
  }
  
  /**
   * Focus the camera on a specific celestial object
   * @param objectId The ID of the object to focus on, or null to clear focus
   * @param distance Optional custom distance from the object
   */
  public focusOnObject(objectId: string | null, distance?: number): void {
    const currentState = this._state$.getValue();
    
    if (objectId === null) {
      // Clear focus - return to default position
      this._updateState({
        focusedObjectId: null,
        currentPosition: DEFAULT_CAMERA_POSITION.clone(),
        currentTarget: DEFAULT_CAMERA_TARGET.clone(),
        isTransitioning: true,
      });
      return;
    }
    
    // Get the object from the renderable store
    const renderableObjects = renderableStore.getRenderableObjects();
    const targetObject = renderableObjects[objectId];
    
    if (!targetObject) {
      console.warn(`[CameraService] Object ${objectId} not found in renderable objects`);
      return;
    }
    
    if (!targetObject.position) {
      console.warn(`[CameraService] Object ${objectId} has no position data`);
      return;
    }
    
    // Calculate viewing distance
    const viewingDistance = distance ?? this._calculateViewingDistance(
      targetObject.radius || 1,
      targetObject.type
    );
    
    // Calculate camera position with offset
    const targetPosition = OSVector3.fromThreeJS(targetObject.position);
    const cameraOffset = this._calculateCameraOffset(targetObject, viewingDistance);
    const newCameraPosition = targetPosition.clone().add(cameraOffset);
    
    // Update state
    this._updateState({
      focusedObjectId: objectId,
      currentPosition: newCameraPosition,
      currentTarget: targetPosition,
      isTransitioning: true,
    });
  }
  
  /**
   * Point the camera towards a specific position without changing camera location
   * @param targetPosition The world coordinates to point the camera towards
   */
  public pointCameraAt(targetPosition: OSVector3): void {
    this._updateState({
      currentTarget: targetPosition.clone(),
      isTransitioning: true,
    });
  }
  
  /**
   * Reset the camera to its default position and target
   */
  public resetCameraView(): void {
    this._updateState({
      focusedObjectId: null,
      currentPosition: DEFAULT_CAMERA_POSITION.clone(),
      currentTarget: DEFAULT_CAMERA_TARGET.clone(),
      isTransitioning: true,
    });
  }
  
  /**
   * Set the camera's field of view
   * @param fov The desired field of view in degrees
   */
  public setFov(fov: number): void {
    const currentState = this._state$.getValue();
    if (fov === currentState.fov) {
      return; // No change needed
    }
    
    this._updateState({ fov });
  }
  
  /**
   * Update the camera position manually
   * @param position The new camera position
   */
  public setCameraPosition(position: OSVector3): void {
    this._updateState({
      currentPosition: position.clone(),
      focusedObjectId: null, // Clear focus when manually positioning
    });
  }
  
  /**
   * Update the camera target manually
   * @param target The new camera target
   */
  public setCameraTarget(target: OSVector3): void {
    this._updateState({
      currentTarget: target.clone(),
    });
  }
  
  /**
   * Mark transition as complete
   */
  public markTransitionComplete(): void {
    this._updateState({ isTransitioning: false });
  }
  
  /**
   * Calculate appropriate viewing distance for an object
   * @private
   */
  private _calculateViewingDistance(objectRadius: number, objectType?: string): number {
    const RENDER_SCALE_AU = 1000;
    
    let reasonableDistance: number;
    
    // Different calculation strategies based on object size and type
    if (objectType === "SATELLITE" || objectRadius < 0.01) {
      reasonableDistance = objectRadius * 0.6;
    } else if ((objectType === "ASTEROID" || objectType === "COMET") && objectRadius < 1.0) {
      reasonableDistance = objectRadius * 5.0;
    } else {
      // Use logarithmic scaling for larger objects
      const typeMultipliers = {
        ASTEROID: 4.0,
        COMET: 4.0,
        MOON: 3.0,
        PLANET: 4.0,
        GAS_GIANT: 6.0,
        STAR: 8.0,
        default: 4.0,
      };
      
      const multiplier = typeMultipliers[objectType as keyof typeof typeMultipliers] || typeMultipliers.default;
      const logBase = 10.0;
      const logFactor = Math.log(objectRadius + logBase) / Math.log(logBase);
      reasonableDistance = multiplier * objectRadius * Math.max(1.0, logFactor);
    }
    
    // Apply constraints
    const minDistance = 0.0001;
    const maxDistance = RENDER_SCALE_AU * 10;
    
    return Math.max(minDistance, Math.min(maxDistance, reasonableDistance));
  }
  
  /**
   * Calculate camera offset from target object
   * @private
   */
  private _calculateCameraOffset(targetObject: any, distance: number): OSVector3 {
    // Simple offset calculation - can be enhanced with more sophisticated logic
    // For now, position camera at distance along the positive Z axis
    return new OSVector3(0, 0, distance);
  }
  
  /**
   * Update focus target position if object has moved
   * @private
   */
  private _updateFocusTarget(objectId: string): void {
    const renderableObjects = renderableStore.getRenderableObjects();
    const targetObject = renderableObjects[objectId];
    
    if (targetObject?.position) {
      const newTarget = OSVector3.fromThreeJS(targetObject.position);
      this._updateState({
        currentTarget: newTarget,
      });
    }
  }
  
  /**
   * Update camera state
   * @private
   */
  private _updateState(updates: Partial<CameraServiceState>): void {
    const currentState = this._state$.getValue();
    const newState = { ...currentState, ...updates };
    this._state$.next(newState);
  }
  
  /**
   * Dispose of the camera service and clean up resources
   */
  public destroy(): void {
    this._state$.complete();
  }
}