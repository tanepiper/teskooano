## Core State Package Analysis (`core/state`)

**Purpose**: This package manages the global state of the simulation using Nanostores. It acts as the central source of truth for all other modules, holding information about celestial objects, simulation control parameters, and potentially UI state.

**Key Components:**

1.  **`index.ts`**: Exports the main stores, actions, factory, and types from the `game/` subdirectory.

2.  **`game/stores.ts`**: Defines the primary Nanostores.

    - `celestialObjectsStore`: A `map` store holding all `CelestialObject` data, keyed by object ID. This is the main store containing the complete state of every object.
    - `celestialHierarchyStore`: A `map` store representing the parent-child relationships (e.g., `starId: [planetId1, planetId2]`, `planetId1: [moonId1]`).
    - `getChildrenOfObject(objectId)`: A utility function to retrieve direct children of an object using the hierarchy and object stores.

3.  **`game/simulation.ts`**: Defines and manages the simulation control state.

    - `SimulationState` Interface: Defines the structure for global simulation settings (time, timeScale, paused, selectedObject, focusedObjectId, camera state using `OSVector3`, physicsEngine choice, visualSettings, optional renderer stats).
    - `simulationState`: An `atom` store holding a single `SimulationState` object.
    - `simulationActions`: An object containing functions to modify the `simulationState` atom (e.g., `setTimeScale`, `togglePause`, `selectObject`, `updateCamera`, `setPhysicsEngine`, `setTrailLengthMultiplier`).

4.  **`game/physics.ts`**: Bridges the physics engine updates with the state store.

    - `getPhysicsBodies()`: Extracts an array of `PhysicsStateReal` objects from the `celestialObjectsStore` to feed into the `core/physics` engine.
    - `updatePhysicsState(updatedBodiesReal)`: Takes the array of updated `PhysicsStateReal` objects from the physics engine. For each updated body, it:
      - Calculates the new scaled position (`position: THREE.Vector3`) using `METERS_TO_SCENE_UNITS`.
      - Calculates the new rotation quaternion (`rotation: THREE.Quaternion`) based on the object's `siderealRotationPeriod_s` and `axialTilt`.
      - Updates the corresponding `CelestialObject` in the `celestialObjectsStore` using `setKey`, replacing the old `physicsStateReal`, `position`, and `rotation` with the newly calculated values. (_Note: It also updates a deprecated scaled `physicsState` property._)

5.  **`game/celestialActions.ts`**: Provides functions for CRUD operations on celestial objects within the state stores.

    - `addCelestialObject(object)`: Adds a complete `CelestialObject` to `celestialObjectsStore` and updates `celestialHierarchyStore`. Dispatches a DOM event.
    - `updateCelestialObject(objectId, updates)`: Updates specific fields of an existing object in the store.
    - `removeCelestialObject(objectId)`: Removes an object from the store. Dispatches a DOM event.
    - `updateOrbitalParameters(objectId, parameters)`: Updates the `orbit` property of an object.

6.  **`game/factory.ts`**: Contains logic for creating fully initialized `CelestialObject` instances.

    - `CelestialObjectCreationInput`: Interface defining the necessary input data (real mass/radius, type, parent, orbit, etc.).
    - `celestialFactory`: An object with factory methods:
      - `clearState()`: Resets the stores and simulation state variables.
      - `createSolarSystem(data)`: Creates the central star. Calculates initial scaled properties and physics states (star is stationary). Uses `celestialActions.addCelestialObject`.
      - `addCelestial(data)`: Creates orbiting bodies (planets, moons). Calculates initial `PhysicsStateReal` (position and velocity) based on `OrbitalParameters` and parent state using helpers from `core/physics`. Calculates scaled properties. Uses `celestialActions.addCelestialObject`.

7.  **`game/panelState.ts` & `game/panelRegistry.ts`**: Define stores and registration logic apparently related to UI panels (likely for debug/control panels).

**Key Characteristics & Design:**

- **Single Source of Truth**: Uses Nanostores (`celestialObjectsStore`, `simulationState`) to provide a central, reactive state.
- **State Atomicity**: Uses `atom` for global simulation settings and `map` for the collection of celestial objects.
- **Immutability (Partial)**: Actions generally create new state objects/maps when updating the stores (`set`, `setKey`), promoting predictability.
- **Action Encapsulation**: State modifications are primarily done through exported action functions (`simulationActions`, `celestialActions`).
- **Factory Pattern**: `celestialFactory` encapsulates the complex logic of creating initial object states from input data and orbital parameters.
- **Physics Synchronization**: `game/physics.ts` handles the critical task of taking physics engine output (`PhysicsStateReal`) and updating the corresponding objects in the state store, including calculating derived values like scaled position and rotation.
- **Separation of Concerns**: Clearly separates state storage (`stores.ts`), simulation control (`simulation.ts`), object modification (`celestialActions.ts`), object creation (`factory.ts`), and physics sync (`physics.ts`).

**Dependencies**: `nanostores`, `@teskooano/data-types`, `@teskooano/core-math`, `@teskooano/core-physics`, `three` (for rotation calculation and deprecated scaled state properties within `game/physics.ts` and `game/factory.ts`).

**Areas for Review**: The remaining usage of `THREE.Vector3` and `THREE.Quaternion` within `game/physics.ts` and `game/factory.ts` should be reviewed to ensure `core/state` remains renderer-agnostic. Ideally, rotation should also be represented by a core type (e.g., a core Quaternion class or Euler angles) and converted by the renderer.
