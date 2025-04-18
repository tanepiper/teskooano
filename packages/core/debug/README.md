# @teskooano/core-debug

A utility package providing debug tools for the Teskooano engine.

## Features

- **Debug Logging** - Comprehensive logging with multiple log levels and module-specific loggers
- **Vector Debugging** - Utilities for capturing and analyzing vector data during runtime
- **THREE.js Integration** - Specific tools for debugging THREE.js vector operations
- **Performance Timing** - Utilities for measuring execution time

## Usage

### Basic Setup

```typescript
import { debugConfig, DebugLevel } from "@teskooano/core-debug";

// Configure debug behavior
debugConfig.level = DebugLevel.DEBUG; // Set debug level
debugConfig.visualize = true; // Enable visual debugging
debugConfig.logging = true; // Enable console logging
```

### Logging

```typescript
import {
  error,
  warn,
  info,
  debug,
  trace,
  createLogger,
} from "@teskooano/core-debug";

// Basic logging
info("System initialized");
warn("Potential issue detected");
error("Failed to load resource", { resourceId: 123 });

// Module-specific logger
const logger = createLogger("PhysicsEngine");
logger.info("Physics system started");
logger.debug("Applying force", { x: 10, y: 0, z: 0 });

// Performance timing
logger.time("update", () => {
  // Expensive operation here
  for (let i = 0; i < 1000; i++) {
    // Do work
  }
});
```

### Vector Debugging

```typescript
import { vectorDebug } from "@teskooano/core-debug";
import { OSVector3 } from "@teskooano/core-math";

// Store vectors for a specific context
vectorDebug.setVector("planet-1", "position", new OSVector3(100, 0, 0));
vectorDebug.setVector("planet-1", "velocity", new OSVector3(0, 10, 0));

// Retrieve vectors
const position = vectorDebug.getVector("planet-1", "position");
const allVectors = vectorDebug.getVectors("planet-1");
```

### THREE.js Integration

```typescript
import { threeVectorDebug } from "@teskooano/core-debug";

// Store THREE.js vectors
threeVectorDebug.setVector("ring-system", "sunDir", sunDirection);
threeVectorDebug.setVector("ring-system", "parentPos", parentPosition);

// Or store multiple vectors at once
threeVectorDebug.setVectors("ring-system", {
  sunDir: sunDirection,
  parentPos: parentPosition,
});
```

## Integration Example for Ring System

Replace existing debug code in `packages/systems/celestial/src/renderers/rings/rings.ts`:

```typescript
// Before:
// --- DEBUG ---
public debugVectors: Map<
  string,
  { sunDir: THREE.Vector3; parentPos: THREE.Vector3 }
> = new Map();
// --- END DEBUG ---

// After:
import { threeVectorDebug, isVisualizationEnabled } from '@teskooano/core-debug';

// Then, wherever the debug vectors are set:
if (isVisualizationEnabled()) {
  threeVectorDebug.setVectors(`ring-system-${this.id}`, {
    sunDir: sunDir,
    parentPos: parentPos
  });
}
```
