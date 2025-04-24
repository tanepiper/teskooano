## Architecture: `@teskooano/core-debug`

**Purpose**: Provides centralized configuration and utility functions for debugging various aspects of the Teskooano engine, including logging, state inspection, and potentially visualization helpers.

**Core Components**:

1.  **`index.ts`**: The main entry point.

    - Defines and exports the global `debugConfig` object (`{ level: DebugLevel, visualize: boolean, logging: boolean }`).
    - Exports the `DebugLevel` enum.
    - Provides helper functions (`isDebugEnabled`, `isVisualizationEnabled`, `setVisualizationEnabled`) to check or modify the global config.
    - Re-exports all functionality from other modules.

2.  **`logger.ts`**: Implements a custom logging solution.

    - Provides standard logging functions (`error`, `warn`, `info`, `debug`, `trace`) that respect `debugConfig.level` and `debugConfig.logging`.
    - Allows creating named loggers (`createLogger(name: string)`) for context.
    - Includes a basic performance timer (`logger.time(label, fn)`).

3.  **`vector-debug.ts`**: Utility for storing and retrieving `OSVector3` instances.

    - Uses a `Map<string, Map<string, OSVector3>>` (or similar) to store vectors associated with an object ID and a specific key (e.g., `vectorDebug.setVector('planet-id', 'velocity', vector)`).
    - Provides `getVector`, `getVectors`, `clearVectors`, `clearAll`.
    - Intended for temporary storage during debugging sessions, often checked with `isVisualizationEnabled`.

4.  **`three-vector-debug.ts`**: Similar to `vector-debug`, but for `THREE.Vector3` instances.

    - Uses the same storage pattern (`Map<string, Map<string, THREE.Vector3>>`).
    - Useful for debugging rendering logic, shaders, or geometry calculations involving Three.js vectors.

5.  **`celestial-debug.ts`**: Contains debug helpers specifically for `CelestialObject` data.
    - _(Implementation details needed)_ Likely includes functions to log specific properties, visualize orbits/positions (potentially using Three.js helpers), or compare states.

**Design Philosophy**:

- **Central Configuration**: Debugging behavior (verbosity, visualization) should be controllable globally via `debugConfig`.
- **Opt-in Performance Cost**: Expensive debugging operations (like complex visualizations or frequent logging) should ideally be guarded by checks like `isDebugEnabled` or `isVisualizationEnabled` to minimize impact in production or when debugging is off.
- **Contextual Logging**: Use `createLogger` to provide context to log messages.
- **State Inspection**: Provide simple mechanisms (`vectorDebug`, `threeVectorDebug`) to store and inspect transient state (like vector values at a specific point in time) during a debugging session.

**Data Flow**: Other packages import utilities from `@teskooano/core-debug`. They check global config flags (`isDebugEnabled`, `isVisualizationEnabled`) before calling potentially expensive debug functions or logging detailed messages. Debug state (like vectors) can be stored using the helpers and potentially retrieved by a separate debug UI or panel.

**Dependencies**: `@teskooano/core-math`, potentially `three` (if visualization helpers are added).
