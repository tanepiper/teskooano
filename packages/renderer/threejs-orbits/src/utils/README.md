# Architecture: Orbit Rendering Utilities (`/utils`)

This directory contains low-level, performance-oriented utility classes that are used by the various orbit and trajectory managers. The utilities are divided into two main categories: those designed to run inside Web Workers for heavy computation, and those that run on the main thread to manage `three.js` objects efficiently.

---

## Main-Thread Utilities

These utilities manage `three.js` objects or bridge the gap between the workers and the main thread.

### `LineBuilder.ts` & `BufferPool.ts`

**Purpose**: To create and manage `THREE.Line` objects with maximum memory efficiency.

**Core Design**: Repeatedly creating and discarding `THREE.BufferGeometry` and its `BufferAttributes` is a major source of garbage collection pressure. These two classes solve this:

- `BufferPool`: Maintains a cache of `THREE.BufferAttribute` objects. Instead of being destroyed, used buffers are returned to the pool and recycled, avoiding new memory allocations.
- `LineBuilder`: A factory for `THREE.Line` objects that uses the `BufferPool` to acquire and release the underlying position attributes. It provides a clean API for creating and managing lines without the consumer needing to worry about memory management.

### `arrayUtils.ts`

**Purpose**: To provide an efficient bridge between the physics engine's data types and the renderer's data types.

**Core Design**: The `updateThreeVector3Array` function bridges the gap between the renderer-agnostic physics engine and `three.js`.

- **Input**: It takes an array of `OSVector3[]` (the output from a worker).
- **Output**: It produces an array of `THREE.Vector3[]` (the required input for a rendering utility like `LineBuilder`).
- **Performance**: It updates an existing target array in place, reusing `THREE.Vector3` objects to reduce memory churn in the render loop.

---

## Worker-Side Utilities

These utilities are pure, data-in/data-out functions designed to be used inside Web Workers for computationally intensive tasks.

### `CircularBuffer.ts`

**Purpose**: A memory-efficient, fixed-size buffer that overwrites the oldest elements when full.

**Core Design**: Used inside the `trail.worker.ts` to manage long position histories without the performance cost of JavaScript's native `Array.shift()`.

### `simplify.ts`

**Purpose**: Implements the Ramer-Douglas-Peucker (RDP) algorithm.

**Core Design**: This function takes a long array of points and removes redundant ones while preserving the essential shape of the line. It's used in the `trail.worker.ts` to reduce the complexity of a trail before rendering.

### `spline.ts`

**Purpose**: Implements a Catmull-Rom spline algorithm.

**Core Design**: This function takes an array of points (typically the output from `simplifyPath`) and generates a smooth, curved path that passes through them. This is used in the `trail.worker.ts` to turn a jagged, simplified path into a visually appealing smooth curve.
