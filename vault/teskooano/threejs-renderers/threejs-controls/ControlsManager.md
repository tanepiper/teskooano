---
aliases: [ControlsManager]
tags: [renderer, threejs, controls]
type: Class
package: "@teskooano/renderer-threejs-controls"
name: ControlsManager
dependencies:
  [
    "three",
    "rxjs",
    "OrbitControlsHandler",
    "CameraTransitionManager",
    "ObjectFollower",
    "@teskooano/core-state",
  ]
functions:
  [
    "transitionTargetTo",
    "moveToPosition",
    "transitionToWithLookAtFirst",
    "cancelTransition",
    "startFollowing",
    "stopFollowing",
    "update",
    "updateMinDistance",
    "setEnabled",
    "setDebugMode",
    "dispose",
    "calculateTransitionDuration",
  ]
status: active
---

# ControlsManager

Public facade for camera interaction. Composes [[OrbitControlsHandler]], [[CameraTransitionManager]], and [[ObjectFollower]].

## Responsibilities

- Delegate user input to OrbitControlsHandler
- Run programmatic transitions (single target; position+target; look-at-first) via CameraTransitionManager
- Maintain follow behavior and synchronize offsets after manual interaction

## Events

- Emits `USER_CAMERA_MANIPULATION` when user finishes interaction

## Performance

- Orders updates: follower → controls update → GSAP onUpdate hooks
- Transition duration estimated by path distance (`calculateTransitionDuration`)
