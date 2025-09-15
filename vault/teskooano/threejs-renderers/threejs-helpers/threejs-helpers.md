---
aliases: [threejs-helpers, helpers]
tags: [renderer, threejs, helpers, utilities]
type: index
package: "@teskooano/renderer-threejs-helpers"
version: "1.0.0"
dependencies: ["three", "gsap"]
classes:
  [
    "SceneHelper",
    "CameraHelper",
    "AnimationHelper",
    "CelestialAnimationHelper",
    "LightingHelper",
    "LineHelper",
    "GeometryHelper",
    "BufferPool",
    "CircularBuffer",
  ]
status: active
---

# Three.js Helpers (`@teskooano/renderer-threejs-helpers`)

Utility helpers shared across renderer packages. These provide optimized creation of common Three.js constructs, memory utilities, and rendering helpers.

## 📦 Dependencies

- `three`
- `gsap`

## 🔗 Related

- [[threejs-core]] uses `SceneHelper` and `CameraHelper` during scene init
- [[threejs-orbits]] uses buffer and line helpers for fast orbital lines
- [[threejs-camera]] integrates with `CameraHelper`

## 📚 Classes

- [[SceneHelper]]: Optimized factory for `Scene`, `Renderer`, and defaults
- [[CameraHelper]]: Camera creation, presets, and updates
- [[AnimationHelper]]: rAF utilities and time helpers
- [[CelestialAnimationHelper]]: Domain-specific animation helpers
- [[LightingHelper]]: Default lights, shadow setup
- [[LineHelper]]: Fast line/geometry builders for paths
- [[GeometryHelper]]: Geometry convenience methods
- [[BufferPool]]: Reusable ArrayBuffer/TypedArray pooling
- [[CircularBuffer]]: Fixed-size circular buffer implementation

---
