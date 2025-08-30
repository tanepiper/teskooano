---
aliases: [ObjectManager, object-manager, celestial-objects, scene-orchestrator]
tags: [renderer, threejs, objects, manager, orchestrator, facade, lifecycle]
type: Class
package: "@teskooano/renderer-threejs-objects"
name: ObjectManager
dependencies:
  [
    "@teskooano/core-state",
    "@teskooano/data-types",
    "@teskooano/renderer-threejs-lighting",
    "@teskooano/renderer-threejs-labels",
    "three",
    "rxjs",
  ]
classes:
  [
    "StateSubscriptionMixin",
    "THREE.Scene",
    "THREE.PerspectiveCamera",
    "THREE.WebGLRenderer",
    "LightingManager",
    "Layer2DManager",
    "ObjectLifecycleManager",
    "MeshFactory",
    "RendererUpdater",
    "GlobalLODManager",
    "GravitationalLensingHandler",
    "DebrisEffectManager",
    "AccelerationVisualizer",
  ]
functions: []
constants: []
types:
  ["RenderableCelestialObject", "DestructionPayload", "LabelVisibilityManager"]
status: active
---

# ObjectManager

The central orchestrator for all celestial object rendering in the Teskooano renderer, acting as a facade that delegates responsibilities to specialized sub-managers for object lifecycle, visual effects, and state synchronization.

## 🎯 Purpose

The `ObjectManager` serves as the primary public interface for the object management system, providing a clean API while orchestrating the complex interactions between various specialized managers. It subscribes to state changes, coordinates the update cycle, and provides debugging and visualization features.

## 🏗️ Architecture

### Core Components

- **State Integration**: Subscribes to renderable objects and acceleration streams
- **Sub-Manager Coordination**: Orchestrates specialized managers for different aspects
- **Update Loop Management**: Manages per-frame updates for visual effects
- **Debug Features**: Provides debugging and visualization capabilities
- **API Facade**: Clean public interface for object management operations

### Manager Structure

```typescript
export class ObjectManager extends StateSubscriptionMixin {
  private objects: Map<string, THREE.Object3D> = new Map();
  private celestialRenderers: Map<string, CelestialRenderer> = new Map();
  private lightingManager: LightingManager;
  private objectLifecycleManager: ObjectLifecycleManager;
  private rendererUpdater: RendererUpdater;
  private meshFactory: MeshFactory;
  private lodManager: GlobalLODManager;
  private lensingHandler: GravitationalLensingHandler;
  private debrisEffectManager: DebrisEffectManager;
  private accelerationVisualizer: AccelerationVisualizer;
}
```

## 🔧 Core Methods

### Constructor

```typescript
constructor(
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  renderableObjects$: Observable<Record<string, RenderableCelestialObject>>,
  renderer: THREE.WebGLRenderer,
  css2DManager: LabelVisibilityManager & Layer2DManager,
  acceleration$: Observable<Record<string, OSVector3>>,
  lightingManager: LightingManager
)
```

- **scene**: Three.js scene for object management
- **camera**: Perspective camera for LOD and effects
- **renderableObjects$**: Observable stream of renderable objects
- **renderer**: WebGL renderer for visual effects
- **css2DManager**: Manager for 2D labels and UI elements
- **acceleration$**: Observable stream for acceleration vectors
- **lightingManager**: Lighting system manager

### State Subscription

```typescript
private subscribeToStateChanges(): void
private subscribeToDestructionEvents(): void
```

- **State Changes**: Subscribes to renderable objects stream for reactive updates
- **Destruction Events**: Listens for object destruction events for debris effects
- **Reactive Updates**: Automatically syncs scene with state changes

### Update Methods

```typescript
public update(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera): void
public updateRenderers(time: number, timeScale: number, renderer?: THREE.WebGLRenderer, scene?: THREE.Scene, camera?: THREE.PerspectiveCamera): void
```

- **Visual Effects**: Updates lensing effects and debris particles
- **Performance**: Manages delta time for smooth animations
- **Backward Compatibility**: Maintains legacy update method for compatibility

## 🚀 Usage Example

```typescript
// Create object manager with all dependencies
const objectManager = new ObjectManager(
  scene,
  camera,
  renderableObjects$,
  renderer,
  css2DManager,
  acceleration$,
  lightingManager,
);

// ObjectManager automatically handles:
// - State subscription and reactive updates
// - Object lifecycle management via ObjectLifecycleManager
// - Renderer updates via RendererUpdater
// - Light source management via LightingManager
// - Label management via Layer2DManager
// - Special effects via specialized handlers

// Update is called by the render pipeline
objectManager.update(renderer, scene, camera);

// Debug and visualization features
objectManager.setDebugMode(true);
objectManager.setDebugVisualization(true);
objectManager.setDebrisEffectsEnabled(true);

// Access to managed objects
const centralBody = objectManager.getCentralBody();
const allMeshes = objectManager.getAllRenderedMeshes();

// Cleanup
objectManager.dispose();
```

## 🎯 Debug Features

### Debug Mode

```typescript
public setDebugMode(enabled: boolean): void
public recreateAllMeshes(): void
```

- **Debug Mode**: Creates simplified fallback meshes for debugging
- **Mesh Recreation**: Recreates all meshes to apply debug visuals
- **Fallback Rendering**: Uses basic spheres when complex renderers fail

### Debug Visualization

```typescript
public setDebugVisualization(enabled: boolean): void
public toggleDebugVisualization(): boolean
```

- **Acceleration Vectors**: Shows physics forces as colored arrows
- **Performance Monitoring**: Tracks update performance and memory usage
- **Visual Debugging**: Color-coded objects by type and state

### Debris Effects

```typescript
public setDebrisEffectsEnabled(enabled: boolean): void
public toggleDebrisEffects(): boolean
```

- **Destruction Effects**: Particle effects when objects are destroyed
- **Performance Control**: Enable/disable effects for performance tuning
- **Visual Feedback**: Provides visual feedback for object destruction

## 🔍 Object Access

### Object Retrieval

```typescript
public getObject(id: string): THREE.Object3D | null
public getCentralBody(): THREE.Object3D | undefined
public getAllRenderedMeshes(): THREE.Object3D[]
```

- **Individual Objects**: Get specific objects by ID
- **Central Body**: Find the primary star or central object
- **All Meshes**: Get all rendered objects for raycasting and occlusion

### State Access

```typescript
public getLatestRenderableObjects(): Record<string, RenderableCelestialObject>
public getCelestialRenderers(): Map<string, CelestialRenderer>
```

- **Current State**: Access the latest renderable object state
- **Renderer Access**: Get access to specialized celestial renderers
- **State Synchronization**: Ensure access to current state data

## 🎯 Performance Considerations

### Reactive Architecture

- **State-Driven Updates**: Only updates when state actually changes
- **Efficient Synchronization**: Compares current and new state to minimize operations
- **Batch Processing**: Processes multiple objects in single update cycles

### Memory Management

- **Automatic Cleanup**: Sub-managers handle their own resource cleanup
- **Disposal Chain**: Proper disposal of all sub-managers and resources
- **Reference Management**: Clears references to prevent memory leaks

### Update Optimization

- **Delta Time Management**: Efficient time tracking for animations
- **Effect Throttling**: Limits expensive visual effects
- **LOD Integration**: Level of detail reduces rendering overhead

## 🔧 Integration Points

### State System Integration

- **Renderable Objects**: Subscribes to renderable objects stream
- **Acceleration Data**: Subscribes to acceleration vectors for debug visualization
- **Destruction Events**: Listens for object destruction events

### Renderer System Integration

- **Lighting Manager**: Coordinates light source creation and management
- **Label Manager**: Manages 2D labels and UI elements
- **LOD Manager**: Handles level of detail for performance
- **Effect Managers**: Coordinates special visual effects

### Scene Integration

- **Three.js Scene**: Manages object addition and removal
- **Camera Integration**: Provides camera access for LOD and effects
- **Renderer Integration**: Coordinates with WebGL renderer for effects

## 📚 Related Components

- **[[ObjectLifecycleManager]]** - Handles object creation, updates, and removal
- **[[MeshFactory]]** - Creates appropriate meshes for different object types
- **[[RendererUpdater]]** - Manages per-frame renderer updates
- **[[GlobalLODManager]]** - Tracks LOD objects for performance
- **[[GravitationalLensingHandler]]** - Manages lensing effects for massive objects
- **[[DebrisEffectManager]]** - Handles destruction particle effects
- **[[AccelerationVisualizer]]** - Debug visualization for physics forces

## 🏛️ Architecture Patterns

- **Facade Pattern**: Provides simplified interface to complex subsystem
- **Manager Pattern**: Orchestrates specialized sub-managers
- **Observer Pattern**: Reactive updates based on state changes
- **Lifecycle Pattern**: Manages object creation, updates, and disposal
- **Factory Pattern**: Delegates object creation to specialized factories

## 🔍 Debug Features

### Object Tracking

- **Renderer Count**: Track number of active renderers
- **Memory Usage**: Monitor renderer memory consumption
- **Update Performance**: Track time spent in object updates

### Visualization Debug

- **Object Bounds**: Visualize object bounding boxes
- **Renderer Types**: Color-code objects by renderer type
- **Light Sources**: Visualize light source positions and intensities
- **Acceleration Vectors**: Debug arrows showing physics forces

---

_The ObjectManager provides the central orchestration for all celestial object rendering, coordinating specialized managers to create a cohesive and performant object management system._
