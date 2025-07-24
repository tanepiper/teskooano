# Celestial Animation Utilities

The celestial animation utilities provide specialized animation methods for celestial objects in the Teskooano app, building on top of the core AnimationHelper.

## CelestialAnimationHelper

The `CelestialAnimationHelper` class provides static methods for creating common animations for stars, planets, moons, and other celestial bodies.

### Overview

```typescript
import {
  CelestialAnimationHelper,
  CelestialAnimationConfig,
} from "@teskooano/renderer-threejs-helpers";

// Specialized animations for celestial objects
```

## Planet and Moon Animations

### Planet Rotation

Creates a smooth rotation animation for planets and moons around their axis.

```typescript
// Earth rotation (24 hours)
CelestialAnimationHelper.createPlanetRotation(
  earthObject,
  86400, // 24 hours in seconds
  {
    onComplete: () => console.log("Rotation started"),
  },
);

// Moon rotation (27.3 days)
CelestialAnimationHelper.createPlanetRotation(
  moonObject,
  2358720, // 27.3 days in seconds
  {
    onComplete: () => console.log("Moon rotation started"),
  },
);
```

### Moon Floating

Creates a gentle floating motion for moons and satellites.

```typescript
// Gentle floating for a moon
CelestialAnimationHelper.createMoonFloat(
  moonObject,
  0.1, // 0.1 units amplitude
  3.0, // 3 seconds per cycle
);

// More dramatic floating for a satellite
CelestialAnimationHelper.createMoonFloat(
  satelliteObject,
  0.5, // 0.5 units amplitude
  1.5, // 1.5 seconds per cycle
);
```

## Star Animations

### Star Pulsing

Creates a pulsing animation to simulate stellar activity.

```typescript
// Gentle star pulse
CelestialAnimationHelper.createStarPulse(
  starObject,
  1.02, // 2% size change
  3.0, // 3 seconds per pulse
);

// More dramatic pulse for variable stars
CelestialAnimationHelper.createStarPulse(
  variableStarObject,
  1.15, // 15% size change
  1.0, // 1 second per pulse
);
```

### Star Glow

Animates the glow intensity of star materials.

```typescript
// Gentle glow animation
CelestialAnimationHelper.createGlowAnimation(
  starMaterial,
  0.8, // Minimum intensity
  1.2, // Maximum intensity
  2.0, // 2 seconds per cycle
);

// Intense glow for bright stars
CelestialAnimationHelper.createGlowAnimation(
  brightStarMaterial,
  0.6, // Minimum intensity
  1.5, // Maximum intensity
  1.0, // 1 second per cycle
);
```

## Entrance and Exit Animations

### Object Entrance

Creates a smooth entrance animation when celestial objects first appear.

```typescript
// Fade in and scale up
CelestialAnimationHelper.createEntranceAnimation(newPlanetObject, {
  duration: 1.5,
  ease: AnimationEase.BackOut,
  onComplete: () => console.log("Planet appeared"),
});
```

### Object Exit

Creates a smooth exit animation when celestial objects are removed.

```typescript
// Fade out and scale down
CelestialAnimationHelper.createExitAnimation(planetObject, {
  duration: 1.0,
  ease: AnimationEase.BackIn,
  onComplete: () => {
    console.log("Planet disappeared");
    scene.remove(planetObject);
  },
});
```

## Camera Focus Animations

### Focus on Object

Creates a smooth camera animation to focus on a celestial object.

```typescript
// Focus on a planet
CelestialAnimationHelper.createFocusAnimation(
  camera,
  planetObject,
  15, // Distance from planet
  {
    duration: 2.0,
    ease: AnimationEase.Power2InOut,
    onComplete: () => console.log("Focused on planet"),
  },
);

// Focus on a star
CelestialAnimationHelper.createFocusAnimation(
  camera,
  starObject,
  50, // Distance from star
  {
    duration: 3.0,
    ease: AnimationEase.Power2InOut,
    onComplete: () => console.log("Focused on star"),
  },
);
```

## Animation Management

### Stop Animations

```typescript
// Stop all animations for a specific object
CelestialAnimationHelper.stopCelestialAnimations(planetObject);

// Stop all animations globally
CelestialAnimationHelper.dispose();
```

## Integration Examples

### Complete Planet Setup

```typescript
function setupPlanet(planetObject, planetMaterial) {
  // Create rotation animation
  const rotationAnimation = CelestialAnimationHelper.createPlanetRotation(
    planetObject,
    86400, // 24 hours
  );

  // Create entrance animation
  const entranceAnimation = CelestialAnimationHelper.createEntranceAnimation(
    planetObject,
    {
      duration: 1.0,
      onComplete: () => {
        console.log("Planet fully appeared");
      },
    },
  );

  return {
    rotationAnimation,
    entranceAnimation,
    dispose: () => {
      CelestialAnimationHelper.stopCelestialAnimations(planetObject);
    },
  };
}
```

### Star System Animation

```typescript
function animateStarSystem(starObject, planetObjects) {
  // Animate the star
  const starPulse = CelestialAnimationHelper.createStarPulse(starObject);
  const starGlow = CelestialAnimationHelper.createGlowAnimation(
    starObject.material,
  );

  // Animate planets
  const planetAnimations = planetObjects.map((planet, index) => {
    const rotation = CelestialAnimationHelper.createPlanetRotation(
      planet,
      86400 * (1 + index * 0.5), // Different rotation periods
    );

    const entrance = CelestialAnimationHelper.createEntranceAnimation(planet, {
      delay: index * 0.5, // Staggered entrance
      duration: 1.0,
    });

    return { rotation, entrance };
  });

  return {
    starPulse,
    starGlow,
    planetAnimations,
    dispose: () => {
      CelestialAnimationHelper.stopCelestialAnimations(starObject);
      planetObjects.forEach((planet) => {
        CelestialAnimationHelper.stopCelestialAnimations(planet);
      });
    },
  };
}
```

### Camera Focus Sequence

```typescript
function createFocusSequence(camera, objects) {
  let currentIndex = 0;

  function focusNext() {
    if (currentIndex >= objects.length) {
      currentIndex = 0; // Loop back to start
    }

    const targetObject = objects[currentIndex];

    CelestialAnimationHelper.createFocusAnimation(
      camera,
      targetObject,
      20, // Distance
      {
        duration: 2.0,
        onComplete: () => {
          console.log(`Focused on ${targetObject.name}`);
          currentIndex++;

          // Focus on next object after delay
          setTimeout(focusNext, 3000);
        },
      },
    );
  }

  // Start the sequence
  focusNext();

  return {
    stop: () => {
      AnimationHelper.stopObjectAnimations(camera);
    },
  };
}
```

## Best Practices

### Performance Considerations

```typescript
// Use appropriate animation periods for different object types
const ANIMATION_PERIODS = {
  star: 2.0, // Stars pulse quickly
  planet: 86400, // Planets rotate slowly
  moon: 2358720, // Moons rotate very slowly
  satellite: 3.0, // Satellites float gently
};

// Stop animations when objects are removed
function removeCelestialObject(object) {
  CelestialAnimationHelper.stopCelestialAnimations(object);
  CelestialAnimationHelper.createExitAnimation(object, {
    onComplete: () => {
      scene.remove(object);
      object.geometry.dispose();
      object.material.dispose();
    },
  });
}
```

### Material Requirements

```typescript
// Ensure materials support transparency for entrance/exit animations
function prepareMaterialForAnimation(material) {
  material.transparent = true;
  material.opacity = 0; // Start invisible
  return material;
}

// Ensure materials have required uniforms for glow animations
function prepareStarMaterial(material) {
  if (!material.uniforms) {
    material.uniforms = {};
  }
  material.uniforms.glowIntensity = { value: 1.0 };
  return material;
}
```

## Integration with Teskooano

The CelestialAnimationHelper is designed to work seamlessly with the Teskooano engine:

- **Performance**: Optimized for high-frequency updates in space simulations
- **Memory Management**: Integrates with the engine's resource management system
- **Camera Integration**: Works with CameraHelper for smooth camera transitions
- **Material Support**: Compatible with all Teskooano material types
- **Object Lifecycle**: Provides entrance and exit animations for object management

## Related Documentation

- [Animation Utilities](./animation.md) - Core animation functionality
- [Camera Utilities](./camera.md) - Camera creation and animation
- [Getting Started](../getting-started.md) - Basic setup and usage
- [API Reference](../api-reference.md) - Complete method documentation
