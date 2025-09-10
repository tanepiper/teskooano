---
aliases: [SceneHelper]
tags: [renderer, threejs, helpers, scene]
type: Class
package: "@teskooano/renderer-threejs-helpers"
name: SceneHelper
dependencies: ["three"]
classes: ["THREE.Scene", "THREE.WebGLRenderer"]
functions: []
constants: []
types: []
status: active
---

# SceneHelper

Factory utilities to create optimized `THREE.Scene` and `THREE.WebGLRenderer` instances with recommended defaults for the Teskooano renderer.

## 🎯 Purpose

- Create scenes/renderers with consistent defaults (tone mapping, shadow maps, pixel ratio)
- Centralize device-aware configuration used by [[threejs-core|SceneManager]]

## 🔗 Used By

- [[threejs-core|SceneManager]] during initialization
- [[threejs-background|BackgroundManager]] for renderer access

