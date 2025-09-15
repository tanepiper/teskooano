---
aliases: [AnimationHelper]
tags: [renderer, threejs, helpers, animation, gsap]
type: Class
package: "@teskooano/renderer-threejs-helpers"
name: AnimationHelper
dependencies: ["three", "gsap"]
classes:
  [
    "THREE.Object3D",
    "THREE.PerspectiveCamera",
    "gsap.core.Tween",
    "gsap.core.Timeline",
  ]
functions:
  [
    "animatePosition",
    "animateRotation",
    "animateScale",
    "animateCamera",
    "animateMaterial",
    "animateColor",
    "animateOpacity",
    "createFloatingAnimation",
    "createRotationAnimation",
    "createPulseAnimation",
    "createTimeline",
    "animateSequence",
    "stopAnimation",
    "stopObjectAnimations",
    "stopAllAnimations",
    "pauseAllAnimations",
    "resumeAllAnimations",
    "getActiveAnimationCount",
    "getActiveAnimationIds",
    "hasActiveAnimations",
    "createOrbitAnimation",
    "createDollyAnimation",
    "dispose",
  ]
status: active
---

# AnimationHelper

GSAP-powered animation utilities for Three.js objects, cameras, and materials with built-in lifecycle control and pooling of active animations.

## Responsibilities

- Animate transforms: position, rotation, scale
- Animate camera moves with optional lookAt and OrbitControls sync
- Animate materials (color, opacity, uniforms via property paths)
- Provide canned animations (float, rotate, pulse, orbit, dolly)
- Manage active animations: stop/cancel/pause/resume

## Key Methods

- `animatePosition(object, target, cfg)` / `animateRotation` / `animateScale`
- `animateCamera(camera, targetPos, { lookAt, orbitControls, ... })`
- `animateMaterial(material, propertyPath, toValue, cfg)` and sugar: `animateColor`, `animateOpacity`
- `createFloatingAnimation`, `createRotationAnimation`, `createPulseAnimation`
- `createOrbitAnimation(camera, target, radius, startAngle, endAngle, cfg)`
- `createDollyAnimation(camera, target, startDistance, endDistance, cfg)`
- `stopAnimation(id)`, `stopObjectAnimations(object)`, `stopAllAnimations()`

## Events & State

- Stores animations in an internal Map keyed per-object/property id
- Exposes counts and ids to aid debugging

## Performance Notes

- Reuses a single Map to avoid leaks; ensure `dispose()` is called on teardown
- Uses GSAP’s internal tick; controls updated in GSAP onUpdate where provided
