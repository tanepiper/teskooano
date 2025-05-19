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

5.  **`game/physics.ts`**: Bridges the physics engine updates with the state store.

    - `getPhysicsBodies()`: Extracts an array of `PhysicsStateReal` objects from the `celestialObjectsStore` to feed into the `core/physics` engine.
    - `updatePhysicsState(updatedBodiesReal)`: Takes the array of updated `PhysicsStateReal` objects from the physics engine. For each updated body, it:
      - Calculates the new scaled position (`position: THREE.Vector3`) using `METERS_TO_SCENE_UNITS`.
      - Calculates the new rotation quaternion (`rotation: THREE.Quaternion`) based on the object's `siderealRotationPeriod_s` and `axialTilt`.
      - Updates the corresponding `CelestialObject` in the `celestialObjectsStore` using `setKey`, replacing the old `physicsStateReal`, `position`, and `rotation` with the newly calculated values. (_Note: It also updates a deprecated scaled `physicsState` property._)

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

8.  **`game/panelState.ts` & `game/panelRegistry.ts`**: Define stores and registration logic apparently related to UI panels (likely for debug/control panels).

## Key Design Principles

- **Immutability**: State updates should be handled immutably. When an object or state slice is updated, a new instance is created rather than modifying the existing one. This is crucial for reactive updates and debugging. (RxJS naturally encourages this with new emissions rather than in-place mutation of emitted values).
- **Single Source of Truth**: Uses RxJS (`celestialObjects$`, `simulationState$`) to provide a central, reactive state.
- **Unidirectional Data Flow**: State is modified by dispatching actions, which update the stores. UI components and other services subscribe to these stores to react to changes.

**Dependencies**: `RxJS`, `@teskooano/data-types`, `@teskooano/core-math`, `@teskooano/core-physics`, `three` (for rotation calculation and deprecated scaled state properties within `game/physics.ts` and `game/factory.ts`).

**Areas for Review**: The remaining usage of `THREE.Vector3` and `THREE.Quaternion` within `game/physics.ts` and `game/factory.ts` should be reviewed to ensure `core/state` remains renderer-agnostic. Ideally, rotation should also be represented by a core type (e.g., a core Quaternion class or Euler angles) and converted by the renderer.
