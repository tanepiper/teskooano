# @teskooano/core-debug

A utility package providing debug tools for the Teskooano engine.

## Features

- **Central Debug Configuration**: Global settings (`debugConfig`) to control log level (`DebugLevel`), enable/disable console logging (`debugConfig.logging`), and toggle debug visualizations (`debugConfig.visualize`). Includes helper functions (`isDebugEnabled`, `isVisualizationEnabled`, `setVisualizationEnabled`).
- **Custom Logger**: A logger (`logger.ts`) with multiple levels (ERROR, WARN, INFO, DEBUG, TRACE), support for context/module names (`createLogger`), and basic performance timing (`logger.time`).
- **Celestial Debugging**: In-memory storage (`celestial-debug.ts`) for caching and retrieving detailed debug information about celestial objects, including physics, orbital, material, and lighting properties.
- **Vector Debugging**: Helpers (`vector-debug.ts`) for storing, retrieving, and potentially logging `OSVector3` instances associated with specific objects or contexts.
- **THREE.js Vector Debugging**: Specific helpers (`three-vector-debug.ts`) for storing, retrieving, and potentially logging `THREE.Vector3` instances, useful for debugging rendering and geometry calculations.

## Usage

### Global Configuration

Control debug output globally. It's recommended to check these flags before performing expensive debug operations or visualizations.

```typescript
import {
  debugConfig,
  DebugLevel,
  isDebugEnabled,
  isVisualizationEnabled,
  setVisualizationEnabled,
} from "@teskooano/core-debug";

// Set the maximum log level (default: INFO in dev, ERROR in prod)
debugConfig.level = DebugLevel.DEBUG;

// Enable/disable visualization helpers (default: true in dev, false in prod)
setVisualizationEnabled(true);

// Check if a specific log level is active
if (isDebugEnabled(DebugLevel.TRACE)) {
  console.log("Trace logging is enabled");
}

// Check if visualization should occur
if (isVisualizationEnabled()) {
  // Add debug meshes, draw lines, etc.
}
```

### Logging

Use the built-in logger or create module-specific instances.

```typescript
import {
  error,
  warn,
  info,
  debug,
  trace,
  createLogger,
  isDebugEnabled,
  DebugLevel,
} from "@teskooano/core-debug";

// Default logger
info("System initialized");
warn("Potential issue detected: Resource limit approaching");
error("Failed to load critical resource", { id: "config.json", status: 404 });

// Conditional debug/trace logging
if (isDebugEnabled(DebugLevel.DEBUG)) {
  debug("Processing item", { itemId: 123, data: { value: "example" } });
}
trace("Entering complex calculation"); // Only logs if level is TRACE

// Module-specific logger
const physicsLogger = createLogger("PhysicsEngine");
physicsLogger.info("Physics system started.");
physicsLogger.debug("Applying impulse", {
  objectId: "ship-alpha",
  impulse: [0, 100, 0],
});

// Basic performance timing (logs duration at INFO level)
physicsLogger.time("integrateVelocities", () => {
  // Perform expensive physics calculations...
  for (let i = 0; i < 1e6; i++) {
    Math.sqrt(i);
  }
});
// Output might be: [PhysicsEngine] INFO: integrateVelocities took 15.23ms
```

### Vector Debugging (`OSVector3`)

Store and retrieve custom math vectors.

```typescript
import { vectorDebug, isVisualizationEnabled } from "@teskooano/core-debug";
import { OSVector3 } from "@teskooano/core-math";

const objId = "planet-x";

// Only store if visualization/debugging is active
if (isVisualizationEnabled()) {
  vectorDebug.setVector(objId, "position", new OSVector3(100, 0, 0));
  vectorDebug.setVector(objId, "velocity", new OSVector3(0, 10, 0));
}

// Retrieve later (e.g., in a debug panel)
const pos = vectorDebug.getVector(objId, "position");
if (pos) {
  console.log(`Position of ${objId}:`, pos.toString());
}
const allVectors = vectorDebug.getVectors(objId);
console.log(`All debug vectors for ${objId}:`, allVectors);

// Clear vectors when object is removed or debug session ends
vectorDebug.clearVectors(objId); // Clear for one object
// vectorDebug.clearAll(); // Clear everything
```

### THREE.js Vector Debugging (`THREE.Vector3`)

Store and retrieve THREE.js vectors, useful for rendering-related debugging.

```typescript
import {
  threeVectorDebug,
  isVisualizationEnabled,
} from "@teskooano/core-debug";
import * as THREE from "three";

const renderId = "mesh-alpha";
const sunDirection = new THREE.Vector3(1, 0, 0);
const upDirection = new THREE.Vector3(0, 1, 0);

if (isVisualizationEnabled()) {
  // Store multiple vectors at once
  threeVectorDebug.setVectors(renderId, {
    sunDir: sunDirection,
    localUp: upDirection,
  });
}

// Retrieve later
const debugData = threeVectorDebug.getVectors(renderId);
if (debugData) {
  console.log(`Sun direction for ${renderId}:`, debugData.sunDir);
}

// Clear vectors
threeVectorDebug.clearVectors(renderId);
// threeVectorDebug.clearAll();
```

### Celestial Object Debugging

Store and retrieve a rich set of debug data for celestial objects. This system uses a performant in-memory cache, making it safe to use in performance-critical code paths when visualization is enabled.

```typescript
import {
  celestialDebugger,
  isVisualizationEnabled,
} from "@teskooano/core-debug";

const objectId = "earth";

if (isVisualizationEnabled()) {
  // Store physics data
  celestialDebugger.setPhysicsData(objectId, {
    mass: 5.972e24,
    radius: 6371000,
    density: 5514,
  });

  // Store orbital data
  celestialDebugger.setOrbitalData(objectId, {
    semiMajorAxis: 149.6e9,
    eccentricity: 0.0167,
  });
}

// --- Later, in a debug panel or console ---

// Get all data for an object
const allDebugData = celestialDebugger.getDebugData(objectId);
if (allDebugData) {
  console.log(`Physics data for ${objectId}:`, allDebugData.physics);
  console.log(`Orbital data for ${objectId}:`, allDebugData.orbital);
}

// Get all object IDs being tracked
const trackedIds = celestialDebugger.getTrackedObjectIds();
console.log("Tracked celestial objects:", trackedIds);

// Clean up data for a specific object
celestialDebugger.clearObjectDebugData(objectId);

// Clean up all data
celestialDebugger.clearAllCelestialDebugData();
```

---

_Remember to commit often! `git commit -m "docs(debug): update README for v0.2.0"`_
