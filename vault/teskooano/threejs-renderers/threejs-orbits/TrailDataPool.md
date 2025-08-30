---
name: "TrailDataPool"
description: "Pre-allocated ArrayBuffer management for efficient trail data storage with circular buffer approach"
package: "@teskooano/renderer-threejs-orbits"
dependencies: []
classes: ["ArrayBuffer", "Float32Array", "Map"]
functions:
  ["allocate", "free", "addPoint", "getPoints", "getRecentPoints", "clear"]
constants: ["totalSlots", "pointsPerSlot", "floatsPerPoint", "floatsPerSlot"]
types: []
---

# TrailDataPool

Pre-allocated ArrayBuffer management system for efficient trail data storage, providing fixed-size "slots" from a large single buffer with circular buffer approach for optimal memory usage.

## 🎯 Purpose

`TrailDataPool` manages a pre-allocated ArrayBuffer to store trail data for multiple objects efficiently. It avoids dynamic memory allocation by providing fixed-size "slots" from a large, single buffer and uses a circular buffer approach within each slot for optimal memory usage.

## 🏗️ Architecture

### Core Components

The pool manages a single large buffer with multiple slots:

```typescript
class TrailDataPool {
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
}
```

### Memory Layout

- **Single ArrayBuffer**: One large buffer for all trail data
- **Fixed-size Slots**: Each object gets a fixed number of points
- **Circular Buffers**: Each slot uses circular buffer approach
- **Float32Array View**: Efficient access to float data

## 🚀 Core Features

### Pre-allocated Buffer Management

Efficient memory allocation and management:

```typescript
constructor(totalSlots: number, pointsPerSlot: number) {
  this.totalSlots = totalSlots;
  this.pointsPerSlot = pointsPerSlot;
  this.floatsPerSlot = this.pointsPerSlot * this.floatsPerPoint;

  const bufferSize = this.totalSlots * this.floatsPerSlot * 4; // 4 bytes per float
  this.buffer = new ArrayBuffer(bufferSize);
  this.float32View = new Float32Array(this.buffer);
}
```

**Features:**

- **Single Allocation**: One large buffer allocation for all data
- **Fixed Slot Sizes**: Predictable memory usage
- **Efficient Access**: Direct float array access
- **Memory Optimization**: No dynamic allocations during runtime

### Slot Allocation System

Dynamic slot allocation and management:

```typescript
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
```

**Features:**

- **Free Slot Stack**: Efficient slot allocation from stack
- **Duplicate Prevention**: Prevents duplicate allocations
- **Pool Full Detection**: Handles pool exhaustion gracefully
- **Offset Management**: Tracks slot offsets in float indices

### Circular Buffer Implementation

Efficient circular buffer for each slot:

```typescript
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
```

**Features:**

- **Circular Wrapping**: Automatically wraps around when full
- **Head Tracking**: Tracks current write position
- **Count Management**: Tracks number of valid points
- **Efficient Writing**: Direct float array writes

## 🔧 Key Methods

### Constructor

```typescript
constructor(totalSlots: number, pointsPerSlot: number)
```

**Parameters:**

- `totalSlots`: Maximum number of objects that can be tracked
- `pointsPerSlot`: Maximum number of points to store per object trail

**Memory Calculation:**

- Buffer size: `totalSlots * pointsPerSlot * 3 * 4` bytes
- Example: 200 objects, 50k points each = ~120 MB total buffer

### Slot Management

```typescript
public allocate(objectId: string): boolean
public free(objectId: string): void
```

**Process:**

1. **Allocation**: Get free slot from stack, initialize slot metadata
2. **Free**: Return slot to free stack, clear slot metadata
3. **Validation**: Check for duplicates and pool capacity

### Point Operations

```typescript
public addPoint(objectId: string, x: number, y: number, z: number): void
public getPoints(objectId: string): [number, number, number][]
public getRecentPoints(objectId: string, maxPoints: number): [number, number, number][]
```

**Features:**

- **Point Addition**: Add new points with circular wrapping
- **Full History**: Get all points in chronological order
- **Recent Points**: Get only recent points for efficiency
- **Order Preservation**: Maintains chronological order even with wrapping

## 🔄 Data Flow

### Point Addition Flow

```typescript
// 1. Get slot for object
const slot = this.objectSlots.get(objectId);
if (!slot) return;

// 2. Calculate buffer index
const index = slot.offset + slot.head * this.floatsPerPoint;

// 3. Write point data
this.float32View[index] = x;
this.float32View[index + 1] = y;
this.float32View[index + 2] = z;

// 4. Update circular buffer state
slot.head = (slot.head + 1) % this.pointsPerSlot;
if (slot.count < this.pointsPerSlot) {
  slot.count++;
}
```

### Point Retrieval Flow

```typescript
// 1. Get slot for object
const slot = this.objectSlots.get(objectId);
if (!slot || slot.count === 0) return [];

// 2. Handle unwrapped buffer (simple case)
if (slot.count < this.pointsPerSlot) {
  // Read from start to count
  for (let i = 0; i < slot.count; i++) {
    const index = start + i * this.floatsPerPoint;
    points[i] = [
      this.float32View[index],
      this.float32View[index + 1],
      this.float32View[index + 2],
    ];
  }
} else {
  // Handle wrapped buffer (two-part read)
  // Part 1: from head to end
  // Part 2: from start to head
}
```

### Slot Management Flow

```typescript
// 1. Initialize free slots stack
for (let i = 0; i < this.totalSlots; i++) {
  this.freeSlots.push(i * this.floatsPerSlot);
}

// 2. Allocate slot
const offset = this.freeSlots.pop()!;
this.objectSlots.set(objectId, { offset, head: 0, count: 0 });

// 3. Free slot
this.freeSlots.push(slot.offset);
this.objectSlots.delete(objectId);
```

## 🎨 Memory Management Features

### Single Buffer Architecture

Efficient memory layout:

```typescript
// Memory layout example for 2 slots, 3 points each
// Buffer: [x1,y1,z1, x2,y2,z2, x3,y3,z3, x4,y4,z4, x5,y5,z5, x6,y6,z6]
// Slot 0: offset 0, points [x1,y1,z1], [x2,y2,z2], [x3,y3,z3]
// Slot 1: offset 9, points [x4,y4,z4], [x5,y5,z5], [x6,y6,z6]
```

**Benefits:**

- **Single Allocation**: One large allocation instead of many small ones
- **Cache Efficiency**: Contiguous memory access patterns
- **Memory Fragmentation**: Eliminates memory fragmentation
- **Garbage Collection**: Reduces pressure on garbage collector

### Circular Buffer Benefits

Efficient data management:

```typescript
// Circular buffer example with 3 points
// Initial: [P1, P2, P3] head=0, count=3
// Add P4:  [P4, P2, P3] head=1, count=3 (wrapped)
// Add P5:  [P4, P5, P3] head=2, count=3 (wrapped)
// Add P6:  [P4, P5, P6] head=0, count=3 (wrapped)
```

**Features:**

- **Automatic Wrapping**: No need to shift data
- **Fixed Memory Usage**: Constant memory footprint
- **Efficient Updates**: O(1) point addition
- **Order Preservation**: Maintains chronological order

## 📊 Performance Considerations

### Memory Efficiency

- **Single Allocation**: One large buffer allocation
- **No Dynamic Allocation**: Fixed memory usage during runtime
- **Efficient Access**: Direct float array access
- **Cache Friendly**: Contiguous memory layout

### Computational Efficiency

- **O(1) Point Addition**: Constant time point addition
- **Efficient Retrieval**: Optimized point retrieval algorithms
- **Minimal Overhead**: Low computational overhead
- **Batch Operations**: Support for batch point operations

### Memory Usage Optimization

- **Predictable Usage**: Fixed memory footprint
- **No Fragmentation**: Eliminates memory fragmentation
- **Garbage Collection**: Reduces GC pressure
- **Memory Pooling**: Efficient slot reuse

## 🔧 Integration Points

### Web Worker Integration

```typescript
// In trail.worker.ts
const trailDataPool = new TrailDataPool(200, 50000);

// Add points from worker
trailDataPool.addPoint(objectId, x, y, z);

// Get points for processing
const points = trailDataPool.getRecentPoints(objectId, maxPoints);
```

### Trail Renderer Integration

```typescript
// In NBodyTrailsRenderer
// Note: TrailDataPool is used in Web Worker context
// The renderer receives processed points from the worker
```

### Performance Monitoring Integration

```typescript
// Monitor pool usage
console.log("Total slots:", trailDataPool.totalSlots);
console.log("Points per slot:", trailDataPool.pointsPerSlot);
console.log("Free slots:", trailDataPool.freeSlots.length);
```

## 🎯 Usage Examples

### Basic Pool Usage

```typescript
import { TrailDataPool } from "@teskooano/renderer-threejs-orbits";

// Create pool for 200 objects, 50k points each
const pool = new TrailDataPool(200, 50000);

// Allocate slot for object
pool.allocate("earth");

// Add points
pool.addPoint("earth", 1.0, 2.0, 3.0);
pool.addPoint("earth", 1.1, 2.1, 3.1);

// Get all points
const points = pool.getPoints("earth");

// Get recent points
const recentPoints = pool.getRecentPoints("earth", 1000);
```

### Pool Management

```typescript
// Allocate multiple objects
pool.allocate("earth");
pool.allocate("mars");
pool.allocate("venus");

// Add points to different objects
pool.addPoint("earth", 1.0, 2.0, 3.0);
pool.addPoint("mars", 4.0, 5.0, 6.0);

// Free object when done
pool.free("venus");
```

### Batch Operations

```typescript
// Add multiple points in batch
for (let i = 0; i < 1000; i++) {
  pool.addPoint("earth", i, i * 2, i * 3);
}

// Get recent points for processing
const recentPoints = pool.getRecentPoints("earth", 500);
```

### Memory Monitoring

```typescript
// Monitor pool usage
console.log("Pool capacity:", pool.totalSlots);
console.log("Points per slot:", pool.pointsPerSlot);
console.log(
  "Total memory (MB):",
  (pool.totalSlots * pool.pointsPerSlot * 3 * 4) / (1024 * 1024),
);
```

## 🔍 Debug Features

### Pool Statistics

```typescript
// Get pool statistics
console.log("Total slots:", pool.totalSlots);
console.log("Points per slot:", pool.pointsPerSlot);
console.log("Free slots:", pool.freeSlots.length);
console.log("Allocated slots:", pool.objectSlots.size);
```

### Memory Usage Analysis

```typescript
// Analyze memory usage
const totalMemory = pool.totalSlots * pool.pointsPerSlot * 3 * 4; // bytes
const usedMemory = pool.objectSlots.size * pool.pointsPerSlot * 3 * 4; // bytes
const utilization = (usedMemory / totalMemory) * 100;

console.log(`Memory utilization: ${utilization.toFixed(1)}%`);
```

### Slot Inspection

```typescript
// Inspect specific slot
const slot = pool.objectSlots.get("earth");
if (slot) {
  console.log("Slot offset:", slot.offset);
  console.log("Slot head:", slot.head);
  console.log("Slot count:", slot.count);
}
```

## 🚀 Future Enhancements

### Planned Features

- **Dynamic Pool Resizing**: Runtime pool size adjustment
- **Compression Support**: Data compression for large trails
- **Persistent Storage**: Save/load trail data to/from disk

### Optimization Opportunities

- **GPU Memory**: Move pool to GPU memory for large datasets
- **Compression Algorithms**: Implement trail data compression
- **Predictive Allocation**: Pre-allocate based on usage patterns

### Advanced Features

- **Multi-resolution Trails**: Different detail levels for different distances
- **Trail Analytics**: Built-in trail analysis and statistics
- **Export/Import**: Trail data export and import functionality
