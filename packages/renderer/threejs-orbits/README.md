# @teskooano/renderer-threejs-orbits

This package is responsible for all orbit visualization within the Teskooano engine.

## Features

- **Dual Visualization Modes**: Dynamically switches between two modes to match the active physics engine:
  - **Keplerian Mode**: Renders precise, analytical orbital ellipses based on an object's orbital parameters.
  - **Verlet Mode**: Renders numerically-integrated paths, including historical trails and predicted future trajectories.
- **Centralized Management**: An `OrbitsManager` orchestrates all orbit-related rendering.
- **Highlighting**: Supports highlighting the orbit of a specific object.
- **Performance-Optimized**: Uses shared materials and efficient buffer management to minimize performance overhead.

## Architecture

The package uses a **Strategy Pattern**, where the `OrbitsManager` acts as the main context. It switches between different visualization strategies (`KeplerianManager` vs. a combination of `TrailManager` and `PredictionManager`) based on the simulation's active physics engine state. This keeps the rendering logic decoupled and allows for easy expansion.

For a complete breakdown and a component diagram, please see the `ARCHITECTURE.md` file.

## Usage

This package is an internal dependency of `@teskooano/renderer-threejs`. The main `ModularSpaceRenderer` instantiates the `OrbitsManager` and calls its `updateAllVisualizations()` method from the main render pipeline. It is not designed to be used directly by the application.

```typescript
// Simplified conceptual usage inside ModularSpaceRenderer

import { OrbitsManager } from "@teskooano/renderer-threejs-orbits";
import { renderableStore } from "@teskooano/core-state";
import { stateAdapter } from "./RendererStateAdapter"; // Assuming stateAdapter is available

// --- Initialization ---
const orbitsManager = new OrbitsManager(
  this.objectManager, // Assumes an ObjectManager instance
  this.stateAdapter,
  renderableStore.renderableObjects$,
);

// --- In the Render Loop / Pipeline ---
function animate() {
  // This single call triggers updates for the currently active orbit strategy
  orbitsManager.updateAllVisualizations();
}

// --- Changing Visualization Mode ---
// The OrbitsManager automatically listens for changes from the RendererStateAdapter
// and switches its internal strategy. No direct call is needed.

// --- Highlighting an orbit ---
orbitsManager.highlightVisualization("earth"); // Highlight Earth's orbit
orbitsManager.highlightVisualization(null); // Clear highlight

// --- Cleanup ---
orbitsManager.dispose();
```
