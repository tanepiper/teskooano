## Simulation Application Analysis (`app/simulation`)

**Purpose**: This package acts as the main application entry point for running the Open Space simulation. It orchestrates the core physics loop, initializes the renderer, and provides UI controls for simulation playback.

**Key Components:**

1.  **`index.ts`**: Defines the main `Simulation` class.
    *   **`Simulation` class**: 
        *   Instantiates `ModularSpaceRenderer` from `@teskooano/renderer-threejs`, providing the main rendering capabilities.
        *   Sets up a basic **render loop** using `requestAnimationFrame` (`animate` method).
        *   This loop:
            *   Calculates frame delta time.
            *   If the simulation is not paused (checked via `simulationState`), it advances the global `simulationState.time` based on `deltaTime` and `timeScale`.
            *   Calls `renderer.updateCamera()` to sync the renderer's camera with the `simulationState`.
            *   Calls `renderer.render()` to draw the scene.
        *   Sets up basic event listeners for window resize and keyboard controls (spacebar for pause, +/- for timescale).
        *   Provides `addObject`/`removeObject` methods that call both the `celestialActions` (to update state) and the `renderer` methods (potentially redundant if the renderer is purely state-driven).
    *   Exports the `Simulation` class and helper functions from other modules.

2.  **`loop.ts`**: Contains the core **physics simulation loop**.
    *   `startSimulationLoop()`: Starts an independent loop (likely driven by `requestAnimationFrame` internally).
    *   `stopSimulationLoop()`: Stops the physics loop.
    *   **Physics Loop Logic** (within `simulationLoop` function called by `startSimulationLoop`):
        1.  Calculates delta time (`fixedDeltaTime`, capped for stability).
        2.  If simulation is not paused:
            *   Calculates scaled delta time based on `timeScale`.
            *   Updates `accumulatedTime` and sets `simulationState.time`.
            *   Retrieves `PhysicsStateReal` for all objects from `celestialObjectsStore`.
            *   Calculates gravitational forces and accelerations for all bodies using direct N-body summation (`calculateAllAccelerations`).
            *   Selects the integration function (`euler`, `symplecticEuler`, `verlet`) based on `simulationState.physicsEngine`.
            *   Applies the chosen integrator to each `PhysicsStateReal` object to get the updated states for the next step.
            *   Calls `updatePhysicsState` (from `core/state`) to write the new `PhysicsStateReal` array back into the `celestialObjectsStore`.
            *   **Directly updates object rotation quaternions** in the `celestialObjectsStore` based on `accumulatedTime` and `siderealRotationPeriod_s`.
            *   Dispatches a global `orbitUpdate` event.

3.  **`toolbar.ts`**: Defines UI controls for the simulation.
    *   `SimulationControlsComponent`: A Web Component providing buttons (Play/Pause, Speed Up/Down, Reverse).
    *   Subscribes to `simulationState` to update button appearances (e.g., showing Play or Pause icon).
    *   Calls `simulationActions` from `core/state` when buttons are clicked.
    *   `registerSimulationControls()`: Defines the `<simulation-controls>` custom element.

4.  **`systems/`**: Directory likely intended for loading predefined system configurations (e.g., Sol system data).

5.  **`solarSystem.ts` / `resetSystem.ts`**: Helper files probably containing functions or data to initialize the simulation state with specific scenarios, likely using `celestialFactory` from `core/state`.

**Key Characteristics & Design:**

*   **Dual Loop Architecture**: Separates the physics update logic (`loop.ts`) from the rendering loop (`index.ts`).
    *   The physics loop runs potentially at a different (often capped) rate, calculates physics, and updates the `core/state` stores.
    *   The render loop runs via `requestAnimationFrame`, updates simulation time state, and tells the renderer to draw based on the current `core/state`.
*   **Orchestration**: Initializes the renderer (`ModularSpaceRenderer`) and starts both the physics and rendering loops.
*   **State Interaction**: Reads simulation control state (`paused`, `timeScale`, `physicsEngine`) from `simulationState` and writes results back via `updatePhysicsState` and direct time updates.
*   **UI Integration**: Provides a Web Component (`SimulationControlsComponent`) for user interaction with simulation playback.
*   **Physics Implementation**: Uses the direct N-body force calculation and allows selection of different integrators via `simulationState`.
*   **Direct State Manipulation**: The physics loop directly calculates and updates object rotations within the `celestialObjectsStore`, bypassing the standard physics state update mechanism for rotation. This might be an area for review.

**Dependencies**: `@teskooano/renderer-threejs`, `@teskooano/core-state`, `@teskooano/core-physics`, `@teskooano/core-math`, `@teskooano/data-types`, `three`. 