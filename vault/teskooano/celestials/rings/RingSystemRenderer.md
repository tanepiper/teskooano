---
aliases: [RingSystemRenderer]
tags: [renderer, threejs, rings]
type: Class
package: "@teskooano/celestials-rings"
name: RingSystemRenderer
dependencies: ["three", "@teskooano/renderer-threejs-celestial"]
functions: ["getLODLevels", "initialize", "getRingMeshes", "registerWithLightingManager", "update", "dispose"]
status: active
---

# RingSystemRenderer

Creates ring/accretion disk meshes with LODs and integrates with parent renderer for material registration and shadow casting.

## Features

- Supports new `ringSystem` config and legacy `rings`
- LODs for high/medium/low with configurable segments and distances
- Exposes `getRingMeshes(detail)` for lighting registration
- Optional accretion disk material with astrophysical params

## Update

- Computes dynamic ambient, updates materials, optional parent axial tilt and precession

