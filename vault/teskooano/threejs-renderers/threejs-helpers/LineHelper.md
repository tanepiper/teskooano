---
aliases: [LineHelper]
tags: [renderer, threejs, helpers, geometry, orbits]
type: Class
package: "@teskooano/renderer-threejs-helpers"
name: LineHelper
dependencies: ["three"]
functions:
  [
    "createLine",
    "updateLine",
    "resizeLineBuffer",
    "disposeLine",
    "clear",
    "createSpiralPoints",
    "updateLinesGroup",
    "createSpiralLinesGroup",
    "createLineCurve",
    "createQuadraticBezierCurve",
    "createCubicBezierCurve",
    "createCustomCurve",
    "createCurvePath",
    "createLineFromPoints",
    "createPointsFromPoints",
    "updateGeometryFromCurve",
    "createCurveAlphaFunction",
  ]
status: active
---

# LineHelper

Efficient creation and updates of buffered line/points geometries with a backing [[BufferPool]]. Used heavily by orbit/trail renderers.

## Responsibilities

- Preallocate and reuse Float32 buffers for line positions
- Provide curve utilities and geometry updaters
- Dispose and return buffers to pool

## Performance

- Avoids reallocation by `resizeLineBuffer` when capacity grows
- Sets `frustumCulled=false` for continuous path rendering
