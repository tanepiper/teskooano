import { BehaviorSubject, Observable } from "rxjs";
import type { CelestialObject } from "@teskooano/data-types";
import type {
  FlatHierarchyState,
  HierarchyEntry,
  HierarchyOperationOptions,
  HierarchyOperationResult,
  HierarchyQueryOptions,
  HierarchyQueryResult,
} from "../types/hierarchy.types";

/**
 * Service for managing a flat hierarchy state with bidirectional parent-child relationships.
 *
 * This service provides efficient querying and management of celestial object hierarchies
 * using a flat state structure that maintains both parent->child and child->parent relationships.
 *
 * Key features:
 * - Atomic operations that maintain consistency
 * - Efficient bidirectional queries (parent->children, child->parent)
 * - Path tracking and depth calculation
 * - Descendant counting
 * - Cycle detection and validation
 * - Reactive state updates via RxJS
 */
export class FlatHierarchyService {
  private static instance: FlatHierarchyService;

  /** BehaviorSubject holding the current flat hierarchy state */
  private readonly _hierarchyState: BehaviorSubject<FlatHierarchyState>;

  /** Observable stream of hierarchy state changes */
  public readonly hierarchyState$: Observable<FlatHierarchyState>;

  private constructor() {
    this._hierarchyState = new BehaviorSubject<FlatHierarchyState>({
      entries: {},
      roots: [],
      totalObjects: 0,
      maxDepth: 0,
    });
    this.hierarchyState$ = this._hierarchyState.asObservable();
  }

  /**
   * Gets the singleton instance of the FlatHierarchyService.
   */
  public static getInstance(): FlatHierarchyService {
    if (!FlatHierarchyService.instance) {
      FlatHierarchyService.instance = new FlatHierarchyService();
    }
    return FlatHierarchyService.instance;
  }

  /**
   * Gets the current hierarchy state snapshot.
   */
  public getHierarchyState(): FlatHierarchyState {
    return this._hierarchyState.getValue();
  }

  /**
   * Initializes the hierarchy from a collection of celestial objects.
   * This is typically called when loading a new system.
   */
  public initializeFromObjects(
    objects: Record<string, CelestialObject>,
    options: HierarchyOperationOptions = {},
  ): HierarchyOperationResult {
    try {
      const entries: Record<string, HierarchyEntry> = {};
      const roots: string[] = [];

      // First pass: create basic entries
      for (const [id, obj] of Object.entries(objects)) {
        const parentId = obj.parentId;
        const isRoot = !parentId;

        entries[id] = {
          id,
          parentId,
          children: [],
          depth: 0, // Will be calculated in second pass
          path: [], // Will be calculated in second pass
          isRoot,
          hasChildren: false,
          descendantCount: 0,
        };

        if (isRoot) {
          roots.push(id);
        }
      }

      // Second pass: establish parent-child relationships
      for (const [id, entry] of Object.entries(entries)) {
        if (entry.parentId && entries[entry.parentId]) {
          entries[entry.parentId].children.push(id);
          entries[entry.parentId].hasChildren = true;
        }
      }

      // Third pass: calculate depths and paths
      this.calculateDepthsAndPaths(entries, roots);

      // Fourth pass: calculate descendant counts
      this.calculateDescendantCounts(entries, roots);

      const newState: FlatHierarchyState = {
        entries,
        roots,
        totalObjects: Object.keys(entries).length,
        maxDepth: Math.max(...Object.values(entries).map((e) => e.depth)),
      };

      this._hierarchyState.next(newState);

      return {
        success: true,
        newState,
        affectedObjects: Object.keys(entries),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        newState: this.getHierarchyState(),
        affectedObjects: [],
      };
    }
  }

  /**
   * Adds a new object to the hierarchy.
   */
  public addObject(
    object: CelestialObject,
    options: HierarchyOperationOptions = {},
  ): HierarchyOperationResult {
    const currentState = this.getHierarchyState();
    const { entries, roots } = currentState;

    if (entries[object.id]) {
      return {
        success: false,
        error: `Object ${object.id} already exists in hierarchy`,
        newState: currentState,
        affectedObjects: [],
      };
    }

    try {
      const newEntries = { ...entries };
      const newRoots = [...roots];

      const parentId = object.parentId;
      const isRoot = !parentId;

      // Create the new entry
      newEntries[object.id] = {
        id: object.id,
        parentId,
        children: [],
        depth: 0,
        path: [],
        isRoot,
        hasChildren: false,
        descendantCount: 0,
      };

      // Add to parent's children if not root
      if (parentId && newEntries[parentId]) {
        newEntries[parentId].children.push(object.id);
        newEntries[parentId].hasChildren = true;
      } else if (isRoot) {
        newRoots.push(object.id);
      }

      // Recalculate affected paths and depths
      this.recalculateAffectedPaths(newEntries, object.id);
      this.calculateDescendantCounts(newEntries, newRoots);

      const newState: FlatHierarchyState = {
        entries: newEntries,
        roots: newRoots,
        totalObjects: Object.keys(newEntries).length,
        maxDepth: Math.max(...Object.values(newEntries).map((e) => e.depth)),
      };

      this._hierarchyState.next(newState);

      return {
        success: true,
        newState,
        affectedObjects: [object.id],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        newState: currentState,
        affectedObjects: [],
      };
    }
  }

  /**
   * Updates an object's parent relationship.
   */
  public updateParent(
    objectId: string,
    newParentId: string | undefined,
    options: HierarchyOperationOptions = {},
  ): HierarchyOperationResult {
    const currentState = this.getHierarchyState();
    const { entries, roots } = currentState;

    if (!entries[objectId]) {
      return {
        success: false,
        error: `Object ${objectId} not found in hierarchy`,
        newState: currentState,
        affectedObjects: [],
      };
    }

    try {
      const newEntries = { ...entries };
      const newRoots = [...roots];

      const currentEntry = newEntries[objectId];
      const oldParentId = currentEntry.parentId;

      // Validate no cycles. Cycle detection is ON by default; pass
      // `validate: false` to opt out (e.g. when the caller has already
      // guaranteed acyclicity).
      if (newParentId && options.validate !== false) {
        if (this.wouldCreateCycle(newEntries, objectId, newParentId)) {
          return {
            success: false,
            error: `Moving ${objectId} to ${newParentId} would create a cycle`,
            newState: currentState,
            affectedObjects: [],
          };
        }
      }

      // Remove from old parent
      if (oldParentId && newEntries[oldParentId]) {
        newEntries[oldParentId].children = newEntries[
          oldParentId
        ].children.filter((id) => id !== objectId);
        newEntries[oldParentId].hasChildren =
          newEntries[oldParentId].children.length > 0;
      } else if (oldParentId === undefined) {
        // Was a root, remove from roots
        newRoots.splice(newRoots.indexOf(objectId), 1);
      }

      // Add to new parent
      if (newParentId && newEntries[newParentId]) {
        newEntries[newParentId].children.push(objectId);
        newEntries[newParentId].hasChildren = true;
      } else if (newParentId === undefined) {
        // Becoming a root
        newRoots.push(objectId);
      }

      // Update the entry
      newEntries[objectId] = {
        ...currentEntry,
        parentId: newParentId,
        isRoot: newParentId === undefined,
      };

      // Recalculate affected paths and depths
      this.recalculateAffectedPaths(newEntries, objectId);
      this.calculateDescendantCounts(newEntries, newRoots);

      const newState: FlatHierarchyState = {
        entries: newEntries,
        roots: newRoots,
        totalObjects: Object.keys(newEntries).length,
        maxDepth: Math.max(...Object.values(newEntries).map((e) => e.depth)),
      };

      this._hierarchyState.next(newState);

      return {
        success: true,
        newState,
        affectedObjects: [objectId],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        newState: currentState,
        affectedObjects: [],
      };
    }
  }

  /**
   * Removes an object from the hierarchy.
   */
  public removeObject(
    objectId: string,
    options: HierarchyOperationOptions = {},
  ): HierarchyOperationResult {
    const currentState = this.getHierarchyState();
    const { entries, roots } = currentState;

    if (!entries[objectId]) {
      return {
        success: false,
        error: `Object ${objectId} not found in hierarchy`,
        newState: currentState,
        affectedObjects: [],
      };
    }

    try {
      const newEntries = { ...entries };
      const newRoots = [...roots];

      const entry = newEntries[objectId];

      // Remove from parent's children
      if (entry.parentId && newEntries[entry.parentId]) {
        newEntries[entry.parentId].children = newEntries[
          entry.parentId
        ].children.filter((id) => id !== objectId);
        newEntries[entry.parentId].hasChildren =
          newEntries[entry.parentId].children.length > 0;
      } else if (entry.isRoot) {
        newRoots.splice(newRoots.indexOf(objectId), 1);
      }

      // Remove the entry
      delete newEntries[objectId];

      // Recalculate descendant counts for affected parents
      this.calculateDescendantCounts(newEntries, newRoots);

      const newState: FlatHierarchyState = {
        entries: newEntries,
        roots: newRoots,
        totalObjects: Object.keys(newEntries).length,
        maxDepth: Math.max(...Object.values(newEntries).map((e) => e.depth), 0),
      };

      this._hierarchyState.next(newState);

      return {
        success: true,
        newState,
        affectedObjects: [objectId],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        newState: currentState,
        affectedObjects: [],
      };
    }
  }

  /**
   * Gets all children of a specific object.
   */
  public getChildren(
    parentId: string,
    options: HierarchyQueryOptions = {},
  ): HierarchyQueryResult {
    const state = this.getHierarchyState();
    const entry = state.entries[parentId];

    if (!entry) {
      return { entries: [], count: 0, depthLimited: false };
    }

    const results: HierarchyEntry[] = [];
    const visited = new Set<string>();

    const traverse = (currentId: string, currentDepth: number) => {
      if (visited.has(currentId)) return;
      visited.add(currentId);

      if (options.maxDepth && currentDepth > options.maxDepth) {
        return;
      }

      const currentEntry = state.entries[currentId];
      if (!currentEntry) return;

      if (options.includeSelf || currentId !== parentId) {
        if (!options.filter || options.filter(currentEntry)) {
          results.push(currentEntry);
        }
      }

      for (const childId of currentEntry.children) {
        traverse(childId, currentDepth + 1);
      }
    };

    traverse(parentId, 0);

    return {
      entries: results,
      count: results.length,
      depthLimited: options.maxDepth
        ? results.some((e) => e.depth >= options.maxDepth!)
        : false,
    };
  }

  /**
   * Gets the parent of a specific object.
   */
  public getParent(childId: string): HierarchyEntry | undefined {
    const state = this.getHierarchyState();
    const entry = state.entries[childId];

    if (!entry || !entry.parentId) {
      return undefined;
    }

    return state.entries[entry.parentId];
  }

  /**
   * Gets the path from root to a specific object.
   */
  public getPathToRoot(objectId: string): string[] {
    const state = this.getHierarchyState();
    const entry = state.entries[objectId];

    return entry ? entry.path : [];
  }

  /**
   * Gets all root objects.
   */
  public getRoots(): HierarchyEntry[] {
    const state = this.getHierarchyState();
    return state.roots.map((id) => state.entries[id]).filter(Boolean);
  }

  /**
   * Gets all objects at a specific depth level.
   */
  public getObjectsAtDepth(depth: number): HierarchyEntry[] {
    const state = this.getHierarchyState();
    return Object.values(state.entries).filter(
      (entry) => entry.depth === depth,
    );
  }

  /**
   * Calculates depths and paths for all entries.
   */
  private calculateDepthsAndPaths(
    entries: Record<string, HierarchyEntry>,
    roots: string[],
  ): void {
    const visited = new Set<string>();

    const traverse = (id: string, depth: number, path: string[]) => {
      if (visited.has(id)) return;
      visited.add(id);

      const entry = entries[id];
      if (!entry) return;

      entry.depth = depth;
      entry.path = [...path, id];

      for (const childId of entry.children) {
        traverse(childId, depth + 1, entry.path);
      }
    };

    for (const rootId of roots) {
      traverse(rootId, 0, []);
    }
  }

  /**
   * Recalculates paths and depths for objects affected by a change.
   */
  private recalculateAffectedPaths(
    entries: Record<string, HierarchyEntry>,
    changedObjectId: string,
  ): void {
    const entry = entries[changedObjectId];
    if (!entry) return;

    // Recalculate path for the changed object
    if (entry.parentId && entries[entry.parentId]) {
      entry.path = [...entries[entry.parentId].path, changedObjectId];
      entry.depth = entries[entry.parentId].depth + 1;
    } else {
      entry.path = [changedObjectId];
      entry.depth = 0;
    }

    // Recalculate for all descendants
    const traverse = (id: string) => {
      const currentEntry = entries[id];
      if (!currentEntry) return;

      for (const childId of currentEntry.children) {
        const childEntry = entries[childId];
        if (childEntry) {
          childEntry.path = [...currentEntry.path, childId];
          childEntry.depth = currentEntry.depth + 1;
          traverse(childId);
        }
      }
    };

    traverse(changedObjectId);
  }

  /**
   * Calculates descendant counts for all entries.
   */
  private calculateDescendantCounts(
    entries: Record<string, HierarchyEntry>,
    roots: string[],
  ): void {
    const visited = new Set<string>();

    const traverse = (id: string): number => {
      if (visited.has(id)) return 0;
      visited.add(id);

      const entry = entries[id];
      if (!entry) return 0;

      let count = 0;
      for (const childId of entry.children) {
        count += 1 + traverse(childId);
      }

      entry.descendantCount = count;
      return count;
    };

    for (const rootId of roots) {
      traverse(rootId);
    }
  }

  /**
   * Checks if moving an object would create a cycle.
   */
  private wouldCreateCycle(
    entries: Record<string, HierarchyEntry>,
    objectId: string,
    newParentId: string,
  ): boolean {
    // Check if newParentId is a descendant of objectId
    const isDescendant = (parentId: string, childId: string): boolean => {
      const parent = entries[parentId];
      if (!parent) return false;

      if (parent.children.includes(childId)) return true;

      for (const grandchildId of parent.children) {
        if (isDescendant(grandchildId, childId)) return true;
      }

      return false;
    };

    return isDescendant(objectId, newParentId);
  }
}
