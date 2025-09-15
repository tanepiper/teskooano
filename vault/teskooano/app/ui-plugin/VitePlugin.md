# Teskooano UI Vite Plugin

A Vite plugin that provides build-time integration for the Teskooano UI Plugin System. Generates virtual modules for plugin loading, handles Hot Module Replacement, and enables configuration-driven plugin management.

## Plugin Definition

```typescript
export function teskooanoUiPlugin(options: TeskooanoUiPluginOptions): Plugin;
```

## Configuration

### `TeskooanoUiPluginOptions`

Configuration interface for the Vite plugin.

```typescript
interface TeskooanoUiPluginOptions {
  pluginRegistryPaths: string[];
}
```

**Properties**:

- `pluginRegistryPaths`: Array of absolute paths to plugin registry configuration files

## Usage

### Basic Configuration

```typescript
// vite.config.ts
import { defineConfig } from "vite";
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
  "data-manager": {
    path: "../plugins/data-manager/plugin.ts",
  },
};
```

```typescript
// src/config/featurePlugins.ts
import type { PluginRegistryConfig } from "@teskooano/ui-plugin";

export const pluginConfig: PluginRegistryConfig = {
  "advanced-visualization": {
    path: "../plugins/advanced-visualization/plugin.ts",
  },
  "export-tools": {
    path: "../plugins/export-tools/plugin.ts",
  },
};
```

## Generated Virtual Modules

### `virtual:teskooano-loaders`

The plugin generates a virtual module containing plugin loaders.

**Generated Code**:

```typescript
// virtual:teskooano-loaders
export const pluginLoaders = {
  "celestial-info": () =>
    import("/absolute/path/to/plugins/celestial-info/plugin.ts"),
  "system-controls": () =>
    import("/absolute/path/to/plugins/system-controls/plugin.ts"),
  "data-manager": () =>
    import("/absolute/path/to/plugins/data-manager/plugin.ts"),
  "advanced-visualization": () =>
    import("/absolute/path/to/plugins/advanced-visualization/plugin.ts"),
  "export-tools": () =>
    import("/absolute/path/to/plugins/export-tools/plugin.ts"),
};
```

**Usage**:

```typescript
import { pluginLoaders } from "virtual:teskooano-loaders";

// Load a plugin
const pluginModule = await pluginLoaders["celestial-info"]();
const plugin = pluginModule.plugin;
```

## Hot Module Replacement

The plugin provides HMR support for plugin development.

### HMR Event

When a plugin file is changed, the plugin sends a custom HMR event:

```typescript
// HMR event sent to browser
{
  event: 'teskooano-plugin-update',
  data: { pluginId: 'celestial-info' }
}
```

### HMR Integration

```typescript
// In PluginManager
if (import.meta.hot) {
  import.meta.hot.on("teskooano-plugin-update", (data) => {
    if (data.pluginId) {
      pluginManager.reloadPlugin(data.pluginId);
    }
  });
}
```

## Plugin Methods

### `resolveId(id: string)`

Resolves virtual module IDs.

**Parameters**:

- `id`: `string` - Module ID to resolve

**Returns**: `string | undefined` - Resolved module ID or undefined

**Behavior**:

- Resolves `virtual:teskooano-loaders` to the virtual module
- Returns undefined for other module IDs

### `load(id: string)`

Loads virtual module content.

**Parameters**:

- `id`: `string` - Module ID to load

**Returns**: `string | undefined` - Module content or undefined

**Behavior**:

- Generates plugin loaders for `virtual:teskooano-loaders`
- Reads plugin registry configuration files
- Converts relative paths to absolute paths
- Generates import statements for each plugin

### `handleHotUpdate({ file, server })`

Handles Hot Module Replacement for plugin files.

**Parameters**:

- `file`: `string` - Path to the changed file
- `server`: `ViteDevServer` - Vite development server instance

**Returns**: `void`

**Behavior**:

- Detects changes to plugin files
- Sends HMR event to browser
- Triggers plugin reload

## File Change Detection

The plugin tracks plugin files and their corresponding plugin IDs:

```typescript
// Internal file-to-plugin mapping
const fileToPluginMap = new Map<string, string>();
fileToPluginMap.set("/path/to/plugin.ts", "plugin-id");
```

## Path Resolution

The plugin handles path resolution for plugin modules:

```typescript
// Convert relative paths to absolute paths
const absolutePath = path.resolve(configPath, relativePath);

// Generate import statement
const importStatement = `() => import('${absolutePath}')`;
```

## Error Handling

The plugin provides comprehensive error handling:

```typescript
// Missing plugin registry file
if (!fs.existsSync(registryPath)) {
  throw new Error(`Plugin registry file not found: ${registryPath}`);
}

// Invalid plugin registry format
if (!pluginConfig || typeof pluginConfig !== "object") {
  throw new Error(`Invalid plugin registry format in ${registryPath}`);
}

// Missing plugin path
if (!pluginConfig[pluginId]?.path) {
  throw new Error(`Missing path for plugin '${pluginId}' in ${registryPath}`);
}
```

## Development Workflow

1. **Configure Plugin**: Add plugin registry paths to Vite config
2. **Create Registry**: Define plugin registry configuration files
3. **Develop Plugins**: Create plugin modules with proper exports
4. **Hot Reload**: Save plugin files to trigger HMR
5. **Build**: Vite generates optimized plugin loaders

## Build Integration

The plugin integrates seamlessly with Vite's build process:

- **Development**: Generates dynamic import loaders
- **Production**: Optimizes plugin loading with code splitting
- **HMR**: Provides fast plugin reloading during development

## Performance Characteristics

- **Lazy Loading**: Plugins are loaded only when needed
- **Code Splitting**: Automatic code splitting for plugin modules
- **HMR Efficiency**: Fast plugin reloading without full page refresh
- **Build Optimization**: Optimized plugin loading in production

## Best Practices

1. **Use Absolute Paths**: Always use absolute paths in Vite config
2. **Organize Registries**: Group related plugins in separate registry files
3. **Consistent Naming**: Use consistent plugin ID naming conventions
4. **Error Handling**: Handle plugin loading errors gracefully
5. **Development Setup**: Enable HMR for efficient plugin development

## Troubleshooting

### Common Issues

**Plugin not found**:

```
Error: Loader for plugin 'unknown-plugin' not found.
```

_Solution_: Ensure plugin is registered in plugin registry configuration

**Invalid registry format**:

```
Error: Invalid plugin registry format in /path/to/registry.ts
```

_Solution_: Check registry file exports proper PluginRegistryConfig

**Missing plugin path**:

```
Error: Missing path for plugin 'my-plugin' in /path/to/registry.ts
```

_Solution_: Ensure plugin configuration includes path property

### Debug Mode

Enable debug logging to troubleshoot issues:

```typescript
// In vite.config.ts
export default defineConfig({
  plugins: [
    teskooanoUiPlugin({
      pluginRegistryPaths: [path.resolve(__dirname, "src/config/plugins.ts")],
    }),
  ],
  define: {
    __TESKOOANO_DEBUG__: true,
  },
});
```

## Related

- [[PluginManager]] - Uses generated plugin loaders
- [[PluginLoader]] - Loads plugins using generated loaders
- [[HMRManager]] - Handles HMR events from Vite plugin
- [[PluginRegistryConfig]] - Configuration interface for plugin registries
