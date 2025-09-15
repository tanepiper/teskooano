---
aliases: [threejs-camera, camera]
tags: [renderer, threejs, camera]
type: index
package: "@teskooano/renderer-threejs-camera"
version: "0.4.0-dev.0"
dependencies:
  [
    "@teskooano/core-state",
    "@teskooano/core-math",
    "@teskooano/data-types",
    "@teskooano/renderer-threejs",
    "@teskooano/renderer-threejs-helpers",
    "@teskooano/notifications",
    "three",
    "rxjs",
  ]
classes: ["CameraManager"]
status: active
---

# Three.js Camera (`@teskooano/renderer-threejs-camera`)

Camera subsystem for the renderer: manages camera state, presets, FOV, and integration with notifications.

## 📚 Classes

- [[CameraManager]]: Central camera control, subscribes to core state; integrates with [[threejs-helpers|CameraHelper]].

## 🔗 Related

- [[threejs-core|SceneManager]] provides camera instance to the loop
- [[threejs-controls]] interacts via state/events; see ControlsManager
