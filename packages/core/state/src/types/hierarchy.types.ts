import type { CelestialObject } from "@teskooano/data-types";

/**
 * Represents a single hierarchy relationship entry in the flat state.
 * This structure maintains bidirectional parent-child relationships
 * for efficient querying in both directions.
 */
export interface HierarchyEntry {
  /** The unique identifier of the celestial object */
  id: string;

  /** The parent object ID (undefined for root objects) */
  parentId?: string;

  /** Array of direct child object IDs */
  children: string[];

  /** The depth level in the hierarchy (0 for root objects) */
  depth: number;

  /** The path from root to this object (e.g., ['sun', 'earth', 'moon']) */
  path: string[];

  /** Whether this object is a root object (no parent) */
  isRoot: boolean;

  /** Whether this object has children */
  hasChildren: boolean;

  /** Total count of descendants (children + grandchildren + ...) */
  descendantCount: number;
}

/**
 * Flat hierarchy state that maintains all parent-child relationships
 * in a single, queryable structure.
 */
export interface FlatHierarchyState {
  /** Map of object ID to hierarchy entry */
  entries: Record<string, HierarchyEntry>;

  /** Array of all root object IDs (objects with no parent) */
  roots: string[];

  /** Total number of objects in the hierarchy */
  totalObjects: number;

  /** Maximum depth in the hierarchy */
  maxDepth: number;
}

/**
 * Options for hierarchy operations to control behavior
 */
export interface HierarchyOperationOptions {
  /** Whether to validate the operation (check for cycles, etc.) */
  validate?: boolean;

  /** Whether to update descendant counts after the operation */
  updateDescendantCounts?: boolean;

  /** Whether to emit change events */
  emitEvents?: boolean;
}

/**
 * Result of a hierarchy operation
 */
export interface HierarchyOperationResult {
  /** Whether the operation was successful */
  success: boolean;

  /** Error message if the operation failed */
  error?: string;

  /** The updated hierarchy state */
  newState: FlatHierarchyState;

  /** Objects that were affected by the operation */
  affectedObjects: string[];
}

/**
 * Query options for hierarchy operations
 */
export interface HierarchyQueryOptions {
  /** Maximum depth to traverse (0 = unlimited) */
  maxDepth?: number;

  /** Whether to include the starting object in results */
  includeSelf?: boolean;

  /** Filter function to apply to results */
  filter?: (entry: HierarchyEntry) => boolean;
}

/**
 * Hierarchy query result
 */
export interface HierarchyQueryResult {
  /** Array of hierarchy entries matching the query */
  entries: HierarchyEntry[];

  /** Total count of matching entries */
  count: number;

  /** Whether the query was limited by maxDepth */
  depthLimited: boolean;
}
