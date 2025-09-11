---
aliases: [PluginExecutor]
tags: [app, ui, plugins]
type: Class
package: "@teskooano/ui-plugin"
name: PluginExecutor
dependencies: ["dockview-core", "rxjs"]
functions: ["setDependencies", "execute", "getManagerInstance"]
status: active
---

# PluginExecutor

Executes registered plugin functions with a curated execution context (plugin manager proxy, Dockview API, manager access, function recursion).

## Responsibilities

- Resolve function by id, construct `PluginExecutionContext`, invoke `execute`
- Expose `getManagerInstance(id)` to plugin code
- Provide registry-backed `execute` for composition

