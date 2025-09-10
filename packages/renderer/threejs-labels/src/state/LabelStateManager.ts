import { BehaviorSubject, Observable, combineLatest, map } from "rxjs";
import { CelestialType } from "@teskooano/data-types";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import type { ObjectManager } from "@teskooano/renderer-threejs-objects";
import * as THREE from "three";
import { AU_METERS } from "@teskooano/data-values";

/**
 * Represents the explicit label visibility state for a celestial object.
 * This is the user's preference - true means "show if rules allow", false means "never show".
 */
export interface LabelVisibilityState {
  [objectId: string]: boolean;
}

/**
 * Represents the final computed label visibility after applying both
 * explicit state and LOD rules.
 */
export interface ComputedLabelVisibility {
  [objectId: string]: boolean;
}

/**
 * Configuration for LOD-based visibility rules.
 */
export interface LabelLODConfig {
  /** Distance threshold for moons (AU) */
  moon: number;
  /** Distance threshold for satellites (AU) */
  satellite: number;
  /** Distance threshold for planets (AU) */
  planet: number;
  /** Distance threshold for gas giants (AU) */
  gasGiant: number;
  /** Distance threshold for comets (AU) */
  comet: number;
  /** Distance threshold for asteroids (AU) */
  asteroid: number;
  /** Default distance threshold (AU) */
  default: number;
}

/**
 * Manages label visibility state with two layers:
 * 1. Explicit state: User's show/hide preference per object
 * 2. LOD rules: Distance-based visibility rules
 *
 * The final visibility is the intersection of both layers.
 */
export class LabelStateManager {
  private static instance: LabelStateManager;

  /** Explicit label visibility state (user preference) */
  private readonly _explicitState: BehaviorSubject<LabelVisibilityState>;

  /** Observable of explicit label visibility state */
  public readonly explicitState$: Observable<LabelVisibilityState>;

  /** Observable of computed final label visibility */
  public readonly computedVisibility$: Observable<ComputedLabelVisibility>;

  /** LOD configuration */
  private readonly lodConfig: LabelLODConfig;

  /** Current camera position for distance calculations */
  private cameraPosition: THREE.Vector3 = new THREE.Vector3();

  /** Current object manager for getting object data */
  private objectManager: ObjectManager | null = null;

  private constructor() {
    this._explicitState = new BehaviorSubject<LabelVisibilityState>({});
    this.explicitState$ = this._explicitState.asObservable();

    // Default LOD configuration
    this.lodConfig = {
      moon: 1, // 1 AU from parent
      satellite: 1, // 1 AU from parent
      planet: 500, // 500 AU from camera
      gasGiant: 800, // 800 AU from camera
      comet: 300, // 300 AU from camera
      asteroid: 100, // 100 AU from camera
      default: 400, // 400 AU from camera
    };

    // Set up computed visibility observable
    this.computedVisibility$ = this.explicitState$.pipe(
      map(() => this.computeFinalVisibility()),
    );
  }

  /**
   * Gets the singleton instance of the LabelStateManager.
   */
  public static getInstance(): LabelStateManager {
    if (!LabelStateManager.instance) {
      LabelStateManager.instance = new LabelStateManager();
    }
    return LabelStateManager.instance;
  }

  /**
   * Updates the camera position and object manager for LOD calculations.
   */
  public updateContext(
    camera: THREE.PerspectiveCamera,
    objectManager: ObjectManager,
  ): void {
    camera.getWorldPosition(this.cameraPosition);
    this.objectManager = objectManager;

    // Trigger recomputation of visibility
    this._explicitState.next(this._explicitState.getValue());
  }

  /**
   * Sets the explicit visibility state for a single object.
   */
  public setObjectVisibility(objectId: string, visible: boolean): void {
    const current = this._explicitState.getValue();
    this._explicitState.next({
      ...current,
      [objectId]: visible,
    });
  }

  /**
   * Sets the explicit visibility state for multiple objects.
   */
  public setMultipleObjectVisibility(
    visibilityMap: LabelVisibilityState,
  ): void {
    const current = this._explicitState.getValue();
    this._explicitState.next({
      ...current,
      ...visibilityMap,
    });
  }

  /**
   * Gets the explicit visibility state for an object.
   * Returns undefined if not explicitly set.
   */
  public getExplicitVisibility(objectId: string): boolean | undefined {
    return this._explicitState.getValue()[objectId];
  }

  /**
   * Gets the computed final visibility for an object.
   * This considers both explicit state and LOD rules.
   */
  public getComputedVisibility(objectId: string): boolean {
    const explicitState = this._explicitState.getValue();
    const explicitVisible = explicitState[objectId];

    // If explicitly set to false, never show
    if (explicitVisible === false) {
      return false;
    }

    // If not explicitly set or set to true, apply LOD rules
    return this.shouldShowBasedOnLOD(objectId);
  }

  /**
   * Gets the current explicit state snapshot.
   */
  public getExplicitState(): LabelVisibilityState {
    return this._explicitState.getValue();
  }

  /**
   * Gets the current computed visibility snapshot for all objects.
   */
  public getAllComputedVisibility(): ComputedLabelVisibility {
    return this.computeFinalVisibility();
  }

  /**
   * Computes the final visibility for all objects.
   */
  private computeFinalVisibility(): ComputedLabelVisibility {
    const explicitState = this._explicitState.getValue();
    const result: ComputedLabelVisibility = {};

    if (!this.objectManager) {
      return result;
    }

    const allObjects = this.objectManager.getLatestRenderableObjects();

    Object.keys(allObjects).forEach((objectId) => {
      const explicitVisible = explicitState[objectId];

      // If explicitly set to false, never show
      if (explicitVisible === false) {
        result[objectId] = false;
        return;
      }

      // If not explicitly set or set to true, apply LOD rules
      result[objectId] = this.shouldShowBasedOnLOD(objectId);
    });

    return result;
  }

  /**
   * Determines if an object should be visible based on LOD rules.
   */
  private shouldShowBasedOnLOD(objectId: string): boolean {
    if (!this.objectManager) {
      return false;
    }

    const allObjects = this.objectManager.getLatestRenderableObjects();
    const object = allObjects[objectId];

    if (!object) {
      return false;
    }

    // Stars always show
    if (object.type === CelestialType.STAR) {
      return true;
    }

    // Rogue objects (no parent) always show
    if (!object.parentId) {
      return true;
    }

    const parent = allObjects[object.parentId];
    if (!parent) {
      return true;
    }

    // Moons and satellites of non-stars: check distance to parent
    if (
      (object.type === CelestialType.MOON ||
        object.type === CelestialType.SATELLITE) &&
      parent.type !== CelestialType.STAR
    ) {
      return this.isWithinDistanceThreshold(
        object,
        parent,
        this.lodConfig.moon,
      );
    }

    // Planets, comets, etc. orbiting stars: check distance to camera
    if (parent.type === CelestialType.STAR) {
      const threshold = this.getDistanceThreshold(object.type);
      return this.isWithinCameraDistance(object, threshold);
    }

    // Default: show
    return true;
  }

  /**
   * Checks if an object is within the distance threshold of its parent.
   */
  private isWithinDistanceThreshold(
    object: RenderableCelestialObject,
    parent: RenderableCelestialObject,
    thresholdAU: number,
  ): boolean {
    if (!this.objectManager) {
      return false;
    }

    const objectMesh = this.objectManager.getObject(object.id);
    const parentMesh = this.objectManager.getObject(parent.id);

    if (!objectMesh || !parentMesh) {
      return false;
    }

    const distance = objectMesh.position.distanceTo(parentMesh.position);
    const distanceAU = distance * (1 / AU_METERS);

    return distanceAU <= thresholdAU;
  }

  /**
   * Checks if an object is within the camera distance threshold.
   */
  private isWithinCameraDistance(
    object: RenderableCelestialObject,
    thresholdAU: number,
  ): boolean {
    if (!this.objectManager) {
      return false;
    }

    const objectMesh = this.objectManager.getObject(object.id);
    if (!objectMesh) {
      return false;
    }

    const distance = this.cameraPosition.distanceTo(objectMesh.position);
    const distanceAU = distance * (1 / AU_METERS);

    return distanceAU <= thresholdAU;
  }

  /**
   * Gets the distance threshold for an object type.
   */
  private getDistanceThreshold(type: CelestialType): number {
    switch (type) {
      case CelestialType.PLANET:
      case CelestialType.DWARF_PLANET:
        return this.lodConfig.planet;
      case CelestialType.GAS_GIANT:
        return this.lodConfig.gasGiant;
      case CelestialType.COMET:
        return this.lodConfig.comet;
      case CelestialType.ASTEROID:
        return this.lodConfig.asteroid;
      default:
        return this.lodConfig.default;
    }
  }

  /**
   * Updates the LOD configuration.
   */
  public updateLODConfig(config: Partial<LabelLODConfig>): void {
    Object.assign(this.lodConfig, config);

    // Trigger recomputation
    this._explicitState.next(this._explicitState.getValue());
  }

  /**
   * Gets the current LOD configuration.
   */
  public getLODConfig(): LabelLODConfig {
    return { ...this.lodConfig };
  }

  /**
   * Clears all explicit visibility state.
   */
  public clearExplicitState(): void {
    this._explicitState.next({});
  }
}

/**
 * Singleton instance of the LabelStateManager.
 */
export const labelStateManager = LabelStateManager.getInstance();
