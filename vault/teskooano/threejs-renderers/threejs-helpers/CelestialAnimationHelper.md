---
aliases: [CelestialAnimationHelper]
tags: [renderer, threejs, helpers, animation, celestial]
type: Class
package: "@teskooano/renderer-threejs-helpers"
name: CelestialAnimationHelper
dependencies: ["three", "gsap", "AnimationHelper"]
functions:
  [
    "createPlanetRotation",
    "createStarPulse",
    "createMoonFloat",
    "createGlowAnimation",
    "createEntranceAnimation",
    "createExitAnimation",
    "createFocusAnimation",
    "stopCelestialAnimations",
    "dispose",
  ]
status: active
---

# CelestialAnimationHelper

Domain-specific animation helpers built atop [[AnimationHelper]] for planets, stars, moons, and camera focus.

## Core Functions

- `createPlanetRotation(object, rotationPeriod)` infinite Y-axis spin
- `createStarPulse(object, intensity, period)` scale pulsing
- `createMoonFloat(object, amplitude, period)` bobbing motion
- `createGlowAnimation(material, min, max, period)` shader uniform easing
- `createEntranceAnimation(object)` fade+scale in; `createExitAnimation` fade+scale out
- `createFocusAnimation(camera, object, distance)` position + lookAt with OrbitControls sync

## Notes

- All return GSAP tween/timeline handles
- Use `stopCelestialAnimations(object)` to cancel per-object animations
