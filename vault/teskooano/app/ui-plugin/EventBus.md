---
aliases: [EventBus]
tags: [app, ui, events]
type: Class
package: "@teskooano/ui-plugin"
name: EventBus
functions:
  [
    "setDebugMode",
    "emit",
    "on",
    "onAll",
    "once",
    "off",
    "clear",
    "getEventHistory",
    "getStats",
  ]
status: active
---

# EventBus

Singleton, type-light event bus for plugins/components. Supports namespacing via `source`/`target`, immediate replay of last event, trigger limits, history and debug logs.

## Usage

- `emit(type, payload, { source, target, bubbles })`
- `on(type, listener, { source, target, immediate, maxTriggers })`
- `onAll(listener)` for global monitors; `getStats()` for diagnostics
