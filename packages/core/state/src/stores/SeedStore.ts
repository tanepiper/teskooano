import { BehaviorSubject, Observable } from "rxjs";

const LAST_SEED_STORAGE_KEY = "teskooano_last_seed";
const DEFAULT_SEED = "42";

/**
 * Manages the current seed used for system generation.
 * Handles persistence to localStorage.
 */
export class SeedStore {
  private static instance: SeedStore;

  private readonly _currentSeed: BehaviorSubject<string>;
  public readonly currentSeed$: Observable<string>;

  private constructor() {
    this._currentSeed = new BehaviorSubject<string>(this.getInitialSeed());
    this.currentSeed$ = this._currentSeed.asObservable();
  }

  public static getInstance(): SeedStore {
    if (!SeedStore.instance) {
      SeedStore.instance = new SeedStore();
    }
    return SeedStore.instance;
  }

  private getInitialSeed(): string {
    try {
      const storedSeed = localStorage.getItem(LAST_SEED_STORAGE_KEY);
      return storedSeed ?? DEFAULT_SEED;
    } catch (error) {
      console.error("Error accessing localStorage for seed:", error);
      return DEFAULT_SEED;
    }
  }

  public getCurrentSeed(): string {
    return this._currentSeed.getValue();
  }

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

export const seedStore = SeedStore.getInstance();
