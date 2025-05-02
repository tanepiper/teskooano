/**
 * Abstract base class for Web Storage wrappers.
 * Provides common methods for getting, setting, and removing items,
 * automatically handling JSON serialization and parsing.
 */
abstract class BaseStorageWrapper {
  protected storage: Storage;

  constructor(storage: Storage) {
    this.storage = storage;
  }

  /**
   * Retrieves an item from storage and parses it as JSON.
   * @param key The key of the item to retrieve.
   * @returns The parsed item, or null if the item doesn't exist or is invalid JSON.
   */
  getItem<T>(key: string): T | null {
    try {
      const item = this.storage.getItem(key);
      return item ? (JSON.parse(item) as T) : null;
    } catch (error) {
      console.error(`Error getting item "${key}" from storage:`, error);
      return null;
    }
  }

  /**
   * Stores an item in storage after serializing it to JSON.
   * @param key The key to store the item under.
   * @param value The value to store (will be JSON.stringified).
   */
  setItem<T>(key: string, value: T): void {
    try {
      const item = JSON.stringify(value);
      this.storage.setItem(key, item);
    } catch (error) {
      console.error(`Error setting item "${key}" in storage:`, error);
    }
  }

  /**
   * Removes an item from storage.
   * @param key The key of the item to remove.
   */
  removeItem(key: string): void {
    try {
      this.storage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item "${key}" from storage:`, error);
    }
  }

  /**
   * Clears all items from storage.
   */
  clear(): void {
    try {
      this.storage.clear();
    } catch (error) {
      console.error("Error clearing storage:", error);
    }
  }
}

/**
 * Wrapper for window.localStorage with automatic JSON handling.
 */
class LocalStorageWrapper extends BaseStorageWrapper {
  constructor() {
    if (typeof window === "undefined" || !window.localStorage) {
      throw new Error("localStorage is not available in this environment.");
    }
    super(window.localStorage);
  }
}

/**
 * Wrapper for window.sessionStorage with automatic JSON handling.
 */
class SessionStorageWrapper extends BaseStorageWrapper {
  constructor() {
    if (typeof window === "undefined" || !window.sessionStorage) {
      throw new Error("sessionStorage is not available in this environment.");
    }
    super(window.sessionStorage);
  }
}

export const safeLocalStorage = new LocalStorageWrapper();
export const safeSessionStorage = new SessionStorageWrapper();
