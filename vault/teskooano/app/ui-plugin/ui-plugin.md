# UI Plugin System (`@teskooano/ui-plugin`)

A comprehensive plugin architecture for building extensible UI features in the Open Space engine. Provides dynamic loading, registration, and management of UI components, panels, functions, and toolbar items through a configuration-driven system with Hot Module Replacement support.

## Overview

The `@teskooano/ui-plugin` package is the foundation of the Open Space engine's modular UI architecture. It enables developers to create self-contained plugins that can register panels, functions, toolbar items, and custom components without modifying the core application code. The system supports dynamic loading, dependency resolution, and Hot Module Replacement for an optimal development experience.

## Key Features

- **Configuration-Driven Architecture**: Enable/disable features through Vite plugin configuration
- **Dynamic Plugin Loading**: Load plugin modules on demand with proper dependency resolution
- **Hot Module Replacement**: Automatic plugin reloading during development
- **Comprehensive Plugin Types**: Support for panels, functions, toolbar items, widgets, and managers
- **Dependency Management**: Automatic resolution of plugin dependencies with circular dependency detection
- **Singleton Management**: Centralized plugin state through the PluginManager singleton
- **Reactive Patterns**: Modern reactive state management and event-driven communication
- **TypeScript Support**: Full type safety with comprehensive interfaces and type definitions
- **Factory Functions**: Simplified plugin creation with minimal boilerplate
- **Vite Integration**: Seamless build-time integration with virtual modules and HMR

## Architecture

### Core Components

- **[[PluginManager]]**: Main singleton class managing plugin lifecycle and state
- **[[PluginLoader]]**: Handles dynamic loading and dependency resolution
- **[[RegistrationManager]]**: Manages registration of plugin contributions
- **[[PluginExecutor]]**: Executes plugin functions with proper context injection
- **[[HMRManager]]**: Handles Hot Module Replacement for development
- **[[EventBus]]**: Centralized event system for plugin communication
- **[[ReactiveState]]**: Reactive state management with computed properties

### Plugin Types

- **Panel Plugins**: UI panels with optional toolbar integration
- **Function Plugins**: Standalone functions and actions
- **Component Plugins**: Reusable custom elements
- **Controller Plugins**: Service classes and background managers
- **Interface Plugins**: Functions with toolbar button integration
- **Widget Plugins**: Inline toolbar components

### Modern Patterns

- **Reactive State Management**: Automatic state tracking with computed properties
- **Event-Driven Communication**: Decoupled component communication
- **Typed Event Registry**: Type-safe event system with payload validation
- **Factory Functions**: Simplified plugin creation patterns

## Usage Examples

### Basic Plugin Definition

```typescript
import type { TeskooanoPlugin } from "@teskooano/ui-plugin";

export const plugin: TeskooanoPlugin = {
  id: "my-feature",
  name: "My Feature",
  description: "A useful feature for the application",
  panels: [
    {
      componentName: "my-feature-panel",
      panelClass: MyFeaturePanel,
      defaultTitle: "My Feature",
    },
  ],
  functions: [
    {
      id: "my-feature:action",
      execute: async (context) => {
        console.log("Action executed!");
      },
    },
  ],
  toolbarRegistrations: [
    {
      target: "main-toolbar",
      items: [
        {
          id: "my-feature-btn",
          type: "panel",
          title: "Open My Feature",
          componentName: "my-feature-panel",
        },
      ],
    },
  ],
};
```

### Using Factory Functions

```typescript
import { createPanelPlugin } from "@teskooano/ui-plugin";

export const plugin = createPanelPlugin({
  id: "celestial-info",
  name: "Celestial Info",
  description: "Display information about celestial objects",
  componentName: "celestial-info-panel",
  panelClass: CelestialInfoPanel,
  defaultTitle: "Celestial Info",
  iconSvg: infoIcon,
  target: "engine-toolbar",
  order: 100,
});
```

### Reactive State Management

```typescript
import { ReactiveState, EventBus, Events } from "@teskooano/ui-plugin/patterns";

export class MyComponent extends HTMLElement {
  private state = new ReactiveState({
    selectedObject: null,
    isLoading: false,
  });

  constructor() {
    super();

    // Add computed properties
    this.state.computed("hasSelection", {
      deps: ["selectedObject"],
      compute: (selectedObject) => selectedObject !== null,
    });

    // Listen for events
    EventBus.getInstance().on(Events.OBJECT_SELECTED, (event) => {
      this.state.set("selectedObject", event.payload.object);
    });

    // Watch for state changes
    this.state.watch("hasSelection", (hasSelection) => {
      this.updateUI(hasSelection);
    });
  }
}
```

### Application Integration

```typescript
import { PluginManager } from "@teskooano/ui-plugin";

async function initializeApp() {
  const pluginManager = PluginManager.getInstance();

  // Set dependencies
  pluginManager.setAppDependencies({
    dockviewApi: dockviewApi,
    dockviewController: dockviewController,
  });

  // Load plugins
  await pluginManager.loadAndRegisterPlugins([
    "celestial-info",
    "system-controls",
    "data-manager",
  ]);

  // Subscribe to plugin status
  pluginManager.pluginStatus$.subscribe((status) => {
    console.log(`Plugin ${status.pluginId}: ${status.status}`);
  });
}
```

## Configuration

### Vite Plugin Configuration

```typescript
// vite.config.ts
import { teskooanoUiPlugin } from "@teskooano/ui-plugin/vite.js";
import path from "path";

export default defineConfig({
  plugins: [
    teskooanoUiPlugin({
      pluginRegistryPaths: [
        path.resolve(__dirname, "src/config/corePlugins.ts"),
        path.resolve(__dirname, "src/config/featurePlugins.ts"),
      ],
    }),
  ],
});
```

### Plugin Registry Configuration

```typescript
// src/config/corePlugins.ts
import type { PluginRegistryConfig } from "@teskooano/ui-plugin";

export const pluginConfig: PluginRegistryConfig = {
  "celestial-info": {
    path: "../plugins/celestial-info/plugin.ts",
  },
  "system-controls": {
    path: "../plugins/system-controls/plugin.ts",
  },
};
```

## Performance Characteristics

- **Lazy Loading**: Plugins are loaded only when needed
- **Dependency Optimization**: Automatic dependency resolution prevents redundant loading
- **Memory Management**: Proper cleanup and disposal of plugin resources
- **HMR Efficiency**: Fast plugin reloading during development
- **Bundle Splitting**: Automatic code splitting for plugin modules

## Development Workflow

### Creating a New Plugin

1. **Define Plugin Structure**:

   ```typescript
   export const plugin: TeskooanoPlugin = {
     id: "my-plugin",
     name: "My Plugin",
     // ... configuration
   };
   ```

2. **Register in Configuration**:

   ```typescript
   // Add to plugin registry
   'my-plugin': {
     path: '../plugins/my-plugin/plugin.ts'
   }
   ```

3. **Load in Application**:
   ```typescript
   await pluginManager.loadAndRegisterPlugins(["my-plugin"]);
   ```

### Hot Module Replacement

During development, when you save a plugin file:

1. Vite detects the change
2. Sends HMR event to the browser
3. PluginManager automatically unloads the old version
4. Loads and registers the new version
5. Calls dispose() on old plugin and initialize() on new plugin

## Testing

```typescript
import { PluginManager } from "@teskooano/ui-plugin";

describe("Plugin System", () => {
  let pluginManager: PluginManager;

  beforeEach(() => {
    pluginManager = PluginManager.getInstance();
  });

  it("should load and register plugins", async () => {
    await pluginManager.loadAndRegisterPlugins(["test-plugin"]);

    const plugins = pluginManager.getPlugins();
    expect(plugins).toHaveLength(1);
    expect(plugins[0].id).toBe("test-plugin");
  });
});
```

## Dependencies

- **dockview-core**: Panel management and layout system
- **rxjs**: Reactive programming for state management
- **vite**: Build tool integration and HMR support

## Related

- [[@teskooano/app-simulation]] - Uses plugins for simulation features
- [[@teskooano/notifications]] - Provides notification system for plugins
- [[@teskooano/core-state]] - State management integration
- [[@teskooano/data-types]] - Type definitions for plugin data structures
