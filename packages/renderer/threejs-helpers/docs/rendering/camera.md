# Camera Utilities

The camera utilities provide a comprehensive set of static methods for creating, configuring, and animating Three.js cameras with various presets and smooth transitions.

## CameraHelper

The `CameraHelper` class provides static methods for creating and managing Three.js cameras with consistent APIs and optimized performance.

### Overview

```typescript
import {
  CameraHelper,
  CameraPreset,
  CameraMovementType,
} from "@teskooano/renderer-threejs-helpers";

// All methods follow the same parameter pattern:
// (preset, config) or (config) for specific camera types
```

## Camera Presets

### Basic Camera

Creates a standard perspective camera with sensible defaults.

```typescript
const camera = CameraHelper.createCamera(CameraPreset.Basic, {
  fov: 75,
  position: [0, 5, 10],
  target: [0, 0, 0],
});
```

### Space Camera

Optimized for space scenes with wide field of view and extended depth range.

```typescript
const camera = CameraHelper.createCamera(CameraPreset.Space, {
  fov: 90,
  near: CAMERA_DISTANCE_CONFIG.NEAR, // ~1.5 km in scene units
  far: CAMERA_DISTANCE_CONFIG.FAR, // 1,000,000 units (1,000 AU)
  position: [0, 0, 50],
});
```

### Debug Camera

Wide viewing angles and close near plane for debugging purposes.

```typescript
const camera = CameraHelper.createCamera(CameraPreset.Debug, {
  fov: 120,
  near: 0.001,
  position: [10, 10, 10],
});
```

### Cinematic Camera

Narrow field of view for dramatic, cinematic shots.

```typescript
const camera = CameraHelper.createCamera(CameraPreset.Cinematic, {
  fov: 45,
  position: [0, 2, 15],
});
```

### Orthographic Camera

2D-like rendering with parallel projection.

```typescript
const camera = CameraHelper.createCamera(CameraPreset.Orthographic, {
  position: [0, 0, 10],
});
```

## Camera Distance Configuration

For space-scale rendering, all camera distance settings use a single source of truth:

```typescript
import { CAMERA_DISTANCE_CONFIG } from "@teskooano/renderer-threejs-core";

// Use these constants for consistent camera distances
const camera = new THREE.PerspectiveCamera(
  fov,
  aspect,
  CAMERA_DISTANCE_CONFIG.NEAR, // ~1.5 km in scene units
  CAMERA_DISTANCE_CONFIG.FAR, // 1,000,000 units (1,000 AU)
);
```

**Distance Values:**

- **NEAR**: `0.00001` units (~1.5 km) - allows viewing very close objects
- **FAR**: `1,000,000` units (1,000 AU) - covers deep outer system ranges

This configuration is optimized for logarithmic depth buffer rendering, providing uniform precision across the entire astronomical distance range.

## Camera Configuration

### CameraConfig Interface

```typescript
interface CameraConfig {
  fov?: number; // Field of view (perspective cameras)
  aspect?: number; // Aspect ratio
  near?: number; // Near clipping plane
  far?: number; // Far clipping plane
  position?: [number, number, number]; // Camera position
  target?: [number, number, number]; // Look-at target
  up?: [number, number, number]; // Up vector
  enableDamping?: boolean; // Enable smooth damping
  dampingFactor?: number; // Damping factor (0-1)
  enableZoom?: boolean; // Enable zoom controls
  enablePan?: boolean; // Enable pan controls
  enableRotate?: boolean; // Enable rotation controls
  maxDistance?: number; // Maximum zoom distance
  minDistance?: number; // Minimum zoom distance
  maxPolarAngle?: number; // Maximum polar angle
  minPolarAngle?: number; // Minimum polar angle
}
```

## Camera Animation

### Smooth Transitions

```typescript
// Transition to a new position and target
CameraHelper.transitionTo(
  camera,
  new THREE.Vector3(10, 5, 20),
  new THREE.Vector3(0, 0, 0),
  {
    duration: 2000, // 2 seconds
    movementType: CameraMovementType.Smooth,
    onStart: () => console.log("Transition started"),
    onUpdate: (progress) => console.log(`Progress: ${progress}`),
    onComplete: () => console.log("Transition complete"),
  },
);

// Update animations in render loop
function animate() {
  requestAnimationFrame(animate);
  CameraHelper.updateAnimations(deltaTime);
  renderer.render(scene, camera);
}
```

### Movement Types

- **Linear**: Constant speed transition
- **EaseIn**: Slow start, fast end
- **EaseOut**: Fast start, slow end
- **EaseInOut**: Slow start and end, fast middle
- **Smooth**: Smoothstep interpolation (default)

## Specialized Camera Types

### Follow Camera

Creates a camera that follows an object with smooth damping.

```typescript
const targetObject = scene.getObjectByName("player");
const camera = CameraHelper.createFollowCamera(
  targetObject,
  new THREE.Vector3(0, 5, 10), // offset
  { fov: 75 },
);

// Update in render loop
function animate() {
  requestAnimationFrame(animate);
  camera.updateFollowCamera();
  renderer.render(scene, camera);
}
```

### Orbit Camera

Creates a camera that orbits around a target point.

```typescript
const camera = CameraHelper.createOrbitCamera(
  new THREE.Vector3(0, 0, 0), // target
  10, // radius
  5, // height
  { fov: 75 },
);

// Update orbit position
function animate() {
  requestAnimationFrame(animate);

  const time = Date.now() * 0.001;
  CameraHelper.updateOrbitCamera(
    camera,
    time, // azimuth angle
    Math.PI / 4, // polar angle (45 degrees)
  );

  renderer.render(scene, camera);
}
```

### Keyframe Camera

Creates a camera that interpolates between multiple keyframes.

```typescript
const keyframes = [
  {
    position: new THREE.Vector3(0, 5, 10),
    target: new THREE.Vector3(0, 0, 0),
    time: 0,
  },
  {
    position: new THREE.Vector3(10, 5, 10),
    target: new THREE.Vector3(0, 0, 0),
    time: 2000,
  },
  {
    position: new THREE.Vector3(0, 5, -10),
    target: new THREE.Vector3(0, 0, 0),
    time: 4000,
  },
];

const camera = CameraHelper.createKeyframeCamera(keyframes, { fov: 75 });

// Update keyframe animation
function animate() {
  requestAnimationFrame(animate);

  const time = Date.now();
  CameraHelper.updateKeyframeCamera(camera, time);

  renderer.render(scene, camera);
}
```

## Debugging Tools

### Frustum Helper

Creates a visual representation of the camera's view frustum.

```typescript
const camera = CameraHelper.createBasicCamera();
const frustumHelper = CameraHelper.createFrustumHelper(camera, 0xffff00);
scene.add(frustumHelper);

// Update frustum helper position when camera moves
frustumHelper.position.copy(camera.position);
frustumHelper.quaternion.copy(camera.quaternion);
```

## Utility Methods

### Resize Camera

Updates camera aspect ratio when window is resized.

```typescript
function onWindowResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  CameraHelper.resizeCamera(camera, width, height);
  renderer.setSize(width, height);
}

window.addEventListener("resize", onWindowResize);
```

### Animation Control

```typescript
// Stop animation for specific camera
CameraHelper.stopAnimation(camera);

// Stop all camera animations
CameraHelper.stopAllAnimations();

// Dispose camera resources
CameraHelper.disposeCamera(camera);
```

## Performance Considerations

### Animation Optimization

- **Batch Updates**: Use `updateAnimations()` in your render loop to update all cameras at once
- **Easing Functions**: Choose appropriate easing functions for your use case
- **Animation Cleanup**: Always call `stopAnimation()` or `disposeCamera()` when done

### Memory Management

- **Disposal**: Call `disposeCamera()` to clean up resources and stop animations
- **Animation States**: The helper automatically manages animation states internally
- **Keyframe Memory**: Large keyframe arrays should be cleaned up when no longer needed

### Rendering Optimization

- **Frustum Culling**: Use appropriate near/far planes for your scene
- **Aspect Ratio**: Update camera aspect ratio on window resize
- **Projection Matrix**: Call `updateProjectionMatrix()` after changing camera parameters

## Best Practices

### Camera Selection

```typescript
// Choose appropriate preset for your use case
const camera = CameraHelper.createCamera(
  isSpaceScene ? CameraPreset.Space : CameraPreset.Basic,
  {
    fov: 75,
    near: 0.1,
    far: 1000,
    position: [0, 5, 10],
  },
);
```

### Smooth Transitions

```typescript
// Use smooth transitions for better user experience
CameraHelper.transitionTo(camera, newPosition, newTarget, {
  duration: 1000,
  movementType: CameraMovementType.Smooth,
  onComplete: () => {
    // Handle transition completion
  },
});
```

### Animation Loop Integration

```typescript
let lastTime = 0;

function animate(currentTime) {
  requestAnimationFrame(animate);

  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  // Update camera animations
  CameraHelper.updateAnimations(deltaTime);

  // Update follow cameras
  if (camera.updateFollowCamera) {
    camera.updateFollowCamera();
  }

  renderer.render(scene, camera);
}
```

### Error Handling

```typescript
// Always check for valid objects before creating specialized cameras
if (targetObject && targetObject.isObject3D) {
  const camera = CameraHelper.createFollowCamera(targetObject);
} else {
  console.warn("Invalid target object for follow camera");
}

// Handle animation completion
CameraHelper.transitionTo(camera, newPosition, newTarget, {
  duration: 2000,
  onComplete: () => {
    console.log("Camera transition completed successfully");
  },
  onError: (error) => {
    console.error("Camera transition failed:", error);
  },
});
```

## Integration with Teskooano

The `CameraHelper` is designed to work seamlessly with the Teskooano engine:

- **Scale Compatibility**: All cameras work with the engine's coordinate system
- **Performance Optimization**: Designed for high-frequency updates in space simulations
- **Memory Management**: Integrates with the engine's resource management system
- **Animation System**: Compatible with the engine's animation and transition systems

## Related Documentation

- [Getting Started](../getting-started.md) - Basic setup and usage
- [Scene Utilities](./scene.md) - Scene creation and management
- [Lighting Utilities](./lighting.md) - Lighting setup and configuration
- [API Reference](../api-reference.md) - Complete method documentation
