---
aliases: [ReactiveState]
tags: [app, ui, state]
type: Class
package: "@teskooano/ui-plugin"
name: ReactiveState
functions:
  [
    "get",
    "set",
    "update",
    "watch",
    "computed",
    "removeComputed",
    "dispose",
    "snapshot",
  ]
status: active
---

# ReactiveState

Minimal reactive state with computed properties, watchers, batching, and dependency tracking. Designed for plugin-local UI state.

## Concepts

- Proxy-backed data object triggers `scheduleUpdate` on set
- `computed(name, { deps, compute })` with cache/dirty flags and dependent invalidation
- `watch(prop, fn)` with unsubscribe; updates batched in microtasks

## Utilities

- `createReactiveState<T>(initial)` typed helper
- `connectObservable(state, prop, observable)` to sync RxJS streams
