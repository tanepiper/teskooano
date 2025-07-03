/**
 * Manages a pre-allocated ArrayBuffer to store trail data for multiple objects efficiently.
 *
 * This class avoids dynamic memory allocation by providing fixed-size "slots" from a large,
 * single buffer. It uses a circular buffer approach within each slot.
 */
export class TrailDataPool {
  private buffer: ArrayBuffer; // The main buffer holding all vertex data (x, y, z floats)
  private float32View: Float32Array; // A view for easy float access
  private objectSlots: Map<
    string,
    { offset: number; head: number; count: number }
  > = new Map();
  private freeSlots: number[] = []; // A stack of starting offsets for available slots

  public readonly totalSlots: number;
  public readonly pointsPerSlot: number;
  private readonly floatsPerPoint = 3;
  private readonly floatsPerSlot: number;

  /**
   * Creates a new TrailDataPool.
   * @param totalSlots - The maximum number of objects that can be tracked.
   * @param pointsPerSlot - The maximum number of points to store per object trail.
   */
  constructor(totalSlots: number, pointsPerSlot: number) {
    this.totalSlots = totalSlots;
    this.pointsPerSlot = pointsPerSlot;
    this.floatsPerSlot = this.pointsPerSlot * this.floatsPerPoint;

    const bufferSize = this.totalSlots * this.floatsPerSlot * 4; // 4 bytes per float
    this.buffer = new ArrayBuffer(bufferSize);
    this.float32View = new Float32Array(this.buffer);

    // Initialize the free slots stack
    for (let i = 0; i < this.totalSlots; i++) {
      // The offset is in terms of float indices, not bytes
      this.freeSlots.push(i * this.floatsPerSlot);
    }
  }

  /**
   * Allocates a new slot for an object.
   * @param objectId - The ID of the object to allocate a slot for.
   * @returns True if allocation was successful, false if the pool is full.
   */
  public allocate(objectId: string): boolean {
    if (this.freeSlots.length === 0) {
      console.warn("[TrailDataPool] Pool is full. Cannot allocate new slot.");
      return false;
    }
    if (this.objectSlots.has(objectId)) {
      return true; // Already allocated
    }

    const offset = this.freeSlots.pop()!;
    this.objectSlots.set(objectId, { offset, head: 0, count: 0 });
    return true;
  }

  /**
   * Frees the slot associated with an object.
   * @param objectId - The ID of the object to free.
   */
  public free(objectId: string): void {
    const slot = this.objectSlots.get(objectId);
    if (slot) {
      this.freeSlots.push(slot.offset);
      this.objectSlots.delete(objectId);
    }
  }

  /**
   * Adds a new point to an object's trail.
   * @param objectId - The ID of the object.
   * @param x - The x coordinate.
   * @param y - The y coordinate.
   * @param z - The z coordinate.
   */
  public addPoint(objectId: string, x: number, y: number, z: number): void {
    const slot = this.objectSlots.get(objectId);
    if (!slot) return;

    const index = slot.offset + slot.head * this.floatsPerPoint;
    this.float32View[index] = x;
    this.float32View[index + 1] = y;
    this.float32View[index + 2] = z;

    slot.head = (slot.head + 1) % this.pointsPerSlot;
    if (slot.count < this.pointsPerSlot) {
      slot.count++;
    }
  }

  /**
   * Retrieves all points for a given object's trail in chronological order.
   * @param objectId - The ID of the object.
   * @returns An array of points, each as a [x, y, z] tuple.
   */
  public getPoints(objectId: string): [number, number, number][] {
    const slot = this.objectSlots.get(objectId);
    if (!slot || slot.count === 0) return [];

    const points: [number, number, number][] = new Array(slot.count);
    const start = slot.offset;

    if (slot.count < this.pointsPerSlot) {
      // Buffer hasn't wrapped yet, just read from the start
      for (let i = 0; i < slot.count; i++) {
        const index = start + i * this.floatsPerPoint;
        points[i] = [
          this.float32View[index],
          this.float32View[index + 1],
          this.float32View[index + 2],
        ];
      }
    } else {
      // Buffer has wrapped, so we read it in two parts to maintain order.
      // Part 1: from the current head (oldest data) to the end of the slot's buffer
      const part1Length = this.pointsPerSlot - slot.head;
      for (let i = 0; i < part1Length; i++) {
        const index = start + (slot.head + i) * this.floatsPerPoint;
        points[i] = [
          this.float32View[index],
          this.float32View[index + 1],
          this.float32View[index + 2],
        ];
      }

      // Part 2: from the beginning of the slot's buffer up to the head
      const part2Length = slot.head;
      for (let i = 0; i < part2Length; i++) {
        const index = start + i * this.floatsPerPoint;
        points[part1Length + i] = [
          this.float32View[index],
          this.float32View[index + 1],
          this.float32View[index + 2],
        ];
      }
    }
    return points;
  }

  /**
   * Clears all data and resets the pool.
   */
  public clear(): void {
    this.float32View.fill(0);
    this.objectSlots.clear();
    this.freeSlots = [];
    for (let i = 0; i < this.totalSlots; i++) {
      this.freeSlots.push(i * this.floatsPerSlot);
    }
  }
}
