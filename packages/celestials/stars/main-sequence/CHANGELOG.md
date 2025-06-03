# Changelog

All notable changes to the main sequence star module will be documented in this file.

## [Unreleased]

### Added

- Implemented a dedicated `CelestialCoronaMaterial` class for better corona rendering
- Added factory methods to create specialized corona materials for different star types
- Created templates for implementing additional spectral classes
- Added detailed README and architecture documentation

### Changed

- Updated architecture to use dedicated material classes
- Refactored `MainSequenceStarRenderer` to use the new corona material class
- Improved exports in index.ts to include all necessary components
- Updated package.json with proper exports and dependencies

### Fixed

- Fixed missing exports in main index.ts file
- Improved typing for corona materials and renderer options

## [0.0.1] - Initial Version

### Added

- Initial implementation of main sequence star module
- Base classes for main sequence stars (`MainSequenceStarCelestial`)
- Renderer for main sequence stars (`MainSequenceStarRenderer`)
- Material factory for star surface (`MainSequenceStarMaterial`)
- Implementation of G-class stars (`ClassGCelestial` and `ClassGRenderer`)
- Custom shaders for star surface and corona effects
- Type definitions for star properties and renderer options
