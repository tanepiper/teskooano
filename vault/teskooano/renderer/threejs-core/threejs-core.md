---
aliases: [threejs-core, core-renderer, scene-manager, animation-loop]
tags: [renderer, threejs, core, foundation, scene, animation]
type: index
package: "@teskooano/renderer-threejs-core"
version: "0.4.0-dev.0"
dependencies:
  [
    "@teskooano/core-state",
    "@teskooano/data-types",
    "@teskooano/renderer-threejs-helpers",
    "three",
    "rxjs",
  ]
classes:
  [
    "SceneManager",
    "AnimationLoop",
    "DebugSphereManager",
    "GridManager",
    "DepthBufferDebugger",
    "LogarithmicDepthMaterial",
    "RenderOrderManager",
    "Subject",
  ]
functions: ["getPerformanceOptimization"]
constants:
  [
    "DEBUG_SPHERE_CONFIG",
    "GRID_LEVELS",
    "GRID_COLORS",
    "logDepthVertexChunk",
    "logDepthFragmentChunk",
    "RENDER_ORDERS",
  ]
types:
  [
    "RendererStats",
    "Callback",
    "RenderLoopPayload",
    "ResizePayload",
    "PerformanceOptimization",
    "MaterialAnalysisResult",
    "RenderOrderAnalysisResult",
    "GridLevel",
    "SceneManagerOptions",
    "DeviceTier",
    "WebGLCapabilities",
  ]
status: active
---

# Three.js Core (`@teskooano/renderer-threejs-core`)

The foundational package that provides the core Three.js infrastructure for the Teskooano renderer system.

## 🎯 Purpose

This package establishes the fundamental building blocks for 3D rendering:

- **Scene Management**: Creating and managing the Three.js scene
- **Animation Loop**: Driving the render cycle with `requestAnimationFrame`
- **Event System**: Centralized event bus for renderer communication
- **Performance Optimization**: Device capability detection and optimization
- **Debug Tools**: Comprehensive debugging and analysis utilities

## 📚 Documentation Structure

### Core Components

- [[SceneManager]] - Main scene orchestrator with Three.js setup
- [[AnimationLoop]] - RequestAnimationFrame loop management
- [[rendererEvents]] - Centralized event bus for renderer communication

### Performance & Optimization

- [[PerformanceOptimization]] - Device capability detection and optimization
- [[LogarithmicDepthMaterial]] - Logarithmic depth buffer for space-scale precision
- [[RenderOrderManager]] - Centralized render order management

### Debug & Analysis

- [[DepthBufferDebugger]] - Depth buffer analysis and debugging
- [[GridManager]] - Dynamic grid helper management
- [[DebugSphereManager]] - Debug sphere at origin management

### Architecture & Patterns

- [[Core Renderer Architecture]] - Overall system architecture
- [[Performance Optimization Patterns]] - Performance considerations and strategies

## 🔄 Quick Navigation

### By Component Type

- **Scene Management**: [[SceneManager]], [[GridManager]], [[DebugSphereManager]]
- **Animation**: [[AnimationLoop]], [[rendererEvents]]
- **Performance**: [[PerformanceOptimization]], [[LogarithmicDepthMaterial]]
- **Debug**: [[DepthBufferDebugger]], [[RenderOrderManager]]

### By Architecture Pattern

- **Singleton Pattern**: [[SceneManager]] provides single scene instance
- **Observer Pattern**: [[AnimationLoop]] uses callback system for extensibility
- **Event-Driven Architecture**: [[rendererEvents]] enables loose coupling
- **Resource Management**: Automatic cleanup and disposal methods

## 🚀 Getting Started

1. Start with [[SceneManager]] to understand scene setup
2. Explore [[AnimationLoop]] for render cycle management
3. Learn about [[rendererEvents]] for system communication
4. Check out [[PerformanceOptimization]] for device optimization
5. Review [[LogarithmicDepthMaterial]] for space-scale precision

## 📦 Dependencies

This package depends on the following packages:

- **[[core/core-state/core-state|Core State]]** - State management and subscriptions
- **[[data/data-types/data-types|Data Types]]** - Core data structures and types
- **[[threejs-helpers]]** - Utility functions and helpers
- **Three.js** - Three.js core library

---
