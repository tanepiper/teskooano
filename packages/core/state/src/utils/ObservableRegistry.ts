import type { Observable } from "rxjs";

/**
 * Categories for organizing observables in the registry.
 */
export enum ObservableCategory {
  /** State store observables (CelestialStore, RenderableStore, etc.) */
  STORE = "store",
  /** Event bridge observables (SystemEventBridge, CelestialEventBridge) */
  BRIDGE = "bridge",
  /** Render pipeline stage observables */
  PIPELINE = "pipeline",
  /** Component-level observables */
  COMPONENT = "component",
  /** Utility observables (timers, web APIs, etc.) */
  UTILITY = "utility",
}

/**
 * Metadata about a registered observable.
 */
export interface ObservableMetadata<T = unknown> {
  /** Unique identifier for this observable */
  id: string;
  /** Human-readable name */
  name: string;
  /** Category for organization */
  category: ObservableCategory;
  /** Description of what this observable emits */
  description: string;
  /** IDs of observables this one depends on */
  dependencies?: string[];
  /** The actual observable instance */
  observable$: Observable<T>;
  /** Timestamp when registered */
  registeredAt: Date;
  /** Optional tags for filtering */
  tags?: string[];
}

/**
 * Statistics about observable usage.
 */
export interface ObservableStats {
  /** Number of active subscriptions */
  subscriptionCount: number;
  /** Total emissions since registration */
  emissionCount: number;
  /** Last emission timestamp */
  lastEmissionAt?: Date;
  /** Average time between emissions (ms) */
  averageEmissionInterval?: number;
}

/**
 * Node in the dependency graph.
 */
export interface DependencyNode {
  id: string;
  name: string;
  category: ObservableCategory;
  dependencies: string[];
  dependents: string[];
}

/**
 * Complete dependency graph of observables.
 */
export interface DependencyGraph {
  nodes: Map<string, DependencyNode>;
  /** Root observables (no dependencies) */
  roots: string[];
  /** Leaf observables (no dependents) */
  leaves: string[];
  /** Detected circular dependencies */
  cycles: string[][];
}

/**
 * Central registry for tracking all observables in the application.
 * Provides visibility into stream connections, dependencies, and usage patterns.
 *
 * @example
 * ```typescript
 * // Register an observable
 * const registry = ObservableRegistry.getInstance();
 * registry.register('celestial-objects', celestialStore.objects$, {
 *   category: ObservableCategory.STORE,
 *   description: 'All celestial objects in the simulation',
 *   tags: ['core', 'state']
 * });
 *
 * // Query the registry
 * const metadata = registry.get('celestial-objects');
 * const storeObservables = registry.getByCategory(ObservableCategory.STORE);
 * const graph = registry.getDependencyGraph();
 * ```
 */
export class ObservableRegistry {
  private static instance: ObservableRegistry;
  private observables = new Map<string, ObservableMetadata>();
  private stats = new Map<string, ObservableStats>();

  private constructor() {}

  /**
   * Gets the singleton instance of the registry.
   */
  public static getInstance(): ObservableRegistry {
    if (!ObservableRegistry.instance) {
      ObservableRegistry.instance = new ObservableRegistry();
    }
    return ObservableRegistry.instance;
  }

  /**
   * Registers an observable in the registry.
   *
   * @param name Unique name for the observable
   * @param observable$ The observable to register
   * @param options Additional metadata
   * @returns The registered observable (for chaining)
   *
   * @example
   * ```typescript
   * const filtered$ = registry.register(
   *   'active-celestials',
   *   celestialStore.activeObjects$,
   *   {
   *     category: ObservableCategory.STORE,
   *     description: 'Active celestial objects',
   *     dependencies: ['celestial-objects'],
   *     tags: ['filtered']
   *   }
   * );
   * ```
   */
  public register<T>(
    name: string,
    observable$: Observable<T>,
    options: {
      category: ObservableCategory;
      description: string;
      dependencies?: string[];
      tags?: string[];
    },
  ): Observable<T> {
    const id = this.generateId(name);

    if (this.observables.has(id)) {
      console.warn(
        `[ObservableRegistry] Observable "${id}" already registered. Skipping.`,
      );
      return observable$;
    }

    const metadata: ObservableMetadata<T> = {
      id,
      name,
      category: options.category,
      description: options.description,
      dependencies: options.dependencies,
      observable$,
      registeredAt: new Date(),
      tags: options.tags,
    };

    this.observables.set(id, metadata);
    this.stats.set(id, {
      subscriptionCount: 0,
      emissionCount: 0,
    });

    return observable$;
  }

  /**
   * Unregisters an observable from the registry.
   *
   * @param nameOrId Name or ID of the observable
   * @returns true if unregistered, false if not found
   */
  public unregister(nameOrId: string): boolean {
    const id = this.resolveId(nameOrId);
    if (!id) return false;

    this.observables.delete(id);
    this.stats.delete(id);
    return true;
  }

  /**
   * Gets metadata for a specific observable.
   *
   * @param nameOrId Name or ID of the observable
   * @returns Metadata if found, undefined otherwise
   */
  public get(nameOrId: string): ObservableMetadata | undefined {
    const id = this.resolveId(nameOrId);
    return id ? this.observables.get(id) : undefined;
  }

  /**
   * Gets all registered observables.
   *
   * @returns Map of all observable metadata
   */
  public getAll(): Map<string, ObservableMetadata> {
    return new Map(this.observables);
  }

  /**
   * Gets observables filtered by category.
   *
   * @param category The category to filter by
   * @returns Array of matching observables
   */
  public getByCategory(category: ObservableCategory): ObservableMetadata[] {
    return Array.from(this.observables.values()).filter(
      (meta) => meta.category === category,
    );
  }

  /**
   * Gets observables filtered by tags.
   *
   * @param tags Tags to search for (OR logic)
   * @returns Array of matching observables
   */
  public getByTags(...tags: string[]): ObservableMetadata[] {
    return Array.from(this.observables.values()).filter((meta) =>
      meta.tags?.some((tag) => tags.includes(tag)),
    );
  }

  /**
   * Gets statistics for a specific observable.
   *
   * @param nameOrId Name or ID of the observable
   * @returns Statistics if found, undefined otherwise
   */
  public getStats(nameOrId: string): ObservableStats | undefined {
    const id = this.resolveId(nameOrId);
    return id ? this.stats.get(id) : undefined;
  }

  /**
   * Builds a dependency graph of all registered observables.
   * Useful for visualizing stream connections and detecting issues.
   *
   * @returns Dependency graph
   */
  public getDependencyGraph(): DependencyGraph {
    const nodes = new Map<string, DependencyNode>();

    // Build nodes
    for (const [id, meta] of this.observables) {
      nodes.set(id, {
        id,
        name: meta.name,
        category: meta.category,
        dependencies: meta.dependencies || [],
        dependents: [],
      });
    }

    // Build reverse dependencies (dependents)
    for (const node of nodes.values()) {
      for (const depId of node.dependencies) {
        const depNode = nodes.get(depId);
        if (depNode) {
          depNode.dependents.push(node.id);
        }
      }
    }

    // Find roots and leaves
    const roots: string[] = [];
    const leaves: string[] = [];
    for (const [id, node] of nodes) {
      if (node.dependencies.length === 0) roots.push(id);
      if (node.dependents.length === 0) leaves.push(id);
    }

    // Detect cycles (simple DFS-based detection)
    const cycles = this.detectCycles(nodes);

    return { nodes, roots, leaves, cycles };
  }

  /**
   * Clears all registered observables.
   * Useful for testing or complete reset.
   */
  public clear(): void {
    this.observables.clear();
    this.stats.clear();
  }

  /**
   * Gets a summary of the registry state.
   *
   * @returns Summary statistics
   */
  public getSummary(): {
    totalObservables: number;
    byCategory: Record<ObservableCategory, number>;
    averageEmissions: number;
  } {
    const byCategory: Record<ObservableCategory, number> = {
      [ObservableCategory.STORE]: 0,
      [ObservableCategory.BRIDGE]: 0,
      [ObservableCategory.PIPELINE]: 0,
      [ObservableCategory.COMPONENT]: 0,
      [ObservableCategory.UTILITY]: 0,
    };

    let totalEmissions = 0;

    for (const meta of this.observables.values()) {
      byCategory[meta.category]++;
      const stats = this.stats.get(meta.id);
      if (stats) totalEmissions += stats.emissionCount;
    }

    return {
      totalObservables: this.observables.size,
      byCategory,
      averageEmissions:
        this.observables.size > 0 ? totalEmissions / this.observables.size : 0,
    };
  }

  // =============================================================================
  // PRIVATE HELPERS
  // =============================================================================

  private generateId(name: string): string {
    return name.toLowerCase().replace(/\s+/g, "-");
  }

  private resolveId(nameOrId: string): string | undefined {
    const id = this.generateId(nameOrId);
    return this.observables.has(id) ? id : undefined;
  }

  private detectCycles(nodes: Map<string, DependencyNode>): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (nodeId: string, path: string[]): void => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      const node = nodes.get(nodeId);
      if (node) {
        for (const depId of node.dependencies) {
          if (!visited.has(depId)) {
            dfs(depId, [...path]);
          } else if (recursionStack.has(depId)) {
            // Cycle detected
            const cycleStart = path.indexOf(depId);
            if (cycleStart !== -1) {
              cycles.push([...path.slice(cycleStart), depId]);
            }
          }
        }
      }

      recursionStack.delete(nodeId);
    };

    for (const nodeId of nodes.keys()) {
      if (!visited.has(nodeId)) {
        dfs(nodeId, []);
      }
    }

    return cycles;
  }
}

/**
 * Singleton instance of the observable registry.
 * Use this for easy access throughout the application.
 */
export const observableRegistry = ObservableRegistry.getInstance();
