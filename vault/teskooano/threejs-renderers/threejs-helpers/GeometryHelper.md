---
aliases: [GeometryHelper]
tags: [renderer, threejs, helpers, geometry]
type: Class
package: "@teskooano/renderer-threejs-helpers"
name: GeometryHelper
dependencies: ["three"]
functions: ["createBox", "createSphere", "createTetrahedron", "createTorus", "createPlane", "createCylinder", "createCone", "createCircle", "createRing", "createStars"]
status: active
---

# GeometryHelper

Convenience factory for common meshes with consistent material defaults and transform helpers; includes a fast starfield creator.

## Highlights

- `createRing` supports injecting custom material (used by rings)
- `createStars(amount, color, size, spread)` generates `THREE.Points`

