---
aliases: [BufferPool]
tags: [renderer, threejs, helpers, memory]
type: Class
package: "@teskooano/renderer-threejs-helpers"
name: BufferPool
dependencies: ["three"]
functions:
  [
    "getBuffer",
    "releaseBuffer",
    "getBufferWithItemSize",
    "clear",
    "getStatistics",
    "getMemoryUsage",
    "garbageCollect",
    "resetStats",
  ]
status: active
---

# BufferPool

Memory pool for `THREE.BufferAttribute` instances keyed by vertex count. Reduces GC churn for dynamic lines/trails.

## Behavior

- Caches buffers up to `maxCachedBufferSize` with per-size cap
- Zero-fills on checkout and return
- Tracks statistics and exposes memory usage

## Used By

- [[LineHelper]] for orbit/trail buffers
