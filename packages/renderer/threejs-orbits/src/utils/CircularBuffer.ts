/**
 * A memory-efficient circular buffer implementation.
 *
 * This class provides a fixed-size buffer that overwrites the oldest elements
 * when its capacity is reached. This avoids expensive array reallocation or
 * `shift()` operations, making it ideal for managing position histories.
 */
export class CircularBuffer<T> {
  private buffer: (T | undefined)[];
  private head = 0;
  private _size = 0;
  public capacity: number;

  /**
   * Creates a new CircularBuffer instance.
   * @param capacity - The maximum number of elements the buffer can hold.
   */
  constructor(capacity: number) {
    this.capacity = capacity;
    this.buffer = new Array<T | undefined>(capacity);
  }

  /**
   * Pushes a new item into the buffer, overwriting the oldest item if full.
   * @param item - The item to add.
   */
  push(item: T): void {
    this.buffer[this.head] = item;
    this.head = (this.head + 1) % this.capacity;
    if (this._size < this.capacity) {
      this._size++;
    }
  }

  /**
   * Retrieves all items from the buffer in their correct, chronological order.
   * @returns A new array containing the ordered items.
   */
  getOrderedItems(): T[] {
    const ordered = new Array<T>(this._size);
    for (let i = 0; i < this._size; i++) {
      const index = (this.head - this._size + i + this.capacity) % this.capacity;
      ordered[i] = this.buffer[index] as T;
    }
    return ordered;
  }

  /**
   * Resizes the buffer, preserving the most recent items.
   * This can be an expensive operation and should be used sparingly.
   * @param newCapacity The new capacity of the buffer.
   */
  resize(newCapacity: number): void {
    if (newCapacity === this.capacity || newCapacity <= 0) {
      return;
    }

    const currentItems = this.getOrderedItems();
    const newBuffer = new Array<T | undefined>(newCapacity);
    const itemsToCopy = currentItems.slice(-newCapacity);

    for (let i = 0; i < itemsToCopy.length; i++) {
      newBuffer[i] = itemsToCopy[i];
    }

    this.buffer = newBuffer;
    this.capacity = newCapacity;
    this._size = itemsToCopy.length;
    this.head = itemsToCopy.length % newCapacity;
  }

  /**
   * The current number of items in the buffer.
   */
  get size(): number {
    return this._size;
  }
} 