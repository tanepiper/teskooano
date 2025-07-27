import * as THREE from "three";

/**
 * Defines the result of a proximity search
 */
export interface ProximitySearchResult {
  /** The found object */
  object: THREE.Object3D;
  /** Distance from the search position */
  distance: number;
  /** World position of the object */
  worldPosition: THREE.Vector3;
}

/**
 * Defines search criteria for complex queries
 */
export interface SearchCriteria {
  /** Object type to search for */
  type?: string;
  /** Celestial object ID */
  celestialObjectId?: string;
  /** Object name (supports partial matching) */
  name?: string;
  /** Parent ID for hierarchical searches */
  parentId?: string;
  /** Custom userData properties to match */
  userData?: Record<string, any>;
  /** Minimum distance from a position */
  minDistance?: number;
  /** Maximum distance from a position */
  maxDistance?: number;
  /** Position for distance-based searches */
  position?: THREE.Vector3;
  /** Visibility state to match */
  visible?: boolean;
}

/**
 * Provides a powerful query abstraction layer on top of a Three.js scene.
 * 
 * This class makes it easier to find and manage objects based on their
 * names, types, spatial relationships, or custom metadata, leveraging 
 * the scene graph hierarchy for efficient searches.
 */
export class SceneQuery {
  private scene: THREE.Scene;

  /**
   * Creates a new SceneQuery instance.
   * @param scene The Three.js scene to query against.
   */
  constructor(scene: THREE.Scene) {
    if (!scene) {
      throw new Error("A valid THREE.Scene object must be provided.");
    }
    this.scene = scene;
  }

  /**
   * Finds a single object by its exact name. This is the fastest lookup method.
   * @param name The name of the object to find.
   * @returns The found object, or undefined if not found.
   */
  public getObjectByName(name: string): THREE.Object3D | undefined {
    return this.scene.getObjectByName(name);
  }

  /**
   * Finds all objects that have a specific value for a given property in their userData.
   * This is highly flexible for finding objects with custom metadata.
   * @param property The key in the userData object.
   * @param value The value to match.
   * @returns An array of matching objects.
   */
  public getObjectsByUserData(property: string, value: any): THREE.Object3D[] {
    const results: THREE.Object3D[] = [];
    this.scene.traverse((object) => {
      if (object.userData && object.userData[property] === value) {
        results.push(object);
      }
    });
    return results;
  }

  /**
   * A convenience method to find all objects of a certain type.
   * Relies on objects having a userData.type property.
   * @param type The type identifier (e.g., 'planet', 'star', 'comet').
   * @returns An array of matching objects.
   */
  public getObjectsByType(type: string): THREE.Object3D[] {
    return this.getObjectsByUserData('type', type);
  }

  /**
   * Finds all objects with a specific celestial object ID.
   * @param celestialObjectId The celestial object ID to search for.
   * @returns An array of matching objects.
   */
  public getObjectsByCelestialId(celestialObjectId: string): THREE.Object3D[] {
    return this.getObjectsByUserData('celestialObjectId', celestialObjectId);
  }

  /**
   * Finds all child objects of a specific parent.
   * @param parentId The ID of the parent object.
   * @returns An array of child objects.
   */
  public getObjectsByParent(parentId: string): THREE.Object3D[] {
    return this.getObjectsByUserData('parentId', parentId);
  }

  /**
   * Finds all objects within a given spherical radius from a world position.
   * @param position The center of the search sphere.
   * @param radius The radius of the search sphere.
   * @param searchSet Optional array of objects to search within. If not provided, searches all celestial objects.
   * @returns An array of ProximitySearchResult objects within the radius.
   */
  public findObjectsInRadius(
    position: THREE.Vector3, 
    radius: number, 
    searchSet?: THREE.Object3D[]
  ): ProximitySearchResult[] {
    const results: ProximitySearchResult[] = [];
    const searchRadiusSq = radius * radius;
    
    // If no specific set is provided, search all celestial objects
    const objectsToSearch = searchSet || [
      ...this.getObjectsByType('star'),
      ...this.getObjectsByType('planet'),
      ...this.getObjectsByType('moon'),
      ...this.getObjectsByType('asteroid'),
      ...this.getObjectsByType('comet'),
      ...this.getObjectsByType('station')
    ];

    objectsToSearch.forEach(object => {
      const worldPosition = new THREE.Vector3();
      object.getWorldPosition(worldPosition);
      
      const distanceSq = position.distanceToSquared(worldPosition);
      if (distanceSq <= searchRadiusSq) {
        results.push({
          object,
          distance: Math.sqrt(distanceSq),
          worldPosition: worldPosition.clone()
        });
      }
    });

    // Sort by distance (closest first)
    return results.sort((a, b) => a.distance - b.distance);
  }

  /**
   * Finds the single closest object to a given world position.
   * @param position The origin point to search from.
   * @param searchSet Optional array of objects to search within. Defaults to all celestial objects.
   * @returns The closest object result, or null if no objects found.
   */
  public findNearest(
    position: THREE.Vector3, 
    searchSet?: THREE.Object3D[]
  ): ProximitySearchResult | null {
    let closest: ProximitySearchResult | null = null;
    let minDistanceSq = Infinity;

    const objectsToSearch = searchSet || [
      ...this.getObjectsByType('star'),
      ...this.getObjectsByType('planet'),
      ...this.getObjectsByType('moon')
    ];

    if (objectsToSearch.length === 0) {
      return null;
    }

    objectsToSearch.forEach(object => {
      const worldPosition = new THREE.Vector3();
      object.getWorldPosition(worldPosition);
      const distanceSq = position.distanceToSquared(worldPosition);
      
      if (distanceSq < minDistanceSq) {
        minDistanceSq = distanceSq;
        closest = {
          object,
          distance: Math.sqrt(distanceSq),
          worldPosition: worldPosition.clone()
        };
      }
    });
    
    return closest;
  }

  /**
   * Performs a complex search based on multiple criteria.
   * @param criteria The search criteria object.
   * @returns An array of matching objects.
   */
  public search(criteria: SearchCriteria): THREE.Object3D[] {
    const results: THREE.Object3D[] = [];

    this.scene.traverse((object) => {
      let matches = true;

      // Check type
      if (criteria.type && object.userData?.type !== criteria.type) {
        matches = false;
      }

      // Check celestial object ID
      if (criteria.celestialObjectId && object.userData?.celestialObjectId !== criteria.celestialObjectId) {
        matches = false;
      }

      // Check name (supports partial matching)
      if (criteria.name && !object.name.toLowerCase().includes(criteria.name.toLowerCase())) {
        matches = false;
      }

      // Check parent ID
      if (criteria.parentId && object.userData?.parentId !== criteria.parentId) {
        matches = false;
      }

      // Check custom userData properties
      if (criteria.userData && matches) {
        for (const [key, value] of Object.entries(criteria.userData)) {
          if (object.userData?.[key] !== value) {
            matches = false;
            break;
          }
        }
      }

      // Check visibility
      if (criteria.visible !== undefined && object.visible !== criteria.visible) {
        matches = false;
      }

      // Check distance constraints
      if ((criteria.minDistance || criteria.maxDistance) && criteria.position && matches) {
        const worldPosition = new THREE.Vector3();
        object.getWorldPosition(worldPosition);
        const distance = criteria.position.distanceTo(worldPosition);

        if (criteria.minDistance && distance < criteria.minDistance) {
          matches = false;
        }
        if (criteria.maxDistance && distance > criteria.maxDistance) {
          matches = false;
        }
      }

      if (matches) {
        results.push(object);
      }
    });

    return results;
  }

  /**
   * Finds all objects in a solar system.
   * @param systemId The solar system ID.
   * @returns An array of objects in the specified solar system.
   */
  public getObjectsInSolarSystem(systemId: string): THREE.Object3D[] {
    const systemGroup = this.scene.getObjectByName(`SolarSystem_${systemId}`);
    if (!systemGroup) return [];

    const objects: THREE.Object3D[] = [];
    systemGroup.traverse((child) => {
      if (child.userData?.celestialObjectId) {
        objects.push(child);
      }
    });

    return objects;
  }

  /**
   * Finds all moons orbiting a specific planet.
   * @param planetId The celestial object ID of the planet.
   * @returns An array of moon objects.
   */
  public getMoonsOfPlanet(planetId: string): THREE.Object3D[] {
    return this.search({
      type: 'moon',
      parentId: planetId
    });
  }

  /**
   * Finds all planets in a solar system.
   * @param systemId The solar system ID.
   * @returns An array of planet objects.
   */
  public getPlanetsInSystem(systemId: string): THREE.Object3D[] {
    const systemObjects = this.getObjectsInSolarSystem(systemId);
    return systemObjects.filter(obj => 
      obj.userData?.type === 'planet' || obj.userData?.type === 'gas_giant'
    );
  }

  /**
   * Finds all stars in a solar system.
   * @param systemId The solar system ID.
   * @returns An array of star objects.
   */
  public getStarsInSystem(systemId: string): THREE.Object3D[] {
    const systemObjects = this.getObjectsInSolarSystem(systemId);
    return systemObjects.filter(obj => obj.userData?.type === 'star');
  }

  /**
   * Finds objects that are currently visible in the camera's frustum.
   * @param camera The camera to check against.
   * @param searchSet Optional array of objects to check. Defaults to all celestial objects.
   * @returns An array of visible objects.
   */
  public getVisibleObjects(
    camera: THREE.PerspectiveCamera, 
    searchSet?: THREE.Object3D[]
  ): THREE.Object3D[] {
    const frustum = new THREE.Frustum();
    const matrix = new THREE.Matrix4().multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    frustum.setFromProjectionMatrix(matrix);

    const objectsToCheck = searchSet || [
      ...this.getObjectsByType('star'),
      ...this.getObjectsByType('planet'),
      ...this.getObjectsByType('moon'),
      ...this.getObjectsByType('asteroid'),
      ...this.getObjectsByType('comet')
    ];

    return objectsToCheck.filter(object => {
      const boundingBox = new THREE.Box3().setFromObject(object);
      return frustum.intersectsBox(boundingBox);
    });
  }

  /**
   * Gets hierarchical information about an object's position in the scene graph.
   * @param objectId The celestial object ID.
   * @returns An object containing hierarchy information.
   */
  public getObjectHierarchy(objectId: string): {
    object?: THREE.Object3D;
    bodyGroup?: THREE.Group;
    orbitGroup?: THREE.Group;
    solarSystem?: THREE.Group;
    parent?: THREE.Object3D;
    children: THREE.Object3D[];
  } {
    const objects = this.getObjectsByCelestialId(objectId);
    const result = {
      object: undefined as THREE.Object3D | undefined,
      bodyGroup: undefined as THREE.Group | undefined,
      orbitGroup: undefined as THREE.Group | undefined,
      solarSystem: undefined as THREE.Group | undefined,
      parent: undefined as THREE.Object3D | undefined,
      children: [] as THREE.Object3D[]
    };

    if (objects.length === 0) return result;

    // Find the body group (contains the actual mesh)
    result.bodyGroup = objects.find(obj => obj.name.endsWith('_Body')) as THREE.Group;
    result.object = result.bodyGroup;

    if (result.bodyGroup) {
      // Find orbit group (parent of body group)
      result.orbitGroup = result.bodyGroup.parent as THREE.Group;

      // Find solar system (traverse up to find it)
      let current = result.bodyGroup.parent;
      while (current && current.userData?.type !== 'solar_system') {
        current = current.parent;
      }
      result.solarSystem = current as THREE.Group;

      // Find children (objects that have this object as parent)
      result.children = this.getObjectsByParent(objectId);

      // Find parent object (if this object has a parentId)
      const parentId = result.bodyGroup.userData?.parentId;
      if (parentId) {
        const parentObjects = this.getObjectsByCelestialId(parentId);
        result.parent = parentObjects.find(obj => obj.name.endsWith('_Body'));
      }
    }

    return result;
  }

  /**
   * Creates a textual representation of the scene hierarchy.
   * Useful for debugging and understanding the scene structure.
   * @param maxDepth Maximum depth to traverse (default: 5).
   * @returns A string representation of the scene hierarchy.
   */
  public getSceneHierarchyString(maxDepth: number = 5): string {
    const lines: string[] = [];
    
    const traverse = (object: THREE.Object3D, depth: number, prefix: string = "") => {
      if (depth > maxDepth) return;
      
      const indent = "  ".repeat(depth);
      const type = object.userData?.type || "object";
      const name = object.name || "unnamed";
      const celestialId = object.userData?.celestialObjectId ? ` [${object.userData.celestialObjectId}]` : "";
      
      lines.push(`${indent}${prefix}${name} (${type})${celestialId}`);
      
      object.children.forEach((child, index) => {
        const isLast = index === object.children.length - 1;
        const childPrefix = isLast ? "└─ " : "├─ ";
        traverse(child, depth + 1, childPrefix);
      });
    };
    
    traverse(this.scene, 0);
    return lines.join('\n');
  }
}