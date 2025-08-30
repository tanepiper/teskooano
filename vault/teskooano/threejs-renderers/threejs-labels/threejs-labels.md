---
aliases: [threejs-labels, labels, css2d, ui-labels, celestial-labels]
tags: [renderer, threejs, labels, ui, css2d, celestial, markers, predictions]
type: index
package: "@teskooano/renderer-threejs-labels"
version: "0.4.0-dev.0"
dependencies:
  [
    "@teskooano/core-math",
    "@teskooano/data-types",
    "@teskooano/data-values",
    "@teskooano/renderer-threejs-core",
    "@teskooano/renderer-threejs-objects",
    "three",
  ]
classes:
  [
    "Layer2DManager",
    "BaseLabelLayer",
    "CelestialLabelLayer",
    "AuMarkerLabelLayer",
    "PredictionLabelLayer",
    "AuMarkerManager",
    "CelestialLabelComponent",
    "AuMarkerLabelComponent",
    "PredictionLabel",
    "CSS2DRenderer",
  ]
functions: ["setText", "setTimeCategory"]
constants:
  [
    "TAG_NAME",
    "CELESTIAL_LABEL_TAG",
    "PREDICTION_LABEL_TAG",
    "CSS2DLayerType",
    "AU_METERS",
    "METERS_TO_SCENE_UNITS",
    "SCALE",
  ]
types:
  [
    "LabelSystem",
    "LabelSystemOptions",
    "LabelVisibilityConfig",
    "RenderableCelestialObject",
    "CelestialType",
    "OcclusionConfig",
    "UIRegistryComponent",
    "VisibilityLevel",
  ]
status: active
---

# Three.js Labels (`@teskooano/renderer-threejs-labels`)

The comprehensive 2D label system for the Teskooano renderer, providing CSS2D-based UI elements that overlay the 3D scene.

## 🎯 Purpose

This package provides a sophisticated 2D label system that renders HTML-based UI elements in 3D space:

- **Celestial Labels**: Dynamic labels for planets, stars, moons, and other celestial bodies
- **AU Distance Markers**: Ring-based distance indicators with 2D labels
- **Prediction Labels**: Time-based trajectory prediction markers
- **Occlusion Detection**: Smart visibility management to prevent labels from showing through objects
- **Performance Optimization**: Efficient rendering with caching and throttling

## 📚 Documentation Structure

### Core System

- [[Layer2DManager]] - Main orchestrator for all CSS2D layers
- [[LabelSystem Interface]] - System configuration and initialization interface

### Layer Architecture

- [[BaseLabelLayer]] - Abstract base class for all label layers
- [[CelestialLabelLayer]] - Labels for celestial bodies with distance and speed info
- [[AuMarkerLabelLayer]] - Distance marker labels with occlusion detection
- [[PredictionLabelLayer]] - Trajectory prediction labels with time-based visibility

### Managers

- [[AuMarkerManager]] - Manages AU distance rings and their labels

### Web Components

- [[CelestialLabelComponent]] - Custom element for celestial body labels
- [[AuMarkerLabelComponent]] - Custom element for AU distance markers
- [[PredictionLabel]] - Custom element for prediction labels

### Architecture & Patterns

- [[CSS2D Label Architecture]] - Overall system architecture
- [[Occlusion Detection System]] - Performance-optimized visibility management
- [[Web Component Integration]] - Custom element registration and lifecycle

## 🔄 Quick Navigation

### By Component Type

- **System Management**: [[Layer2DManager]], [[LabelSystem Interface]]
- **Layer Types**: [[BaseLabelLayer]], [[CelestialLabelLayer]], [[AuMarkerLabelLayer]], [[PredictionLabelLayer]]
- **Managers**: [[AuMarkerManager]]
- **Web Components**: [[CelestialLabelComponent]], [[AuMarkerLabelComponent]], [[PredictionLabel]]

### By Architecture Pattern

- **Manager Pattern**: [[Layer2DManager]] orchestrates all layers
- **Layer Pattern**: Each label type has its own specialized layer
- **Web Component Pattern**: Custom HTML elements for label rendering
- **Occlusion Pattern**: Performance-optimized visibility detection
- **Caching Pattern**: Efficient attribute and position caching

## 🚀 Getting Started

1. Start with [[Layer2DManager]] to understand the core system
2. Explore [[BaseLabelLayer]] for the layer architecture foundation
3. Learn about [[CelestialLabelLayer]] for celestial body labeling
4. Check out [[AuMarkerManager]] for distance marker system
5. Review [[Occlusion Detection System]] for performance optimization

## 📦 Dependencies

This package depends on the following packages:

- **[[data-types]]** - Core data structures and types
- **[[core-math]]** - Vector mathematics (OSVector3)
- **[[data-values]]** - Constants and scale values
- **[[threejs-objects]]** - Object management and mesh access
- **[[threejs-core]]** - Render order management
- **Three.js** - Three.js core library and CSS2DRenderer

---
