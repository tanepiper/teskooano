# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Changed

- `LODManager` now subscribes to `simulationState$` to get the current `performanceProfile` (`low`, `medium`, 'high'). This profile is used to apply a scaling factor to the distances of **newly created** LODs.
- All `THREE.LOD` objects are now created via a central `createAndRegisterLOD` method in `LODManager`, which ensures consistency.
- Debug labels (`lod-debug-labels.ts`) have been improved to show more information and handle removal more cleanly.

### Removed

- Removed the obsolete `LightManager`
