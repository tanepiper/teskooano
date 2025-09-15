---
aliases: [Event Bus Pattern, rendererEvents]
tags: [architecture, pattern, events, rxjs]
type: pattern
status: active
---

# Event Bus Pattern

Centralized RxJS event bus for renderer internals (see [[rendererEvents]]). Promotes loose coupling between systems.

## Streams

- beforeRender$, afterRender$
- resize$, dispose$
- statsUpdated$, performanceOptimizationChanged$

## Sequence

```mermaid
sequenceDiagram
  participant Loop as AnimationLoop
  participant Bus as rendererEvents
  participant Systems as Managers
  Loop->>Bus: beforeRender$ {delta, elapsed}
  Bus-->>Systems: Subscriptions fire
  Systems->>Loop: onRender callbacks
  Loop->>Bus: afterRender$
```
