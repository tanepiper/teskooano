# Animation Utilities

The animation utilities provide a comprehensive set of methods for creating smooth, performant animations using GSAP (GreenSock Animation Platform) for Three.js objects, cameras, and materials.

## AnimationHelper

The `AnimationHelper` class provides static methods for creating and managing GSAP animations with Three.js objects, offering smooth transitions, complex timelines, and optimized performance.

### Overview

```typescript
import {
  AnimationHelper,
  AnimationEase,
} from "@teskooano/renderer-threejs-helpers";

// All methods return GSAP tween instances for further control
// and provide consistent configuration options
```

## Basic Animations

### Position Animation

Animates an object's position to a target position.

```typescript
// Simple position animation
AnimationHelper.animatePosition(cube, new THREE.Vector3(10, 5, 0), {
  duration: 2,
  ease: AnimationEase.Power2Out,
  onComplete: () => console.log("Animation complete"),
});

// With custom easing
AnimationHelper.animatePosition(sphere, new THREE.Vector3(0, 10, 0), {
  duration: 1.5,
  ease: AnimationEase.BounceOut,
  delay: 0.5,
});
```

### Rotation Animation

Animates an object's rotation to a target rotation.

```typescript
// Rotate to specific angles
AnimationHelper.animateRotation(
  cube,
  new THREE.Euler(0, Math.PI, 0), // 180 degrees around Y axis
  {
    duration: 1,
    ease: AnimationEase.Power2InOut,
  },
);

// Continuous rotation
AnimationHelper.createRotationAnimation(
  planet,
  "y", // rotate around Y axis
  20, // 20 seconds per rotation
  { repeat: -1 }, // infinite repeat
);
```

### Scale Animation

Animates an object's scale to a target scale.

```typescript
// Scale up
AnimationHelper.animateScale(cube, new THREE.Vector3(2, 2, 2), {
  duration: 1,
  ease: AnimationEase.BackOut,
});

// Pulsing scale animation
AnimationHelper.createPulseAnimation(
  star,
  1.3, // scale to 130%
  2, // 2 seconds per pulse
  { repeat: -1, yoyo: true },
);
```

## Camera Animations

### Camera Position and Look-At

Animates a camera to a new position and optionally a new look-at target.

```typescript
// Move camera to new position
AnimationHelper.animateCamera(camera, new THREE.Vector3(0, 10, 20), {
  duration: 3,
  ease: AnimationEase.Power2InOut,
  lookAt: new THREE.Vector3(0, 0, 0),
});

// Camera orbit around a target
AnimationHelper.createOrbitAnimation(
  camera,
  new THREE.Vector3(0, 0, 0), // orbit around origin
  15, // radius
  0, // start angle
  Math.PI * 2, // full circle
  {
    duration: 30,
    ease: AnimationEase.Power1InOut,
    repeat: -1,
  },
);

// Camera dolly (zoom in/out)
AnimationHelper.createDollyAnimation(
  camera,
  new THREE.Vector3(0, 0, 0), // target point
  50, // start distance
  10, // end distance
  {
    duration: 4,
    ease: AnimationEase.Power2InOut,
  },
);
```

## Material Animations

### Color Animation

Animates a material's color to a target color.

```typescript
// Animate to hex color
AnimationHelper.animateColor(
  material,
  0xff0000, // red
  {
    duration: 1,
    ease: AnimationEase.Power2Out,
  },
);

// Animate to THREE.Color
AnimationHelper.animateColor(
  material,
  new THREE.Color(0, 1, 0), // green
  {
    duration: 2,
    ease: AnimationEase.SineInOut,
  },
);
```

### Opacity Animation

Animates a material's opacity for fade effects.

```typescript
// Fade in
AnimationHelper.animateOpacity(
  material,
  1.0, // fully opaque
  {
    duration: 1,
    ease: AnimationEase.Power2Out,
  },
);

// Fade out
AnimationHelper.animateOpacity(
  material,
  0.0, // fully transparent
  {
    duration: 0.5,
    ease: AnimationEase.Power2In,
  },
);
```

### Custom Material Properties

Animates any material property.

```typescript
// Animate shader uniform
AnimationHelper.animateMaterial(material, "uniforms.uIntensity.value", 2.0, {
  duration: 2,
  ease: AnimationEase.Power2InOut,
});

// Animate custom property
AnimationHelper.animateMaterial(material, "userData.glowIntensity", 1.5, {
  duration: 1,
  ease: AnimationEase.SineInOut,
});
```

## Specialized Animations

### Floating Animation

Creates a smooth floating motion for objects.

```typescript
// Gentle floating
AnimationHelper.createFloatingAnimation(
  asteroid,
  0.3, // 0.3 units amplitude
  3, // 3 seconds per cycle
  { repeat: -1, yoyo: true },
);

// More dramatic floating
AnimationHelper.createFloatingAnimation(
  spaceship,
  1.0, // 1 unit amplitude
  1.5, // faster cycle
  { repeat: -1, yoyo: true },
);
```

### Complex Timelines

Creates multi-step animations with precise timing.

```typescript
// Create a timeline
const timeline = AnimationHelper.createTimeline({
  onComplete: () => console.log("Timeline complete"),
});

// Add animations to timeline
timeline
  .to(cube.position, { x: 10, duration: 1 })
  .to(cube.scale, { x: 2, y: 2, z: 2, duration: 0.5 })
  .to(cube.rotation, { y: Math.PI, duration: 1 });

// Or use sequence animation
AnimationHelper.animateSequence(
  [cube1, cube2, cube3],
  (object, index) => ({
    target: object.position,
    x: index * 5,
    duration: 0.5,
    ease: AnimationEase.BackOut,
  }),
  0.2, // 0.2 second stagger
  { onComplete: () => console.log("Sequence complete") },
);
```

## Easing Functions

The `AnimationEase` enum provides access to all GSAP easing functions:

### Power Easing

- `Power1In`, `Power1Out`, `Power1InOut`
- `Power2In`, `Power2Out`, `Power2InOut`
- `Power3In`, `Power3Out`, `Power3InOut`
- `Power4In`, `Power4Out`, `Power4InOut`

### Special Easing

- `BackIn`, `BackOut`, `BackInOut` - Overshoot effect
- `BounceIn`, `BounceOut`, `BounceInOut` - Bounce effect
- `ElasticIn`, `ElasticOut`, `ElasticInOut` - Elastic effect

### Smooth Easing

- `SineIn`, `SineOut`, `SineInOut` - Smooth sine curve
- `ExpoIn`, `ExpoOut`, `ExpoInOut` - Exponential curve
- `CircIn`, `CircOut`, `CircInOut` - Circular curve

```typescript
// Use different easing for different effects
AnimationHelper.animatePosition(object, targetPosition, {
  duration: 1,
  ease: AnimationEase.BounceOut, // bouncy landing
  onComplete: () => {
    // Start floating after landing
    AnimationHelper.createFloatingAnimation(object, 0.2, 2);
  },
});
```

## Animation Control

### Stopping Animations

```typescript
// Stop specific animation
AnimationHelper.stopAnimation("position_cube-uuid");

// Stop all animations for an object
AnimationHelper.stopObjectAnimations(cube);

// Stop all animations
AnimationHelper.stopAllAnimations();
```

### Pausing and Resuming

```typescript
// Pause all animations
AnimationHelper.pauseAllAnimations();

// Resume all animations
AnimationHelper.resumeAllAnimations();
```

### Animation Monitoring

```typescript
// Check active animation count
const activeCount = AnimationHelper.getActiveAnimationCount();
console.log(`Active animations: ${activeCount}`);

// Get all active animation IDs
const animationIds = AnimationHelper.getActiveAnimationIds();
console.log("Active animations:", animationIds);

// Check if object has animations
const hasAnimations = AnimationHelper.hasActiveAnimations(cube);
if (hasAnimations) {
  console.log("Cube has active animations");
}
```

## Performance Considerations

### Animation Optimization

- **Batch Updates**: Use timelines for complex animations to reduce overhead
- **Easing Selection**: Choose appropriate easing functions for your use case
- **Animation Cleanup**: Always stop animations when objects are disposed

### Memory Management

```typescript
// Clean up when disposing objects
function disposeObject(object) {
  // Stop all animations for this object
  AnimationHelper.stopObjectAnimations(object);

  // Dispose of the object
  object.geometry.dispose();
  object.material.dispose();
}

// Clean up all animations on application shutdown
function cleanup() {
  AnimationHelper.dispose();
}
```

### GSAP Integration

The AnimationHelper is built on top of GSAP, providing access to all GSAP features:

```typescript
// Get the underlying GSAP tween for advanced control
const tween = AnimationHelper.animatePosition(cube, targetPosition);

// Access GSAP methods
tween.timeScale(2); // Speed up animation
tween.reverse(); // Reverse animation
tween.seek(0.5); // Jump to 50% of animation

// Use GSAP timeline for complex sequences
const timeline = gsap.timeline();
timeline
  .add(AnimationHelper.animatePosition(cube, pos1))
  .add(AnimationHelper.animateRotation(cube, rot1), "-=0.5") // Overlap
  .add(AnimationHelper.animateScale(cube, scale1));
```

## Best Practices

### Animation Configuration

```typescript
// Use consistent configuration objects
const standardConfig = {
  duration: 1,
  ease: AnimationEase.Power2Out,
  onComplete: () => console.log("Animation complete"),
};

// Apply to multiple animations
AnimationHelper.animatePosition(cube1, pos1, standardConfig);
AnimationHelper.animatePosition(cube2, pos2, standardConfig);
```

### Camera Animation

```typescript
// Smooth camera transitions
AnimationHelper.animateCamera(camera, newPosition, {
  duration: 2,
  ease: AnimationEase.Power2InOut,
  lookAt: target,
  onStart: () => {
    // Disable controls during transition
    controls.enabled = false;
  },
  onComplete: () => {
    // Re-enable controls
    controls.enabled = true;
  },
});
```

### Material Effects

```typescript
// Create glowing effect
function createGlowEffect(material) {
  AnimationHelper.animateMaterial(
    material,
    "uniforms.glowIntensity.value",
    2.0,
    {
      duration: 1,
      ease: AnimationEase.SineInOut,
      repeat: -1,
      yoyo: true,
    },
  );
}

// Fade in/out effects
function fadeInObject(object) {
  AnimationHelper.animateOpacity(object.material, 1.0, {
    duration: 0.5,
    ease: AnimationEase.Power2Out,
  });
}
```

### Complex Sequences

```typescript
// Create entrance animation sequence
function createEntranceAnimation(objects) {
  const timeline = AnimationHelper.createTimeline({
    onComplete: () => console.log("All objects entered"),
  });

  objects.forEach((object, index) => {
    // Start with objects invisible
    object.material.opacity = 0;
    object.scale.setScalar(0);

    // Add to timeline with stagger
    timeline
      .to(object.material, { opacity: 1, duration: 0.3 }, index * 0.1)
      .to(
        object.scale,
        { x: 1, y: 1, z: 1, duration: 0.5, ease: AnimationEase.BackOut },
        index * 0.1,
      );
  });

  return timeline;
}
```

## Integration with Teskooano

The AnimationHelper is designed to work seamlessly with the Teskooano engine:

- **Performance**: Optimized for high-frequency updates in space simulations
- **Memory Management**: Integrates with the engine's resource management system
- **Camera Integration**: Works with CameraHelper for smooth camera transitions
- **Material Support**: Compatible with all Teskooano material types

## Related Documentation

- [Getting Started](../getting-started.md) - Basic setup and usage
- [Camera Utilities](./camera.md) - Camera creation and animation
- [Scene Utilities](./scene.md) - Scene creation and management
- [API Reference](../api-reference.md) - Complete method documentation
