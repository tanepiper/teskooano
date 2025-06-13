# Architecture: Orbit Rendering Utilities (`/utils`)

This directory contains low-level, performance-oriented utility classes that are used by the various orbit and trajectory managers.

## `LineBuilder.ts` & `BufferPool.ts`

**Purpose**: To create and manage `THREE.Line` objects with maximum memory efficiency.

### Core Design & Rationale

1.  **The Problem**: Repeatedly creating and discarding `THREE.BufferGeometry` and its associated `BufferAttributes` (which hold vertex data) is a major source of garbage collection pressure in a real-time `three.js` application. This can lead to performance stutters and frame drops.
2.  **The Solution**: These two classes work together to solve this problem.
    -   `BufferPool`: This is a low-level manager that maintains a cache of `THREE.BufferAttribute` objects. Instead of being destroyed, used buffers are returned to the pool. When a new buffer is needed, the pool provides a recycled one of the correct size if available, avoiding a new memory allocation.
    -   `LineBuilder`: This class acts as a factory for `THREE.Line` objects. It uses the `BufferPool` to acquire and release the underlying position attributes for its line geometries. It provides a clean API for creating, updating, and resizing lines without the consumer needing to worry about the underlying memory management.
3.  **Usage**: The various managers (`KeplerianManager`, `TrailManager`) use the `LineBuilder` to handle all their `three.js` geometry needs, ensuring that the entire orbit rendering system is memory-efficient.

## `arrayUtils.ts`

**Purpose**: To provide utility functions for array manipulations, specifically for converting between math types.

### Core Design & Rationale

1.  **Physics/Renderer Bridge**: This utility is a key component of the project's core architectural pattern. It contains the `updateThreeVector3Array` function.
2.  **Data Flow**: The function's role is to bridge the gap between the renderer-agnostic physics engine and the `three.js` rendering layer.
    -   **Input**: It takes an array of `OSVector3[]` (the output from a physics calculation).
    -   **Output**: It produces an array of `THREE.Vector3[]` (the required input for a rendering utility like `LineBuilder`).
3.  **Performance**: It is designed to be efficient. Instead of creating a new `THREE.Vector3[]` on every call, it updates an existing target array in place, reusing `THREE.Vector3` objects where possible and only allocating new ones when the source array is longer than the target. This further reduces memory churn in the render loop. 