import { BehaviorSubject, Observable } from "rxjs";
import type { CelestialObject } from "@teskooano/data-types";

/**
 * Manages celestial object data storage and hierarchy relationships.
 * Pure data store with no business logic.
 */
export class CelestialStore {
  private static instance: CelestialStore;

  private readonly _objects: BehaviorSubject<Record<string, CelestialObject>>;
  public readonly objects$: Observable<Record<string, CelestialObject>>;

  private readonly _hierarchy: BehaviorSubject<Record<string, string[]>>;
  public readonly hierarchy$: Observable<Record<string, string[]>>;

  private constructor() {
    this._objects = new BehaviorSubject<Record<string, CelestialObject>>({});
    this.objects$ = this._objects.asObservable();

    this._hierarchy = new BehaviorSubject<Record<string, string[]>>({});
    this.hierarchy$ = this._hierarchy.asObservable();
  }

  public static getInstance(): CelestialStore {
    if (!CelestialStore.instance) {
      CelestialStore.instance = new CelestialStore();
    }
    return CelestialStore.instance;
  }

  // Object operations
  public getObjects(): Record<string, CelestialObject> {
    return this._objects.getValue();
  }

  public getObject(id: string): CelestialObject | undefined {
    return this._objects.getValue()[id];
  }

  public setObject(id: string, object: CelestialObject): void {
    const current = this._objects.getValue();
    this._objects.next({ ...current, [id]: object });
  }

  public removeObject(id: string): void {
    const current = this._objects.getValue();
    if (current[id]) {
      const newObjects = { ...current };
      delete newObjects[id];
      this._objects.next(newObjects);
    }
  }

  public setAllObjects(objects: Record<string, CelestialObject>): void {
    this._objects.next(objects);
  }

  // Hierarchy operations
  public getHierarchy(): Record<string, string[]> {
    return this._hierarchy.getValue();
  }

  public setHierarchy(hierarchy: Record<string, string[]>): void {
    this._hierarchy.next(hierarchy);
  }

  public addChild(parentId: string, childId: string): void {
    const current = this._hierarchy.getValue();
    const children = current[parentId] || [];
    if (!children.includes(childId)) {
      this._hierarchy.next({
        ...current,
        [parentId]: [...children, childId],
      });
    }
  }

  public removeChild(parentId: string, childId: string): void {
    const current = this._hierarchy.getValue();
    const children = current[parentId];
    if (children) {
      this._hierarchy.next({
        ...current,
        [parentId]: children.filter((id) => id !== childId),
      });
    }
  }

  public removeHierarchyEntry(objectId: string): void {
    const current = this._hierarchy.getValue();
    const newHierarchy = { ...current };

    // Remove the object's own entry
    delete newHierarchy[objectId];

    // Remove from all parent lists
    Object.keys(newHierarchy).forEach((parentId) => {
      newHierarchy[parentId] = newHierarchy[parentId].filter(
        (childId) => childId !== objectId,
      );
    });

    this._hierarchy.next(newHierarchy);
  }

  // Utility operations
  public getChildren(parentId: string): CelestialObject[] {
    const hierarchy = this._hierarchy.getValue();
    const objects = this._objects.getValue();
    const childIds = hierarchy[parentId] || [];
    return childIds.map((id) => objects[id]).filter(Boolean);
  }

  public getParent(childId: string): CelestialObject | undefined {
    const objects = this._objects.getValue();
    const object = objects[childId];
    return object?.parentId ? objects[object.parentId] : undefined;
  }
}

export const celestialStore = CelestialStore.getInstance();
