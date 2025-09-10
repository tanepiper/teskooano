---
aliases: [threejs-controls, controls]
tags: [renderer, threejs, controls]
type: index
package: "@teskooano/renderer-threejs-controls"
version: "0.4.0-dev.0"
dependencies: ["@teskooano/core-state", "@teskooano/data-types", "@teskooano/renderer-threejs-core", "@teskooano/renderer-threejs-camera", "@teskooano/notifications", "three", "gsap"]
classes: ["ControlsManager", "OrbitControlsHandler", "CameraTransitionManager", "ObjectFollower"]
status: active
---

# Three.js Controls (`@teskooano/renderer-threejs-controls`)

Input system decoupled from camera automation. Follows project rule: Controls handle input; camera reacts to state.

## 📚 Classes

- [[ControlsManager]]: Orchestrates input subscriptions and publishes state
- [[OrbitControlsHandler]]: Wraps orbit behavior
- [[CameraTransitionManager]]: Smooth scripted moves
- [[ObjectFollower]]: Maintains follow behavior via state

## 🔗 Related

- [[threejs-camera|CameraManager]] subscribes to focus/follow state
- [[threejs-core|rendererEvents]] for timing hooks

