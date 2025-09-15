# RegistrationManager

Manages the registration of all plugin contributions including panels, functions, toolbar items, manager classes, and custom elements. Handles the complex process of integrating plugin components into the application's registry system.

## Class Definition

```typescript
export class RegistrationManager {
  #registries: PluginRegistries;
  #dockviewApi: DockviewApi | null = null;

  constructor(registries: PluginRegistries);
  public setDependencies(deps: { dockviewApi: DockviewApi | null }): void;
  public processPlugin(plugin: TeskooanoPlugin): void;
  public unregisterPluginItems(pluginId: string): void;
}
```

## Properties

### `#registries: PluginRegistries`

Private reference to the plugin registries managed by the PluginManager.

**Type**: `PluginRegistries`

**Structure**:

```typescript
type PluginRegistries = {
  pluginRegistry: Map<string, TeskooanoPlugin>;
  panelRegistry: Map<string, RegisteredItem<PanelConfig>>;
  functionRegistry: Map<string, RegisteredItem<FunctionConfig>>;
  toolbarRegistry: Map<ToolbarTarget, RegisteredItem<ToolbarItemConfig>[]>;
  pendingToolbarRegistrations: RegisteredItem<ToolbarRegistration>[];
  managerInstances: Map<string, { instance: any; pluginId: string }>;
  componentRegistry: Map<string, RegisteredItem<ComponentConfig>>;
};
```

### `#dockviewApi: DockviewApi | null`

Private reference to the Dockview API for panel management.

**Type**: `DockviewApi | null`

## Methods

### `setDependencies(deps: { dockviewApi: DockviewApi | null }): void`

Sets the Dockview API dependency for panel management.

**Parameters**:

- `deps.dockviewApi`: `DockviewApi | null` - The Dockview API instance

**Example**:

```typescript
registrationManager.setDependencies({
  dockviewApi: dockviewApi,
});
```

### `processPlugin(plugin: TeskooanoPlugin): void`

Processes and registers all contributions from a single plugin.

**Parameters**:

- `plugin`: `TeskooanoPlugin` - The plugin to register

**Example**:

```typescript
registrationManager.processPlugin({
  id: "my-plugin",
  name: "My Plugin",
  panels: [
    /* ... */
  ],
  functions: [
    /* ... */
  ],
  toolbarRegistrations: [
    /* ... */
  ],
  managerClasses: [
    /* ... */
  ],
  components: [
    /* ... */
  ],
});
```

**Behavior**:

- Registers panels and defines custom elements
- Registers functions
- Processes toolbar items with dependency resolution
- Instantiates manager classes
- Registers custom components

## Internal Methods

### `registerPanels(plugin: TeskooanoPlugin): void`

Registers panel configurations and defines custom elements for panels.

**Behavior**:

- Stores panel configuration in registry
- Defines custom elements using `customElements.define`
- Handles duplicate component name warnings
- Provides HMR warnings for already defined elements

### `registerFunctions(plugin: TeskooanoPlugin): void`

Registers function configurations in the function registry.

**Behavior**:

- Stores function configuration with plugin ID
- Skips already registered functions
- Enables function execution through PluginExecutor

### `registerToolbarItems(plugin: TeskooanoPlugin): void`

Registers toolbar items with dependency resolution for initializer functions.

**Behavior**:

- Adds toolbar registrations to pending list
- Processes pending items to resolve dependencies
- Handles initializer function dependencies
- Sorts items by order property

### `processPendingToolbarItems(): void`

Processes pending toolbar registrations, resolving dependencies for initializer functions.

**Behavior**:

- Checks if all required initializer functions are registered
- Moves satisfied registrations to active registry
- Keeps unsatisfied registrations in pending list
- Sorts items by order property

### `registerManagerClasses(plugin: TeskooanoPlugin): void`

Instantiates manager classes and calls their dependency injection methods.

**Behavior**:

- Creates instances of manager classes
- Calls `setDependencies` if available and dockviewApi is set
- Stores instances with plugin ID tracking
- Handles instantiation errors gracefully

### `registerComponents(plugin: TeskooanoPlugin): void`

Registers custom element components.

**Behavior**:

- Stores component configuration in registry
- Defines custom elements using `customElements.define`
- Skips already defined elements
- Handles definition errors gracefully

### `unregisterPluginItems(pluginId: string): void`

Removes all registrations for a specific plugin (used during HMR and plugin unloading).

**Parameters**:

- `pluginId`: `string` - The ID of the plugin to unregister

**Behavior**:

- Removes panels, functions, and components from registries
- Cleans up toolbar items for all targets
- Removes manager instances
- Enables clean plugin reloading

## Usage Examples

### Plugin Registration

```typescript
import { RegistrationManager } from "@teskooano/ui-plugin";

const registrationManager = new RegistrationManager(registries);

// Set dependencies
registrationManager.setDependencies({
  dockviewApi: dockviewApi,
});

// Register a plugin
const plugin = {
  id: "celestial-info",
  name: "Celestial Info",
  panels: [
    {
      componentName: "celestial-info-panel",
      panelClass: CelestialInfoPanel,
      defaultTitle: "Celestial Info",
    },
  ],
  functions: [
    {
      id: "celestial:focus",
      execute: async (context) => {
        console.log("Focusing on celestial object");
      },
    },
  ],
  toolbarRegistrations: [
    {
      target: "main-toolbar",
      items: [
        {
          id: "celestial-info-btn",
          type: "panel",
          title: "Celestial Info",
          componentName: "celestial-info-panel",
        },
      ],
    },
  ],
  managerClasses: [
    {
      id: "celestial-manager",
      managerClass: CelestialManager,
    },
  ],
  components: [
    {
      tagName: "celestial-display",
      componentClass: CelestialDisplay,
    },
  ],
};

registrationManager.processPlugin(plugin);
```

### Dependency Resolution

```typescript
// Plugin with initializer dependencies
const pluginWithDeps = {
  id: "advanced-feature",
  name: "Advanced Feature",
  functions: [
    {
      id: "advanced:init",
      execute: async (context) => {
        // Initialize advanced features
      },
    },
  ],
  toolbarRegistrations: [
    {
      target: "main-toolbar",
      items: [
        {
          id: "advanced-btn",
          type: "function",
          functionId: "advanced:action",
          dependencies: {
            initializers: ["advanced:init"], // Depends on init function
          },
        },
      ],
    },
  ],
};

// The toolbar item will only be registered after the init function is available
registrationManager.processPlugin(pluginWithDeps);
```

### Plugin Unregistration

```typescript
// Unregister plugin during HMR
registrationManager.unregisterPluginItems("celestial-info");

// All registrations for the plugin are removed:
// - Panel removed from panelRegistry
// - Functions removed from functionRegistry
// - Toolbar items removed from toolbarRegistry
// - Manager instances removed
// - Components removed from componentRegistry
```

## Error Handling

The RegistrationManager provides comprehensive error handling:

```typescript
// Panel registration errors
try {
  customElements.define(componentName, PanelClass);
} catch (error) {
  console.error(
    `Failed to auto-define custom element panel '${componentName}':`,
    error,
  );
}

// Manager instantiation errors
try {
  const instance = new ManagerClass();
  // ... registration logic
} catch (error) {
  console.error(`Failed to instantiate manager '${managerConfig.id}':`, error);
}

// Component definition errors
try {
  customElements.define(
    componentConfig.tagName,
    componentConfig.componentClass,
  );
} catch (error) {
  console.error(
    `Failed to define custom element '${componentConfig.tagName}':`,
    error,
  );
}
```

## HMR Considerations

The RegistrationManager handles Hot Module Replacement gracefully:

```typescript
// HMR warning for already defined custom elements
if (customElements.get(componentName)) {
  console.warn(
    `[HMR] Custom element '${componentName}' from plugin '${plugin.id}' is already defined. ` +
    `A full page reload may be required to see changes.`
  );
}

// Clean unregistration for HMR
public unregisterPluginItems(pluginId: string) {
  // Remove all plugin contributions
  // This enables clean reloading without conflicts
}
```

## Performance Characteristics

- **Efficient Registry Operations**: Uses Map data structures for O(1) lookups
- **Dependency Resolution**: Processes toolbar dependencies incrementally
- **Memory Management**: Proper cleanup during plugin unregistration
- **Error Resilience**: Continues processing even if individual components fail

## Related

- [[PluginManager]] - Uses RegistrationManager for plugin processing
- [[PluginExecutor]] - Uses registered functions for execution
- [[HMRManager]] - Uses unregistration for plugin reloading
- [[TeskooanoPlugin]] - Plugin configuration interface
