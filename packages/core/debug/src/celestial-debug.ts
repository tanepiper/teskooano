/**
 * Celestial body debug utilities
 *
 * This module provides specialized debug tools for celestial objects
 * in the Teskooano engine.
 */
import { OSVector3 } from "@teskooano/core-math";
import { isVisualizationEnabled, createLogger } from "./index";
import { vectorDebug } from "./vector-debug";
import { threeVectorDebug } from "./three-vector-debug";
import {
  physicsSystemAdapter,
  FlatHierarchyService,
} from "@teskooano/core-state";
import type { CelestialObject, CelestialType } from "@teskooano/data-types";

/**
 * A container for all debug information related to a single celestial object.
 */
export interface CelestialDebugCache {
  orbital?: OrbitalDebugData;
  material?: MaterialDebugData;
  physics?: PhysicsDebugData;
  lighting?: LightingDebugData;
}

/**
 * Defines the structure for a node in the celestial system hierarchy.
 * This is used to build a tree view of the system for debugging.
 */
export interface SystemHierarchyNode {
  id: string;
  name: string;
  type: CelestialType;
  children: SystemHierarchyNode[];
}

/**
 * Types of debug data that can be stored for celestial objects
 */
export enum CelestialDebugDataType {
  VECTORS = "vectors",
  ORBITAL = "orbital",
  PHYSICS = "physics",
  MATERIAL = "material",
  LIGHTING = "lighting",
}

/**
 * Interface for debug vector pairs commonly used in celestial renderers
 */
export interface CelestialVectorPairs {
  lightDirection?: OSVector3;
  parentPosition?: OSVector3;
  orbitNormal?: OSVector3;
  velocity?: OSVector3;
  angularMomentum?: OSVector3;
}

/**
 * Interface for orbital debug data
 */
export interface OrbitalDebugData {
  semiMajorAxis?: number;
  eccentricity?: number;
  inclination?: number;
  longitudeAscendingNode?: number;
  argumentOfPeriapsis?: number;
  meanAnomaly?: number;
  period?: number;
}

/**
 * Debug options for material properties
 */
export interface MaterialDebugData {
  type?: string;
  shaderType?: string;
  parameters?: Record<string, any>;
  textures?: string[];
}

/**
 * Physics debug data for celestial objects
 */
export interface PhysicsDebugData {
  mass?: number;
  density?: number;
  radius?: number;
  gravity?: number;
  escapeVelocity?: number;
}

/**
 * Lighting debug data
 */
export interface LightingDebugData {
  primaryLightSource?: string;
  intensity?: number;
  color?: string;
  effectiveTemperature?: number;
}

/**
 * Helper class for debugging celestial objects.
 * This class stores debug data in-memory for fast access and to avoid
 * performance bottlenecks associated with `localStorage`.
 */
export class CelestialDebugger {
  private readonly logger = createLogger("CelestialDebug");
  private dataCache: Map<string, CelestialDebugCache> = new Map();

  private getOrCreateCache(objectId: string): CelestialDebugCache {
    if (!this.dataCache.has(objectId)) {
      this.dataCache.set(objectId, {});
    }
    return this.dataCache.get(objectId)!;
  }

  /**
   * Set debug vectors for a celestial object
   *
   * @param objectId The celestial object ID
   * @param vectors The vector pairs to store
   */
  public setVectors(objectId: string, vectors: CelestialVectorPairs): void {
    if (!isVisualizationEnabled()) return;

    const debugName = `celestial-${objectId}`;

    if (vectors.lightDirection) {
      threeVectorDebug.setVector(
        debugName,
        "lightDirection",
        vectors.lightDirection.toThreeJS(),
      );
    }

    if (vectors.parentPosition) {
      threeVectorDebug.setVector(
        debugName,
        "parentPosition",
        vectors.parentPosition.toThreeJS(),
      );
    }

    if (vectors.orbitNormal) {
      threeVectorDebug.setVector(
        debugName,
        "orbitNormal",
        vectors.orbitNormal.toThreeJS(),
      );
    }

    if (vectors.velocity) {
      threeVectorDebug.setVector(
        debugName,
        "velocity",
        vectors.velocity.toThreeJS(),
      );
    }

    if (vectors.angularMomentum) {
      threeVectorDebug.setVector(
        debugName,
        "angularMomentum",
        vectors.angularMomentum.toThreeJS(),
      );
    }
  }

  /**
   * Set orbital data for a celestial object
   *
   * @param objectId The celestial object ID
   * @param data The orbital data to store
   */
  public setOrbitalData(objectId: string, data: OrbitalDebugData): void {
    if (!isVisualizationEnabled()) return;
    const cache = this.getOrCreateCache(objectId);
    cache.orbital = data;
  }

  /**
   * Set material debug data for a celestial object
   *
   * @param objectId The celestial object ID
   * @param data The material data to store
   */
  public setMaterialData(objectId: string, data: MaterialDebugData): void {
    if (!isVisualizationEnabled()) return;
    const cache = this.getOrCreateCache(objectId);
    cache.material = data;
  }

  /**
   * Set physics debug data for a celestial object
   *
   * @param objectId The celestial object ID
   * @param data The physics data to store
   */
  public setPhysicsData(objectId: string, data: PhysicsDebugData): void {
    if (!isVisualizationEnabled()) return;
    const cache = this.getOrCreateCache(objectId);
    cache.physics = data;
  }

  /**
   * Set lighting debug data for a celestial object
   *
   * @param objectId The celestial object ID
   * @param data The lighting data to store
   */
  public setLightingData(objectId: string, data: LightingDebugData): void {
    if (!isVisualizationEnabled()) return;
    const cache = this.getOrCreateCache(objectId);
    cache.lighting = data;
  }

  /**
   * Get all cached debug data for a celestial object.
   *
   * @param objectId The celestial object ID.
   * @returns The debug data cache for the object, or undefined.
   */
  public getDebugData(objectId: string): CelestialDebugCache | undefined {
    return this.dataCache.get(objectId);
  }

  /**
   * Get the IDs of all objects currently being tracked by the debugger.
   * This includes objects with vector data and/or cached data.
   *
   * @returns A string array of unique object IDs.
   */
  public getTrackedObjectIds(): string[] {
    const vectorIds = vectorDebug
      .getNames()
      .filter((name) => name.startsWith("celestial-"))
      .map((name) => name.replace("celestial-", ""));

    const cacheIds = Array.from(this.dataCache.keys());

    return Array.from(new Set([...vectorIds, ...cacheIds]));
  }

  /**
   * Builds and returns a hierarchical tree structure of the current celestial system.
   * This is useful for building a debug UI that displays the system hierarchy.
   * Now uses the FlatHierarchyService for improved performance and consistency.
   *
   * @returns An array of root nodes representing the system's hierarchy.
   */
  public getSystemHierarchy(): SystemHierarchyNode[] {
    const flatHierarchyService = FlatHierarchyService.getInstance();
    const hierarchyState = flatHierarchyService.getHierarchyState();
    const allObjects = physicsSystemAdapter.getCelestialObjectsSnapshot();

    const nodes = new Map<string, SystemHierarchyNode>();

    // First pass: create a node for each object
    Object.values(allObjects).forEach((object) => {
      nodes.set(object.id, {
        id: object.id,
        name: object.name,
        type: object.type,
        children: [],
      });
    });

    const rootNodes: SystemHierarchyNode[] = [];

    // Second pass: build the hierarchy using the flat hierarchy service
    hierarchyState.roots.forEach((rootId) => {
      const rootNode = nodes.get(rootId);
      if (rootNode) {
        rootNodes.push(rootNode);
        this.buildHierarchyRecursively(rootNode, hierarchyState.entries, nodes);
      }
    });

    // Sort children alphabetically by name for consistent display
    nodes.forEach((node) => {
      node.children.sort((a, b) => a.name.localeCompare(b.name));
    });
    rootNodes.sort((a, b) => a.name.localeCompare(b.name));

    return rootNodes;
  }

  /**
   * Recursively builds the hierarchy tree using the flat hierarchy service data.
   */
  private buildHierarchyRecursively(
    parentNode: SystemHierarchyNode,
    entries: Record<string, any>,
    nodes: Map<string, SystemHierarchyNode>,
  ): void {
    const parentEntry = entries[parentNode.id];
    if (!parentEntry) return;

    parentEntry.children.forEach((childId: string) => {
      const childNode = nodes.get(childId);
      if (childNode) {
        parentNode.children.push(childNode);
        this.buildHierarchyRecursively(childNode, entries, nodes);
      }
    });
  }

  /**
   * Clear all debug data for a specific celestial object
   *
   * @param objectId The celestial object ID to clear
   */
  public clearObjectDebugData(objectId: string): void {
    threeVectorDebug.clearVectors(`celestial-${objectId}`);
    this.dataCache.delete(objectId);
  }

  /**
   * Clear all celestial debug data
   */
  public clearAllCelestialDebugData(): void {
    const trackedIds = this.getTrackedObjectIds();
    trackedIds.forEach((id) => this.clearObjectDebugData(id));
  }

  /**
   * Gets detailed hierarchy information for debugging purposes.
   * This provides comprehensive information about the flat hierarchy state.
   *
   * @returns A detailed hierarchy debug object
   */
  public getHierarchyDebugInfo(): {
    totalObjects: number;
    maxDepth: number;
    rootCount: number;
    entries: Array<{
      id: string;
      name: string;
      type: string;
      parentId?: string;
      childrenCount: number;
      depth: number;
      path: string[];
      descendantCount: number;
      isRoot: boolean;
    }>;
  } {
    const flatHierarchyService = FlatHierarchyService.getInstance();
    const hierarchyState = flatHierarchyService.getHierarchyState();
    const allObjects = physicsSystemAdapter.getCelestialObjectsSnapshot();

    const entries = Object.values(hierarchyState.entries).map((entry) => {
      const object = allObjects[entry.id];
      return {
        id: entry.id,
        name: object?.name || "Unknown",
        type: object?.type || "Unknown",
        parentId: entry.parentId,
        childrenCount: entry.children.length,
        depth: entry.depth,
        path: entry.path,
        descendantCount: entry.descendantCount,
        isRoot: entry.isRoot,
      };
    });

    return {
      totalObjects: hierarchyState.totalObjects,
      maxDepth: hierarchyState.maxDepth,
      rootCount: hierarchyState.roots.length,
      entries: entries.sort(
        (a, b) => a.depth - b.depth || a.name.localeCompare(b.name),
      ),
    };
  }

  /**
   * Gets hierarchy statistics for performance monitoring.
   *
   * @returns Hierarchy performance statistics
   */
  public getHierarchyStats(): {
    totalObjects: number;
    maxDepth: number;
    rootCount: number;
    averageChildrenPerParent: number;
    objectsWithChildren: number;
    leafNodes: number;
  } {
    const flatHierarchyService = FlatHierarchyService.getInstance();
    const hierarchyState = flatHierarchyService.getHierarchyState();
    const entries = Object.values(hierarchyState.entries);

    const objectsWithChildren = entries.filter((e) => e.hasChildren).length;
    const leafNodes = entries.filter((e) => !e.hasChildren).length;
    const totalChildren = entries.reduce(
      (sum, e) => sum + e.children.length,
      0,
    );
    const averageChildrenPerParent =
      objectsWithChildren > 0 ? totalChildren / objectsWithChildren : 0;

    return {
      totalObjects: hierarchyState.totalObjects,
      maxDepth: hierarchyState.maxDepth,
      rootCount: hierarchyState.roots.length,
      averageChildrenPerParent,
      objectsWithChildren,
      leafNodes,
    };
  }
}

/**
 * Singleton instance of the CelestialDebugger
 */
export const celestialDebugger = new CelestialDebugger();
