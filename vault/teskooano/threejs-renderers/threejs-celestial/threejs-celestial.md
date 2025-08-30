---
aliases: [threejs-celestial, celestial-renderer, base-celestial-renderer]
tags: [renderer, threejs, celestial, base-class, architecture]
type: index
name: "@teskooano/renderer-threejs-celestial"
version: "0.4.0-dev.0"
dependencies:
  [
    "@teskooano/core-state",
    "@teskooano/data-types",
    "@teskooano/core-math",
    "@teskooano/core-physics",
    "@teskooano/renderer-threejs-lighting",
    "@teskooano/renderer-threejs-lod",
    "@teskooano/renderer-threejs-core",
    "@teskooano/renderer-threejs-helpers",
    "@teskooano/web-apis",
    "three",
  ]
classes:
  [
    "BaseCelestialRenderer",
    "CelestialRenderer",
    "BillboardManager",
    "CelestialLightingManager",
    "PositionHistoryManager",
    "MaterialManager",
    "LODManager",
    "TimeManager",
    "GeometryUtilities",
    "PerformanceMonitor",
    "LightArrayUtils",
    "LightingCalculator",
    "ShadowCasterUtils",
    "CircularBuffer",
  ]
functions: ["createFallbackSphere", "getCelestialLayers"]
constants: ["AU_METERS", "METERS_TO_SCENE_UNITS"]
types:
  [
    "RenderableCelestialObject",
    "CelestialType",
    "OSVector3",
    "LightSourcesMap",
    "LightSourceData",
    "ShadowCasterData",
    "LODLevel",
    "CelestialMeshOptions",
    "BaseCelestialRendererOptions",
    "OrbitalConfig",
    "TimePoint",
    "BillboardLODConfig",
    "BillboardInfo",
    "LightingConfig",
  ]
status: active
---

# Three.js Celestial (`@teskooano/renderer-threejs-celestial`)

The foundational package for celestial object rendering, providing base classes, interfaces, and utilities that all celestial renderers build upon.

## 🎯 Purpose

This package establishes the core architecture for rendering celestial objects:

- **Base Classes**: Abstract renderer classes with common functionality
- **Orbital Management**: Centralized position history and LOD-based rendering
- **Material Management**: Automatic lifecycle management for materials and textures
- **Light Integration**: Utilities for managing light sources in shaders
- **Billboard System**: Sprite-based representations for distant objects
- **Debug Support**: Comprehensive debugging and fallback utilities

## 📚 Documentation Structure

### Core Components

- [[BaseCelestialRenderer]] - Abstract base class for all celestial renderers
- [[CelestialRenderer Interface]] - Core interface contract for renderers
- [[PositionHistoryManager]] - Orbital data management and position history
- [[BillboardManager]] - Sprite-based distant object representations

### Manager Classes

- [[MaterialManager]] - Material lifecycle and disposal management
- [[LODManager]] - Level of Detail object management
- [[CelestialLightingManager]] - Comprehensive lighting management
- [[TimeManager]] - Time tracking and animation utilities
- [[GeometryUtilities]] - Performance-optimized geometry calculations
- [[PerformanceMonitor]] - Device capability detection and optimization

### Lighting System

- [[LightArrayUtils]] - Light source array management for shaders
- [[LightingCalculator]] - Instance-based lighting calculations
- [[ShadowCasterUtils]] - Shadow caster detection and management

### Debug System

- [[CelestialRendererDebugHelper]] - Comprehensive debugging support
- [[createFallbackSphere]] - Emergency fallback rendering

### Architecture & Patterns

- [[Celestial Renderer Architecture]] - Overall system architecture
- [[Manager Pattern in Celestial]] - Manager pattern implementation
- [[Performance Optimization]] - Performance considerations and strategies

## 🔄 Quick Navigation

### By Component Type

- **Base Classes**: [[BaseCelestialRenderer]], [[CelestialRenderer Interface]]
- **Data Management**: [[PositionHistoryManager]], [[MaterialManager]]
- **Rendering**: [[BillboardManager]], [[LODManager]]
- **Lighting**: [[CelestialLightingManager]], [[LightArrayUtils]]
- **Utilities**: [[TimeManager]], [[GeometryUtilities]]
- **Debug**: [[CelestialRendererDebugHelper]], [[createFallbackSphere]]

### By Architecture Pattern

- **Manager Pattern**: [[Manager Pattern in Celestial]]
- **Template Method**: [[BaseCelestialRenderer]]
- **Resource Management**: [[MaterialManager]], [[PositionHistoryManager]]
- **Performance**: [[PerformanceMonitor]], [[Performance Optimization]]

## 🚀 Getting Started

1. Start with [[CelestialRenderer Interface]] to understand the contract
2. Explore [[BaseCelestialRenderer]] for the base implementation
3. Learn about [[PositionHistoryManager]] for orbital data management
4. Check out [[BillboardManager]] for distant object rendering
5. Review [[Performance Optimization]] for best practices

## 📦 Dependencies

This package depends on the following packages:

- **[[core-state]]** - State management and subscriptions
- **[[data-types]]** - Core data structures and types
- **[[core-math]]** - Vector mathematics (OSVector3)
- **[[core-physics]]** - WASM spatial service for shadow detection
- **[[threejs-lighting]]** - Lighting system integration
- **[[threejs-lod]]** - Level of Detail utilities
- **[[threejs-core]]** - Core renderer events and utilities
- **[[threejs-helpers]]** - Utility functions and helpers
- **[[web-apis]]** - Web API monitoring (battery, memory, idle detection)
- **Three.js** - Three.js core library

---

_This package provides the foundation for all celestial object rendering in the Teskooano system, with comprehensive support for performance optimization, debugging, and fallback rendering._
