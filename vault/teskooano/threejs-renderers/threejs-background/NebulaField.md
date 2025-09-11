---
aliases: [NebulaField]
tags: [renderer, threejs, background, shader]
type: Class
package: "@teskooano/renderer-threejs-background"
name: NebulaField
dependencies: ["three", "Field", "GLSL shaders"]
functions: ["update", "toggleDebug", "dispose"]
status: active
---

# NebulaField

Shader-driven volumetric nebula rendered on a large back-facing sphere with slow rotation and time-evolving noise.

## Uniforms

- `uTime`, `uAlpha`, `uColors[]`, `uNoise*`, `uNoiseSeed`

## Behavior

- Rotates at `rotationSpeed`; increments `uTime`
- Positioned at `-baseDistance` with tiny random offset to avoid z-fighting

