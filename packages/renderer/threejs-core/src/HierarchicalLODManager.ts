import * as THREE from "three";
import { RenderableCelestialObject, CelestialType, DeviceTier } from "@teskooano/data-types";
import { StateAccessor, StateSubscriptionMixin } from "@teskooano/core-state";
import { SceneGraphManager, CelestialSystemNode } from "./SceneGraphManager";

/**
 * Defines different levels of detail for an object
 */
export interface HierarchicalLODLevel {
  /** The Three.js object to display at this level */
  object: THREE.Object3D;
  /** Distance threshold for this level (in scene units) */
  distance: number;
  /** Visibility threshold for showing children (e.g., moons) */
  showChildren?: boolean;
  /** Geometry detail level (vertices/faces) */
  geometryDetail?: 'high' | 'medium' | 'low' | 'billboard';
  /** Shader complexity level */
  shaderComplexity?: 'full' | 'simplified' | 'basic';
}

/**
 * Configuration for automatic LOD generation
 */
export interface AutoLODConfig {
  /** Base radius of the object */
  radius: number;
  /** Object type for determining appropriate distances */
  type: CelestialType;
  /** Performance tier for adjusting thresholds */
  performanceTier: DeviceTier;
  /** Whether this object has children that should be managed */
  hasChildren: boolean;
}

/**
 * Performance-optimized thresholds for different celestial types
 */
const LOD_DISTANCE_MULTIPLIERS = {
  [CelestialType.STAR]: {
    high: { factor: 50, children: 200 },
    medium: { factor: 100, children: 300 },
    low: { factor: 200, children: 500 },
    billboard: { factor: 1000, children: 2000 }
  },
  [CelestialType.PLANET]: {
    high: { factor: 20, children: 50 },
    medium: { factor: 40, children: 100 },
    low: { factor: 80, children: 200 },
    billboard: { factor: 400, children: 800 }
  },
  [CelestialType.GAS_GIANT]: {
    high: { factor: 30, children: 80 },
    medium: { factor: 60, children: 150 },
    low: { factor: 120, children: 300 },
    billboard: { factor: 600, children: 1200 }
  },
  [CelestialType.MOON]: {
    high: { factor: 10, children: 20 },
    medium: { factor: 20, children: 40 },
    low: { factor: 40, children: 80 },
    billboard: { factor: 200, children: 400 }
  },
  [CelestialType.ASTEROID]: {
    high: { factor: 5, children: 10 },
    medium: { factor: 10, children: 20 },
    low: { factor: 20, children: 40 },
    billboard: { factor: 100, children: 200 }
  },
  [CelestialType.COMET]: {
    high: { factor: 15, children: 30 },
    medium: { factor: 30, children: 60 },
    low: { factor: 60, children: 120 },
    billboard: { factor: 300, children: 600 }
  },
  [CelestialType.SATELLITE]: {
    high: { factor: 5, children: 10 },
    medium: { factor: 10, children: 20 },
    low: { factor: 20, children: 40 },
    billboard: { factor: 100, children: 200 }
  },
  [CelestialType.DWARF_PLANET]: {
    high: { factor: 15, children: 30 },
    medium: { factor: 30, children: 60 },
    low: { factor: 60, children: 120 },
    billboard: { factor: 300, children: 600 }
  },
  [CelestialType.ASTEROID_FIELD]: {
    high: { factor: 20, children: 50 },
    medium: { factor: 40, children: 100 },
    low: { factor: 80, children: 200 },
    billboard: { factor: 400, children: 800 }
  },
  [CelestialType.OORT_CLOUD]: {
    high: { factor: 100, children: 500 },
    medium: { factor: 200, children: 1000 },
    low: { factor: 400, children: 2000 },
    billboard: { factor: 2000, children: 4000 }
  },
  [CelestialType.RING_SYSTEM]: {
    high: { factor: 8, children: 15 },
    medium: { factor: 16, children: 30 },
    low: { factor: 32, children: 60 },
    billboard: { factor: 160, children: 320 }
  },
  [CelestialType.BARYCENTER]: {
    high: { factor: 1, children: 1 },
    medium: { factor: 1, children: 1 },
    low: { factor: 1, children: 1 },
    billboard: { factor: 1, children: 1 }
  },
  [CelestialType.OTHER]: {
    high: { factor: 10, children: 20 },
    medium: { factor: 20, children: 40 },
    low: { factor: 40, children: 80 },
    billboard: { factor: 200, children: 400 }
  }
};

/**
 * Enhanced LOD manager that works with hierarchical scene graphs.
 * 
 * This manager automatically handles:
 * - Distance-based LOD switching for individual objects
 * - Hierarchical visibility (e.g., moons only visible when close to planet)
 * - Performance-based threshold adjustment
 * - Group-level culling for entire systems
 */
export class HierarchicalLODManager extends StateSubscriptionMixin {
  private camera: THREE.PerspectiveCamera;
  private sceneGraphManager: SceneGraphManager;
  
  /** Map of LOD objects by celestial object ID */
  private lodObjects: Map<string, THREE.LOD> = new Map();
  
  /** Map of original meshes for fallback */
  private originalMeshes: Map<string, THREE.Object3D> = new Map();
  
  /** Current performance tier */
  private performanceTier: DeviceTier = "medium";
  
  /** Global LOD distance multiplier based on performance */
  private globalLODMultiplier: number = 1.0;
  
  /** Cache for distance calculations to avoid repeated work */
  private distanceCache: Map<string, { distance: number; frame: number }> = new Map();
  private currentFrame: number = 0;
  
  /** Frustum for culling calculations */
  private frustum = new THREE.Frustum();
  private cameraMatrix = new THREE.Matrix4();

  constructor(camera: THREE.PerspectiveCamera, sceneGraphManager: SceneGraphManager) {
    super();
    this.camera = camera;
    this.sceneGraphManager = sceneGraphManager;
    
    // Subscribe to performance changes
    this.subscribeToState(StateAccessor.getSimulationStateStream(), (state) => {
      if (state.performanceProfile !== this.performanceTier) {
        this.performanceTier = state.performanceProfile;
        this.updateGlobalLODMultiplier();
      }
    });
    
    this.updateGlobalLODMultiplier();
  }

  /**
   * Updates the global LOD multiplier based on performance tier
   */
  private updateGlobalLODMultiplier(): void {
    switch (this.performanceTier) {
      case "low":
        this.globalLODMultiplier = 0.5; // Switch to lower LOD sooner
        break;
      case "medium":
        this.globalLODMultiplier = 1.0;
        break;
      case "high":
        this.globalLODMultiplier = 1.5; // Keep high LOD longer
        break;
      case "cosmic":
        this.globalLODMultiplier = 2.0; // Maximum quality
        break;
    }
  }

  /**
   * Creates automatic LOD levels for a celestial object
   */
  public createAutoLOD(
    object: RenderableCelestialObject,
    meshes: {
      high?: THREE.Object3D;
      medium?: THREE.Object3D;
      low?: THREE.Object3D;
      billboard?: THREE.Object3D;
    }
  ): THREE.LOD {
    const config: AutoLODConfig = {
      radius: object.radius || 1,
      type: object.type,
      performanceTier: this.performanceTier,
      hasChildren: this.hasChildren(object.celestialObjectId)
    };

    const distances = this.calculateLODDistances(config);
    const lod = new THREE.LOD();

    // Determine the primary mesh to use
    const primaryMesh = meshes.high || meshes.medium || meshes.low || meshes.billboard;
    
    if (!primaryMesh) {
      console.warn(`[HierarchicalLODManager] No meshes provided for ${object.celestialObjectId}`);
      return lod;
    }

    // Add high-detail level
    if (meshes.high) {
      lod.addLevel(meshes.high, 0);
      this.originalMeshes.set(object.celestialObjectId, meshes.high);
    } else {
      // Use primary mesh as high detail
      lod.addLevel(primaryMesh, 0);
      this.originalMeshes.set(object.celestialObjectId, primaryMesh);
    }
    
    // Add medium-detail level
    if (meshes.medium) {
      lod.addLevel(meshes.medium, distances.medium);
    } else if (primaryMesh) {
      // Clone and slightly reduce detail for medium level
      const mediumMesh = primaryMesh.clone();
      mediumMesh.scale.multiplyScalar(0.8); // Slightly smaller for distance
      lod.addLevel(mediumMesh, distances.medium);
    }
    
    // Add low-detail level
    if (meshes.low) {
      lod.addLevel(meshes.low, distances.low);
    } else if (primaryMesh) {
      // Clone and reduce detail for low level
      const lowMesh = primaryMesh.clone();
      lowMesh.scale.multiplyScalar(0.6); // Smaller for distance
      lod.addLevel(lowMesh, distances.low);
    }
    
    // Add billboard level if provided
    if (meshes.billboard) {
      lod.addLevel(meshes.billboard, distances.billboard);
    }

    // Store for management
    this.lodObjects.set(object.celestialObjectId, lod);

    return lod;
  }

  /**
   * Creates custom LOD levels for a celestial object
   */
  public createCustomLOD(
    objectId: string,
    levels: HierarchicalLODLevel[]
  ): THREE.LOD {
    const lod = new THREE.LOD();
    
    levels.forEach(level => {
      const adjustedDistance = level.distance * this.globalLODMultiplier;
      lod.addLevel(level.object, adjustedDistance);
    });

    this.lodObjects.set(objectId, lod);
    return lod;
  }

  /**
   * Calculates appropriate LOD distances for an object
   */
  private calculateLODDistances(config: AutoLODConfig): {
    medium: number;
    low: number;
    billboard: number;
    childrenVisible: number;
  } {
    let multipliers = LOD_DISTANCE_MULTIPLIERS[config.type];
    
    // Fallback to OTHER type if multipliers not found
    if (!multipliers) {
      console.warn(`[HierarchicalLODManager] No LOD multipliers defined for ${config.type}, using OTHER as fallback`);
      multipliers = LOD_DISTANCE_MULTIPLIERS[CelestialType.OTHER];
    }
    
    const baseRadius = config.radius;
    
    // Apply performance tier adjustments
    const performanceMultiplier = this.getPerformanceMultiplier(config.performanceTier);
    
    return {
      medium: baseRadius * multipliers.medium.factor * performanceMultiplier * this.globalLODMultiplier,
      low: baseRadius * multipliers.low.factor * performanceMultiplier * this.globalLODMultiplier,
      billboard: baseRadius * multipliers.billboard.factor * performanceMultiplier * this.globalLODMultiplier,
      childrenVisible: baseRadius * multipliers.high.children * performanceMultiplier * this.globalLODMultiplier
    };
  }

  /**
   * Gets performance multiplier for LOD distances
   */
  private getPerformanceMultiplier(tier: DeviceTier): number {
    switch (tier) {
      case "low": return 0.5;
      case "medium": return 1.0;
      case "high": return 1.5;
      case "cosmic": return 2.0;
    }
  }

  /**
   * Checks if an object has children in the scene graph
   */
  private hasChildren(objectId: string): boolean {
    const node = this.sceneGraphManager.getNode(objectId);
    return node ? node.children.size > 0 : false;
  }

  /**
   * Main update method - call this each frame
   */
  public update(): void {
    this.currentFrame++;
    this.updateFrustum();
    
    // Update LOD for all registered objects
    this.lodObjects.forEach((lod, objectId) => {
      this.updateObjectLOD(objectId, lod);
    });
    
    // Update hierarchical visibility
    this.updateHierarchicalVisibility();
    
    // Clean old distance cache entries
    if (this.currentFrame % 60 === 0) { // Every ~1 second at 60fps
      this.cleanDistanceCache();
    }
  }

  /**
   * Updates the camera frustum for culling calculations
   */
  private updateFrustum(): void {
    this.cameraMatrix.multiplyMatrices(
      this.camera.projectionMatrix,
      this.camera.matrixWorldInverse
    );
    this.frustum.setFromProjectionMatrix(this.cameraMatrix);
  }

  /**
   * Updates LOD for a specific object
   */
  private updateObjectLOD(objectId: string, lod: THREE.LOD): void {
    const distance = this.getCachedDistance(objectId, lod);
    
    // Update the LOD based on distance
    lod.update(this.camera);
    
    // Store the distance for hierarchical visibility calculations
    this.distanceCache.set(objectId, { distance, frame: this.currentFrame });
  }

  /**
   * Gets cached distance or calculates new one
   */
  private getCachedDistance(objectId: string, object: THREE.Object3D): number {
    const cached = this.distanceCache.get(objectId);
    
    // Use cached value if it's from the current frame
    if (cached && cached.frame === this.currentFrame) {
      return cached.distance;
    }
    
    // Calculate new distance
    const worldPosition = new THREE.Vector3();
    object.getWorldPosition(worldPosition);
    const distance = this.camera.position.distanceTo(worldPosition);
    
    return distance;
  }

  /**
   * Updates hierarchical visibility (e.g., moons based on planet distance)
   */
  private updateHierarchicalVisibility(): void {
    // Process each celestial object to determine if its children should be visible
    this.lodObjects.forEach((lod, objectId) => {
      const node = this.sceneGraphManager.getNode(objectId);
      if (!node || node.children.size === 0) return;
      
      const distance = this.distanceCache.get(objectId)?.distance;
      if (distance === undefined) return;
      
      // Calculate if children should be visible based on parent distance
      const shouldShowChildren = this.shouldShowChildren(node.object, distance);
      
      // Update visibility of all children
      node.children.forEach((childNode, childId) => {
        const childLOD = this.lodObjects.get(childId);
        if (childLOD) {
          childLOD.visible = shouldShowChildren;
        }
        
        // Also update the body group visibility
        if (childNode.bodyGroup) {
          childNode.bodyGroup.visible = shouldShowChildren;
        }
      });
    });
  }

  /**
   * Determines if children should be visible based on parent object and distance
   */
  private shouldShowChildren(parentObject: RenderableCelestialObject, distance: number): boolean {
    const config: AutoLODConfig = {
      radius: parentObject.radius || 1,
      type: parentObject.type,
      performanceTier: this.performanceTier,
      hasChildren: true
    };
    
    const distances = this.calculateLODDistances(config);
    return distance <= distances.childrenVisible;
  }

  /**
   * Performs group-level frustum culling for solar systems
   */
  public performGroupCulling(): void {
    // This would work with the SceneGraphManager to cull entire solar systems
    this.sceneGraphManager.performSpatialCulling(this.camera);
  }

  /**
   * Sets the visibility threshold for children of a specific object
   */
  public setChildrenVisibilityThreshold(objectId: string, threshold: number): void {
    // Custom override for specific objects
    const node = this.sceneGraphManager.getNode(objectId);
    if (node) {
      node.bodyGroup.userData.childrenVisibilityThreshold = threshold;
    }
  }

  /**
   * Gets the current LOD level for an object
   */
  public getCurrentLODLevel(objectId: string): number {
    const lod = this.lodObjects.get(objectId);
    if (!lod) return -1;
    
    // Find which level is currently active
    const distance = this.distanceCache.get(objectId)?.distance;
    if (distance === undefined) return -1;
    
    for (let i = 0; i < lod.levels.length; i++) {
      if (distance <= lod.levels[i].distance || i === lod.levels.length - 1) {
        return i;
      }
    }
    
    return -1;
  }

  /**
   * Gets performance statistics for debugging
   */
  public getPerformanceStats(): {
    totalLODObjects: number;
    visibleLODObjects: number;
    currentFrame: number;
    cacheSize: number;
    globalLODMultiplier: number;
  } {
    let visibleCount = 0;
    this.lodObjects.forEach(lod => {
      if (lod.visible) visibleCount++;
    });
    
    return {
      totalLODObjects: this.lodObjects.size,
      visibleLODObjects: visibleCount,
      currentFrame: this.currentFrame,
      cacheSize: this.distanceCache.size,
      globalLODMultiplier: this.globalLODMultiplier
    };
  }

  /**
   * Cleans old entries from the distance cache
   */
  private cleanDistanceCache(): void {
    const cutoffFrame = this.currentFrame - 120; // Keep last 2 seconds at 60fps
    
    this.distanceCache.forEach((value, key) => {
      if (value.frame < cutoffFrame) {
        this.distanceCache.delete(key);
      }
    });
  }

  /**
   * Removes an object from LOD management
   */
  public removeLOD(objectId: string): void {
    const lod = this.lodObjects.get(objectId);
    if (lod && lod.parent) {
      lod.parent.remove(lod);
    }
    
    this.lodObjects.delete(objectId);
    this.originalMeshes.delete(objectId);
    this.distanceCache.delete(objectId);
  }

  /**
   * Updates the camera reference (useful for camera switches)
   */
  public setCamera(camera: THREE.PerspectiveCamera): void {
    this.camera = camera;
  }

  /**
   * Forces an update of all LOD distances based on new performance settings
   */
  public refreshAllLODs(): void {
    this.lodObjects.forEach((lod, objectId) => {
      // Force recalculation by clearing cache
      this.distanceCache.delete(objectId);
    });
  }

  /**
   * Disposes of all resources
   */
  public dispose(): void {
    this.lodObjects.clear();
    this.originalMeshes.clear();
    this.distanceCache.clear();
    super.dispose();
  }
}