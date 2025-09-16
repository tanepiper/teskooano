---
aliases: [SceneManager, scene-manager, threejs-scene]
tags: [renderer, threejs, core, scene, camera, renderer]
type: Class
package: "@teskooano/renderer-threejs-core"
name: SceneManager
dependencies:
  [
    "@teskooano/core-state",
    "@teskooano/data-types",
    "@teskooano/renderer-threejs-helpers",
    "three",
    "rxjs",
  ]
classes:
  [
    "THREE.Scene",
    "THREE.PerspectiveCamera",
    "THREE.WebGLRenderer",
    "AnimationLoop",
    "LogarithmicDepthMaterial",
    "SceneHelper",
    "CameraHelper",
    "Subscription",
  ]
functions: ["getPerformanceOptimization"]
constants: []
types:
  [
    "SceneManagerOptions",
    "PerformanceOptimization",
    "DeviceTier",
    "WebGLCapabilities",
  ]
status: active
---

# SceneManager

The central orchestrator for the Three.js scene setup and management in the Teskooano renderer system.

## 🎯 Purpose

The SceneManager is responsible for:

- **Scene Creation**: Creating and managing `THREE.Scene`, `THREE.PerspectiveCamera`, and `THREE.WebGLRenderer`
- **Configuration**: Setting up renderer settings (size, pixel ratio, shadows, HDR/tone mapping)
- **Performance Optimization**: Device capability detection and optimization
- **Logarithmic Depth**: Enabling logarithmic depth buffer for space-scale precision
- **Lifecycle Management**: Handling initialization, updates, and cleanup

## 🏗️ Architecture

### Core Components

The SceneManager creates and manages three fundamental Three.js objects:

```typescript
class SceneManager {
  public scene: Scene; // THREE.Scene - root object for all scene objects
  public camera: PerspectiveCamera; // THREE.PerspectiveCamera - main camera
  public renderer: WebGLRenderer; // THREE.WebGLRenderer - WebGL renderer
  public animationLoop: AnimationLoop; // AnimationLoop - render cycle management
}
```

### Performance Integration

- **Device Detection**: Automatically detects WebGL capabilities
- **Profile-Based Optimization**: Adjusts settings based on device tier (low/medium/high/cosmic)
- **Dynamic Configuration**: Updates renderer settings based on performance profile changes

### Logarithmic Depth Buffer

Essential for space simulations with massive distance ranges:

- **Near Plane**: 0.00001 (ultra-aggressive for log depth)
- **Far Plane**: 1,000,000 (covers entire solar system)
- **Auto-Application**: Automatically applies log depth to all materials

## 🔧 Core Methods

### Constructor

```typescript
constructor(container: HTMLElement, options: SceneManagerOptions = {})
```

- Creates optimized scene components using `SceneHelper`
- Enables logarithmic depth buffer
- Initializes performance optimization
- Sets up animation loop

### Lifecycle Methods

```typescript
start(): void                    // Starts the render loop
stop(): void                     // Stops the render loop
render(): void                   // Renders a single frame
onResize(width: number, height: number): void  // Handles resize events
dispose(): void                  // Cleans up all resources
```

### Configuration Methods

```typescript
setFov(newFov: number): void     // Updates camera field of view
getWebGLCapabilities(): WebGLCapabilities  // Returns detected capabilities
getPerformanceOptimization(): PerformanceOptimization  // Returns current settings
```

## 🔄 Update Flow

### Initialization Flow

1. **Container Setup**: Receives HTML container element
2. **State Reading**: Reads initial camera position from core state
3. **Scene Creation**: Uses `SceneHelper` to create optimized components
4. **Log Depth Setup**: Enables logarithmic depth buffer
5. **Performance Setup**: Initializes device capability detection
6. **Animation Loop**: Sets up render cycle management

### Performance Update Flow

1. **State Subscription**: Subscribes to performance profile changes
2. **Capability Detection**: Detects WebGL capabilities
3. **Optimization Calculation**: Calculates optimal settings
4. **Renderer Update**: Applies new settings to renderer
5. **Event Emission**: Broadcasts optimization changes

### Render Flow

1. **Viewport Setup**: Sets renderer viewport
2. **Scene Rendering**: Calls `renderer.render(scene, camera)`
3. **Error Handling**: Catches and logs rendering errors

## 🎨 Configuration Options

### SceneManagerOptions

```typescript
interface SceneManagerOptions {
  fov?: number; // Field of view (default: 75)
  shadows?: boolean; // Enable shadows (default: true)
  antialias?: boolean; // Enable antialiasing (default: true)
  hdr?: boolean; // Enable HDR (default: true)
  cameraPosition?: [number, number, number]; // Initial camera position
}
```

### Performance Optimization

Based on device capabilities and user profile:

- **Pixel Ratio**: Optimized based on device capabilities
- **Shadow Quality**: PCFSoftShadowMap for high-end, BasicShadowMap for low-end
- **Antialiasing**: Enabled for high/mid-range GPUs
- **HDR**: Enabled for high-end devices

## 🚀 Usage Example

```typescript
// Create scene manager
const container = document.getElementById("render-container");
const sceneManager = new SceneManager(container, {
  fov: 75,
  shadows: true,
  hdr: true,
});

// Start rendering
sceneManager.start();

// Handle resize
window.addEventListener("resize", () => {
  sceneManager.onResize(window.innerWidth, window.innerHeight);
});

// Access scene components
const scene = sceneManager.scene;
const camera = sceneManager.camera;
const renderer = sceneManager.renderer;

// Cleanup
sceneManager.dispose();
```

## 🔗 Integration Points

### Core State Integration

- **Initial Camera**: Reads initial camera position from `@teskooano/core-state`
- **Performance Profile**: Subscribes to performance profile changes
- **State Updates**: Updates performance statistics in global state

### Animation Loop Integration

- **Renderer Setup**: Provides renderer and camera to AnimationLoop
- **Callback Registration**: Registers render callbacks
- **Performance Stats**: Collects and reports performance statistics

### Helper Integration

- **SceneHelper**: Uses for optimized scene creation
- **CameraHelper**: Uses for optimized camera setup
- **LogarithmicDepthMaterial**: Uses for depth buffer optimization

## 🎯 Performance Considerations

### Device Tier Optimization

- **Low Tier**: Aggressive optimization, reduced quality
- **Medium Tier**: Balanced performance and quality
- **High Tier**: Enhanced quality with moderate optimization
- **Cosmic Tier**: Maximum quality with minimal optimization

### Memory Management

- **Automatic Cleanup**: Proper disposal of all Three.js objects
- **Canvas Removal**: Removes canvas from DOM on disposal
- **Reference Nulling**: Allows garbage collection of disposed objects

### Render Optimization

- **Logarithmic Depth**: Enables massive near/far ratios without precision loss
- **Power Preference**: High-performance GPU selection for high-tier devices
- **Capability Detection**: Avoids features not supported by device

## 🔌 Integration Points

### Primary Integration

- **AnimationLoop**: Provides renderer and camera instances
- **Core State**: Reads initial camera position and performance profile
- **Performance Optimization**: Applies device-specific settings
- **Logarithmic Depth**: Enables space-scale precision

### Secondary Integration

- **Helper Systems**: Uses SceneHelper and CameraHelper for setup
- **Event System**: Broadcasts resize and disposal events
- **State Management**: Updates performance statistics
- **Debug Tools**: Provides debugging information

## 🔍 Debug Features

### Performance Monitoring

- **WebGL Capabilities**: Tracks device capabilities
- **Performance Profile**: Monitors current optimization settings
- **Render Statistics**: Collects FPS, draw calls, memory usage

### Scene Debugging

- **Log Depth Status**: Tracks logarithmic depth buffer status
- **Camera Configuration**: Monitors camera settings
- **Renderer State**: Tracks renderer configuration

## 📚 Related Components

- [[AnimationLoop]] - Manages the render cycle
- [[LogarithmicDepthMaterial]] - Enables logarithmic depth buffer
- [[Performance Optimization]] - Device capability detection
- [[GridManager]] - Optional grid helper management
- [[DebugSphereManager]] - Optional debug sphere management

## 🔮 Future Enhancements

### Optimization Opportunities

- **Dynamic Quality**: Real-time quality adjustment based on performance
- **Memory Pooling**: Reuse Three.js objects to reduce allocations
- **Lazy Loading**: Load components only when needed
- **WebGPU Support**: Add WebGPU renderer as alternative to WebGL

### Potential Improvements

- **Multi-Camera Support**: Support for multiple camera types and configurations
- **Advanced Debugging**: More comprehensive debugging and profiling tools
- **Plugin System**: Extensible architecture for custom renderer features
- **Performance Prediction**: Predict performance impact of configuration changes

## 🏛️ Architecture Patterns

- **Singleton Pattern**: Provides single scene instance
- **Observer Pattern**: Subscribes to state changes
- **Resource Management**: Automatic cleanup and disposal
- **Configuration Pattern**: Options-based initialization

---

_The SceneManager is the foundation of the Three.js rendering system, providing the core scene, camera, and renderer that all other components build upon._
