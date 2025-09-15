# PluginLoader

Handles the dynamic loading of plugin modules with sophisticated dependency resolution using topological sorting. Ensures plugins are loaded in the correct order based on their dependencies and prevents circular dependency issues.

## Class Definition

```typescript
export class PluginLoader {
  public async loadPlugins(
    pluginIds: string[],
    alreadyRegistered: Set<string> = new Set(),
  ): Promise<{
    loadedPlugins: Record<string, TeskooanoPlugin>;
    processingOrder: string[];
  }>;
}
```

## Methods

### `loadPlugins(pluginIds: string[], alreadyRegistered?: Set<string>): Promise<LoadResult>`

Loads plugins with proper dependency resolution using topological sorting.

**Parameters**:

- `pluginIds`: `string[]` - Array of plugin IDs to load
- `alreadyRegistered`: `Set<string>` - Set of already registered plugin IDs to avoid reloading

**Returns**: `Promise<LoadResult>` - Object containing loaded plugins and processing order

**Type Definition**:

```typescript
interface LoadResult {
  loadedPlugins: Record<string, TeskooanoPlugin>;
  processingOrder: string[];
}
```

**Example**:

```typescript
const pluginLoader = new PluginLoader();

const result = await pluginLoader.loadPlugins([
  "celestial-info",
  "system-controls",
  "data-manager",
]);

console.log("Loaded plugins:", Object.keys(result.loadedPlugins));
console.log("Processing order:", result.processingOrder);
```

**Behavior**:

- Performs topological sort to resolve dependencies
- Loads plugins in dependency order
- Handles circular dependency detection
- Skips already registered plugins
- Throws descriptive errors for missing loaders or unmet dependencies

## Internal Methods

### `performTopologicalSort(allRequestedIds: Set<string>, context: SortContext): Promise<void>`

Performs the core topological sorting algorithm to resolve plugin dependencies.

**Parameters**:

- `allRequestedIds`: `Set<string>` - All plugin IDs that need to be loaded
- `context`: `SortContext` - Context object containing loaders, registries, and state

**Type Definition**:

```typescript
interface SortContext {
  loaders: Record<string, () => Promise<any>>;
  loadedPlugins: Record<string, TeskooanoPlugin>;
  processingOrder: string[];
  alreadyRegistered: Set<string>;
}
```

**Behavior**:

- Uses depth-first search with cycle detection
- Maintains visited and processing sets to detect circular dependencies
- Resolves dependencies recursively
- Builds processing order based on dependency resolution

## Usage Examples

### Basic Plugin Loading

```typescript
import { PluginLoader } from "@teskooano/ui-plugin";

const pluginLoader = new PluginLoader();

// Load plugins with dependency resolution
const result = await pluginLoader.loadPlugins([
  "data-manager", // Has no dependencies
  "celestial-info", // Depends on data-manager
  "system-controls", // Depends on data-manager
]);

// Plugins are loaded in dependency order
console.log("Processing order:", result.processingOrder);
// Output: ['data-manager', 'celestial-info', 'system-controls']

// Access loaded plugins
Object.entries(result.loadedPlugins).forEach(([id, plugin]) => {
  console.log(`Loaded plugin: ${plugin.name} (${id})`);
});
```

### Handling Already Registered Plugins

```typescript
import { PluginLoader } from "@teskooano/ui-plugin";

const pluginLoader = new PluginLoader();

// Some plugins are already loaded
const alreadyRegistered = new Set(["core-utils", "base-components"]);

// Load additional plugins, skipping already registered ones
const result = await pluginLoader.loadPlugins(
  [
    "core-utils", // Will be skipped (already registered)
    "celestial-info", // Will be loaded
    "system-controls", // Will be loaded
  ],
  alreadyRegistered,
);

// Only new plugins are loaded
console.log("Newly loaded:", Object.keys(result.loadedPlugins));
// Output: ['celestial-info', 'system-controls']
```

### Error Handling

```typescript
import { PluginLoader } from "@teskooano/ui-plugin";

const pluginLoader = new PluginLoader();

try {
  const result = await pluginLoader.loadPlugins([
    "missing-plugin", // This will cause an error
    "valid-plugin",
  ]);
} catch (error) {
  if (error.message.includes("Loader for plugin")) {
    console.error("Plugin loader not found:", error.message);
  } else if (error.message.includes("Circular dependency")) {
    console.error("Circular dependency detected:", error.message);
  } else if (error.message.includes("unmet dependency")) {
    console.error("Missing dependency:", error.message);
  }
}
```

## Dependency Resolution Algorithm

The PluginLoader uses a sophisticated topological sorting algorithm:

### 1. Depth-First Search with Cycle Detection

```typescript
const resolve = async (pluginId: string): Promise<void> => {
  // Check for circular dependencies
  if (processing.has(pluginId)) {
    throw new Error(
      `Circular dependency detected involving plugin: ${pluginId}`,
    );
  }

  // Skip if already visited
  if (visited.has(pluginId)) return;

  // Mark as processing
  processing.add(pluginId);

  // Load the plugin module
  const loader = context.loaders[pluginId];
  if (!loader) {
    throw new Error(`Loader for plugin '${pluginId}' not found.`);
  }

  const module = await loader();
  const plugin = module.plugin as TeskooanoPlugin;
  context.loadedPlugins[pluginId] = plugin;

  // Resolve dependencies recursively
  if (plugin.dependencies) {
    for (const depId of plugin.dependencies) {
      await resolve(depId);
    }
  }

  // Mark as completed
  processing.delete(pluginId);
  visited.add(pluginId);
  context.processingOrder.push(pluginId);
};
```

### 2. Dependency Validation

```typescript
// Check if all dependencies are available
if (plugin.dependencies) {
  for (const depId of plugin.dependencies) {
    if (!allRequestedIds.has(depId) && !context.alreadyRegistered.has(depId)) {
      throw new Error(
        `Plugin '${pluginId}' has an unmet dependency: '${depId}'`,
      );
    }
  }
}
```

## Integration with PluginManager

The PluginLoader is used internally by the PluginManager:

```typescript
// In PluginManager.loadAndRegisterPlugins()
const { loadedPlugins, processingOrder } = await this.#pluginLoader.loadPlugins(
  pluginIds,
  new Set(this.#registries.pluginRegistry.keys()),
);

// Process plugins in dependency order
for (const id of processingOrder) {
  const plugin = loadedPlugins[id];
  if (plugin) {
    this.registerPlugin(plugin);
  }
}
```

## Virtual Module Integration

The PluginLoader relies on the virtual module generated by the Vite plugin:

```typescript
// virtual:teskooano-loaders (generated by Vite plugin)
export const pluginLoaders = {
  "celestial-info": () => import("/path/to/celestial-info/plugin.ts"),
  "system-controls": () => import("/path/to/system-controls/plugin.ts"),
  "data-manager": () => import("/path/to/data-manager/plugin.ts"),
};

// PluginLoader uses these loaders
const loaders = pluginLoaders as Record<string, () => Promise<any>>;
const loader = loaders[pluginId];
const module = await loader();
```

## Performance Characteristics

- **Efficient Dependency Resolution**: O(V + E) time complexity for topological sort
- **Cycle Detection**: Prevents infinite loops with processing set tracking
- **Lazy Loading**: Plugins are loaded only when needed
- **Memory Optimization**: Reuses already registered plugins
- **Error Early**: Fails fast on missing dependencies or circular references

## Error Types

### Missing Loader Error

```
Loader for plugin 'unknown-plugin' not found.
```

### Circular Dependency Error

```
Circular dependency detected involving plugin: plugin-a
```

### Unmet Dependency Error

```
Plugin 'plugin-b' has an unmet dependency: 'missing-plugin'
```

### Load Failure Error

```
Failed to load plugin 'plugin-c': [original error message]
```

## Best Practices

1. **Define Dependencies Clearly**: Always specify plugin dependencies in the plugin configuration
2. **Avoid Circular Dependencies**: Design plugin architecture to prevent circular references
3. **Handle Errors Gracefully**: Implement proper error handling for loading failures
4. **Use Already Registered Set**: Pass already registered plugins to avoid redundant loading
5. **Monitor Processing Order**: Use the processing order to understand dependency resolution

## Related

- [[PluginManager]] - Uses PluginLoader for plugin loading
- [[RegistrationManager]] - Processes loaded plugins
- [[HMRManager]] - Uses PluginLoader for plugin reloading
- [[TeskooanoPlugin]] - Plugin configuration with dependencies
