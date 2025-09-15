---
aliases: [CameraManager]
tags: [renderer, threejs, camera, state]
type: Class
package: "@teskooano/renderer-threejs-camera"
name: CameraManager
dependencies:
  [
    "@teskooano/core-state",
    "@teskooano/data-types",
    "@teskooano/renderer-threejs-helpers",
    "rx",
    "three",
  ]
functions:
  [
    "setDependencies",
    "initializeCameraPosition",
    "getCameraState$",
    "followObject",
    "pointCameraAt",
    "resetCameraView",
    "clearFocus",
    "setFov",
    "destroy",
  ]
status: active
---

# CameraManager

High-level camera controller that owns camera state (via core-state `CameraStore`) and coordinates with the renderer’s Controls subsystem. Enforces the rule: UI sets focus/follow state; camera reacts.

## Responsibilities

- Initialize and synchronize camera state (position, target, FOV)
- Perform programmatic focus/follow using ControlsManager transitions
- Maintain dynamic min-distance and log-depth related settings per celestial type (via [[CameraHelper]])
- Expose state as `BehaviorSubject<CameraState>`

## Key Methods

- `setDependencies({ renderer, panelId, onFocusChangeCallback, initial* })`
- `followObject(objectId | null, distance?)`: smooth transitions with velocity prediction and time scaling
- `pointCameraAt(target)` and `resetCameraView()` / `clearFocus()`
- `setFov(fov)`; updates renderer SceneManager and state

## Events

- Listens to `camera-transition-complete` and `user-camera-manipulation` document events (dispatched by ControlsManager)

## Performance & UX

- Temporarily adjusts simulation time scale during long transitions
- Predicts object position over transition time to reduce snapping
