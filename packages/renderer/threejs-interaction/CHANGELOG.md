# Changelog

All notable changes to this project will be documented in this file.

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
