---
aliases: [GalaxyField]
tags: [renderer, threejs, background]
type: Class
package: "@teskooano/renderer-threejs-background"
name: GalaxyField
dependencies: ["three", "Field"]
functions: ["update", "toggleDebug", "dispose"]
status: active
---

# GalaxyField

Instanced distant galaxies rendered as billboards/meshes with optional parallax. Debug mode swaps a bright material for visibility.

## Behavior

- Creates instanced mesh group from generator
- Stores/restores original material on debug toggle

