# Open Space ThreeJS Renderer

This package provides a ThreeJS-based renderer for the Open Space project. It has been refactored to use a modular architecture for better maintainability and extensibility.

## Architecture

The renderer is now split into several modular packages:

- **@teskooano/renderer-threejs-core**: Core functionality including scene management, animation loop, and state management
- **@teskooano/renderer-threejs-visualization**: Visualization components including object management, orbit management, and background management
- **@teskooano/renderer-threejs-interaction**: Interaction components including controls management and UI management
- **@teskooano/renderer-threejs-effects**: Effects components including light management and LOD management

## Usage

### Basic Usage

```typescript
import { ModularSpaceRenderer } from '@teskooano/renderer-threejs';

// Create a container element
const container = document.getElementById('renderer-container');

// Initialize the renderer
const renderer = new ModularSpaceRenderer(container, {
  antialias: true,
  shadows: true,
  hdr: true,
  background: 'black',
  showDebugSphere: false,
  showGrid: true
});

// Start the render loop
renderer.startRenderLoop();
```

### Advanced Usage

```typescript
// Toggle UI elements
renderer.toggleLabels();
renderer.toggleGrid();
renderer.toggleDebugSphere();

// Update camera
renderer.updateCamera(new THREE.Vector3(0, 0, 10), new THREE.Vector3(0, 0, 0));

// Add a custom canvas UI manager
renderer.setCanvasUIManager({
  render: () => {
    // Custom rendering logic
  }
});

// Add a render callback
const callback = () => {
  console.log('Rendering frame');
};
renderer.addRenderCallback(callback);

// Remove a render callback
renderer.removeRenderCallback(callback);

// Get performance metrics
const triangleCount = renderer.getTriangleCount();
console.log(`Total triangles: ${triangleCount}`);

// Clean up resources
renderer.dispose();
```

## API Reference

### ModularSpaceRenderer

The main class that integrates all the modular components.

#### Constructor

```typescript
constructor(container: HTMLElement, options?: {
  antialias?: boolean;
  shadows?: boolean;
  hdr?: boolean;
  background?: string | THREE.Texture;
  showDebugSphere?: boolean;
  showGrid?: boolean;
})
```

#### Methods

- `startRenderLoop()`: Start the animation loop
- `stopRenderLoop()`: Stop the animation loop
- `onResize(width: number, height: number)`: Handle window resize
- `render()`: Render a single frame
- `addObject(object: any)`: Add an object to the scene
- `removeObject(id: string)`: Remove an object from the scene
- `updateObject(object: any)`: Update an object in the scene
- `dispose()`: Clean up resources
- `toggleLabels()`: Toggle visibility of celestial object labels
- `toggleGrid()`: Toggle visibility of the grid
- `toggleDebugSphere()`: Toggle visibility of the debug sphere
- `updateCamera(position: THREE.Vector3, target: THREE.Vector3)`: Update the camera position and target
- `setCanvasUIManager(uiManager: { render(): void })`: Set a custom canvas UI manager
- `addRenderCallback(callback: () => void)`: Add a callback to be called on each render
- `removeRenderCallback(callback: () => void)`: Remove a render callback
- `getTriangleCount()`: Get the total triangle count for all meshes in the scene

#### Properties

- `scene`: The ThreeJS scene
- `camera`: The ThreeJS camera
- `renderer`: The ThreeJS renderer
- `controls`: The orbit controls

## Modular Packages

### @teskooano/renderer-threejs-core

Core functionality for the ThreeJS renderer.

#### Components

- `SceneManager`: Manages the ThreeJS scene, camera, and renderer
- `AnimationLoop`: Manages the animation loop
- `StateManager`: Manages the state of the renderer

### @teskooano/renderer-threejs-visualization

Visualization components for the ThreeJS renderer.

#### Components

- `ObjectManager`: Manages celestial objects in the scene
- `OrbitManager`: Manages orbit lines in the scene
- `BackgroundManager`: Manages the background of the scene

### @teskooano/renderer-threejs-interaction

Interaction components for the ThreeJS renderer.

#### Components

- `ControlsManager`: Manages orbit controls
- `UIManager`: Manages UI elements like labels

### @teskooano/renderer-threejs-effects

Effects components for the ThreeJS renderer.

#### Components

- `LightManager`: Manages lights in the scene
- `LODManager`: Manages level of detail for objects

## Migration from SpaceRenderer

The original `SpaceRenderer` class has been replaced with the new `ModularSpaceRenderer` class. The new class provides the same functionality but with a more modular architecture. The original class is no longer exported.

To migrate from `SpaceRenderer` to `ModularSpaceRenderer`, simply replace the import and class name:

```typescript
// Old code
import { SpaceRenderer } from '@teskooano/renderer-threejs';
const renderer = new SpaceRenderer(container, options);

// New code
import { ModularSpaceRenderer } from '@teskooano/renderer-threejs';
const renderer = new ModularSpaceRenderer(container, options);
```

The API is compatible, so no other changes should be needed.
