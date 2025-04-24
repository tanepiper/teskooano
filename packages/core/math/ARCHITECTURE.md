## Architecture: `@teskooano/core-math`

**Purpose**: Provides fundamental mathematical constants, a custom 3D vector class (`OSVector3`), and general utility functions essential for the Teskooano engine, particularly physics and simulation tasks.

**Key Components:**

1.  **`index.ts`**: Entry point, exporting the main components (`constants`, `OSVector3`) and namespacing the utility functions under `utils`.

2.  **`constants.ts`**: Defines commonly used mathematical constants:

    - `EPSILON`: A small value for precise floating-point comparisons.
    - `PI`, `TWO_PI`, `HALF_PI`: Standard Pi-related values.
    - `DEG_TO_RAD`: Conversion factor from degrees to radians.

3.  **`OSVector3.ts`**: A custom implementation of a 3-dimensional vector (Y-up coordinate system).

    - **Properties**: `x`, `y`, `z` (public numbers).
    - **Constructor**: `constructor(x = 0, y = 0, z = 0)`.
    - **Core Methods**: `clone()`, `set()`, `copy()`, `add()`, `sub()`, `multiplyScalar()`, `lengthSq()`, `length()`, `normalize()`, `dot()`, `cross()`, `distanceToSquared()`, `distanceTo()`.
    - **Utility Methods**: `toString()`, `toThreeJS()` (creates a new `THREE.Vector3`), `applyQuaternion()` (applies a `THREE.Quaternion`).
    - **Rationale**: Likely separated from `THREE.Vector3` for internal physics/simulation precision or to minimize direct Three.js dependencies in core logic. `toThreeJS()` provides interoperability with the rendering layer.

4.  **`utils/index.ts`**: A collection of general-purpose utility functions.
    - **Math**: `clamp`, `lerp`, `degToRad`, `radToDeg`, `equals` (with epsilon), `isPowerOfTwo`, `ceilPowerOfTwo`, `floorPowerOfTwo`, `nearestPowerOfTwo`.
    - **General**: `generateUUID`.
    - **Function Modifiers**: `debounce`, `throttle`, `memoize` (useful for performance optimization in various engine parts).

**Design Philosophy:**

- **Foundational**: Provides essential mathematical building blocks for higher-level packages (e.g., `@teskooano/core-physics`, `@teskooano/app-simulation`).
- **Self-Contained**: Minimizes external dependencies, except for `three` for specific conversion/application methods in `OSVector3`.
- **Clear Separation**: `OSVector3` handles vector operations, `constants` holds fixed values, and `utils` contains general-purpose helper functions.

**Dependencies**:

- `three` (dev/peer dependency, only strictly needed if `toThreeJS` or `applyQuaternion` is used).
