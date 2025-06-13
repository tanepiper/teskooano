# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Changed

- **Major Refactor**: Removed the obsolete `InteractionManager` facade. The package now exports `ControlsManager` and `CSS2DManager` as the primary, distinct components for direct use.
- **`ControlsManager`**: Now fully relies on GSAP for all programmatic camera transitions, removing the internal `moveToPosition` logic.
- **`CSS2DManager`**: Simplified the `createCelestialLabel` method signature and improved internal layer management.
- `ControlsManager.ts` now uses `getSimulationState` and `setSimulationState` from `@teskooano/core-state` for camera state updates.
- `CSS2DManager.ts`:
  - Added pre-render checks to find and remove orphaned labels and to hide any `CSS2DObject` in the scene without a parent, improving stability.
  - Simplified internal logic for managing `pointer-events`.
- Extensive comment removal and minor code cleanup across various files, including test files and `setup.ts`.
- Removed Playwright and Vitest browser-specific triple-slash directives from `setup.ts`.

### Removed

- `InteractionManager`: This facade was outdated and did not reflect the actual architecture. Consumers should now instantiate `ControlsManager` and `CSS2DManager` directly.
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
