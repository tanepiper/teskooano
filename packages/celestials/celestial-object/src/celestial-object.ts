import {
  CelestialStatus,
  CelestialOrbitalProperties,
  CelestialPhysicsState,
  CelestialRenderer,
  CelestialCoreProperties,
  CelestialObjectConstructorParams,
  CelestialPhysicalProperties,
  CelestialType,
  type PhysicsEngineType,
} from "./types";
import { BasicCelestialRenderer } from "./renderer";
import { BehaviorSubject, Observable } from "rxjs";
import {
  reassignOrphanedObjects,
  checkAndReassignPlanetsToProperStars,
  checkAndReassignEscapedChildren,
} from "./utils";

/**
 * Base abstract class for all celestial objects in the simulation.
 * This class provides the fundamental properties and behaviors common to all celestial bodies,
 * such as identification, hierarchical relationships, orbital mechanics, and physics state.
 * It also manages a renderer, defaulting to BasicCelestialRenderer if no specific renderer is provided,
 * and makes its state observable via RxJS.
 * Subclasses are expected to implement specific behaviors, particularly the `updatePhysics` method,
 * and can provide their own CelestialRenderer implementation.
 */
export abstract class CelestialObject {
  /**
   * The unique identifier of the celestial object.
   */
  public id: string;
  /** The name of the celestial object. */
  public name: string;
  /** The type of celestial object. */
  public type: CelestialType;
  /** The status of the celestial object. */
  public status: CelestialStatus;
  /** Flag indicating if this object should be ignored by the physics engine. */
  public ignorePhysics: boolean;
  /** The physical properties of the celestial object. */
  public physicalProperties: CelestialPhysicalProperties;
  /** The parent CelestialObject of this celestial object. */
  public parent?: CelestialObject;
  /** The children CelestialObjects of this celestial object. */
  public children: CelestialObject[];
  /** Flag indicating if this object is the main star of its system. */
  public isMainStar: boolean;
  /** The orbital properties of the celestial object. */
  public orbit: CelestialOrbitalProperties;
  /** The physics state of the celestial object. */
  public physicsState: CelestialPhysicsState;
  /** The renderer of the celestial object. */
  public renderer: CelestialRenderer;

  public lightSources: CelestialObject[];

  /** The state subject of the celestial object. */
  private readonly _stateSubject: BehaviorSubject<CelestialCoreProperties>;
  /** The observable state of the celestial object. */
  public readonly state$: Observable<CelestialCoreProperties>;

  constructor(params: CelestialObjectConstructorParams) {
    this.id = params.id;
    this.name = params.name;
    this.status = params.status ?? CelestialStatus.ACTIVE;
    this.ignorePhysics = params.ignorePhysics ?? false;
    this.type = params.type;
    this.lightSources = params.lightSources ?? [];
    this.physicalProperties = params.physicalProperties;
    this.orbit = params.orbit;
    this.physicsState = params.physicsState;
    this.isMainStar = params.isMainStar ?? false;
    this.children = []; // Initialize as empty array
    // Parent assignment should be handled by the system orchestrating object creation
    // or via an explicit setParent method if needed for more granular control.
    // If a parent is provided in params, it should add this object as a child.
    if (params.parent) {
      this.parent = params.parent as CelestialObject; // Type assertion
      // It's generally better for the parent to call addChild on itself,
      // but if direct assignment is used, ensure consistency:
      // (params.parent as CelestialObject).addChild(this); // Requires CelestialObject type on params.parent
    }

    if (params.rendererInstance) {
      this.renderer = params.rendererInstance;
    } else {
      const visualRadius = this.physicalProperties.radius / 1e7;
      const visualColor = 0xffffff;
      this.renderer = new BasicCelestialRenderer(
        this,
        visualRadius,
        visualColor,
        params.rendererOptions,
      );
    }

    this._stateSubject = new BehaviorSubject<CelestialCoreProperties>(
      this._getCurrentState(),
    );
    this.state$ = this._stateSubject.asObservable();
  }

  /**
   * Gathers the current state of the object for the BehaviorSubject.
   */
  private _getCurrentState(): CelestialCoreProperties {
    return {
      id: this.id,
      name: this.name,
      status: this.status,
      type: this.type,
      physicalProperties: { ...this.physicalProperties },
      parentId: this.parent?.id, // Get ID from parent object
      childIds: this.children.map((child) => child.id),
      isMainStar: this.isMainStar,
      orbit: { ...this.orbit },
      physicsState: { ...this.physicsState },
    };
  }

  /**
   * Pushes the current state to the _stateSubject, notifying subscribers.
   * This should be called whenever a significant state change occurs.
   */
  protected _updateObservableState(): void {
    this._stateSubject.next(this._getCurrentState());
  }

  /**
   * Adds a celestial object as a child of this object.
   * @param child The CelestialObject to add as a child.
   */
  public addChild(child: CelestialObject): void {
    if (!this.children.includes(child)) {
      this.children.push(child);
      if (child.parent && child.parent !== this) {
        child.parent.removeChild(child); // Remove from old parent
      }
      child.parent = this; // Set new parent
      this._updateObservableState();
      child._updateObservableState(); // Notify child about parent change
    }
  }

  /**
   * Removes a celestial object from this object's children.
   * @param child The CelestialObject to remove.
   */
  public removeChild(child: CelestialObject): void {
    const index = this.children.indexOf(child);
    if (index > -1) {
      this.children.splice(index, 1);
      child.parent = undefined; // Clear parent link
      this._updateObservableState();
      child._updateObservableState(); // Notify child about parent change
    }
  }

  public abstract updatePhysics(deltaTime: number): void;

  public updateRenderer(): void {
    if (this.renderer) {
      this.renderer.update();
    }
  }

  public dispose(): void {
    if (this.renderer) {
      this.renderer.dispose();
    }
    // Detach from parent
    if (this.parent) {
      this.parent.removeChild(this);
    }
    // Orphan children - their new parent will be assigned by external logic
    // or they might be disposed if they are part of a cascading delete not handled here.
    // For robust cleanup, external logic should handle re-parenting or disposal of these children.
    [...this.children].forEach((child) => {
      child.parent = undefined; // Child is now an orphan
      child._updateObservableState();
    });
    this.children = []; // Clear own children list

    this._updateObservableState(); // Reflect detached state
    this._stateSubject.complete(); // Complete the subject when object is disposed
  }

  /**
   * Orchestrates the reassignment of parent-child relationships when objects are destroyed.
   * @param destroyedIds An array of IDs for the celestial objects that have been destroyed.
   * @param allObjects A record containing all currently active CelestialObject instances.
   * @param physicsEngine The type of physics engine currently in use.
   */
  public static handleDestroyedObjects(
    destroyedIds: string[],
    allObjects: Record<string, CelestialObject>,
    physicsEngine: PhysicsEngineType,
  ): void {
    reassignOrphanedObjects(destroyedIds, allObjects, physicsEngine);
  }

  /**
   * Performs routine system-wide hierarchy maintenance, such as ensuring planets orbit the correct stars
   * and reassigning children that may have escaped their parent's gravity.
   * @param allObjects A record containing all currently active CelestialObject instances.
   * @param physicsEngine The type of physics engine currently in use.
   */
  public static performSystemHierarchyMaintenance(
    allObjects: Record<string, CelestialObject>,
    physicsEngine: PhysicsEngineType,
  ): void {
    checkAndReassignPlanetsToProperStars(allObjects, physicsEngine);
    checkAndReassignEscapedChildren(allObjects, physicsEngine);
  }

  /**
   * Creates a basic, generic celestial object instance with default rendering.
   * @param params - The construction parameters for the celestial object.
   * @returns A new instance of GenericCelestialObject.
   */
  public static createBasic(
    params: CelestialObjectConstructorParams,
  ): CelestialObject {
    return new GenericCelestialObject(params);
  }
}

/**
 * A concrete implementation of CelestialObject for generic use cases or as a base
 * for objects that do not require highly specialized physics or rendering logic beyond basic capabilities.
 */
export class GenericCelestialObject extends CelestialObject {
  constructor(params: CelestialObjectConstructorParams) {
    super(params);
  }

  /**
   * Basic physics update for a generic object.
   * Can be overridden by more specific subclasses if needed.
   * This implementation primarily ensures that the observable state is updated.
   * @param deltaTime - The time step for the physics update (in seconds).
   */
  public updatePhysics(deltaTime: number): void {
    // For a truly generic object, physics might be externally applied, or it might have no internal physics.
    // This ensures that any changes made directly to its physicsState are broadcast.
    // If more sophisticated default behavior is needed (e.g., simple kinematic updates based on velocity),
    // that could be added here.
    this._updateObservableState();
  }
}
