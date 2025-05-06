# Changelog

All notable changes to the `@teskooano/renderer-threejs-objects` package will be documented in this file.

## [Unreleased]

### Changed

- **Major Refactor (Mesh Creation)**:
  - Deleted the monolithic `MeshFactory.ts` class.
  - Introduced a new `object-manager/mesh-creators/` directory with dedicated functions for creating meshes for specific celestial object types (e.g., `createStarMesh`, `createPlanetMesh`, `createRingSystemMesh`, etc.).
  - Each creator function now handles fetching appropriate LOD levels from `CelestialRenderer` instances and constructing `THREE.LOD` objects.
  - Added `createFallbackSphere.ts` for consistent fallback mesh generation.
- Updated exports in `object-manager/index.ts` to include new managers like `AccelerationVisualizer`, `DebrisEffectManager`, `ObjectLifecycleManager`, and the new mesh creator exports.
- Refactored `RendererUpdater.ts`:
  - Simplified update logic for standard and specialized renderers.
  - The `dispose()` method is now empty, indicating a change in how renderer resources are managed or disposed of.
  - General comment cleanup.

## [0.2.0] - 2025-05-01

### Changed

- Internal updates to `ObjectManager.ts` and `mesh-factory.ts`.
- Updated dependencies.

## [0.1.0] - 2025-04-24
