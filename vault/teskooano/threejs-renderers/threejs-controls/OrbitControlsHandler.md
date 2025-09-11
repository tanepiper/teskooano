---
aliases: [OrbitControlsHandler]
tags: [renderer, threejs, controls]
type: Class
package: "@teskooano/renderer-threejs-controls"
name: OrbitControlsHandler
dependencies: ["three", "OrbitControls", "rxjs"]
functions: ["update", "setEnabled", "dispose", "updateMinDistance"]
events: ["onControlsStart$", "onControlsEnd$"]
status: active
---

# OrbitControlsHandler

Lifecycle and event wrapper for Three.js `OrbitControls`. Emits start/end events with position and target for state syncing.

## Behavior

- Damping enabled by default; dynamic `minDistance` updates
- Emits `onControlsEnd$` with `{ position, target }` snapshot

