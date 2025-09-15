---
aliases: [PluginLoader]
tags: [app, ui, plugins]
type: Class
package: "@teskooano/ui-plugin"
name: PluginLoader
functions: ["loadPlugins"]
status: active
---

# PluginLoader

Loads plugins using virtual loaders and resolves dependencies with a topological sort. Returns loaded plugin map and processing order.

## Flow

- Read loaders from `virtual:teskooano-loaders`
- DFS resolve with cycle detection (processing set) and visited set
- Throw on missing loader or unmet dependency not already registered
