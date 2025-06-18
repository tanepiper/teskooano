# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Changed

- **Major Refactor**: Removed the obsolete `InteractionManager` facade. The functionality was split: this package now exports `ControlsManager` as the primary component for camera control, while all 2D label rendering has been moved to the `@teskooano/renderer-threejs-labels` package, which exports a `Layer2DManager`.
- **`ControlsManager`**: Now fully relies on GSAP for all programmatic camera transitions, removing the internal `moveToPosition` logic.
- `ControlsManager.ts` now uses `getSimulationState` and `setSimulationState` from `@teskooano/core-state` for camera state updates.
- Extensive comment removal and minor code cleanup across various files, including test files and `setup.ts`.
- Removed Playwright and Vitest browser-specific triple-slash directives from `setup.ts`.

### Removed

- `InteractionManager`: This facade was outdated and did not reflect the actual architecture. Consumers should now instantiate `ControlsManager` and the `Layer2DManager` from `@teskooano/renderer-threejs-labels` directly.
- `UIManager`: A non-existent class that was referenced by the old `InteractionManager`.

## [0.1.0] - 2025-04-24

### Added

- **`ControlsManager`:** Manages `THREE.OrbitControls` for camera interaction (zoom, pan, rotate).
- **Smooth Transitions:** Implemented GSAP-based animations for `moveToPosition`, `pointCameraAtTarget`, and `setFollowTarget` camera actions.
- **Object Following:** Enabled the camera to track a `THREE.Object3D` while maintaining user orbit control.
- **State Synchronization:** Updates `@teskooano/core-state` with camera position/target on user interaction.
- **`CSS2DManager`:** Manages HTML elements overlaid on the 3D scene using `THREE.CSS2DRenderer`.
- **Layered Labels:** Supports organizing CSS2D elements (like celestial object names and AU markers) into layers (`CELESTIAL_LABELS`, `AU_MARKERS`) with visibility controls.
- **Orphan Check:** `CSS2DManager` includes a check to remove labels whose parent object no longer exists in the scene.
- **Interaction Handling:** Explicitly sets `pointer-events: none` on CSS2D elements to prevent blocking underlying canvas interactions.
- **Basic Setup:** Includes `index.ts` for exporting managers, `setup.ts` (potentially for tests), and Vitest configuration (`vitest.config.ts`).
