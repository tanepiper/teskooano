# Orchestrator Architecture

This directory contains orchestrators that group related managers together to create a more modular and maintainable rendering system.

## Overview

The `ModularSpaceRenderer` was refactored to use orchestrators instead of exposing all managers directly. This reduces the public API surface and creates a cleaner, more modular architecture.

## Orchestrators

### `RenderingOrchestrator`

Groups all rendering-related managers and operations:

- **Scene Management**: `SceneManager`, core Three.js objects
- **Object Lifecycle**: `ObjectManager`, visual representation
- **Orbital Visualization**: `OrbitsManager`, trajectory rendering
- **Background & Environment**: `BackgroundManager`, skybox
- **Lighting & LOD**: `LightingManager`, `LODManager`
- **Grid & Spatial Reference**: `GridManager`
- **State & Pipeline**: `RendererStateAdapter`, `RenderPipeline`

**Key Methods:**

- `getSceneManager()` - Access to core scene management
- `getObjectManager()` - Access to object lifecycle
- `getOrbitManager()` - Access to orbital visualization
- `setDebugMode()` - Enable debug mode for all components
- `highlightPrediction()` - Control prediction line highlighting
- `getTriangleCount()` - Performance debugging
- `dispose()` - Cleanup all rendering resources

### `InteractionOrchestrator`

Groups all user interaction and interface-related managers:

- **Camera Controls**: `ControlsManager`, user input handling
- **2D Labels**: `Layer2DManager`, HTML overlays
- **AU Markers**: `AuMarkerManager`, distance indicators

**Key Methods:**

- `getControlsManager()` - Access to camera controls
- `getLayer2DManager()` - Access to 2D label system
- `setDebugMode()` - Enable debug mode for interactions
- `onResize()` - Handle window resize events
- `dispose()` - Cleanup all interaction resources

### `DebugOrchestrator`

Groups debug and analysis tools:

- **Depth Analysis**: `DepthBufferDebugger`, occlusion debugging
- **Performance Monitoring**: Future expansion
- **Debug Visualizations**: Future expansion

**Key Methods:**

- `getDepthDebugger()` - Access to depth analysis tools
- `runDepthAnalysis()` - Execute comprehensive depth analysis
- `dispose()` - Cleanup debug resources

## Benefits of Orchestrator Pattern

### 1. Reduced API Surface

- **Before**: 10+ public managers exposed directly
- **After**: 3 orchestrators with focused responsibilities

### 2. Better Encapsulation

- Managers are now private within orchestrators
- Public access is controlled through getter methods
- Implementation details are hidden from consumers

### 3. Improved Modularity

- Related functionality is grouped together
- Clear separation of concerns
- Easier to test and maintain individual components

### 4. Consistent Interface

- All orchestrators follow the same pattern
- Standardized methods for common operations
- Predictable API design

## Usage Example

```typescript
// Before: Direct access to many managers
renderer.objectManager.setDebugMode(true);
renderer.controlsManager.setDebugMode(true);
renderer.orbitManager.highlightPrediction("earth");

// After: Clean orchestrator interface
renderer.setDebugMode(true); // Delegates to both orchestrators
renderer.highlightPrediction("earth"); // Delegates to rendering orchestrator
```

## Migration Notes

The refactoring maintains backward compatibility for the most common use cases:

- **Public API**: Core methods like `start()`, `stop()`, `dispose()` remain unchanged
- **Getter Access**: Core objects like `scene`, `camera`, `renderer`, `controls` remain accessible
- **Debug Methods**: `setDebugMode()`, `highlightPrediction()`, `runDepthAnalysis()` remain available

For advanced use cases that require direct manager access, getter methods are provided:

```typescript
// Access to specific managers when needed
const sceneManager = renderer.renderingOrchestrator.getSceneManager();
const objectManager = renderer.renderingOrchestrator.getObjectManager();
const controlsManager = renderer.interactionOrchestrator.getControlsManager();
```

## Future Extensions

The orchestrator pattern provides a foundation for future enhancements:

1. **Performance Orchestrator**: Group performance monitoring and optimization tools
2. **Effects Orchestrator**: Group post-processing and visual effects
3. **Audio Orchestrator**: Group audio-related functionality (future)
4. **Network Orchestrator**: Group networking and multiplayer features (future)

This architecture ensures that the `ModularSpaceRenderer` remains focused on its core responsibility: orchestrating the overall rendering system while delegating specific concerns to specialized orchestrators.
