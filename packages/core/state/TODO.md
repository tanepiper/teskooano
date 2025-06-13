# TODO - @teskooano/core-state

- [ ] **Decouple UI Logic from Core State**:

  - The `PanelService` and `PanelViewState` type are UI-specific constructs related to Dockview and should not reside in a core state package.
  - Move these components to `apps/teskooano/src/core/controllers/dockview/` to create a clean separation between core application state and UI presentation logic.

- [ ] **Refine Celestial Object Creation**: Improve the `createCelestialObject` method to be more flexible, possibly allowing partial property overrides or using a builder pattern for complex objects.
- [ ] **State Snapshots and History**: Implement a mechanism to take snapshots of the entire game state and revert to them, enabling save/load functionality and a more robust undo/redo system.
- [ ] **Optimize State Subscriptions**: Audit subscriptions across the application to ensure there are no memory leaks. Consider using `takeUntil` patterns more broadly for component-level subscriptions.
- [ ] **Selector Granularity**: Develop more granular selectors for derived state to avoid unnecessary re-renders in components that only depend on a small slice of a larger state object.
- [ ] **Immutable State Operations**: Enforce immutability more strictly on state updates. While `BehaviorSubject` requires emitting new objects, ensure nested objects are also treated as immutable to prevent side effects.
- [ ] **Tests for Actions and Reducers**: Add comprehensive unit tests for all actions and reducer-like logic to ensure state transitions are predictable and correct.

- [ ] **Renderer-Agnostic State**: Refactor `game/physics.ts` and `game/factory.ts`
