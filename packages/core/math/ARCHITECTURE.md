## Core Math Package Analysis (`core/math`)

**Purpose**: This package provides fundamental mathematical constants, a custom 3D vector class (`OSVector3`), and general utility functions often needed in simulation and graphics contexts.

**Key Components:**

1.  **`index.ts`**: Exports the main components (`constants`, `OSVector3`) and namespaces the utility functions under `utils`.

2.  **`constants.ts`**: Defines commonly used mathematical constants:
    *   `EPSILON`: A small value for floating-point comparisons.
    *   `PI`, `TWO_PI`, `HALF_PI`: Standard Pi-related values.
    *   `DEG_TO_RAD`: Conversion factor from degrees to radians.

3.  **`OSVector3.ts`**: A custom implementation of a 3-dimensional vector.
    *   **Properties**: `x`, `y`, `z` (public numbers).
    *   **Constructor**: `constructor(x = 0, y = 0, z = 0)`.
    *   **Core Methods**: `clone()`, `set()`, `copy()`, `add()`, `sub()`, `multiplyScalar()`, `lengthSq()`, `length()`, `normalize()`, `dot()`, `cross()`, `distanceToSquared()`, `distanceTo()`.
    *   **Utility Methods**: `toString()` (formats as `(x, y, z)` using exponential notation), `toThreeJS()` (creates a new `THREE.Vector3` instance), `applyQuaternion()` (applies a `THREE.Quaternion` rotation).
    *   **Notes**: This class seems intended for use within the core physics engine, possibly for precision or to avoid direct dependency on Three.js in core logic. The `toThreeJS()` method provides the bridge to the rendering system.

4.  **`utils/index.ts`**: A collection of general-purpose utility functions.
    *   **Math**: `clamp`, `lerp`, `degToRad`, `radToDeg`, `equals` (with epsilon), `isPowerOfTwo`, `ceilPowerOfTwo`, `floorPowerOfTwo`, `nearestPowerOfTwo`.
    *   **General**: `generateUUID`.
    *   **Function Modifiers**: `debounce`, `throttle`, `memoize`.

**Key Characteristics & Design:**

*   **Foundation**: Provides essential mathematical building blocks for other core packages (especially `core/physics`).
*   **Custom Vector**: Uses a custom `OSVector3` class, separate from `THREE.Vector3`, likely for internal physics calculations.
*   **Utility Collection**: Includes a standard set of helpful mathematical and functional utilities.

**Dependencies**: `three` (only for `OSVector3.toThreeJS()` and `OSVector3.applyQuaternion()`). 