---
aliases: [ui-plugin]
tags: [app, ui, plugins]
type: index
package: "@teskooano/ui-plugin"
version: "0.4.0-dev.0"
dependencies: ["dockview-core"]
classes:
  [
    "PluginExecutor",
    "PluginLoader",
    "RegistrationManager",
    "HMRManager",
    "EventBus",
    "ReactiveState",
  ]
status: active
---

# UI Plugin System (`@teskooano/ui-plugin`)

Extensible plugin architecture for UI features. See detailed [[apps/teskooano/plugins/ui-plugin/ARCHITECTURE|ARCHITECTURE]] for flow diagrams.

## 📚 Classes

- PluginExecutor, PluginLoader, RegistrationManager, HMRManager
- EventBus, ReactiveState

## 🔗 Related

- Consumed by app panels in `apps/teskooano`
