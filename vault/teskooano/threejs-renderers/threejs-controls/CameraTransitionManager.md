---
aliases: [CameraTransitionManager]
tags: [renderer, threejs, controls, camera, gsap]
type: Class
package: "@teskooano/renderer-threejs-controls"
name: CameraTransitionManager
dependencies: ["three", "gsap", "AnimationHelper", "@teskooano/notifications"]
functions: ["getIsAnimating", "cancelTransition", "transitionTargetTo", "transitionTo", "transitionToWithLookAtFirst", "calculateTransitionDuration", "dispose"]
status: active
---

# CameraTransitionManager

Runs GSAP-driven camera transitions while temporarily disabling OrbitControls and coordinating with [[ObjectFollower]]. Displays progress via notifications.

## Flow

- `beginTransition()`: stop existing, disable damping/controls, set flags
- `transitionTargetTo(target)`: lookAt-only movement
- `transitionTo(pos, target)`: single-stage move with live remaining distance (AU)
- `transitionToWithLookAtFirst(pos, target)`: two-stage align → travel with live speed/ETA
- `endTransition(pos, target, type, focusedId)`: re-enable controls and dispatch `CAMERA_TRANSITION_COMPLETE`

## Duration Model

- `duration = clamp( MIN..MAX, BASE * (distanceAU ^ exponent) )`

