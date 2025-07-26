/**
 * @fileoverview Reactive State Management System
 *
 * This module provides a reactive state management system inspired by Vue.js reactivity
 * but designed specifically for the Teskooano plugin system. It handles:
 * - Automatic dependency tracking
 * - Computed properties with caching
 * - Change notifications
 * - Efficient updates
 *
 * @example
 * ```typescript
 * const state = new ReactiveState({
 *   selectedObject: null,
 *   filter: 'all'
 * });
 *
 * // Add computed property
 * state.computed('filteredObjects', {
 *   deps: ['objects', 'filter'],
 *   compute: (objects, filter) => objects.filter(obj => filter === 'all' || obj.type === filter)
 * });
 *
 * // Watch for changes
 * state.watch('selectedObject', (newValue, oldValue) => {
 *   console.log(`Selection changed from ${oldValue} to ${newValue}`);
 * });
 * ```
 */

import { Subscription } from "rxjs";

/**
 * Configuration for computed properties
 */
export interface ComputedDefinition {
  /** Array of state property names this computed depends on */
  deps: string[];
  /** Function to compute the value given the dependencies */
  compute: (...deps: any[]) => any;
}

/**
 * Internal representation of a computed property
 */
interface ComputedProperty extends ComputedDefinition {
  /** Cached computed value */
  cache: any;
  /** Whether the cache is dirty and needs recomputation */
  dirty: boolean;
  /** Set of properties that depend on this computed (for invalidation chains) */
  dependents: Set<string>;
}

/**
 * Function signature for state change watchers
 */
export type StateWatcher = (
  newValue: any,
  oldValue: any,
  property: string,
) => void;

/**
 * Reactive state management system with automatic dependency tracking
 * and computed properties.
 */
export class ReactiveState {
  private _data: Record<string, any> = {};
  private _watchers: Map<string, Set<StateWatcher>> = new Map();
  private _computed: Map<string, ComputedProperty> = new Map();
  private _isUpdating = false;
  private _updateQueue: Set<string> = new Set();

  /**
   * Creates a new reactive state instance
   * @param initialData Initial state data
   */
  constructor(initialData: Record<string, any> = {}) {
    this._data = new Proxy(initialData, {
      set: (target, prop, value) => {
        const propName = prop as string;
        const oldValue = target[propName];

        // Don't trigger updates if value hasn't changed
        if (oldValue === value) return true;

        target[propName] = value;
        this.scheduleUpdate(propName, value, oldValue);
        return true;
      },

      get: (target, prop) => {
        const propName = prop as string;

        // Return computed value if it's a computed property
        if (this._computed.has(propName)) {
          return this.getComputed(propName);
        }

        return target[propName];
      },
    });
  }

  /**
   * Get the raw data object (for debugging or direct access)
   */
  get data(): Record<string, any> {
    return this._data;
  }

  /**
   * Get a specific property value
   * @param property Property name
   */
  get(property: string): any {
    return this._data[property];
  }

  /**
   * Set a property value
   * @param property Property name
   * @param value New value
   */
  set(property: string, value: any): void {
    this._data[property] = value;
  }

  /**
   * Update multiple properties at once
   * @param updates Object with property updates
   */
  update(updates: Record<string, any>): void {
    Object.entries(updates).forEach(([key, value]) => {
      this._data[key] = value;
    });
  }

  /**
   * Watch for changes to a specific property
   * @param property Property name to watch
   * @param callback Function to call when property changes
   * @returns Unsubscribe function
   */
  watch(property: string, callback: StateWatcher): () => void {
    if (!this._watchers.has(property)) {
      this._watchers.set(property, new Set());
    }
    this._watchers.get(property)!.add(callback);

    // Return unsubscribe function
    return () => {
      this._watchers.get(property)?.delete(callback);
      if (this._watchers.get(property)?.size === 0) {
        this._watchers.delete(property);
      }
    };
  }

  /**
   * Define a computed property
   * @param property Name of the computed property
   * @param definition Computed property configuration
   */
  computed(property: string, definition: ComputedDefinition): void {
    const computedProp: ComputedProperty = {
      deps: definition.deps,
      compute: definition.compute,
      cache: null,
      dirty: true,
      dependents: new Set(),
    };

    this._computed.set(property, computedProp);

    // Set up dependency tracking
    definition.deps.forEach((dep) => {
      // Watch direct dependencies
      this.watch(dep, () => {
        this.invalidateComputed(property);
      });

      // Handle computed dependencies
      if (this._computed.has(dep)) {
        this._computed.get(dep)!.dependents.add(property);
      }
    });
  }

  /**
   * Remove a computed property
   * @param property Name of the computed property to remove
   */
  removeComputed(property: string): void {
    const computed = this._computed.get(property);
    if (!computed) return;

    // Remove from dependents of dependencies
    computed.deps.forEach((dep) => {
      if (this._computed.has(dep)) {
        this._computed.get(dep)!.dependents.delete(property);
      }
    });

    this._computed.delete(property);
  }

  /**
   * Get the current value of a computed property
   * @param property Name of the computed property
   */
  private getComputed(property: string): any {
    const computed = this._computed.get(property);
    if (!computed) {
      throw new Error(`Computed property '${property}' not found`);
    }

    if (computed.dirty || computed.cache === null) {
      try {
        const deps = computed.deps.map((dep) => this._data[dep]);
        computed.cache = computed.compute(...deps);
        computed.dirty = false;
      } catch (error) {
        console.error(`Error computing property '${property}':`, error);
        computed.cache = null;
      }
    }

    return computed.cache;
  }

  /**
   * Mark a computed property as dirty and schedule updates
   * @param property Name of the computed property to invalidate
   */
  private invalidateComputed(property: string): void {
    const computed = this._computed.get(property);
    if (!computed || computed.dirty) return;

    computed.dirty = true;

    // Schedule update for this computed property
    this.scheduleUpdate(property, undefined, undefined);

    // Recursively invalidate dependent computed properties
    computed.dependents.forEach((dependent) => {
      this.invalidateComputed(dependent);
    });
  }

  /**
   * Schedule a property update to be processed in the next microtask
   * @param property Property name that changed
   * @param newValue New value
   * @param oldValue Previous value
   */
  private scheduleUpdate(property: string, newValue: any, oldValue: any): void {
    this._updateQueue.add(property);

    if (!this._isUpdating) {
      this._isUpdating = true;

      // Use microtask to batch updates
      Promise.resolve().then(() => {
        this.flushUpdates();
      });
    }
  }

  /**
   * Process all queued updates
   */
  private flushUpdates(): void {
    const updates = Array.from(this._updateQueue);
    this._updateQueue.clear();
    this._isUpdating = false;

    updates.forEach((property) => {
      this.notifyWatchers(property);
    });
  }

  /**
   * Notify all watchers of a property change
   * @param property Property name that changed
   */
  private notifyWatchers(property: string): void {
    const watchers = this._watchers.get(property);
    if (!watchers) return;

    const newValue = this._data[property];

    watchers.forEach((callback) => {
      try {
        callback(newValue, undefined, property);
      } catch (error) {
        console.error(`Error in watcher for property '${property}':`, error);
      }
    });
  }

  /**
   * Get all currently defined computed properties
   */
  getComputedProperties(): string[] {
    return Array.from(this._computed.keys());
  }

  /**
   * Get all properties being watched
   */
  getWatchedProperties(): string[] {
    return Array.from(this._watchers.keys());
  }

  /**
   * Clean up all watchers and computed properties
   */
  dispose(): void {
    this._watchers.clear();
    this._computed.clear();
    this._updateQueue.clear();
    this._isUpdating = false;
  }

  /**
   * Create a snapshot of the current state for debugging
   */
  snapshot(): { data: any; computed: Record<string, any> } {
    const computedValues: Record<string, any> = {};

    this._computed.forEach((_, key) => {
      try {
        computedValues[key] = this.getComputed(key);
      } catch (error) {
        computedValues[key] =
          `<Error: ${(error as Error).message || "Unknown error"}>`;
      }
    });

    return {
      data: { ...this._data },
      computed: computedValues,
    };
  }
}

/**
 * Utility function to create a reactive state with type safety
 */
export function createReactiveState<T extends Record<string, any>>(
  initialData: T,
): ReactiveState & { data: T } {
  return new ReactiveState(initialData) as ReactiveState & { data: T };
}

/**
 * Hook for integrating reactive state with RxJS observables
 * @param state Reactive state instance
 * @param property Property to sync with observable
 * @param observable RxJS observable to subscribe to
 */
export function connectObservable(
  state: ReactiveState,
  property: string,
  observable: any, // Observable type from rxjs
): Subscription {
  return observable.subscribe((value: any) => {
    state.set(property, value);
  });
}
