# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- **Parent Reassignment System**: Implemented automatic parent reassignment for orphaned celestial objects when their parent star is destroyed.
  - Added `parent-reassignment.ts` utility with functions to calculate distances, find nearest stars, and reassign orphaned objects.
  - Integrated reassignment logic into `PhysicsSystemAdapter.updateStateFromResult()` to handle orphaned planets automatically.
  - Prevents simulation instability by ensuring all active objects maintain proper gravitational parent relationships.
  - Includes comprehensive logging and handles edge cases (no remaining stars, binary systems, cascading effects).

### Changed

- **Major Refactor**: Migrated core game state management (`simulationState`, `celestialObjectsStore`, `celestialHierarchyStore`, `renderableObjectsStore`, `panelState`) from Nanostores (`atom`, `map`) to RxJS `BehaviorSubject`.
- **PhysicsSystemAdapter Refactor**: Split the complex `updateStateFromResult()` method into smaller, focused functions for better maintainability:
  - `updatePhysicsStates()`: Handles position/velocity updates
  - `handleDestructionEvents()`: Manages object destruction and cascading effects  
  - `handleParentReassignment()`: Processes orphaned object reassignment
  - Added comprehensive documentation and comments explaining each step of the physics update process.
  - State stores now expose an Observable (e.g., `simulationState$`) for reactive subscriptions and getter functions (e.g., `getSimulationState()`) for direct access.
  - Setter functions (e.g., `setSimulationState()`) and specific action dispatchers are now used for state modification.
- Updated `physics.ts` to use new RxJS-based state accessors (`getSimulationState`, `getCelestialObjects`).
- Refactored `factory.ts` to use new state setters (`setSimulationState`, `setCelestialHierarchy`) and getters, and removed redundant comments.
- Simplified `stores.ts`, `panelRegistry.ts`, and `panelState.ts` by removing unnecessary comments and adapting to RxJS.
- Updated `currentSeed` in `stores.ts` to use `BehaviorSubject`.
- Introduced `accelerationVectors$` observable in `stores.ts`.
- Revised exports in `packages/core/state/src/game/index.ts` to reflect the new RxJS structure.

## [0.1.0] - 2025-04-24

### Added

- Initial release of the core state management package.
- **Foundation**: Uses `RxJS` for reactive state management.
- **Core Stores**:
  - `celestialObjectsStore`: Map store for all `CelestialObject` data (including `physicsStateReal`).
  - `celestialHierarchyStore`: Map store for parent-child object relationships.
  - `simulationState`: Atom store for global simulation settings (time, pause state, camera, etc.).
- **State Modification**: Provided actions (`simulationActions`, `celestialActions`) for controlled updates to simulation settings and celestial objects (add, remove, update).
- **Object Creation**: Implemented `celestialFactory` to create initial `CelestialObject` states from input data, including calculating initial physics state from orbital parameters using `@teskooano/core-physics`.
- **Physics Integration**: Logic in `game/physics.ts` to synchronize state updates from the physics engine back into the `celestialObjectsStore`, including calculation of derived scaled positions and rotations.
- **Panel State**: Basic stores and registry for UI panel management (`panelState.ts`, `panelRegistry.ts`).
- Initial documentation (`README.md`, `ARCHITECTURE.md`) and project setup.
