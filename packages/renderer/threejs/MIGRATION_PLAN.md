# Migration Plan: Refactoring `ModularSpaceRenderer`

## 1. Goal

Refactor the `ModularSpaceRenderer` facade (`packages/renderer/threejs/src/index.ts`) to improve modularity, separation of concerns, and testability. Clarify the rendering pipeline and the responsibilities of the main renderer class versus its constituent managers.

## 2. Problem

The current `ModularSpaceRenderer` implementation suffers from several issues:

*   **Large Constructor:** The constructor is responsible for instantiating numerous managers and setting up event listeners, state subscriptions, and animation callbacks, making it complex and hard to follow.
*   **Mixed Concerns:** The main class directly handles:
    *   Core rendering setup (`SceneManager`).
    *   Orchestration of updates for various managers (`ObjectManager`, `OrbitManager`, `LightManager`, etc.) within the animation loop.
    *   Direct subscription to application state (`@teskooano/core-state`).
    *   Camera following logic.
    *   UI state toggling (`toggleLabels`, `toggleGrid`, etc.).
    *   Conditional UI manager instantiation using Null object patterns (`NullUIManager`, `NullCSS2DManager`).
*   **Tight Coupling:** Direct dependency on specific state stores (`celestialObjectsStore`, `simulationState`) creates tight coupling between the renderer and the core application state logic.
*   **Misplaced Logic:** Camera following logic is embedded within the renderer's animation callback instead of being encapsulated within the controls or camera system.
*   **Redundant Updates:** The `render()` method performs updates that seem redundant with those in the main animation callback.

## 3. Proposed Solution: Refactoring Strategy

We will refactor `ModularSpaceRenderer` by:

1.  **Extracting Setup Logic:** Move complex initialization steps (state subscriptions, animation callbacks, event listeners) from the constructor into dedicated private methods or potentially separate helper classes.
2.  **Decoupling State Management:** Introduce a `RendererStateAdapter` (or similar) responsible for subscribing to the necessary core state stores and providing a simplified interface or events for the renderer components to consume. This breaks the direct dependency.
3.  **Relocating Camera Logic:** Move the camera following state (`_followTargetId`, vectors) and update logic into the `@teskooano/renderer-threejs-interaction/ControlsManager` or a dedicated `CameraController` class.
4.  **Simplifying Animation Loop:** The main animation callback in `ModularSpaceRenderer` should primarily orchestrate `update(deltaTime)` calls on its managers (including the new camera logic) and trigger rendering via `SceneManager` and `CSS2DManager`.
5.  **Refining UI Handling:** Replace the `NullUIManager` and `NullCSS2DManager` with conditional instantiation and optional chaining (`?.`) for cleaner handling of optional UI features. Public toggle methods (`toggleLabels`, etc.) will delegate to the appropriate managers.
6.  **Clarifying `render()` Method:** Ensure the `render()` method is solely responsible for triggering the actual render calls (`SceneManager.render()`, `CSS2DManager.render()`) and remove redundant update logic.

## 4. Migration Steps

1.  **Create Setup Methods:**
    *   Action: Move logic from the constructor into private `_setupStateSubscriptions()`, `_setupAnimationCallbacks()`, `_setupEventListeners()`, `_populateInitialState()` methods.
    *   Update: Call these methods from the constructor.
2.  **Implement State Adapter:**
    *   Action: Create a new class `RendererStateAdapter` within the `threejs` package.
    *   Action: Move state subscription logic (`celestialObjectsStore`, `simulationState`) into this adapter. The adapter should process state changes and potentially emit simpler events (e.g., `objectAdded`, `objectUpdated`, `objectRemoved`, `visualSettingChanged`).
    *   Update: Modify `ModularSpaceRenderer` and relevant managers (`ObjectManager`, `LightManager`, `OrbitManager`) to interact with the `RendererStateAdapter` instead of subscribing directly to core state.
3.  **Move Camera Following:**
    *   Action: Add state (`followTargetId`, tracking vectors) and an `update(deltaTime)` method to `ControlsManager` (or a new `CameraController`) to handle the camera following logic previously in the animation callback.
    *   Update: Remove camera following logic and state from `ModularSpaceRenderer`. Call `controlsManager.update(deltaTime)` within the animation loop. Update `setFollowTarget` to delegate to `ControlsManager`.
4.  **Refactor Animation Loop (`_setupAnimationCallbacks`)**:
    *   Action: Simplify the `mainUpdateCallback`. It should primarily call `update(deltaTime)` on relevant managers: `controlsManager`, `objectManager`, `orbitManager`, `lightManager`, `backgroundManager`, `lodManager`.
    *   Action: Ensure `sceneManager.render()` and `css2DManager.render()` are called *after* all updates.
5.  **Refactor `render()` Method:**
    *   Action: Remove any `update()` calls from the `render()` method. It should only contain render calls (`sceneManager.render()`, `css2DManager.render()`) and potentially UI rendering (`canvasUIManager.render()`).
6.  **Handle Optional UI:**
    *   Action: Remove `NullUIManager` and `NullCSS2DManager`.
    *   Update: In the constructor, conditionally instantiate `CSS2DManager` based on the `enableUI` option.
    *   Update: Use optional chaining (`this.css2DManager?.method()`) wherever it's accessed. Modify `toggleLabels` etc., to check for the manager's existence before calling methods.
7.  **Update Dependencies & Imports:** Adjust imports and potentially `package.json` dependencies if new classes introduce changes.
8.  **Testing:**
    *   Action: Run existing tests (`npm run test` or `moon run :test`).
    *   Action: Write new unit/integration tests for the `RendererStateAdapter` and the moved camera logic within `ControlsManager`.
    *   Action: Fix any broken tests.
9.  **Documentation:** Update `README.md` and comments within `ModularSpaceRenderer` and related files to reflect the changes.

## 5. Rollback Plan

Utilize Git for version control. Commit before starting the refactoring and after each major step (e.g., after implementing the State Adapter, after moving camera logic). Revert commits if significant issues arise that cannot be easily resolved.
