import { BehaviorSubject, Observable } from "rxjs";

const LAST_SEED_STORAGE_KEY = "teskooano_last_seed";
const DEFAULT_SEED = "42";

/**
 * Manages the current seed used for system generation.
 *
 * This store handles the persistence and management of the seed value used for
 * procedural generation of celestial systems. It provides both reactive (Observable)
 * and imperative (getter/setter) access patterns for managing the seed.
 *
 * ## Architecture
 *
 * The store uses RxJS BehaviorSubjects to maintain state and provide reactive streams:
 * - `_currentSeed`: Stores the current seed value
 * - Handles persistence to localStorage with fallback to default seed
 *
 * ## Features
 *
 * - **Persistence**: Automatically saves and loads the seed from localStorage
 * - **Fallback**: Uses a default seed if localStorage is unavailable
 * - **Validation**: Trims whitespace and handles empty input gracefully
 * - **Error Handling**: Gracefully handles localStorage errors
 *
 * ## Usage Patterns
 *
 * ### Reactive Access (Recommended)
 * ```typescript
 * // Subscribe to seed changes
 * seedStore.currentSeed$.subscribe(seed => {
 *   console.log('Seed changed to:', seed);
 * });
 * ```
 *
 * ### Imperative Access
 * ```typescript
 * // Get current seed
 * const currentSeed = seedStore.getCurrentSeed();
 *
 * // Update seed
 * seedStore.updateSeed('my-new-seed');
 * ```
 *
 * ## Singleton Pattern
 *
 * This store follows a singleton pattern to ensure a single source of truth
 * across the entire application. Access the instance via `getInstance()` or
 * use the exported `seedStore` constant.
 *
 * @example
 * ```typescript
 * import { seedStore } from '@teskooano/core-state';
 *
 * // Update the seed
 * seedStore.updateSeed('galaxy-42');
 *
 * // React to changes
 * seedStore.currentSeed$.subscribe(seed => {
 *   console.log(`Current seed: ${seed}`);
 * });
 * ```
 */
export class SeedStore {
  private static instance: SeedStore;

  /** BehaviorSubject holding the current seed value */
  private readonly _currentSeed: BehaviorSubject<string>;

  /** Observable stream of the current seed that emits on every change */
  public readonly currentSeed$: Observable<string>;

  /**
   * Private constructor to enforce singleton pattern.
   * Initializes the seed from localStorage or uses the default seed.
   */
  private constructor() {
    this._currentSeed = new BehaviorSubject<string>(this.getInitialSeed());
    this.currentSeed$ = this._currentSeed.asObservable();
  }

  /**
   * Gets the singleton instance of the SeedStore.
   * Creates the instance if it doesn't exist.
   *
   * @returns The singleton SeedStore instance
   *
   * @example
   * ```typescript
   * const store = SeedStore.getInstance();
   * store.updateSeed('new-seed');
   * ```
   */
  public static getInstance(): SeedStore {
    if (!SeedStore.instance) {
      SeedStore.instance = new SeedStore();
    }
    return SeedStore.instance;
  }

  /**
   * Retrieves the initial seed value from localStorage or returns the default.
   *
   * This method handles localStorage access errors gracefully by falling back
   * to the default seed if localStorage is unavailable or throws an error.
   *
   * @returns The initial seed value to use
   *
   * @example
   * ```typescript
   * // This is called internally during initialization
   * const initialSeed = this.getInitialSeed();
   * ```
   */
  private getInitialSeed(): string {
    try {
      const storedSeed = localStorage.getItem(LAST_SEED_STORAGE_KEY);
      return storedSeed ?? DEFAULT_SEED;
    } catch (error) {
      console.error("Error accessing localStorage for seed:", error);
      return DEFAULT_SEED;
    }
  }

  /**
   * Gets the current seed value.
   *
   * This method returns the current seed value. For reactive updates,
   * prefer subscribing to `currentSeed$` instead.
   *
   * @returns The current seed value
   *
   * @example
   * ```typescript
   * const currentSeed = seedStore.getCurrentSeed();
   * console.log(`Current seed: ${currentSeed}`);
   * ```
   */
  public getCurrentSeed(): string {
    return this._currentSeed.getValue();
  }

  /**
   * Updates the current seed value.
   *
   * This method updates the seed value, persists it to localStorage,
   * and triggers emissions on the `currentSeed$` observable. It handles
   * various edge cases:
   * - Trims whitespace from the input
   * - Uses default seed if input is empty after trimming
   * - Handles localStorage errors gracefully
   * - Warns if empty input was provided
   *
   * @param newSeed The new seed value to set
   *
   * @example
   * ```typescript
   * // Set a new seed
   * seedStore.updateSeed('galaxy-42');
   *
   * // Set an empty seed (will use default)
   * seedStore.updateSeed('');
   *
   * // Set a seed with whitespace (will be trimmed)
   * seedStore.updateSeed('  my-seed  ');
   * ```
   */
  public updateSeed(newSeed: string): void {
    const trimmedSeed = newSeed.trim();
    const seedToSet = trimmedSeed || DEFAULT_SEED;

    try {
      localStorage.setItem(LAST_SEED_STORAGE_KEY, seedToSet);
      this._currentSeed.next(seedToSet);

      if (!trimmedSeed) {
        console.warn(
          `Seed input was empty, using default seed "${DEFAULT_SEED}".`,
        );
      }
    } catch (error) {
      console.error("Error updating seed in localStorage:", error);
      // Still update the BehaviorSubject even if localStorage fails
      this._currentSeed.next(seedToSet);
    }
  }
}

/**
 * Singleton instance of the SeedStore.
 *
 * This is the primary way to access the seed store throughout the application.
 * It provides both reactive and imperative access to the current seed value,
 * with automatic persistence to localStorage.
 *
 * @example
 * ```typescript
 * import { seedStore } from '@teskooano/core-state';
 *
 * // Reactive subscription to seed changes
 * seedStore.currentSeed$.subscribe(seed => {
 *   console.log('Seed changed to:', seed);
 * });
 *
 * // Imperative access
 * const currentSeed = seedStore.getCurrentSeed();
 * seedStore.updateSeed('new-seed-value');
 * ```
 */
export const seedStore = SeedStore.getInstance();
