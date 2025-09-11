---
aliases: [ObjectFollower]
tags: [renderer, threejs, controls]
type: Class
package: "@teskooano/renderer-threejs-controls"
name: ObjectFollower
dependencies: ["three", "OrbitControlsHandler"]
functions: ["startFollowing", "stopFollowing", "isFollowing", "getFollowOffset", "getFollowedObjectWorldPosition", "update", "updateFollowOffset", "syncPositionsAfterTransition"]
status: active
---

# ObjectFollower

Maintains a relative camera offset to a moving `THREE.Object3D`. Works with OrbitControls target and supports transitions.

## Behavior

- On each frame, computes delta of followed object and applies to camera and controls target
- After manual interaction, `updateFollowOffset()` re-derived from current positions
- `isFollowingTransitioning` flag prevents double updates during programmatic moves

