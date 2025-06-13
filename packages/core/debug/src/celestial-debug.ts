/**
 * Celestial body debug utilities
 *
 * This module provides specialized debug tools for celestial objects
 * in the Teskooano engine.
 */
import { OSVector3 } from "@teskooano/core-math";
import {
  threeVectorDebug,
  isVisualizationEnabled,
  createLogger,
} from "./index";
import { vectorDebug } from "./vector-debug";
import { ThreeVector3 } from "./three-vector-debug";
import { physicsSystemAdapter } from "@teskooano/core-state";
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
  lightDirection?: ThreeVector3;
  parentPosition?: ThreeVector3;
  orbitNormal?: ThreeVector3;
  velocity?: ThreeVector3;
  angularMomentum?: ThreeVector3;
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
        vectors.lightDirection,
      );
    }

    if (vectors.parentPosition) {
      threeVectorDebug.setVector(
        debugName,
        "parentPosition",
        vectors.parentPosition,
      );
    }

    if (vectors.orbitNormal) {
      threeVectorDebug.setVector(debugName, "orbitNormal", vectors.orbitNormal);
    }

    if (vectors.velocity) {
      threeVectorDebug.setVector(debugName, "velocity", vectors.velocity);
    }

    if (vectors.angularMomentum) {
      threeVectorDebug.setVector(
        debugName,
        "angularMomentum",
        vectors.angularMomentum,
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
   *
   * @returns An array of root nodes representing the system's hierarchy.
   */
  public getSystemHierarchy(): SystemHierarchyNode[] {
    const allObjects = physicsSystemAdapter.getCelestialObjectsSnapshot();
    const objectMap = new Map<string, CelestialObject>(
      Object.entries(allObjects),
    );
    const nodes = new Map<string, SystemHierarchyNode>();

    // First pass: create a node for each object
    objectMap.forEach((object) => {
      nodes.set(object.id, {
        id: object.id,
        name: object.name,
        type: object.type,
        children: [],
      });
    });

    const rootNodes: SystemHierarchyNode[] = [];

    // Second pass: build the hierarchy by linking children to parents
    nodes.forEach((node) => {
      const object = objectMap.get(node.id)!;
      if (object.parentId && nodes.has(object.parentId)) {
        const parentNode = nodes.get(object.parentId)!;
        parentNode.children.push(node);
      } else {
        rootNodes.push(node);
      }
    });

    // Optional: Sort children alphabetically by name for consistent display
    nodes.forEach((node) => {
      node.children.sort((a, b) => a.name.localeCompare(b.name));
    });
    rootNodes.sort((a, b) => a.name.localeCompare(b.name));

    return rootNodes;
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
}

/**
 * Singleton instance of the CelestialDebugger
 */
export const celestialDebugger = new CelestialDebugger();
