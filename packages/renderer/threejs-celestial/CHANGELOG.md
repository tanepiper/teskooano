# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
