---
aliases: [RegistrationManager]
tags: [app, ui, plugins]
type: Class
package: "@teskooano/ui-plugin"
name: RegistrationManager
functions: ["processPlugin", "setDependencies", "unregisterPluginItems"]
status: active
---

# RegistrationManager

Writes plugin contributions into registries (panels, functions, toolbar items, managers, components). Auto-defines custom elements where applicable.

## Responsibilities

- Panels: record config, define custom element (see HMR flow note)
- Functions: register per id
- Toolbar: defer items until initializer function deps are present; stable order
- Managers: instantiate and invoke optional `setDependencies`
- Components: define via `customElements.define`

