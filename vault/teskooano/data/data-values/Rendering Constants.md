---
aliases: [Rendering Constants]
tags: [data, values, rendering, visualization]
type: Constants Module
package: "@teskooano/data-values"
file: "src/constants/rendering.ts"
status: active
---

# Rendering Constants

Default values and limits for camera, rendering, and visualization settings.

## Overview

The rendering constants module provides default values and limits for camera, rendering, and visualization settings in the Teskooano simulation. These constants ensure consistent visual behavior, provide sensible defaults for user interfaces, and establish bounds for camera and rendering parameters.

## Camera Settings

### DEFAULT_FOV

```typescript
export const DEFAULT_FOV = 75;
```

Default field of view for cameras in degrees.

**Description:**
The default field of view angle for cameras in the simulation. This provides a good balance between showing enough of the scene while maintaining reasonable perspective distortion.

**Value:** 75 degrees

**Usage Examples:**

```typescript
// Initialize camera with default FOV
const camera = new THREE.PerspectiveCamera(DEFAULT_FOV, aspectRatio, near, far);

// Reset camera to default settings
camera.fov = DEFAULT_FOV;
camera.updateProjectionMatrix();

// Create FOV slider with default value
const fovSlider = createSlider(MIN_FOV, MAX_FOV, DEFAULT_FOV);

// Calculate zoom level relative to default
const zoomLevel = DEFAULT_FOV / currentFOV;
```

### MIN_FOV

```typescript
export const MIN_FOV = 10;
```

Minimum field of view in degrees.

**Description:**
The minimum allowed field of view angle for cameras in the simulation. This prevents excessive zooming that could cause rendering issues or make navigation difficult.

**Value:** 10 degrees

**Usage Examples:**

```typescript
// Validate FOV input
const isValidFOV = fov >= MIN_FOV && fov <= MAX_FOV;

// Clamp FOV to valid range
const clampedFOV = Math.max(MIN_FOV, Math.min(fov, MAX_FOV));

// Create FOV slider with bounds
const fovSlider = createSlider(MIN_FOV, MAX_FOV, DEFAULT_FOV);

// Check if FOV is at minimum
const isAtMinimum = fov <= MIN_FOV;
```

### MAX_FOV

```typescript
export const MAX_FOV = 120;
```

Maximum field of view in degrees.

**Description:**
The maximum allowed field of view angle for cameras in the simulation. This prevents excessive wide-angle views that could cause distortion or make objects appear too small.

**Value:** 120 degrees

**Usage Examples:**

```typescript
// Validate FOV input
const isValidFOV = fov >= MIN_FOV && fov <= MAX_FOV;

// Determine if FOV is wide-angle
const isWideAngle = fov > 90;

// Check if FOV is at maximum
const isAtMaximum = fov >= MAX_FOV;

// Calculate field of view range
const fovRange = MAX_FOV - MIN_FOV;
```

### DEFAULT_NEAR

```typescript
export const DEFAULT_NEAR = 0.1;
```

Default near clipping plane distance.

**Description:**
The default near clipping plane distance for cameras in the simulation. This determines the closest distance at which objects are rendered and helps prevent z-fighting issues.

**Value:** 0.1 scene units

**Usage Examples:**

```typescript
// Initialize camera with default near plane
const camera = new THREE.PerspectiveCamera(
  fov,
  aspectRatio,
  DEFAULT_NEAR,
  DEFAULT_FAR,
);

// Adjust near plane based on scene scale
const adaptiveNear = Math.max(DEFAULT_NEAR, sceneScale * 0.001);

// Prevent z-fighting by setting appropriate near plane
camera.near = Math.max(DEFAULT_NEAR, objectDistance * 0.01);

// Calculate near plane for close-up viewing
const closeUpNear = Math.max(DEFAULT_NEAR, targetSize * 0.1);
```

### DEFAULT_FAR

```typescript
export const DEFAULT_FAR = 10000;
```

Default far clipping plane distance.

**Description:**
The default far clipping plane distance for cameras in the simulation. This determines the farthest distance at which objects are rendered and ensures distant objects are visible.

**Value:** 10,000 scene units

**Usage Examples:**

```typescript
// Initialize camera with default far plane
const camera = new THREE.PerspectiveCamera(
  fov,
  aspectRatio,
  DEFAULT_NEAR,
  DEFAULT_FAR,
);

// Adjust far plane based on scene scale
const adaptiveFar = Math.max(DEFAULT_FAR, sceneScale * 10);

// Ensure stars are visible at great distances
camera.far = Math.max(DEFAULT_FAR, starDistance * 1.1);

// Calculate far plane for system-wide viewing
const systemFar = Math.max(DEFAULT_FAR, systemRadius * 2);
```

## Camera Movement Settings

### DEFAULT_CAMERA_SPEED

```typescript
export const DEFAULT_CAMERA_SPEED = 1.0;
```

Default camera movement speed multiplier.

**Description:**
The default speed multiplier for camera movement in the simulation. This provides a comfortable navigation speed for exploring the celestial environment.

**Value:** 1.0

**Usage Examples:**

```typescript
// Apply camera movement speed
const movementVector = direction.multiplyScalar(
  DEFAULT_CAMERA_SPEED * deltaTime,
);
camera.position.add(movementVector);

// Adjust speed based on distance from target
const adaptiveSpeed = DEFAULT_CAMERA_SPEED * (distance / 1000);

// Create speed slider with default value
const speedSlider = createSlider(0.1, 10.0, DEFAULT_CAMERA_SPEED);

// Calculate movement based on user input
const movement = inputDirection * DEFAULT_CAMERA_SPEED * timeDelta;
```

### DEFAULT_CAMERA_ROTATION_SPEED

```typescript
export const DEFAULT_CAMERA_ROTATION_SPEED = 0.5;
```

Default camera rotation speed multiplier.

**Description:**
The default speed multiplier for camera rotation in the simulation. This provides smooth and responsive camera turning for exploring the celestial environment from different angles.

**Value:** 0.5

**Usage Examples:**

```typescript
// Apply camera rotation speed
const rotationAmount = mouseDelta * DEFAULT_CAMERA_ROTATION_SPEED * deltaTime;
camera.rotation.y += rotationAmount;

// Adjust rotation speed based on zoom level
const adaptiveRotationSpeed = DEFAULT_CAMERA_ROTATION_SPEED * (1 / zoomLevel);

// Create rotation speed slider
const rotationSlider = createSlider(0.1, 2.0, DEFAULT_CAMERA_ROTATION_SPEED);

// Calculate rotation based on mouse movement
const rotation = mouseMovement * DEFAULT_CAMERA_ROTATION_SPEED;
```

### DEFAULT_CAMERA_ZOOM_SPEED

```typescript
export const DEFAULT_CAMERA_ZOOM_SPEED = 1.0;
```

Default camera zoom speed multiplier.

**Description:**
The default speed multiplier for camera zooming in the simulation. This provides smooth zoom transitions for focusing on objects or getting a broader view of the scene.

**Value:** 1.0

**Usage Examples:**

```typescript
// Apply camera zoom speed
const zoomAmount = wheelDelta * DEFAULT_CAMERA_ZOOM_SPEED;
camera.position.lerp(targetPosition, zoomAmount);

// Adjust zoom speed based on current distance
const adaptiveZoomSpeed = DEFAULT_CAMERA_ZOOM_SPEED * (distance / 1000);

// Create zoom speed slider
const zoomSlider = createSlider(0.1, 3.0, DEFAULT_CAMERA_ZOOM_SPEED);

// Calculate zoom based on scroll input
const zoom = scrollDelta * DEFAULT_CAMERA_ZOOM_SPEED;
```

## Level of Detail (LOD) Settings

### LOD_DISTANCE_THRESHOLD

```typescript
export const LOD_DISTANCE_THRESHOLD = 1000;
```

Distance threshold for LOD transitions in scene units.

**Description:**
The distance at which Level of Detail (LOD) transitions occur in the simulation. Objects beyond this distance use simplified geometry and materials to maintain performance while preserving visual quality.

**Value:** 1,000 scene units

**Usage Examples:**

```typescript
// Determine LOD level based on distance
const lodLevel = distance > LOD_DISTANCE_THRESHOLD ? "low" : "high";

// Apply LOD transition with hysteresis
const transitionDistance = LOD_DISTANCE_THRESHOLD * (isApproaching ? 0.8 : 1.2);

// Optimize rendering based on LOD
if (distance > LOD_DISTANCE_THRESHOLD) {
  object.useSimplifiedGeometry();
  object.useLowQualityMaterial();
}

// Calculate LOD level for multiple objects
const lodLevels = objects.map((obj) =>
  obj.distance > LOD_DISTANCE_THRESHOLD ? "low" : "high",
);
```

## Usage Patterns

### Camera Initialization

```typescript
function createDefaultCamera(aspectRatio: number): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(
    DEFAULT_FOV,
    aspectRatio,
    DEFAULT_NEAR,
    DEFAULT_FAR,
  );

  return camera;
}
```

### Camera Controls Setup

```typescript
function setupCameraControls(camera: THREE.PerspectiveCamera): CameraControls {
  return {
    movementSpeed: DEFAULT_CAMERA_SPEED,
    rotationSpeed: DEFAULT_CAMERA_ROTATION_SPEED,
    zoomSpeed: DEFAULT_CAMERA_ZOOM_SPEED,

    // Apply user preferences
    applyUserPreferences(preferences: UserPreferences) {
      this.movementSpeed = preferences.movementSpeed || DEFAULT_CAMERA_SPEED;
      this.rotationSpeed =
        preferences.rotationSpeed || DEFAULT_CAMERA_ROTATION_SPEED;
      this.zoomSpeed = preferences.zoomSpeed || DEFAULT_CAMERA_ZOOM_SPEED;
    },
  };
}
```

### LOD Management

```typescript
class LODManager {
  private threshold = LOD_DISTANCE_THRESHOLD;

  updateLOD(objects: RenderableObject[], cameraPosition: THREE.Vector3): void {
    objects.forEach((obj) => {
      const distance = obj.position.distanceTo(cameraPosition);
      const lodLevel = this.calculateLODLevel(distance);
      obj.setLODLevel(lodLevel);
    });
  }

  private calculateLODLevel(distance: number): LODLevel {
    if (distance > this.threshold * 2) return "lowest";
    if (distance > this.threshold) return "low";
    if (distance > this.threshold * 0.5) return "medium";
    return "high";
  }
}
```

### Adaptive Camera Settings

```typescript
class AdaptiveCamera {
  private camera: THREE.PerspectiveCamera;

  adjustForScene(scale: number, targetDistance: number): void {
    // Adjust FOV based on scale
    const adaptiveFOV = Math.max(
      MIN_FOV,
      Math.min(DEFAULT_FOV * scale, MAX_FOV),
    );
    this.camera.fov = adaptiveFOV;

    // Adjust clipping planes
    this.camera.near = Math.max(DEFAULT_NEAR, targetDistance * 0.01);
    this.camera.far = Math.max(DEFAULT_FAR, targetDistance * 10);

    this.camera.updateProjectionMatrix();
  }

  resetToDefaults(): void {
    this.camera.fov = DEFAULT_FOV;
    this.camera.near = DEFAULT_NEAR;
    this.camera.far = DEFAULT_FAR;
    this.camera.updateProjectionMatrix();
  }
}
```

## Performance Considerations

### FOV Impact

- Lower FOV = higher zoom, better performance for distant objects
- Higher FOV = wider view, more objects rendered
- Adaptive FOV can balance performance and visual quality

### Clipping Plane Optimization

- Near plane too close can cause z-fighting
- Far plane too far can impact depth buffer precision
- Adaptive clipping based on scene content

### LOD Efficiency

- Distance-based LOD reduces geometry complexity
- Hysteresis prevents LOD flickering
- Multiple LOD levels for smooth transitions

## Integration

### Camera System

- Default camera initialization
- User preference management
- Adaptive camera behavior

### Rendering System

- LOD system integration
- Performance optimization
- Visual quality management

### UI System

- Camera control sliders
- Setting persistence
- Real-time adjustment

## 🔗 Related

- [[Scaling Constants]] - Scene scaling factors used with camera settings
- [[Time Constants]] - Animation and performance settings
- [[Simulation Limits]] - Performance constraints
- [[@teskooano/renderer-threejs-camera]] - Camera system using these constants
- [[@teskooano/renderer-threejs-core]] - Core rendering system using these constants
