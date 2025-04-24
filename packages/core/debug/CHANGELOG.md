# Changelog

All notable changes to the `@teskooano/core-debug` package will be documented in this file.

## [0.1.0] - 2025-04-24

### Added

- Initial implementation of the debug utilities package.
- Central `debugConfig` for global control of logging level and visualization.
- `DebugLevel` enum and helper functions (`isDebugEnabled`, `isVisualizationEnabled`, `setVisualizationEnabled`).
- Custom logger (`logger.ts`) with multiple levels, named logger support (`createLogger`), and basic timing (`logger.time`).
- Vector debugging utilities (`vector-debug.ts`) for storing/retrieving `OSVector3` instances.
- THREE.js vector debugging utilities (`three-vector-debug.ts`) for storing/retrieving `THREE.Vector3` instances.
- Placeholder for celestial object debugging utilities (`celestial-debug.ts`).
