# @teskooano/renderer-threejs-orbits

This package provides visualization of orbital paths using Three.js for the Teskooano space simulation engine.

## Features

- **Keplerian Orbits**: Renders static, idealized elliptical paths based on orbital parameters.
- **Verlet-based Trajectories**:
  - **Trails**: Shows the recent, historical path of an object.
  - **Predictions**: Shows the predicted future path for a selected object based on physics calculations.
- **Dynamic Mode Switching**: Seamlessly toggle between Keplerian and Verlet visualization modes.
- **Memory-Efficient**: Uses buffer pooling and shared materials to minimize resource consumption.

## Architecture

The package is orchestrated by a central `OrbitsManager` which delegates tasks to specialized sub-managers for each visualization type (`KeplerianManager`, `TrailManager`, `PredictionManager`). This provides a clean separation of concerns.

For a detailed explanation of the design, see the [ARCHITECTURE.md](./ARCHITECTURE.md) file.

## Usage

The `OrbitsManager` is typically instantiated and managed by a higher-level renderer class.

```typescript
import {
  OrbitsManager,
  VisualizationMode,
} from "@teskooano/renderer-threejs-orbits";
import { SceneManager } from "@teskooano/renderer-threejs-core";
import * as THREE from "three";

// --- Initialization ---
const sceneManager = new SceneManager(new THREE.Scene());
const orbitsManager = new OrbitsManager(sceneManager);

// --- In the Render Loop ---
function animate() {
  requestAnimationFrame(animate);

  // The OrbitsManager's update method handles all orbit-related updates
  orbitsManager.update();
}

// --- Interacting with the Manager ---

// Toggle between Keplerian and Verlet modes
orbitsManager.setVisualizationMode(VisualizationMode.Keplerian);
orbitsManager.setVisualizationMode(VisualizationMode.Verlet);

// Toggle orbit visibility on and off
orbitsManager.toggleVisualization();

// Highlight the orbit/path for a specific object
orbitsManager.highlightVisualization("celestialObjectId");

// --- Cleanup ---
orbitsManager.dispose();
```
