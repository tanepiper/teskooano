# TODO - @teskooano/core-physics

- [x] **Resolve Conflicting Simulation Drivers**:

  - The package contains a reactive, RxJS-based simulation driver (`createSimulationStream`) which is currently unused and conflicts with the main `SimulationManager`'s imperative loop.
  - To eliminate confusion and have a single source of truth, remove the `createSimulationStream` function.

- [x] **Fix Circular Type Dependencies**:

  - Some files import `PhysicsStateReal` from `@teskooano/data-types` instead of the canonical definition in `src/types.ts`.
  - Refactor all internal files to import `PhysicsStateReal` from the local `./types.ts` file to enforce correct dependency flow (`core-physics` -> `data-types`).

- [ ] **Refine Collision Event Data Structure**:

  - The `DestructionEvent` for mutual destruction uses a concatenated string ID (e.g., `"moon1 & moon2"`), which is hard to parse.
  - Modify the `DestructionEvent` interface to handle multiple destructions more gracefully, for example, by changing `destroyedId: string | number` to `destroyedIds: (string | number)[]`.

- [ ] **Relativistic Effects**: Fully integrate and test relativistic force calculations from `forces/relativistic.ts` into the main simulation loop if high precision is required for certain scenarios (e.g., close proximity to massive stars).
- [ ] **Non-Gravitational Forces**: Expand `forces/non-gravitational.ts` to include more specific forces like atmospheric drag, solar radiation pressure, or engine thrust for spacecraft simulation.
- [ ] **Collision Response**: Refine collision response models. Consider adding support for inelastic collisions, fragmentation, or different material properties.
- [ ] **Rotational Dynamics**: Implement rotational dynamics (angular velocity, torque, moments of inertia) for celestial bodies and spacecraft if required.
- [ ] **Integrator Accuracy**: Investigate higher-order integrators (e.g., Runge-Kutta 4) if increased accuracy is needed, balancing with performance cost.
- [ ] **Performance Profiling**: Continuously profile the simulation loop, Octree performance, and integrator steps, especially with large numbers of bodies.
- [ ] **API for External Forces**: Define a clear API for applying external forces (like player ship thrust) to bodies within the simulation.
- [ ] **Spatial Partitioning Alternatives**: Explore alternative spatial partitioning schemes (e.g., k-d tree) if Octree proves suboptimal for specific distributions.
