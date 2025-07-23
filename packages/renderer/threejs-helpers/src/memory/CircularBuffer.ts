/**
 * A memory-efficient circular buffer implementation.
 *
 * This class provides a fixed-size buffer that overwrites the oldest elements
 * when its capacity is reached. This avoids expensive array reallocation or
 * `shift()` operations, making it ideal for managing position histories.
 *
 * Features:
 * - O(1) push and pop operations
 * - Iterator support for easy iteration
 * - Batch operations for better performance
 * - Statistics tracking
 * - Type-safe operations
 */
export class CircularBuffer<T> {
  private buffer: (T | undefined)[];
  private head = 0;
  private _size = 0;
  public readonly capacity: number;

  /** Statistics tracking */
  private stats = {
    totalPushes: 0,
    totalOverwrites: 0,
    totalGets: 0,
  };

  /**
   * Creates a new CircularBuffer instance.
   * @param capacity - The maximum number of elements the buffer can hold.
   * @throws Error if capacity is invalid
   */
  constructor(capacity: number) {
    if (capacity <= 0 || !Number.isInteger(capacity)) {
      throw new Error(
        `Invalid capacity: ${capacity}. Capacity must be a positive integer.`,
      );
    }

    this.capacity = capacity;
    this.buffer = new Array<T | undefined>(capacity);
  }

  /**
   * Pushes a new item into the buffer, overwriting the oldest item if full.
   * @param item - The item to add.
   * @returns true if an item was overwritten, false otherwise
   */
  push(item: T): boolean {
    const wasOverwritten = this._size === this.capacity;

    this.buffer[this.head] = item;
    this.head = (this.head + 1) % this.capacity;

    if (this._size < this.capacity) {
      this._size++;
    }

    this.stats.totalPushes++;
    if (wasOverwritten) {
      this.stats.totalOverwrites++;
    }

    return wasOverwritten;
  }

  /**
   * Pushes multiple items into the buffer efficiently.
   * @param items - Array of items to add
   * @returns Number of items that were overwritten
   */
  pushMany(items: T[]): number {
    let overwrites = 0;

    for (const item of items) {
      if (this.push(item)) {
        overwrites++;
      }
    }

    return overwrites;
  }

  /**
   * Retrieves all items from the buffer in their correct, chronological order.
   * @returns A new array containing the ordered items.
   */
  getOrderedItems(): T[] {
    this.stats.totalGets++;

    const ordered = new Array<T>(this._size);
    for (let i = 0; i < this._size; i++) {
      const index =
        (this.head - this._size + i + this.capacity) % this.capacity;
      ordered[i] = this.buffer[index] as T;
    }
    return ordered;
  }

  /**
   * Gets the most recent item without removing it.
   * @returns The most recent item, or undefined if buffer is empty
   */
  peek(): T | undefined {
    if (this._size === 0) return undefined;

    const index = (this.head - 1 + this.capacity) % this.capacity;
    return this.buffer[index];
  }

  /**
   * Gets the oldest item without removing it.
   * @returns The oldest item, or undefined if buffer is empty
   */
  peekOldest(): T | undefined {
    if (this._size === 0) return undefined;

    const index = (this.head - this._size + this.capacity) % this.capacity;
    return this.buffer[index];
  }

  /**
   * Gets an item at a specific index (0 = oldest, size-1 = newest).
   * @param index - The index of the item to retrieve
   * @returns The item at the specified index, or undefined if index is out of bounds
   */
  getAt(index: number): T | undefined {
    if (index < 0 || index >= this._size) {
      return undefined;
    }

    const bufferIndex =
      (this.head - this._size + index + this.capacity) % this.capacity;
    return this.buffer[bufferIndex];
  }

  /**
   * Gets the last N items from the buffer.
   * @param count - Number of items to retrieve
   * @returns Array of the last N items (newest first)
   */
  getLast(count: number): T[] {
    if (count <= 0) return [];
    if (count > this._size) count = this._size;

    const result = new Array<T>(count);
    for (let i = 0; i < count; i++) {
      const index = (this.head - 1 - i + this.capacity) % this.capacity;
      result[i] = this.buffer[index] as T;
    }

    return result;
  }

  /**
   * Resizes the buffer, preserving the most recent items.
   * This can be an expensive operation and should be used sparingly.
   * @param newCapacity The new capacity of the buffer.
   * @throws Error if newCapacity is invalid
   */
  resize(newCapacity: number): void {
    if (newCapacity <= 0 || !Number.isInteger(newCapacity)) {
      throw new Error(
        `Invalid new capacity: ${newCapacity}. Capacity must be a positive integer.`,
      );
    }

    if (newCapacity === this.capacity) {
      return;
    }

    const currentItems = this.getOrderedItems();
    const newBuffer = new Array<T | undefined>(newCapacity);
    const itemsToCopy = currentItems.slice(-newCapacity);

    for (let i = 0; i < itemsToCopy.length; i++) {
      newBuffer[i] = itemsToCopy[i];
    }

    this.buffer = newBuffer;
    this._size = itemsToCopy.length;
    this.head = itemsToCopy.length % newCapacity;
  }

  /**
   * Takes (removes and returns) a specified number of items from the start of the buffer.
   * @param count - The number of items to take.
   * @returns An array containing the removed items.
   */
  take(count: number): T[] {
    if (count <= 0) return [];
    if (count > this._size) count = this._size;

    const takenItems = new Array<T>(count);
    for (let i = 0; i < count; i++) {
      const index = (this.head - this._size + this.capacity) % this.capacity;
      takenItems[i] = this.buffer[index] as T;
      this.buffer[index] = undefined;
      this._size--;
    }
    return takenItems;
  }

  /**
   * Removes and returns the most recent item.
   * @returns The most recent item, or undefined if buffer is empty
   */
  pop(): T | undefined {
    if (this._size === 0) return undefined;

    this._size--;
    this.head = (this.head - 1 + this.capacity) % this.capacity;
    const item = this.buffer[this.head];
    this.buffer[this.head] = undefined;

    return item;
  }

  /**
   * Clears the buffer.
   */
  clear(): void {
    this.buffer = new Array<T | undefined>(this.capacity);
    this._size = 0;
    this.head = 0;
  }

  /**
   * Checks if the buffer is empty.
   */
  get isEmpty(): boolean {
    return this._size === 0;
  }

  /**
   * Checks if the buffer is full.
   */
  get isFull(): boolean {
    return this._size === this.capacity;
  }

  /**
   * The current number of items in the buffer.
   */
  get size(): number {
    return this._size;
  }

  /**
   * Gets the fill percentage of the buffer (0-1).
   */
  get fillPercentage(): number {
    return this._size / this.capacity;
  }

  /**
   * Gets statistics about buffer usage.
   */
  getStatistics(): typeof this.stats {
    return { ...this.stats };
  }

  /**
   * Resets all statistics counters.
   */
  resetStats(): void {
    this.stats = {
      totalPushes: 0,
      totalOverwrites: 0,
      totalGets: 0,
    };
  }

  /**
   * Creates an iterator for the buffer (oldest to newest).
   */
  [Symbol.iterator](): Iterator<T> {
    let index = 0;
    const items = this.getOrderedItems();

    return {
      next(): IteratorResult<T> {
        if (index < items.length) {
          return { value: items[index++], done: false };
        }
        return { value: undefined, done: true };
      },
    };
  }

  /**
   * Creates a reverse iterator for the buffer (newest to oldest).
   */
  *reverseIterator(): Generator<T> {
    for (let i = this._size - 1; i >= 0; i--) {
      const index =
        (this.head - this._size + i + this.capacity) % this.capacity;
      yield this.buffer[index] as T;
    }
  }

  /**
   * Finds the first item that matches the predicate.
   * @param predicate - Function to test each item
   * @returns The first matching item, or undefined if none found
   */
  find(predicate: (item: T) => boolean): T | undefined {
    for (const item of this) {
      if (predicate(item)) {
        return item;
      }
    }
    return undefined;
  }

  /**
   * Filters items that match the predicate.
   * @param predicate - Function to test each item
   * @returns Array of items that match the predicate
   */
  filter(predicate: (item: T) => boolean): T[] {
    const result: T[] = [];
    for (const item of this) {
      if (predicate(item)) {
        result.push(item);
      }
    }
    return result;
  }

  /**
   * Maps each item using the provided function.
   * @param mapper - Function to transform each item
   * @returns Array of transformed items
   */
  map<U>(mapper: (item: T) => U): U[] {
    const result: U[] = [];
    for (const item of this) {
      result.push(mapper(item));
    }
    return result;
  }
}
