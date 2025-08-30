---
aliases:
  [ObjectLifecycleManager, object-lifecycle, lifecycle-manager, scene-sync]
tags: [renderer, threejs, objects, lifecycle, state-sync, creation, removal]
type: Class
package: "@teskooano/renderer-threejs-objects"
name: ObjectLifecycleManager
dependencies:
  [
    "@teskooano/data-types",
    "@teskooano/renderer-threejs-lighting",
    "@teskooano/renderer-threejs-labels",
    "three",
  ]
classes:
  [
    "THREE.Scene",
    "THREE.Object3D",
    "THREE.Group",
    "MeshFactory",
    "GlobalLODManager",
    "LightingManager",
    "GravitationalLensingHandler",
    "Layer2DManager",
    "CelestialLabelLayer",
    "LightSourceComponent",
  ]
functions: []
constants: []
types:
  [
    "RenderableCelestialObject",
    "ObjectLifecycleManagerConfig",
    "CelestialStatus",
    "CelestialType",
    "CSS2DLayerType",
  ]
status: active
---

# ObjectLifecycleManager

Manages the complete lifecycle of Three.js Object3D instances representing celestial bodies, handling creation, updates, removal, and integration with all rendering systems.

## 🎯 Purpose

The `ObjectLifecycleManager` is responsible for keeping the Three.js scene synchronized with the renderable object state. It handles the complex process of creating new objects, updating existing ones, removing destroyed objects, and managing all associated components like lights, labels, lensing effects, and shadow casting.

## 🏗️ Architecture

### Core Components

- **State Synchronization**: Compares current scene state with new renderable object state
- **Object Creation**: Creates new meshes using MeshFactory when objects appear
- **Object Updates**: Updates position and rotation of existing objects
- **Object Removal**: Performs comprehensive cleanup when objects are destroyed
- **Component Integration**: Manages lights, labels, lensing, and shadow casting

### Manager Structure

```typescript
export class ObjectLifecycleManager {
  private objects: Map<string, THREE.Object3D>;
  private scene: THREE.Scene;
  private meshFactory: MeshFactory;
  private lodManager: GlobalLODManager;
  private lightingManager: LightingManager;
  private lensingHandler: GravitationalLensingHandler;
  private renderer: THREE.WebGLRenderer | null;
  private camera: THREE.PerspectiveCamera;
  private css2DManager?: Layer2DManager;
}
```

## 🔧 Core Methods

### State Synchronization

```typescript
public syncObjectsWithState(newState: Record<string, RenderableCelestialObject>): void
```

- **State Comparison**: Compares current scene objects with new state
- **Object Addition**: Creates new objects that appear in state
- **Object Updates**: Updates existing objects with new data
- **Object Removal**: Removes objects no longer present in state
- **Status Handling**: Handles destroyed/annihilated objects explicitly

### Object Creation

```typescript
public addObject(object: RenderableCelestialObject): void
```

- **Mesh Creation**: Uses MeshFactory to create appropriate mesh
- **Scene Integration**: Adds mesh to scene with proper grouping
- **Light Source Registration**: Creates light sources for stars
- **Shadow Caster Registration**: Registers planets as shadow casters
- **Label Creation**: Creates 2D labels for celestial objects
- **Lensing Application**: Applies gravitational lensing for massive objects

### Object Updates

```typescript
public updateObject(object: RenderableCelestialObject): void
```

- **Position Updates**: Updates mesh position to match object data
- **Rotation Updates**: Updates mesh rotation (except for comets)
- **State Validation**: Ensures object exists before updating
- **Fallback Handling**: Creates object if it doesn't exist

### Object Removal

```typescript
public removeObject(objectId: string): void
```

- **Component Cleanup**: Removes labels, lights, lensing, and shadow casters
- **Scene Removal**: Removes mesh from scene with proper group handling
- **Resource Disposal**: Disposes of geometries and materials
- **Map Cleanup**: Removes object from tracking maps

## 🚀 Usage Example

```typescript
// Create lifecycle manager with dependencies
const lifecycleManager = new ObjectLifecycleManager({
  objects: objectMap,
  scene: threeJsScene,
  meshFactory: meshFactory,
  lodManager: lodManager,
  lightingManager: lightingManager,
  lensingHandler: lensingHandler,
  renderer: webglRenderer,
  camera: perspectiveCamera,
  css2DManager: labelManager,
});

// Sync scene with new state (called by ObjectManager)
lifecycleManager.syncObjectsWithState(newRenderableObjects);

// Individual object operations (if needed)
lifecycleManager.addObject(newStarObject);
lifecycleManager.updateObject(updatedPlanetObject);
lifecycleManager.removeObject("destroyed-object-id");

// Cleanup
lifecycleManager.dispose();
```

## 🎨 Object Lifecycle Process

### Creation Process

```typescript
// 1. Create mesh using factory
const mesh = this.meshFactory.createObjectMesh(object);

// 2. Add to scene with grouping
const group = new THREE.Group();
group.name = `GROUP_${objectId}`;
group.add(mesh);
this.scene.add(group);

// 3. Register with tracking systems
this.objects.set(objectId, mesh);

// 4. Create light source for stars
if (object.type === CelestialType.STAR) {
  const lightSource = new LightSourceComponent(object);
  this.lightingManager.register(lightSource, mesh);
}

// 5. Register as shadow caster for planets
if (isPlanetaryObject(object.type)) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  this.lightingManager.registerShadowCaster(objectId, mesh, object);
}

// 6. Create 2D label
const celestialLayer = this.css2DManager?.getLayer(
  CSS2DLayerType.CELESTIAL_LABELS,
);
if (celestialLayer) {
  celestialLayer.createLabel(object, mesh);
}

// 7. Apply gravitational lensing if needed
if (this.lensingHandler.needsGravitationalLensing(object)) {
  this.lensingHandler.applyGravitationalLensing(
    object,
    this.renderer,
    this.scene,
    this.camera,
    mesh,
  );
}
```

### Update Process

```typescript
// 1. Get existing mesh
const existingMesh = this.objects.get(objectId);

// 2. Update position
existingMesh.position.copy(object.position);

// 3. Update rotation (except for comets)
if (object.type !== CelestialType.COMET) {
  existingMesh.quaternion.copy(object.rotation);
}
```

### Removal Process

```typescript
// 1. Remove associated components
this.css2DManager?.removeElement(CSS2DLayerType.CELESTIAL_LABELS, objectId);
this.lodManager.remove(objectId);
this.lensingHandler.removeLensingObject(objectId);
this.lightingManager.unregister(objectId);
this.lightingManager.unregisterShadowCaster(objectId);

// 2. Remove from scene
const group = this.scene.getObjectByName(`GROUP_${objectId}`);
if (group) {
  this.scene.remove(group);
}

// 3. Dispose resources
mesh.traverse((child) => {
  if (child instanceof THREE.Mesh) {
    child.geometry?.dispose();
    child.material?.dispose();
  }
});

// 4. Remove from tracking
this.objects.delete(objectId);
```

## 🎯 Performance Considerations

### State Synchronization

- **Efficient Comparison**: Uses Set operations for fast state comparison
- **Minimal Operations**: Only performs necessary add/update/remove operations
- **Batch Processing**: Processes multiple objects in single sync cycle

### Resource Management

- **Proper Disposal**: Ensures all Three.js resources are properly disposed
- **Memory Cleanup**: Removes references to prevent memory leaks
- **Component Cleanup**: Cleans up all associated components and systems

### Update Optimization

- **Position Updates**: Direct position copying for efficiency
- **Rotation Handling**: Special handling for comets and other objects
- **Component Updates**: Only updates components that actually changed

## 🔧 Integration Points

### MeshFactory Integration

- **Type-Based Creation**: Delegates mesh creation to specialized factories
- **Error Handling**: Provides fallback meshes when creation fails
- **Debug Support**: Supports debug mode for simplified meshes

### Lighting System Integration

- **Light Source Creation**: Creates LightSourceComponent for stars
- **Shadow Caster Registration**: Registers planets for shadow casting
- **Ring Shadow Casters**: Handles ring system shadow casting

### Label System Integration

- **Label Creation**: Creates 2D labels for celestial objects
- **Visibility Management**: Manages label visibility based on object state
- **Layer Integration**: Works with CSS2D layer system

### Lensing System Integration

- **Lensing Detection**: Identifies objects that need gravitational lensing
- **Effect Application**: Applies lensing effects to massive objects
- **Resource Management**: Manages lensing helper lifecycle

## 📚 Related Components

- **[[MeshFactory]]** - Creates appropriate meshes for different object types
- **[[GlobalLODManager]]** - Manages LOD objects for performance
- **[[LightingManager]]** - Manages light sources and shadow casting
- **[[GravitationalLensingHandler]]** - Manages lensing effects for massive objects
- **[[Layer2DManager]]** - Manages 2D labels and UI elements
- **[[LightSourceComponent]]** - Individual light source components

## 🏛️ Architecture Patterns

- **Lifecycle Pattern**: Manages complete object lifecycle (create, update, remove)
- **State Synchronization Pattern**: Keeps scene synchronized with state
- **Component Integration Pattern**: Coordinates multiple systems for each object
- **Resource Management Pattern**: Ensures proper cleanup and disposal
- **Factory Pattern**: Delegates object creation to specialized factories

## 🔍 Error Handling

### Creation Failures

- **Mesh Creation**: Handles failures in mesh creation gracefully
- **Component Failures**: Continues processing even if individual components fail
- **Debug Information**: Provides detailed error information for debugging

### State Inconsistencies

- **Missing Objects**: Handles cases where objects don't exist in scene
- **Invalid States**: Validates object state before processing
- **Recovery**: Attempts to recover from inconsistent states

### Resource Cleanup

- **Disposal Failures**: Handles cases where disposal fails
- **Reference Cleanup**: Ensures all references are properly cleared
- **Memory Leak Prevention**: Prevents memory leaks through proper cleanup

---

_The ObjectLifecycleManager ensures that the Three.js scene stays perfectly synchronized with the renderable object state, managing the complex lifecycle of celestial objects and their associated components._
