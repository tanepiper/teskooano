---
aliases: [DebugSphereManager, debug-sphere, origin-sphere, spatial-reference]
tags: [renderer, threejs, core, debug, sphere, origin]
type: Class
package: "@teskooano/renderer-threejs-core"
name: DebugSphereManager
dependencies: ["three"]
classes:
  [
    "THREE.Scene",
    "THREE.Mesh",
    "THREE.SphereGeometry",
    "THREE.MeshBasicMaterial",
  ]
functions: []
constants: ["DEBUG_SPHERE_CONFIG"]
types: []
status: active
---

# DebugSphereManager

Manages the debug sphere at the origin for spatial reference, providing a visual marker for the world coordinate system.

## 🎯 Purpose

The DebugSphereManager provides:

- **Spatial Reference**: Visual marker at world origin (0,0,0)
- **Coordinate System**: Helps understand 3D coordinate system orientation
- **Debug Visualization**: Useful for debugging camera positioning and object placement
- **Origin Marker**: Clear reference point for spatial navigation
- **Toggle Control**: Easy visibility control for debug features

## 🏗️ Architecture

### Core Components

The DebugSphereManager manages a single debug sphere at the origin:

```typescript
class DebugSphereManager {
  private scene: THREE.Scene;
  private debugSphere: THREE.Mesh | null = null;
  private isVisible = false;

  // Core methods
  public setVisible(visible: boolean): void;
  public toggle(): void;
  public getVisible(): boolean;
  public dispose(): void;
}
```

### Sphere Configuration

Pre-defined configuration for the debug sphere:

```typescript
const DEBUG_SPHERE_CONFIG = {
  RADIUS: 0.5, // Sphere radius in scene units
  WIDTH_SEGMENTS: 16, // Horizontal segments
  HEIGHT_SEGMENTS: 16, // Vertical segments
  COLOR: 0xff00ff, // Magenta color for visibility
};
```

### Sphere Properties

- **Position**: Always at world origin (0, 0, 0)
- **Size**: Small radius (0.5 units) to avoid interference
- **Color**: Bright magenta for high visibility
- **Material**: Basic material for simplicity

## 🔧 Core Methods

### Lifecycle Management

#### Constructor

Creates a new DebugSphereManager instance.

```typescript
constructor(scene: THREE.Scene)
```

**Process:**

1. Stores scene reference
2. Initializes visibility state to false
3. Does not create sphere immediately (lazy creation)

#### dispose()

Cleans up debug sphere resources and removes from scene.

```typescript
public dispose(): void
```

**Process:**

1. Removes sphere from scene
2. Disposes geometry and material
3. Nullifies sphere reference

### Visibility Control

#### setVisible()

Sets the visibility of the debug sphere.

```typescript
public setVisible(visible: boolean): void
```

**Process:**

1. Updates visibility state
2. Creates sphere if showing and not exists
3. Updates sphere visibility if exists
4. Removes sphere if hiding

#### toggle()

Toggles the visibility of the debug sphere.

```typescript
public toggle(): void
```

#### getVisible()

Returns current visibility state.

```typescript
public getVisible(): boolean
```

### Sphere Creation

#### \_createDebugSphere()

Creates the debug sphere at the origin.

```typescript
private _createDebugSphere(): void
```

**Process:**

1. Creates sphere geometry with configured parameters
2. Creates basic material with configured color
3. Creates mesh and positions at origin
4. Adds to scene with appropriate name
5. Sets visibility based on current state

## 🔄 Creation Flow

### Lazy Creation Process

```typescript
public setVisible(visible: boolean): void {
  this.isVisible = visible;

  if (visible) {
    if (!this.debugSphere) {
      this._createDebugSphere();  // Create if doesn't exist
    }
    if (this.debugSphere) {
      this.debugSphere.visible = true;  // Show if exists
    }
  } else if (this.debugSphere) {
    this.debugSphere.visible = false;  // Hide if exists
  }
}
```

### Sphere Creation Process

```typescript
private _createDebugSphere(): void {
  if (this.debugSphere) return;  // Already exists

  const geometry = new THREE.SphereGeometry(
    DEBUG_SPHERE_CONFIG.RADIUS,
    DEBUG_SPHERE_CONFIG.WIDTH_SEGMENTS,
    DEBUG_SPHERE_CONFIG.HEIGHT_SEGMENTS
  );

  const material = new THREE.MeshBasicMaterial({
    color: DEBUG_SPHERE_CONFIG.COLOR
  });

  this.debugSphere = new THREE.Mesh(geometry, material);
  this.debugSphere.name = "debug-sphere-origin";
  this.debugSphere.position.set(0, 0, 0);
  this.scene.add(this.debugSphere);
}
```

## 🚀 Usage Examples

### Basic Setup

```typescript
import { DebugSphereManager } from "@teskooano/renderer-threejs-core";

// Create debug sphere manager
const debugSphereManager = new DebugSphereManager(scene);

// Control visibility
debugSphereManager.setVisible(true); // Show debug sphere
debugSphereManager.setVisible(false); // Hide debug sphere
debugSphereManager.toggle(); // Toggle visibility

// Check visibility state
const isVisible = debugSphereManager.getVisible();
console.log(`Debug sphere visible: ${isVisible}`);
```

### Integration with SceneManager

```typescript
// In SceneManager or similar
class SceneManager {
  private debugSphereManager: DebugSphereManager;

  constructor(scene: THREE.Scene) {
    this.debugSphereManager = new DebugSphereManager(scene);
  }

  setDebugMode(enabled: boolean) {
    this.debugSphereManager.setVisible(enabled);
  }

  dispose() {
    this.debugSphereManager.dispose();
  }
}
```

### Debug Mode Toggle

```typescript
// Toggle debug mode with keyboard
document.addEventListener("keydown", (event) => {
  if (event.key === "d" || event.key === "D") {
    debugSphereManager.toggle();
    console.log(
      `Debug sphere ${debugSphereManager.getVisible() ? "enabled" : "disabled"}`,
    );
  }
});
```

### Multiple Debug Objects

```typescript
// Create multiple debug objects
const debugObjects = {
  sphere: new DebugSphereManager(scene),
  grid: new GridManager(scene),
  // ... other debug objects
};

// Control all debug objects
function setDebugMode(enabled: boolean) {
  Object.values(debugObjects).forEach((manager) => {
    if (manager.setVisible) {
      manager.setVisible(enabled);
    }
  });
}
```

## 🎯 Performance Considerations

### Lazy Creation

- **On-Demand Creation**: Sphere only created when first shown
- **Memory Efficiency**: No unnecessary geometry/material creation
- **Scene Impact**: Minimal impact when not visible

### Resource Management

- **Proper Disposal**: Geometry and material properly disposed
- **Scene Cleanup**: Removes sphere from scene on disposal
- **Reference Management**: Nullifies references for garbage collection

### Visibility Impact

- **Minimal Overhead**: Basic sphere with simple material
- **Render Cost**: Only rendered when visible
- **Memory Footprint**: Small geometry and material

## 🔍 Debug Features

### Visibility Monitoring

```typescript
// Monitor debug sphere visibility changes
let lastVisibility = false;

function updateDebugSphere() {
  const currentVisibility = debugSphereManager.getVisible();

  if (currentVisibility !== lastVisibility) {
    console.log(
      `Debug sphere visibility changed: ${lastVisibility} -> ${currentVisibility}`,
    );
    lastVisibility = currentVisibility;
  }
}
```

### Position Verification

```typescript
// Verify debug sphere is at origin
function verifyDebugSpherePosition() {
  if (debugSphereManager.getVisible() && debugSphereManager.debugSphere) {
    const position = debugSphereManager.debugSphere.position;
    const isAtOrigin = position.x === 0 && position.y === 0 && position.z === 0;

    if (!isAtOrigin) {
      console.warn(
        `Debug sphere not at origin: ${position.x}, ${position.y}, ${position.z}`,
      );
    } else {
      console.log("Debug sphere correctly positioned at origin");
    }
  }
}
```

### Scene Analysis

```typescript
// Analyze debug objects in scene
function analyzeDebugObjects(scene: THREE.Scene) {
  const debugObjects = [];

  scene.traverse((object) => {
    if (object.name && object.name.includes("debug")) {
      debugObjects.push({
        name: object.name,
        type: object.type,
        visible: object.visible,
        position: object.position.clone(),
      });
    }
  });

  console.log("Debug objects in scene:", debugObjects);
}
```

## 📚 Related Components

- [[SceneManager]] - Scene management and debug mode control
- [[GridManager]] - Grid helper for spatial reference
- [[DepthBufferDebugger]] - Depth buffer analysis tools
- [[Performance Optimization]] - Performance considerations

## 🏛️ Architecture Patterns

- **Manager Pattern**: Centralized debug sphere management
- **Lazy Creation**: On-demand object creation
- **Resource Management**: Proper disposal and cleanup
- **Toggle Pattern**: Simple visibility control

## 🔧 Advanced Usage

### Custom Debug Sphere

```typescript
// Create custom debug sphere with different properties
class CustomDebugSphereManager extends DebugSphereManager {
  private static readonly CUSTOM_CONFIG = {
    RADIUS: 1.0, // Larger radius
    WIDTH_SEGMENTS: 32, // More segments
    HEIGHT_SEGMENTS: 32, // More segments
    COLOR: 0x00ff00, // Green color
  };

  private _createDebugSphere(): void {
    if (this.debugSphere) return;

    const geometry = new THREE.SphereGeometry(
      CustomDebugSphereManager.CUSTOM_CONFIG.RADIUS,
      CustomDebugSphereManager.CUSTOM_CONFIG.WIDTH_SEGMENTS,
      CustomDebugSphereManager.CUSTOM_CONFIG.HEIGHT_SEGMENTS,
    );

    const material = new THREE.MeshBasicMaterial({
      color: CustomDebugSphereManager.CUSTOM_CONFIG.COLOR,
    });

    this.debugSphere = new THREE.Mesh(geometry, material);
    this.debugSphere.name = "custom-debug-sphere-origin";
    this.debugSphere.position.set(0, 0, 0);
    this.scene.add(this.debugSphere);
  }
}
```

### Animated Debug Sphere

```typescript
// Create animated debug sphere
class AnimatedDebugSphereManager extends DebugSphereManager {
  private animationSpeed = 0.01;

  update(time: number) {
    if (this.debugSphere && this.getVisible()) {
      // Rotate the sphere
      this.debugSphere.rotation.x = time * this.animationSpeed;
      this.debugSphere.rotation.y = time * this.animationSpeed * 0.5;
    }
  }
}

// Usage
const animatedDebugSphere = new AnimatedDebugSphereManager(scene);
animatedDebugSphere.setVisible(true);

function animate(time: number) {
  animatedDebugSphere.update(time);
  requestAnimationFrame(animate);
}
```

### Multiple Debug Spheres

```typescript
// Create multiple debug spheres at different positions
class MultiDebugSphereManager {
  private spheres: Map<string, DebugSphereManager> = new Map();

  addSphere(name: string, position: THREE.Vector3, scene: THREE.Scene) {
    const sphereManager = new DebugSphereManager(scene);
    // Note: This would require extending DebugSphereManager to support custom positions
    this.spheres.set(name, sphereManager);
  }

  setAllVisible(visible: boolean) {
    this.spheres.forEach((sphere) => sphere.setVisible(visible));
  }

  dispose() {
    this.spheres.forEach((sphere) => sphere.dispose());
    this.spheres.clear();
  }
}
```

## ⚡ Performance Considerations

### Efficiency

- **Lazy Creation**: Sphere only created when first shown
- **Memory Efficiency**: No unnecessary geometry/material creation
- **Minimal Overhead**: Basic sphere with simple material
- **Scene Impact**: Minimal impact when not visible

### Quality Metrics

- **Visual Clarity**: Clear visual reference for spatial orientation
- **Reliability**: Robust visibility management
- **Consistency**: Consistent behavior across different scenarios
- **Scalability**: Efficient handling of visibility changes

### Performance Monitoring

- **Creation Performance**: Monitor sphere creation time
- **Memory Usage**: Track memory usage during operations
- **Visibility Changes**: Track visibility change frequency
- **Scene Impact**: Measure impact on scene performance

## 🔌 Integration Points

### Primary Integration

- **SceneManager**: Integrates with scene management
- **Debug Systems**: Provides spatial reference for debugging
- **Camera Systems**: Helps with camera positioning
- **Performance Systems**: Integrates with performance monitoring

### Secondary Integration

- **Debug Tools**: Provides debugging information
- **Validation Systems**: Validates spatial configuration
- **Monitoring Tools**: Provides monitoring capabilities
- **Optimization Tools**: Provides optimization recommendations

## 🔍 Debug Features

### Visibility Monitoring

- **Visibility Tracking**: Track visibility state changes
- **Position Verification**: Verify sphere is at origin
- **Scene Analysis**: Analyze debug objects in scene
- **Configuration Validation**: Validate sphere configuration

### Performance Monitoring

- **Creation Performance**: Monitor sphere creation performance
- **Memory Usage**: Track memory usage during operations
- **Scene Impact**: Measure impact on scene performance
- **Error Detection**: Detect sphere-related errors

## 🔮 Future Enhancements

### Optimization Opportunities

- **Memory Pooling**: Reuse sphere objects to reduce allocations
- **Lazy Loading**: Load sphere only when needed
- **Background Processing**: Process sphere updates in background
- **Predictive Updates**: Predict visibility changes

### Potential Improvements

- **Custom Spheres**: Support for different sphere types
- **Advanced Debugging**: More sophisticated debugging features
- **Performance Analytics**: Advanced performance analytics
- **Automated Optimization**: Automatic sphere optimization

## 📚 Related Components

- [[SceneManager]] - Scene management and debug mode control
- [[GridManager]] - Grid helper for spatial reference
- [[DepthBufferDebugger]] - Depth buffer analysis tools
- [[PerformanceOptimization]] - Performance considerations

## 🏛️ Architecture Patterns

- **Manager Pattern**: Centralized debug sphere management
- **Lazy Creation**: On-demand object creation
- **Resource Management**: Proper disposal and cleanup
- **Toggle Pattern**: Simple visibility control

---

_The DebugSphereManager provides a simple but effective visual reference for the world origin, helping developers understand spatial relationships and coordinate systems in the 3D scene._
