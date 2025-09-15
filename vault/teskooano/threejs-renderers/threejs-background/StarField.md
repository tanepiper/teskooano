---
aliases: [StarField]
tags: [renderer, threejs, background]
type: Class
package: "@teskooano/renderer-threejs-background"
name: StarField
dependencies: ["three", "Field"]
functions: ["update", "toggleDebug", "dispose"]
status: active
---

# StarField

Layered star backdrop built from multiple `THREE.Points` layers with color gradients and parallax support.

## Features

- Multiple layers with different densities, brightness and tints
- Parallax via inverse camera movement scaled by `parallaxStrength`
- Debug recolors each layer with solid colors for inspection
