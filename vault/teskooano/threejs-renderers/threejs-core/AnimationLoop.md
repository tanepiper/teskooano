---
aliases: [AnimationLoop, animation-loop, render-loop]
tags: [renderer, threejs, core, animation, loop, performance]
type: Class
package: "@teskooano/renderer-threejs-core"
name: AnimationLoop
dependencies: ["@teskooano/core-state", "three", "rxjs"]
classes:
  ["THREE.Clock", "THREE.WebGLRenderer", "THREE.PerspectiveCamera", "Subject"]
functions: []
constants: []
types: ["RendererStats", "Callback", "RenderLoopPayload"]
status: active
---

# AnimationLoop

Manages the main `requestAnimationFrame` loop that drives the entire rendering pipeline in the Teskooano renderer system.

## 🎯 Purpose

The AnimationLoop is responsible for:

- **Render Cycle Management**: Driving the main animation loop with `requestAnimationFrame`
- **Time Tracking**: Using `THREE.Clock` to track elapsed time and delta time
- **Callback System**: Managing arrays of callbacks for different update phases
- **Performance Monitoring**: Collecting and reporting renderer statistics
- **Event Broadcasting**: Broadcasting render events to the system

## 🏗️ Architecture

### Core Components

The AnimationLoop manages the render cycle through several key components:

```typescript
class AnimationLoop {
  private renderLoopId: number | null = null; // RequestAnimationFrame ID
  private clock: THREE.Clock; // Time tracking
  private onPhysicsCallbacks: Callback[]; // Physics update callbacks
  private onAnimateCallbacks: Callback[]; // Animation update callbacks
  private onRenderCallbacks: Callback[]; // Render update callbacks
  private renderer: THREE.WebGLRenderer | null; // For performance stats
  private camera: THREE.PerspectiveCamera | null; // For camera stats
}
```

### Callback System

Three distinct callback phases for proper update ordering:

1. **Physics Callbacks**: Execute first, for simulation updates
2. **Animation Callbacks**: Execute second, for rendering updates
3. **Render Callbacks**: Execute last, for final rendering operations

### Performance Monitoring

- **FPS Tracking**: Real-time frames per second calculation
- **Renderer Stats**: Draw calls, triangles, memory usage
- **Camera Stats**: Position and field of view tracking
- **Update Frequency**: Configurable stats update interval (500ms default)

## 🔧 Core Methods

### Lifecycle Methods

```typescript
start(): void                    // Starts the animation loop
stop(): void                     // Stops the animation loop
setRenderer(renderer: THREE.WebGLRenderer): void  // Sets renderer for stats
setCamera(camera: THREE.PerspectiveCamera): void  // Sets camera for stats
```

### Callback Registration

```typescript
onPhysics(callback: (time: number, delta: number) => void): void
onAnimate(callback: (time: number, delta: number) => void): void
onRender(callback: () => void): void

removePhysicsCallback(callback: Callback): void
removeAnimateCallback(callback: Callback): void
removeRenderCallback(callback: Callback): void
```

### Performance Methods

```typescript
getPerformanceStats(): PerformanceStats  // Returns current performance data
getCurrentStats(): RendererStats | null  // Returns detailed renderer stats
```

## 🔄 Update Flow

### Main Animation Loop

```typescript
private animate = (): void => {
  this.renderLoopId = requestAnimationFrame(this.animate);
  const deltaTime = this.clock.getDelta();
  const elapsedTime = this.clock.getElapsedTime();

  // Broadcast before render event
  rendererEvents.beforeRender$.next({ deltaTime, elapsedTime });

  // Update performance statistics
  this._updateStats();

  // Execute callbacks in order
  for (const callback of this.onPhysicsCallbacks) {
    callback(elapsedTime, deltaTime);
  }

  for (const callback of this.onAnimateCallbacks) {
    callback(elapsedTime, deltaTime);
  }

  for (const callback of this.onRenderCallbacks) {
    callback();
  }

  // Broadcast after render event
  rendererEvents.afterRender$.next({ deltaTime, elapsedTime });
};
```

### Performance Update Flow

1. **FPS Calculation**: Counts frames and calculates FPS every 500ms
2. **Stats Collection**: Gathers renderer statistics (draw calls, triangles, memory)
3. **Event Broadcasting**: Emits stats via `rendererEvents.statsUpdated$`
4. **Camera Stats**: Collects camera position and field of view

### Callback Execution Order

1. **Physics Phase**: Simulation updates, physics calculations
2. **Animation Phase**: Object positioning, material updates
3. **Render Phase**: Final rendering operations, post-processing

## 📊 Performance Statistics

### RendererStats Interface

```typescript
interface RendererStats {
  fps: number; // Current frames per second
  drawCalls: number; // Number of draw calls in last frame
  triangles: number; // Number of triangles in last frame
  memory?: {
    // Browser memory usage
    usedJSHeapSize?: number;
  };
  camera?: {
    // Camera state information
    position?: { x: number; y: number; z: number };
    fov?: number;
  };
}
```

### Performance Monitoring

- **Update Interval**: Statistics updated every 500ms (configurable)
- **FPS Calculation**: Based on frame count over time period
- **Memory Tracking**: Uses `performance.memory` API when available
- **Error Handling**: Graceful handling of missing renderer/camera

## 🚀 Usage Example

```typescript
// Create animation loop
const animationLoop = new AnimationLoop();

// Set up renderer and camera
animationLoop.setRenderer(sceneManager.renderer);
animationLoop.setCamera(sceneManager.camera);

// Register physics callbacks
animationLoop.onPhysics((time, delta) => {
  // Update physics simulation
  physicsEngine.update(delta);
});

// Register animation callbacks
animationLoop.onAnimate((time, delta) => {
  // Update object positions
  objectManager.update(delta);

  // Update materials and effects
  materialManager.update(delta);
});

// Register render callbacks
animationLoop.onRender(() => {
  // Final rendering operations
  sceneManager.render();
});

// Start the loop
animationLoop.start();

// Monitor performance
const stats = animationLoop.getPerformanceStats();
console.log(`FPS: ${stats.fps}, Callbacks: ${stats.animationCallbacks}`);

// Stop the loop
animationLoop.stop();
```

## 🔗 Integration Points

### Event System Integration

- **Before Render**: Broadcasts `beforeRender$` event with time data
- **After Render**: Broadcasts `afterRender$` event with time data
- **Stats Updates**: Broadcasts `statsUpdated$` event with performance data

### SceneManager Integration

- **Renderer Setup**: Receives renderer instance for statistics collection
- **Camera Setup**: Receives camera instance for position tracking
- **Render Coordination**: Coordinates with SceneManager's render method

### State Integration

- **Performance Stats**: Updates global state with performance metrics
- **Event Broadcasting**: Provides events for other systems to subscribe to
- **Time Management**: Provides consistent time data across the system

## 🎯 Performance Considerations

### Callback Management

- **Efficient Execution**: Direct array iteration for callback execution
- **Memory Safety**: Callback removal prevents memory leaks
- **Error Isolation**: Individual callback errors don't break the loop

### Statistics Collection

- **Throttled Updates**: Statistics collected every 500ms to reduce overhead
- **Conditional Collection**: Only collects stats when renderer is available
- **Error Handling**: Graceful handling of missing WebGL context

### Time Management

- **Delta Time**: Uses `THREE.Clock` for consistent time tracking
- **Elapsed Time**: Provides total elapsed time for animation systems
- **Frame Rate Independence**: Delta time ensures consistent behavior regardless of FPS

## ⚡ Performance Considerations

### Efficiency

- **Callback Execution**: Direct array iteration for optimal performance
- **Memory Management**: Proper callback cleanup prevents memory leaks
- **Error Isolation**: Individual callback errors don't break the loop
- **Stats Collection**: Throttled updates (500ms) to reduce overhead

### Quality Metrics

- **Accuracy**: Precise time tracking with THREE.Clock
- **Reliability**: Robust error handling and recovery
- **Consistency**: Stable frame timing across different devices
- **Scalability**: Efficient callback management for large numbers

### Performance Monitoring

- **FPS Calculation**: Real-time performance tracking
- **Resource Usage**: Memory and CPU monitoring
- **Callback Performance**: Individual callback timing analysis
- **Optimization Strategies**: Automatic performance tuning

## 🔌 Integration Points

### Primary Integration

- **SceneManager**: Provides renderer and camera instances
- **Core State**: Updates performance statistics
- **Event System**: Broadcasts render events
- **Callback System**: Manages update callbacks

### Secondary Integration

- **Performance Monitoring**: Integrates with performance systems
- **Debug Tools**: Provides debugging information
- **State Management**: Updates global state with metrics
- **Error Handling**: Integrates with error reporting systems

## 🔍 Debug Features

### Performance Monitoring

- **Real-time FPS**: Live FPS tracking and display
- **Renderer Statistics**: Draw calls, triangles, memory usage
- **Camera Tracking**: Position and field of view monitoring
- **Callback Counts**: Number of registered callbacks per phase

### Loop State

- **Running Status**: Track whether loop is active
- **Callback Registration**: Monitor callback registration/removal
- **Error Tracking**: Catch and log callback execution errors

## 📚 Related Components

- [[SceneManager]] - Provides renderer and camera instances
- [[rendererEvents]] - Event broadcasting system
- [[Performance Optimization]] - Performance monitoring integration
- [[Core State]] - Performance statistics storage

## 🔮 Future Enhancements

### Optimization Opportunities

- **Callback Batching**: Group similar callbacks for better performance
- **Priority System**: Implement callback priority for critical updates
- **Adaptive Timing**: Adjust update frequency based on performance
- **Memory Optimization**: Reduce callback array allocations

### Potential Improvements

- **Web Workers**: Offload heavy calculations to background threads
- **Frame Skipping**: Intelligent frame skipping for low-end devices
- **Predictive Timing**: Predict optimal callback execution timing
- **Advanced Profiling**: More detailed performance analysis tools

## 🏛️ Architecture Patterns

- **Observer Pattern**: Callback system for extensibility
- **Event-Driven Architecture**: Broadcasting render events
- **Resource Management**: Proper cleanup of animation frame
- **Performance Monitoring**: Integrated statistics collection

---

_The AnimationLoop is the heartbeat of the rendering system, driving all updates and providing the timing foundation for the entire renderer pipeline._
