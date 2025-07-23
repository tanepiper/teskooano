# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2024-01-XX

### Added

- **Orbital Data Management**: Integrated `OrbitalManager` into `BaseCelestialRenderer` for centralized orbit data management
  - `OrbitalManager` class for managing position history, orbit data, and LOD-based rendering control
  - `OrbitalConfig` interface for configuring orbital data management behavior
  - `PositionSample` interface for position history with timestamps and velocity data
  - `CircularBuffer` class for memory-efficient position history storage
  - Delegation methods in `BaseCelestialRenderer` for subclasses to access orbital data
- **LOD-Based Rendering Control**: Automatic visibility control for orbit lines and trails based on camera distance
  - Different LOD thresholds for stars vs moons and other celestial types
  - Configurable distance thresholds for orbit lines and trails
  - Integration with the existing LOD system
- **Performance Optimizations**:
  - Throttled updates to prevent excessive processing (~60fps)
  - Distance-based sampling to avoid redundant position data
  - Pre-allocated buffers to minimize garbage collection
  - Memory usage statistics and monitoring
- **Backward Compatibility**: Flexible constructor supporting both object-first and legacy options-first patterns
  - Automatic object ID resolution in `initialize()` method
  - Seamless integration with existing renderer inheritance hierarchy

### Changed

- **BaseCelestialRenderer Constructor**: Updated to support both constructor signatures for backward compatibility
  - New signature: `constructor(object: RenderableCelestialObject, options?: BaseCelestialRendererOptions)`
  - Legacy signature: `constructor(options?: BaseCelestialRendererOptions)` (for star renderers)
  - Automatic orbital manager initialization with correct object ID
- **Update Method**: Enhanced to include orbital data updates
  - Calls `orbitalManager.update()` to maintain position history
  - Preserves existing LOD and billboard update functionality
- **Resource Management**: Extended disposal to include orbital manager cleanup
- **Type Definitions**: Added `orbitalConfig` to `BaseCelestialRendererOptions`

### Technical Details

- **Memory Management**: Each position sample uses ~24 bytes, with configurable history sizes (default: 1000 points)
- **Update Frequency**: Throttled to 16ms intervals (~60fps) to prevent excessive processing
- **Sampling Logic**: Only adds position samples when object moves beyond `minDistanceThreshold` (default: 1e-6 scene units)
- **LOD Thresholds**: Stars have 2x higher LOD thresholds than moons for orbit line and trail visibility

## [0.1.0] - 2024-01-XX

### Added

- **New Package**: Created `@teskooano/renderer-threejs-celestial` as a standalone package for base celestial rendering infrastructure
- **Base Renderer Classes**:
  - `CelestialRenderer` interface defining the contract for all celestial renderers
  - `BaseCelestialRenderer` abstract base class with common functionality
  - `LightArrayUtils` utility class for managing light sources in shaders
- **Billboard Management System**:
  - `BillboardManager` class for managing sprite-based LOD representations
  - Billboard utility functions for sprite creation and configuration
  - Distance-based visibility and smooth fading transitions
- **Type Definitions**:
  - `CelestialMeshOptions` for mesh creation configuration
  - `BaseCelestialRendererOptions` for renderer configuration
  - `LightSourceData` and `LightSourcesMap` for light source management
  - `BillboardLODConfig` and `BillboardInfo` for billboard configuration
- **Resource Management**:
  - Automatic material and texture tracking and disposal
  - Shared billboard texture caching for performance
  - Comprehensive cleanup methods to prevent memory leaks
- **Documentation**:
  - Complete README.md with usage examples
  - Detailed ARCHITECTURE.md explaining design patterns and integration points
  - TARGET_ARCHITECTURE.md outlining future compositional rendering plans

### Migration Notes

- This package extracts the base celestial rendering infrastructure from `@teskooano/systems-celestial`
- Provides a shared foundation that can be used by multiple celestial rendering systems
- Designed to support future migration to compositional rendering architecture
- All existing celestial renderers should be updated to import from this package instead of the old location
