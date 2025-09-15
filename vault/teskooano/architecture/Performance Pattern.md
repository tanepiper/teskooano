---
aliases: [Performance Pattern, performance]
tags: [architecture, pattern, performance]
type: pattern
status: active
---

# Performance Pattern

Key mechanisms to maintain 60fps rendering in a large-scale scene.

## Strategies

- LOD System: distance-based complexity reduction
- Spatial Culling: frustum checks and distance gates
- Web Workers: trails and predictions off main thread
- Object Pooling: vectors, buffers (see [[Caching Pattern]])

## Flow (Mermaid)

```mermaid
flowchart LR
  A[Frame Start] --> B{Visible?}
  B -- No --> Z[Skip]
  B -- Yes --> C[LOD Compute]
  C --> D[Update Needed?]
  D -- No --> Z
  D -- Yes --> E[Worker Tasks]
  E --> F[GPU Submit]
  Z --> G[Frame End]
  F --> G
```
