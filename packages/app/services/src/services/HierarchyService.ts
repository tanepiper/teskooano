import { StateAccessor, celestialManager, physicsSystemAdapter } from "@teskooano/core-state";
import { CelestialObject, CelestialStatus, CelestialType, PhysicsStateReal } from "@teskooano/data-types";
import { AU_METERS } from "@teskooano/data-values";
import { BehaviorSubject, Observable } from "rxjs";

/**
 * Hierarchy node representing a celestial object and its children
 */
export interface HierarchyNode {
  /** The celestial object */
  object: CelestialObject;
  /** Child objects in the hierarchy */
  children: HierarchyNode[];
  /** Depth level in the hierarchy (0 = root) */
  depth: number;
  /** Whether this node is expanded in UI representations */
  expanded?: boolean;
}

/**
 * Hierarchy service state interface
 */
export interface HierarchyServiceState {
  /** The complete hierarchy tree structure */
  hierarchyTree: HierarchyNode[];
  /** Map of parent ID to child IDs for quick lookup */
  parentChildMap: Map<string | null, string[]>;
  /** List of root object IDs (objects without parents) */
  rootObjectIds: string[];
  /** List of destroyed/inactive objects */
  destroyedObjects: CelestialObject[];
  /** Whether hierarchy is currently being updated */
  isUpdating: boolean;
}

/**
 * Centralized hierarchy service for managing celestial object hierarchy.
 * 
 * This service extracts hierarchy business logic and provides:
 * - Dynamic hierarchy building and maintenance
 * - Object relationship management (parent-child)
 * - Escape logic for moons and satellites
 * - Orphaned object handling
 * - Observable hierarchy state for reactive UI updates
 */
export class HierarchyService {
  private _state$: BehaviorSubject<HierarchyServiceState>;
  private _updateIndex = 0;
  
  constructor() {
    const initialState: HierarchyServiceState = {
      hierarchyTree: [],
      parentChildMap: new Map(),
      rootObjectIds: [],
      destroyedObjects: [],
      isUpdating: false,
    };
    
    this._state$ = new BehaviorSubject<HierarchyServiceState>(initialState);
  }
  
  /**
   * Get the current hierarchy state as an observable
   */
  public get state$(): Observable<HierarchyServiceState> {
    return this._state$.asObservable();
  }
  
  /**
   * Get the current hierarchy state value
   */
  public getCurrentState(): HierarchyServiceState {
    return this._state$.getValue();
  }
  
  /**
   * Build hierarchy tree from current celestial objects
   * @param objects Record of celestial objects
   * @returns Array of root hierarchy nodes
   */
  public buildHierarchyTree(objects: Record<string, CelestialObject>): HierarchyNode[] {
    const objectMap = new Map(Object.entries(objects));
    const parentChildMap = new Map<string | null, string[]>();
    const destroyedObjects: CelestialObject[] = [];
    
    // Build parent-child relationships and collect destroyed objects
    objectMap.forEach((obj, id) => {
      if (obj.status === CelestialStatus.DESTROYED || obj.status === CelestialStatus.ANNIHILATED) {
        destroyedObjects.push(obj);
        return;
      }
      
      const parentKey = obj.parentId ?? null;
      if (!parentChildMap.has(parentKey)) {
        parentChildMap.set(parentKey, []);
      }
      parentChildMap.get(parentKey)!.push(id);
    });
    
    // Get root objects (objects without parents)
    let rootIds = parentChildMap.get(null) || [];
    
    // Handle orphaned objects (parent doesn't exist)
    parentChildMap.forEach((children, parentId) => {
      if (parentId !== null && !objectMap.has(parentId)) {
        rootIds.push(...children);
      }
    });
    
    // Ensure all stars without parents are included in roots
    objectMap.forEach((obj, id) => {
      if (obj.type === CelestialType.STAR && !obj.parentId && !rootIds.includes(id)) {
        rootIds.push(id);
      }
    });
    
    // Sort root objects (stars first, then by name)
    rootIds.sort((a, b) => {
      const objA = objectMap.get(a);
      const objB = objectMap.get(b);
      if (!objA || !objB) return 0;
      if (objA.type === CelestialType.STAR && objB.type !== CelestialType.STAR) return -1;
      if (objA.type !== CelestialType.STAR && objB.type === CelestialType.STAR) return 1;
      return (objA.name ?? "").localeCompare(objB.name ?? "");
    });
    
    // Build hierarchy tree
    const buildNode = (objectId: string, depth: number = 0): HierarchyNode | null => {
      const obj = objectMap.get(objectId);
      if (!obj) return null;
      
      const childIds = parentChildMap.get(objectId) || [];
      const children = childIds
        .map(childId => buildNode(childId, depth + 1))
        .filter((node): node is HierarchyNode => node !== null);
      
      return {
        object: obj,
        children,
        depth,
        expanded: depth < 2, // Auto-expand first two levels
      };
    };
    
    const hierarchyTree = rootIds
      .map(rootId => buildNode(rootId))
      .filter((node): node is HierarchyNode => node !== null);
    
    // Update state
    this._updateState({
      hierarchyTree,
      parentChildMap,
      rootObjectIds: rootIds,
      destroyedObjects,
    });
    
    return hierarchyTree;
  }
  
  /**
   * Update hierarchies of all celestial objects based on physics
   * Processes one object per tick to avoid performance issues
   */
  public updateHierarchies(): void {
    const allObjects = StateAccessor.getCurrentCelestialObjects();
    const objectIds = Object.keys(allObjects);
    const allPhysicsStates = physicsSystemAdapter.getPhysicsBodies();
    
    if (objectIds.length === 0) {
      this._updateIndex = 0;
      return;
    }
    
    if (this._updateIndex >= objectIds.length) {
      this._updateIndex = 0;
    }
    
    const objectId = objectIds[this._updateIndex];
    const obj = allObjects[objectId];
    const physicsState = allPhysicsStates.find((p) => p.id === objectId);
    
    if (obj && physicsState && 
        obj.status !== CelestialStatus.DESTROYED && 
        obj.status !== CelestialStatus.ANNIHILATED) {
      this._handleObjectHierarchy(obj, physicsState, allObjects, allPhysicsStates);
    }
    
    this._updateIndex++;
  }
  
  /**
   * Find the best parent for an object based on proximity
   * @param obj The object looking for a parent
   * @param physicsState The object's physics state
   * @param allObjects All available celestial objects
   * @param allPhysicsStates All physics states
   * @returns The best parent object or null
   */
  public findBestParent(
    obj: CelestialObject,
    physicsState: PhysicsStateReal,
    allObjects: Record<string, CelestialObject>,
    allPhysicsStates: PhysicsStateReal[]
  ): CelestialObject | null {
    let bestParent: CelestialObject | null = null;
    let closestDistance = Infinity;
    
    // Look for the closest appropriate parent
    Object.values(allObjects).forEach(potentialParent => {
      // Skip self, destroyed objects, and inappropriate types
      if (potentialParent.id === obj.id ||
          potentialParent.status === CelestialStatus.DESTROYED ||
          potentialParent.status === CelestialStatus.ANNIHILATED) {
        return;
      }
      
      // Hierarchy rules: smaller objects orbit larger ones
      const canOrbit = this._canObjectOrbit(obj, potentialParent);
      if (!canOrbit) return;
      
      const parentState = allPhysicsStates.find(p => p.id === potentialParent.id);
      if (!parentState) return;
      
      const distance = physicsState.position_m.distanceTo(parentState.position_m);
      if (distance < closestDistance) {
        closestDistance = distance;
        bestParent = potentialParent;
      }
    });
    
    return bestParent;
  }
  
  /**
   * Get all objects at a specific hierarchy level
   * @param level The hierarchy level (0 = roots)
   * @returns Array of objects at the specified level
   */
  public getObjectsAtLevel(level: number): CelestialObject[] {
    const objects: CelestialObject[] = [];
    
    const traverse = (nodes: HierarchyNode[], currentLevel: number) => {
      for (const node of nodes) {
        if (currentLevel === level) {
          objects.push(node.object);
        } else if (currentLevel < level) {
          traverse(node.children, currentLevel + 1);
        }
      }
    };
    
    const currentState = this._state$.getValue();
    traverse(currentState.hierarchyTree, 0);
    
    return objects;
  }
  
  /**
   * Get all descendant objects of a parent
   * @param parentId The parent object ID
   * @returns Array of all descendant objects
   */
  public getDescendants(parentId: string): CelestialObject[] {
    const descendants: CelestialObject[] = [];
    const currentState = this._state$.getValue();
    const childIds = currentState.parentChildMap.get(parentId) || [];
    
    const collectDescendants = (ids: string[]) => {
      for (const id of ids) {
        const allObjects = StateAccessor.getCurrentCelestialObjects();
        const obj = allObjects[id];
        if (obj) {
          descendants.push(obj);
          const grandchildIds = currentState.parentChildMap.get(id) || [];
          collectDescendants(grandchildIds);
        }
      }
    };
    
    collectDescendants(childIds);
    return descendants;
  }
  
  /**
   * Check if an object can orbit another object based on type hierarchy
   * @private
   */
  private _canObjectOrbit(child: CelestialObject, parent: CelestialObject): boolean {
    // Stars can only orbit other stars
    if (child.type === CelestialType.STAR) {
      return parent.type === CelestialType.STAR;
    }
    
    // Planets and gas giants can orbit stars
    if (child.type === CelestialType.PLANET || child.type === CelestialType.GAS_GIANT) {
      return parent.type === CelestialType.STAR;
    }
    
    // Moons can orbit planets or gas giants
    if (child.type === CelestialType.MOON) {
      return parent.type === CelestialType.PLANET || parent.type === CelestialType.GAS_GIANT;
    }
    
    // Satellites can orbit planets, gas giants, or moons
    if (child.type === CelestialType.SATELLITE) {
      return parent.type === CelestialType.PLANET || 
             parent.type === CelestialType.GAS_GIANT || 
             parent.type === CelestialType.MOON;
    }
    
    // Asteroids and comets can orbit stars
    if (child.type === CelestialType.ASTEROID || child.type === CelestialType.COMET) {
      return parent.type === CelestialType.STAR;
    }
    
    return false;
  }
  
  /**
   * Handle hierarchy updates for a specific object
   * @private
   */
  private _handleObjectHierarchy(
    obj: CelestialObject,
    physicsState: PhysicsStateReal,
    allObjects: Record<string, CelestialObject>,
    allPhysicsStates: PhysicsStateReal[]
  ): void {
    // Skip stars - they maintain their hierarchy
    if (obj.type === CelestialType.STAR) return;
    
    // Handle moon escape (> 0.1 AU from parent)
    if (obj.type === CelestialType.MOON) {
      this._handleMoonEscape(obj, physicsState, allObjects, allPhysicsStates);
      return;
    }
    
    // Handle satellite escape
    if (obj.type === CelestialType.SATELLITE) {
      this._handleSatelliteEscape(obj, physicsState, allObjects, allPhysicsStates);
      return;
    }
    
    // Handle orphaned objects (parent destroyed)
    this._handleOrphanedObject(obj, physicsState, allObjects, allPhysicsStates);
  }
  
  /**
   * Handle moon escape logic
   * @private
   */
  private _handleMoonEscape(
    obj: CelestialObject,
    physicsState: PhysicsStateReal,
    allObjects: Record<string, CelestialObject>,
    allPhysicsStates: PhysicsStateReal[]
  ): void {
    if (!obj.parentId) return;
    
    const parent = allObjects[obj.parentId];
    const parentState = allPhysicsStates.find(p => p.id === obj.parentId);
    if (!parent || !parentState) return;
    
    const distanceToParent = physicsState.position_m.distanceTo(parentState.position_m);
    const escapeDistance = 0.1 * AU_METERS; // 0.1 AU in meters
    
    if (distanceToParent > escapeDistance) {
      // Moon has escaped - find new parent (usually a star)
      const newParent = this.findBestParent(obj, physicsState, allObjects, allPhysicsStates);
      if (newParent) {
        celestialManager.updateObject(obj.id, {
          type: CelestialType.DWARF_PLANET,
          parentId: newParent.id,
        });
      }
    }
  }
  
  /**
   * Handle satellite escape logic
   * @private
   */
  private _handleSatelliteEscape(
    obj: CelestialObject,
    physicsState: PhysicsStateReal,
    allObjects: Record<string, CelestialObject>,
    allPhysicsStates: PhysicsStateReal[]
  ): void {
    if (!obj.parentId) return;
    
    const parent = allObjects[obj.parentId];
    const parentState = allPhysicsStates.find(p => p.id === obj.parentId);
    if (!parent || !parentState) return;
    
    const distanceToParent = physicsState.position_m.distanceTo(parentState.position_m);
    const escapeDistance = 0.01 * AU_METERS; // 0.01 AU in meters (closer than moons)
    
    if (distanceToParent > escapeDistance) {
      // Satellite has escaped - find new parent
      const newParent = this.findBestParent(obj, physicsState, allObjects, allPhysicsStates);
      if (newParent) {
        // Satellites become asteroids when they escape
        celestialManager.updateObject(obj.id, {
          type: CelestialType.ASTEROID,
          parentId: newParent.id,
        });
      }
    }
  }
  
  /**
   * Handle orphaned objects (parent destroyed)
   * @private
   */
  private _handleOrphanedObject(
    obj: CelestialObject,
    physicsState: PhysicsStateReal,
    allObjects: Record<string, CelestialObject>,
    allPhysicsStates: PhysicsStateReal[]
  ): void {
    // Check if parent still exists and is not destroyed
    if (obj.parentId) {
      const parent = allObjects[obj.parentId];
      if (!parent || parent.status === CelestialStatus.DESTROYED || 
          parent.status === CelestialStatus.ANNIHILATED) {
        // Parent is gone - find new parent
        const newParent = this.findBestParent(obj, physicsState, allObjects, allPhysicsStates);
        if (newParent) {
          celestialManager.updateObject(obj.id, {
            parentId: newParent.id,
          });
        } else {
          // No suitable parent found - make it a root object
          celestialManager.updateObject(obj.id, {
            parentId: null,
          });
        }
      }
    }
  }
  
  /**
   * Update hierarchy state
   * @private
   */
  private _updateState(updates: Partial<HierarchyServiceState>): void {
    const currentState = this._state$.getValue();
    const newState = { ...currentState, ...updates };
    this._state$.next(newState);
  }
  
  /**
   * Dispose of the hierarchy service and clean up resources
   */
  public destroy(): void {
    this._state$.complete();
  }
}