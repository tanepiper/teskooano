---
aliases: [GridManager, grid-helper, dynamic-grid, spatial-reference]
tags: [renderer, threejs, core, grid, debug, spatial]
type: Class
package: "@teskooano/renderer-threejs-core"
name: GridManager
dependencies: ["three"]
classes: ["THREE.Scene", "THREE.GridHelper", "THREE.PerspectiveCamera"]
functions: []
constants: ["GRID_LEVELS", "GRID_COLORS"]
types: ["GridLevel"]
status: active
---

# GridManager

Manages the `THREE.GridHelper` for a scene, providing dynamic grid scaling and density adjustment based on camera distance.

## 🎯 Purpose

The GridManager provides:

- **Dynamic Grid Scaling**: Automatically adjusts grid size and density based on camera distance
- **Spatial Reference**: Provides visual reference for spatial orientation and scale
- **Performance Optimization**: Efficient grid recreation and disposal
- **Distance-Based LOD**: Multiple grid levels for different zoom ranges
- **Visual Consistency**: Maintains appropriate visual density at all zoom levels

## 🏗️ Architecture

### Grid Levels

Pre-defined grid configurations for different distance ranges:

```typescript
const GRID_LEVELS: GridLevel[] = [
  { maxDistance: 1e1, size: 1e2, divisions: 100 }, // 10 units: 100x100 grid
  { maxDistance: 1e2, size: 1e3, divisions: 100 }, // 100 units: 1000x1000 grid
  { maxDistance: 1e3, size: 1e4, divisions: 100 }, // 1000 units: 10000x10000 grid
  { maxDistance: 1e4, size: 1e5, divisions: 100 }, // 10000 units: 100000x100000 grid
  { maxDistance: 1e5, size: 1e6, divisions: 100 }, // 100000 units: 1000000x1000000 grid
  { maxDistance: 1e6, size: 1e7, divisions: 100 }, // 1000000 units: 10000000x10000000 grid
  { maxDistance: 1e7, size: 1e8, divisions: 100 }, // 10000000 units: 100000000x100000000 grid
  { maxDistance: Infinity, size: 1e9, divisions: 100 }, // Maximum: 1000000000x1000000000 grid
];
```

### Core Components

```typescript
class GridManager {
  private scene: THREE.Scene;
  private gridHelper: THREE.GridHelper | null = null;
  private currentLevel = -1;
  private isGridVisible = true;

  // Core methods
  public update(camera: THREE.PerspectiveCamera): void;
  public setVisible(visible: boolean): void;
  public toggle(): void;
  public isVisible(): boolean;
  public dispose(): void;
}
```

### Grid Colors

Centralized color constants for consistent theming:

```typescript
const GRID_COLORS = {
  COLOR_CENTER_LINE: 0xff0000, // Red center lines
  COLOR_GRID: 0x444444, // Dark gray grid lines
};
```

## 🔧 Core Methods

### Lifecycle Management

#### Constructor

Creates a new GridManager instance.

```typescript
constructor(scene: THREE.Scene, initialVisibility = true)
```

**Process:**

1. Stores scene reference
2. Sets initial visibility state
3. Creates initial grid if visibility is enabled

#### dispose()

Cleans up grid resources and removes from scene.

```typescript
public dispose(): void
```

**Process:**

1. Removes grid helper from scene
2. Disposes geometry and material
3. Nullifies references
4. Resets current level

### Visibility Control

#### setVisible()

Sets the visibility of the grid.

```typescript
public setVisible(visible: boolean): void
```

**Process:**

1. Updates visibility state
2. Disposes current grid if hiding
3. Creates new grid if showing

#### toggle()

Toggles the visibility of the grid.

```typescript
public toggle(): void
```

#### isVisible()

Returns current visibility state.

```typescript
public isVisible(): boolean
```

### Dynamic Updates

#### update()

Updates the grid based on camera position.

```typescript
public update(camera: THREE.PerspectiveCamera): void
```

**Process:**

1. Calculates camera distance from origin
2. Determines appropriate grid level
3. Recreates grid if level changed
4. Skips update if grid is hidden

## 🔄 Update Flow

### Grid Level Determination

```typescript
private _getGridLevel(distance: number): number {
  return GRID_LEVELS.findIndex((level) => distance < level.maxDistance);
}
```

**Logic:**

- Finds first grid level where camera distance is less than maxDistance
- Returns -1 if no level found (should not happen with Infinity level)

### Grid Recreation Process

```typescript
private _recreateGrid(newLevel: number): void {
  this.dispose();           // Clean up current grid
  this.currentLevel = newLevel;  // Update level
  this._create();           // Create new grid
}
```

### Grid Creation Process

```typescript
private _create(): void {
  if (this.gridHelper || this.currentLevel === -1) return;

  const config = GRID_LEVELS[this.currentLevel];
  if (!config) return;

  this.gridHelper = new THREE.GridHelper(
    config.size,
    config.divisions,
    GRID_COLORS.COLOR_CENTER_LINE,
    GRID_COLORS.COLOR_GRID
  );
  this.scene.add(this.gridHelper);
  this.gridHelper.visible = this.isGridVisible;
}
```

## 🚀 Usage Examples

### Basic Setup

```typescript
import { GridManager } from "@teskooano/renderer-threejs-core";

// Create grid manager
const gridManager = new GridManager(scene);

// Update grid based on camera position
function animate() {
  gridManager.update(camera);
  requestAnimationFrame(animate);
}

// Control visibility
gridManager.setVisible(true); // Show grid
gridManager.setVisible(false); // Hide grid
gridManager.toggle(); // Toggle visibility
```

### Integration with SceneManager

```typescript
// In SceneManager or similar
class SceneManager {
  private gridManager: GridManager;

  constructor(scene: THREE.Scene) {
    this.gridManager = new GridManager(scene, true);
  }

  update(camera: THREE.PerspectiveCamera) {
    this.gridManager.update(camera);
  }

  dispose() {
    this.gridManager.dispose();
  }
}
```

### Camera Distance Examples

```typescript
// Different camera distances trigger different grid levels
const camera = new THREE.PerspectiveCamera();

// Close view (10 units from origin)
camera.position.set(5, 5, 5);
gridManager.update(camera);
// Creates: 100x100 grid (level 0)

// Medium view (1000 units from origin)
camera.position.set(500, 500, 500);
gridManager.update(camera);
// Creates: 10000x10000 grid (level 2)

// Far view (100000 units from origin)
camera.position.set(50000, 50000, 50000);
gridManager.update(camera);
// Creates: 1000000x1000000 grid (level 4)
```

## 🎯 Performance Considerations

### Grid Recreation Strategy

- **Level-Based**: Only recreates grid when level changes
- **Efficient Disposal**: Proper cleanup of old grid resources
- **Lazy Creation**: Only creates grid when visibility is enabled

### Memory Management

- **Geometry Disposal**: Proper disposal of THREE.GridHelper geometry
- **Material Disposal**: Proper disposal of grid material
- **Scene Cleanup**: Removes grid from scene on disposal

### Update Frequency

- **Per-Frame Updates**: Called every frame to check camera distance
- **Level Changes Only**: Grid recreation only when level changes
- **Distance Calculation**: Simple distance calculation (minimal overhead)

## 🔍 Debug Features

### Grid Level Monitoring

```typescript
// Monitor grid level changes
let lastLevel = -1;

function updateGrid() {
  gridManager.update(camera);

  // Check if level changed
  const currentLevel = gridManager.currentLevel;
  if (currentLevel !== lastLevel) {
    console.log(`Grid level changed: ${lastLevel} -> ${currentLevel}`);
    lastLevel = currentLevel;
  }
}
```

### Distance Analysis

```typescript
// Analyze camera distance and grid level
function analyzeGridLevel(camera: THREE.PerspectiveCamera) {
  const distance = camera.position.length();
  const level = GRID_LEVELS.findIndex((l) => distance < l.maxDistance);

  console.log(`Camera distance: ${distance.toFixed(2)}`);
  console.log(`Grid level: ${level}`);
  console.log(`Grid size: ${GRID_LEVELS[level]?.size || "unknown"}`);
}
```

## 📚 Related Components

- [[SceneManager]] - Scene management and camera access
- [[DebugSphereManager]] - Debug sphere at origin
- [[Performance Optimization]] - Performance considerations
- [[DepthBufferDebugger]] - Debug analysis tools

## 🏛️ Architecture Patterns

- **Manager Pattern**: Centralized grid management
- **Level of Detail**: Distance-based grid scaling
- **Resource Management**: Proper disposal and cleanup
- **Observer Pattern**: Camera-based updates

## 🔧 Advanced Usage

### Custom Grid Levels

```typescript
// Define custom grid levels
const CUSTOM_GRID_LEVELS: GridLevel[] = [
  { maxDistance: 50, size: 100, divisions: 50 },
  { maxDistance: 500, size: 1000, divisions: 50 },
  { maxDistance: Infinity, size: 10000, divisions: 50 },
];

// Extend GridManager for custom levels
class CustomGridManager extends GridManager {
  private static readonly CUSTOM_LEVELS = CUSTOM_GRID_LEVELS;

  private _getGridLevel(distance: number): number {
    return CustomGridManager.CUSTOM_LEVELS.findIndex(
      (level) => distance < level.maxDistance,
    );
  }
}
```

### Grid Color Customization

```typescript
// Custom grid colors
const CUSTOM_GRID_COLORS = {
  COLOR_CENTER_LINE: 0x00ff00, // Green center lines
  COLOR_GRID: 0x666666, // Light gray grid lines
};

// Apply custom colors
const gridHelper = new THREE.GridHelper(
  size,
  divisions,
  CUSTOM_GRID_COLORS.COLOR_CENTER_LINE,
  CUSTOM_GRID_COLORS.COLOR_GRID,
);
```

### Performance Monitoring

```typescript
// Monitor grid performance
let gridRecreationCount = 0;
let lastUpdateTime = 0;

function updateGridWithMonitoring() {
  const startTime = performance.now();

  const oldLevel = gridManager.currentLevel;
  gridManager.update(camera);

  if (gridManager.currentLevel !== oldLevel) {
    gridRecreationCount++;
    console.log(`Grid recreated ${gridRecreationCount} times`);
  }

  const updateTime = performance.now() - startTime;
  if (updateTime > 1) {
    // More than 1ms
    console.warn(`Grid update took ${updateTime.toFixed(2)}ms`);
  }
}
```

---

_The GridManager provides dynamic spatial reference grids that automatically scale with camera distance, ensuring consistent visual density and optimal performance across all zoom levels._
