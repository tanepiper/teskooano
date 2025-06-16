# `@teskooano/renderer-threejs-labels`

This package provides a flexible, layer-based system for rendering HTML-based UI elements (labels, markers) that are positioned in 3D space within the Teskooano Three.js scene.

For a detailed explanation of the internal architecture, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Features

- **`CSS2DManager`**: A lightweight manager for the `THREE.CSS2DRenderer`. It handles the render loop and provides a registry for different label layers.
- **Dynamic Layers**: The system is built around extensible layers. Each layer (`AuMarkerLabelLayer`, `CelestialLabelLayer`) encapsulates the logic and required HTML components for a specific type of label.
- **Configurable**: Layers can be configured during instantiation. For example, `CelestialLabelLayer` accepts a `LabelVisibilityConfig` to control visibility distances.

## Usage

The `CSS2DManager` is instantiated by a higher-level renderer. Layers are then created and registered with the manager.

```typescript
import * as THREE from "three";
import {
  CSS2DManager,
  CSS2DLayerType,
  CelestialLabelLayer,
  AuMarkerLabelLayer,
} from "@teskooano/renderer-threejs-labels";

// --- Initialization ---
const scene = new THREE.Scene();
const container = document.getElementById("renderer-container");

// 1. Create the manager
const css2dManager = new CSS2DManager(scene, container);

// 2. Create and register layers
const celestialLayer = new CelestialLabelLayer({ planet: 500 }); // Optional config
css2dManager.registerLayer(CSS2DLayerType.CELESTIAL_LABELS, celestialLayer);

const auMarkerLayer = new AuMarkerLabelLayer(scene);
css2dManager.registerLayer(CSS2DLayerType.AU_MARKERS, auMarkerLayer);

// --- Interacting with Layers ---

// The higher-level renderer would call the appropriate layer's create method
const my3dObject = new THREE.Mesh();
scene.add(my3dObject);
// This would typically be called from a class like ObjectManager
celestialLayer.createLabel(
  { celestialObjectId: "my-object", name: "My Object" }, // Simplified object data
  my3dObject,
);

// --- In the Render Loop ---
function animate(camera) {
  // Main WebGL render call happens here...

  // Update and render all registered CSS2D layers
  css2dManager.update(camera, scene.children[0]);
  css2dManager.render(camera);
}

// --- Cleanup ---
css2dManager.dispose();
```

## Core Components

- **`CSS2DManager`:** Manages the `CSS2DRenderer` and a registry of layers.
- **`BaseLabelLayer`:** The abstract base class for all label layers.
- **`CelestialLabelLayer`:** A layer for rendering labels on celestial objects.
- **`AuMarkerLabelLayer`:** A layer for rendering distance markers (e.g., 1 AU, 5 AU).
- **`CelestialLabelComponent` / `AuMarkerLabelComponent`:** The HTML Custom Elements that define the labels' appearance.

## Dependencies

- `three`
- `@teskooano/data-types`
- `@teskooano/renderer-threejs-objects`
