import type { Observable } from "rxjs";
import type { FilterPredicate } from "../utils/StoreFilters";

/**
 * Base interface for all state stores in Teskooano.
 * Provides a consistent API for reactive and imperative access patterns.
 *
 * @template T The type of state managed by this store
 */
export interface BaseStore<T> {
  /**
   * Observable stream that emits the current state on every change.
   * This is the primary way to react to state changes.
   */
  readonly state$: Observable<T>;

  /**
   * Gets the current state synchronously.
   * Use this for one-off reads or when you need immediate access to state.
   *
   * @returns The current state
   */
  getState(): T;

  /**
   * Cleans up resources and completes all observables.
   * Call this when the store is no longer needed.
   */
  destroy(): void;
}

/**
 * Extended store interface for stores that manage collections of objects
 * and support filtering operations.
 *
 * @template TItem The type of individual items in the collection
 * @template TCollection The type of the collection (typically Record<string, TItem>)
 */
export interface FilterableStore<TItem, TCollection>
  extends BaseStore<TCollection> {
  /**
   * Creates a filtered observable stream based on one or more predicates.
   * The predicates are composed with AND logic (all must return true).
   *
   * @param predicates Array of predicate functions to filter items
   * @returns An observable that emits filtered collections
   *
   * @example
   * ```typescript
   * // Get only active, visible objects
   * const filtered$ = store.getFiltered$([isActive, isVisible]);
   * ```
   */
  getFiltered$(
    ...predicates: FilterPredicate<TItem>[]
  ): Observable<TCollection>;

  /**
   * Synchronously filters the current state based on predicates.
   *
   * @param predicates Array of predicate functions to filter items
   * @returns A filtered collection
   *
   * @example
   * ```typescript
   * // Get snapshot of active objects
   * const activeObjects = store.getFiltered(isActive);
   * ```
   */
  getFiltered(...predicates: FilterPredicate<TItem>[]): TCollection;
}

/**
 * Interface for stores that manage keyed collections (maps) of objects.
 * Provides additional methods for managing individual items by ID.
 *
 * @template TItem The type of individual items (must have an id property)
 */
export interface KeyedStore<TItem extends { id: string }>
  extends FilterableStore<TItem, Record<string, TItem>> {
  /**
   * Gets a single item by its ID.
   *
   * @param id The unique identifier of the item
   * @returns The item if found, undefined otherwise
   */
  getItem(id: string): TItem | undefined;

  /**
   * Sets or updates an item in the store.
   *
   * @param id The unique identifier of the item
   * @param item The item to store
   */
  setItem(id: string, item: TItem): void;

  /**
   * Removes an item from the store.
   *
   * @param id The unique identifier of the item to remove
   * @returns true if the item was removed, false if it didn't exist
   */
  removeItem(id: string): boolean;

  /**
   * Checks if an item exists in the store.
   *
   * @param id The unique identifier to check
   * @returns true if the item exists, false otherwise
   */
  hasItem(id: string): boolean;

  /**
   * Gets all item IDs currently in the store.
   *
   * @returns Array of all item IDs
   */
  getItemIds(): string[];

  /**
   * Gets the number of items in the store.
   *
   * @returns The count of items
   */
  getItemCount(): number;
}

/**
 * Metadata about a store for debugging and monitoring.
 */
export interface StoreMetadata {
  /** Unique identifier for the store */
  id: string;
  /** Human-readable name of the store */
  name: string;
  /** Category/type of store (e.g., 'celestial', 'physics', 'renderable') */
  category: string;
  /** Description of what the store manages */
  description: string;
  /** List of observable stream names exposed by this store */
  observables: string[];
  /** Creation timestamp */
  createdAt: Date;
}

/**
 * Interface for stores that support metadata and introspection.
 */
export interface InspectableStore {
  /**
   * Gets metadata about this store for debugging and monitoring.
   *
   * @returns Store metadata
   */
  getMetadata(): StoreMetadata;

  /**
   * Gets statistics about the current state of the store.
   *
   * @returns Key-value pairs of statistics
   */
  getStats(): Record<string, number | string>;
}
