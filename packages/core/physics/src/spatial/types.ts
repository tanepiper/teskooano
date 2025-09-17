import { OSVector3 } from "@teskooano/core-math";
import { PhysicsStateReal } from "@teskooano/data-types";

/**
 * Configuration for the WASM spatial partitioning system
 */
export interface WasmPartitioningConfig {
  /** Maximum distance to consider two points as neighbors (meters) */
  neighborDistance: number;
  /** Whether the WASM module has been initialized */
  initialized: boolean;
}

export interface PerformanceMetrics {
  totalOperations: number;
  averageOperationTime: number;
  wasmOperations: number;
  traditionalOperations: number;
  lastResetTime: number;
}

/**
 * Represents a node in the octree
 */
export interface OctreeNode {
  /** The center point of this node (OSVector3, meters) */
  center: OSVector3;
  /** The size of this node (half-width, meters) */
  size: number;
  /** The bodies contained directly in this node */
  bodies: PhysicsStateReal[];
  /** Child nodes (if any) */
  children?: OctreeNode[];
  /** The total mass of all bodies within this node and its children (kg) */
  totalMass_kg: number;
  /** The center of mass of all bodies within this node and its children (OSVector3, meters) */
  centerOfMass_m: OSVector3;
  /** The minimum x coordinate of this node */
  minX: number;
  /** The maximum x coordinate of this node */
  maxX: number;
  /** The minimum y coordinate of this node */
  minY: number;
  /** The maximum y coordinate of this node */
  maxY: number;
  /** The minimum z coordinate of this node */
  minZ: number;
  /** The maximum z coordinate of this node */
  maxZ: number;
}
