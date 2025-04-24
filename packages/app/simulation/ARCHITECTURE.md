## Simulation Application Analysis (`packages/app/simulation`)

**Purpose**: This package acts as the main application entry point for running the Teskooano simulation. It orchestrates the core physics loop, initializes the renderer, and manages the simulation time and state interactions.

**Key Components:**

1.  **`index.ts`**: Exports the main `Simulation` class and re-exports key functions.

    - **`Simulation` class**:
      - Primary role is to instantiate and hold the `ModularSpaceRenderer` instance from `@teskooano/renderer-threejs`.
      - Sets up event listeners (e.g., window resize) to keep the renderer dimensions correct.
      - _Does not_ directly manage the simulation loop or state updates, focuses purely on renderer setup.

2.  **`loop.ts`**: Contains the core **physics simulation loop**.

    - `startSimulationLoop()`: Begins the main simulation update cycle, likely using `requestAnimationFrame`.
    - `stopSimulationLoop()`: Halts the update cycle.
    - **Physics Loop Logic** (`simulationLoop` function):
      1.  Calculates delta time, applying `simulationState.timeScale` and capping for stability (`fixedDeltaTime`).
      2.  If not paused (`simulationState.paused`), advances `accumulatedTime` and updates `simulationState.time`.
      3.  Retrieves active celestial bodies from `celestialObjectsStore`, filtering out destroyed or ignored ones.
      4.  Constructs maps needed for collision detection (radii, types) from the active bodies.
      5.  Calls `updateSimulation` from `@teskooano/core-physics`, passing the active bodies and collision data. This function handles:
          - N-body gravity calculation (currently direct summation, potentially Octree later).
          - Collision detection and resolution (returning destruction events).
          - State integration (Euler, Verlet, etc., based on physics engine settings).
      6.  Processes `destructionEvents` from the physics step, emitting `destruction:occurred` via `rendererEvents` for visual effects.
      7.  Updates the `celestialObjectsStore`:
          - Merges the updated physics states (`stepResult.states`) back into the store.
          - Sets the `status` (DESTROYED, ANNIHILATED) for objects listed in `stepResult.destroyedIds` based on collision outcomes.
          - Updates the `accelerationVectors` store.
      8.  **Directly calculates and applies object rotation quaternions** within the `celestialObjectsStore` based on `accumulatedTime` and `siderealRotationPeriod_s`.
      9.  Dispatches a global `CustomEvents.ORBIT_UPDATE` event containing updated positions.

3.  **`resetSystem.ts`**: Provides a utility function `resetSystem` to clear the current simulation state (celestial objects, simulation time, etc.) and optionally run an initializer function to load a new system.

4.  **`systems/`**: Contains modules for defining and initializing predefined star systems (e.g., `redDwarfSystem.ts`, `solarSystem/` subdirectory).

    - These modules typically use `actions` from `@teskooano/core-state` to create and add `CelestialObject` data to the stores.

5.  **`solarSystem.ts`**: Likely a placeholder or specific initializer for the Sol system, residing within or called by the `systems/` structure.

_(Note: `toolbar.ts` and related Web Component logic seem to have been removed or refactored out of this package based on current file structure.)_

**Key Characteristics & Design:**

- **Separation of Concerns**: Attempts to separate renderer setup (`index.ts`) from the physics/state update loop (`loop.ts`).
- **State-Driven**: The simulation loop reads configuration and initial state from `@teskooano/core-state` (`simulationState`, `celestialObjectsStore`) and writes results back.
- **Physics Integration**: Leverages `@teskooano/core-physics` for the heavy lifting of N-body simulation and collision detection.
- **Event-Based Communication**: Uses `rendererEvents` to signal visual events (like destructions) and `CustomEvents` for broader state changes (like orbit updates).
- **Direct State Manipulation**: The physics loop directly calculates and updates object rotations within the `celestialObjectsStore`. While functional, this slightly bypasses the centralized physics state update pathway and might be revisited for consistency.
- **Initialization**: Relies on functions within the `systems/` directory to populate the initial simulation state.

**Data Flow Summary:**

1.  **Initialization**: `systems/*.ts` -> `core-state/actions` -> `celestialObjectsStore`
2.  **Loop Start**: `startSimulationLoop()` activates `loop.ts`.
3.  **Physics Update**: `loop.ts` reads `core-state`, calls `core-physics/updateSimulation`.
4.  **State Update**: `core-physics` returns results -> `loop.ts` updates `core-state` (`celestialObjectsStore`, `simulationState.time`, `accelerationVectors`).
5.  **Rotation Update**: `loop.ts` directly updates rotation in `celestialObjectsStore`.
6.  **Events**: `loop.ts` emits `rendererEvents` (destruction) & `CustomEvents` (orbit update).
7.  **Rendering**: (Managed externally) `renderer-threejs` reads `core-state` (`celestialObjectsStore`) and listens for `rendererEvents` to draw the scene.

**Dependencies**: `@teskooano/renderer-threejs`, `@teskooano/core-state`, `@teskooano/core-physics`, `@teskooano/core-math`, `@teskooano/data-types`, `three`.
