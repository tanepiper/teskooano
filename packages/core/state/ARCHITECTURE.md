# Architecture: @teskooano/core-state

**Purpose**: This package manages the global state of the simulation using RxJS. It acts as the central source of truth for all other modules, holding information about celestial objects, simulation control parameters, and potentially UI state.

## Core Components

1.  **`data-types`**: (Imported) Defines the core data structures like `CelestialObject`, `PhysicsState`, etc.
2.  **`game/stores.ts`**: Defines the primary RxJS Subjects/BehaviorSubjects.
    - `celestialObjects$`: A `BehaviorSubject` holding a map of `CelestialObject` instances, keyed by their ID. This is the main store for all game entities.
    - `simulationState$`: A `BehaviorSubject` for global simulation parameters like time, time scale, pause state, selected/focused objects, and camera state.
    - `celestialHierarchy$`: A `BehaviorSubject` representing the parent-child relationships between celestial objects (e.g., moons orbiting a planet).
3.  **`game/actions.ts`**: Contains functions that modify the state. These actions are the only way to update the stores, ensuring a unidirectional data flow. Examples: `addCelestialObject`, `updateSimulationTime`, `selectObject`.

4.  **`game/simulation.ts`**: Defines and manages the simulation control state.

    - `SimulationState` Interface: Defines the structure for global simulation settings (time, timeScale, paused, selectedObject, focusedObjectId, camera state using `OSVector3`, physicsEngine choice, visualSettings, optional renderer stats).
    - `simulationState`: An `atom` store holding a single `SimulationState` object.
    - `simulationActions`: An object containing functions to modify the `simulationState` atom (e.g., `setTimeScale`, `togglePause`, `selectObject`, `updateCamera`, `setPhysicsEngine`, `setTrailLengthMultiplier`).

5.  **`game/physicsSystemAdapter.ts`**: Defines the `PhysicsSystemAdapter` service.
    This service acts as a crucial bridge between the application's core game state (managed by `GameStateService`) and the external physics engine (`@teskooano/core-physics`). Its responsibilities include:

    - `physicsSystemAdapter.getPhysicsBodies()`: Retrieves an array of `PhysicsStateReal` objects representing all active (not destroyed or ignored) celestial bodies. This array is intended to be fed into the physics engine for a simulation step.
    - `physicsSystemAdapter.getCelestialObjectsSnapshot()`: Provides a direct snapshot (a shallow copy) of the current `Record<string, CelestialObject>` from `GameStateService`. This is useful for parts of the simulation loop that need to build parameters based on the full state of all objects (e.g., for calculating radii, types for the physics engine).
    - `physicsSystemAdapter.updateStateFromResult(result: SimulationStepResult)`: Takes a `SimulationStepResult` object (output from `@teskooano/core-physics`'s `updateSimulation` function). It then updates the `GameStateService` by:
      - Applying the new `physicsStateReal` to each corresponding `CelestialObject`.
      - Updating the `status` of objects listed in `result.destroyedIds` (e.g., to `DESTROYED` or `ANNIHILATED` based on `result.destructionEvents`).
      - Updating the global acceleration vectors via `gameStateService.updateAccelerationVectors(result.accelerations)`.
      - This method efficiently updates the game state, typically by preparing a new map of all celestial objects and calling `gameStateService.setAllCelestialObjects()`.

6.  **`game/celestialActions.ts`**: Provides functions for CRUD operations on celestial objects within the state stores.

    - `addCelestialObject(object)`: Adds a complete `CelestialObject` to `celestialObjectsStore` and updates `celestialHierarchyStore`. Dispatches a DOM event.
    - `updateCelestialObject(objectId, updates)`: Updates specific fields of an existing object in the store.
    - `removeCelestialObject(objectId)`: Removes an object from the store. Dispatches a DOM event.
    - `updateOrbitalParameters(objectId, parameters)`: Updates the `orbit` property of an object.

7.  **`game/factory.ts`**: Contains logic for creating fully initialized `CelestialObject` instances.

    - `CelestialObjectCreationInput`: Interface defining the necessary input data (real mass/radius, type, parent, orbit, etc.).
    - `celestialFactory`: An object with factory methods:
      - `clearState()`: Resets the stores and simulation state variables.
      - `createSolarSystem(data)`: Creates the central star. Calculates initial scaled properties and physics states (star is stationary). Uses `celestialActions.addCelestialObject`.
      - `addCelestial(data)`: Creates orbiting bodies (planets, moons). Calculates initial `PhysicsStateReal` (position and velocity) based on `OrbitalParameters` and parent state using helpers from `core/physics`. Calculates scaled properties. Uses `celestialActions.addCelestialObject`.

8.  **`game/panel.service.ts`**: Defines the `PanelService` singleton.
    This service consolidates UI panel management. Its responsibilities include:
    - Registering and unregistering panel instances by ID (e.g., `panelService.registerPanelInstance(id, instance)`).
    - Providing access to registered panel instances (e.g., `panelService.getPanelInstance(id)`).
    - Managing the state of the currently active DockView panel API:
      - Exposing an `activePanelApi$: Observable<DockviewPanelApi | null>` for reactive updates.
      - Providing methods `setActivePanelApi(api)` and `getActivePanelApi()` for imperative state management of the active panel.

## Key Design Principles

- **Immutability**: State updates should be handled immutably. When an object or state slice is updated, a new instance is created rather than modifying the existing one. This is crucial for reactive updates and debugging. (RxJS naturally encourages this with new emissions rather than in-place mutation of emitted values).
- **Single Source of Truth**: Uses RxJS (`celestialObjects$`, `simulationState$`) to provide a central, reactive state.
- **Unidirectional Data Flow**: State is modified by dispatching actions, which update the stores. UI components and other services subscribe to these stores to react to changes.

**Dependencies**: `RxJS`, `@teskooano/data-types`, `@teskooano/core-math`, `@teskooano/core-physics` (for `SimulationStepResult` type), `three` (potentially, if any types from it remain, though ideally minimized in core-state).

**Areas for Review**:

- The ad-hoc `rotation: THREE.Quaternion` property being added to celestial objects in `app/simulation/src/loop.ts` should be reviewed. `RendererStateAdapter` is responsible for calculating renderable rotations, and `CelestialObject` type does not formally include this Three.js-specific rotation. Ensure this doesn't cause conflicts or represent a misplaced responsibility.
- Ensure type paths like `@teskooano/core-physics` are correctly resolved in `tsconfig.json` for `packages/core/state`.
