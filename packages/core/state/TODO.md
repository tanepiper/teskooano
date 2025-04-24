# TODO - @teskooano/core-state

- [ ] **Renderer-Agnostic State**: Refactor `game/physics.ts` and `game/factory.ts` to remove direct dependencies on `THREE.Vector3` and `THREE.Quaternion` for scaled positions and rotations. These should ideally be calculated and handled by the rendering layer or via conversion utilities, keeping the core state purely physics-based (SI units) or using engine-agnostic types.
- [ ] **UI State Management**: Expand state management to properly handle the upcoming dockable UI system (window positions, visibility, focused elements, panel-specific configurations).
- [ ] **Persistence**: Implement loading/saving mechanisms for simulation state (celestial objects, simulation settings) potentially using JSON or another format.
- [ ] **Player State**: Add dedicated stores and actions for managing player-specific state (ship position, velocity, orientation, inventory, status).
- [ ] **Time Synchronization**: Improve handling of time across different parts of the system (game time, physics time step, render time) to ensure consistency, especially when paused or changing time scale.
- [ ] **Error Handling**: Add more robust error handling and validation, particularly in the factory and action functions.
- [ ] **Event System**: Review the use of DOM events (`dispatchEvent`) in `celestialActions` and consider using Nanostores' built-in listeners or a dedicated event bus for better decoupling.
- [ ] **Optimization**: Profile store updates and reads, especially `celestialObjectsStore` with a large number of objects, and optimize if necessary (e.g., selective updates, derived stores).
