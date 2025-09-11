---
aliases: [HMRManager]
tags: [app, ui, plugins, hmr]
type: Class
package: "@teskooano/ui-plugin"
name: HMRManager
functions: ["setCallbacks", "reloadPlugin", "unloadPlugin"]
status: active
---

# HMRManager

Handles plugin Hot Module Replacement lifecycle: unload (dispose + deregister) then load/register updated module; emits status callbacks.

## Events

- Listens to `teskooano-plugin-update` via Vite HMR client; triggers reload

## Lifecycle

- `unloadPlugin(id)`: call `dispose` if present; remove all registries; emit pluginsChanged
- `reloadPlugin(id)`: unload then re-load via PluginLoader; process via RegistrationManager; run `initialize` if present

