import path from "path";
import type { Plugin } from "vite";
import type {
  ComponentLoadConfig,
  ComponentRegistryConfig,
  PluginLoadConfig,
  PluginRegistryConfig,
} from "./types.js";

/**
 * Options for the Teskooano UI Vite plugin.
 */
export interface TeskooanoUiPluginOptions {
  /** Absolute paths to the component registry configuration files (e.g., componentRegistry.ts). */
  componentRegistryPaths: string[];
  /** Absolute path to the plugin registry configuration file (e.g., pluginRegistry.ts). */
  pluginRegistryPath: string;
}

const VIRTUAL_MODULE_ID = "virtual:teskooano-loaders";
const RESOLVED_VIRTUAL_MODULE_ID = "\0" + VIRTUAL_MODULE_ID; // Vite convention

/**
 * Creates a Vite plugin for the Teskooano UI system.
 * This plugin reads component and plugin registry configurations and generates
 * a virtual module (`virtual:teskooano-loaders`) containing:
 *  - `componentRegistryConfig`: The loaded component configuration object.
 *  - `componentLoaders`: An object mapping component keys to dynamic import functions.
 *  - `pluginLoaders`: An object mapping plugin IDs to dynamic import functions.
 *
 * @param options - Configuration options for the plugin.
 * @returns A Vite Plugin instance.
 * @throws If required options (`componentRegistryPaths`, `pluginRegistryPath`) are missing.
 */
export function teskooanoUiPlugin(options: TeskooanoUiPluginOptions): Plugin {
  if (
    !options ||
    !options.componentRegistryPaths ||
    options.componentRegistryPaths.length === 0 ||
    !options.pluginRegistryPath
  ) {
    throw new Error(
      "[Teskooano UI Plugin] Missing required options: componentRegistryPaths (must be a non-empty array) and pluginRegistryPath",
    );
  }

  // Ensure paths are absolute
  const componentConfigPaths = options.componentRegistryPaths.map((p) =>
    path.resolve(p),
  );
  const pluginConfigPath = path.resolve(options.pluginRegistryPath);

  console.log(`[Teskooano UI Plugin] Initialized with:
    Component Configs: ${componentConfigPaths.join(", ")}
    Plugin Config:     ${pluginConfigPath}`);

  return {
    name: "vite-plugin-teskooano-ui",

    /**
     * Resolves the virtual module ID for Vite.
     * @param id - The module ID being resolved.
     * @returns The resolved virtual module ID or null.
     */
    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) {
        // console.log(`[Teskooano UI Plugin] Resolving virtual module ID: ${id}`); // DEBUG
        return RESOLVED_VIRTUAL_MODULE_ID;
      }
      return null; // Let Vite handle other IDs
    },

    /**
     * Loads the content for the virtual module.
     * Reads component and plugin configurations, then generates dynamic import loaders.
     * @param id - The module ID being loaded.
     * @returns The generated virtual module content as a string, or null.
     */
    async load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        // console.log(`[Teskooano UI Plugin] Loading virtual module: ${id}`); // DEBUG
        try {
          // --- Load and Merge Component Configs ---
          const mergedComponentConfig: ComponentRegistryConfig = {};
          console.log(
            `  - Reading ${componentConfigPaths.length} component config(s)...`,
          );
          for (const configPath of componentConfigPaths) {
            try {
              // console.log(`    - Reading component config: ${configPath}`); // DEBUG
              // Use dynamic import with cache busting
              const componentConfigModule = await import(
                configPath + `?import&t=${Date.now()}`
              );
              const componentConfig: ComponentRegistryConfig =
                componentConfigModule.componentConfig;
              if (!componentConfig || typeof componentConfig !== "object") {
                console.warn(
                  `[Teskooano UI Plugin] Invalid or missing export 'componentConfig' from ${configPath}. Skipping.`,
                );
                continue; // Skip this config file
              }
              // Merge, warning on duplicates
              for (const [key, value] of Object.entries(componentConfig)) {
                if (mergedComponentConfig[key]) {
                  console.warn(
                    `[Teskooano UI Plugin] Duplicate component key '${key}' found while merging from ${configPath}. Overwriting previous definition.`,
                  );
                }
                // Store the original config path with the value for correct relative path resolution later
                mergedComponentConfig[key] = {
                  ...value,
                  _configPath: configPath,
                };
              }
              // console.log(`    - Merged ${Object.keys(componentConfig).length} components from ${configPath}.`); // DEBUG
            } catch (error) {
              console.error(
                `[Teskooano UI Plugin] Error loading component config from ${configPath}:`,
                error,
              );
              // Decide if we should throw or continue. Let's continue but log the error.
            }
          }
          console.log(
            `  - Total ${Object.keys(mergedComponentConfig).length} components merged.`,
          );

          // Read Plugin Config
          // console.log(`  - Reading plugin config: ${pluginConfigPath}`); // DEBUG
          const pluginConfigModule = await import(
            pluginConfigPath + `?import&t=${Date.now()}`
          );
          const pluginConfig: PluginRegistryConfig =
            pluginConfigModule.pluginConfig;
          if (!pluginConfig || typeof pluginConfig !== "object") {
            throw new Error(
              `Invalid or missing export 'pluginConfig' from ${pluginConfigPath}`,
            );
          }
          // console.log(`  - Found ${Object.keys(pluginConfig).length} plugins in config.`); // DEBUG

          // Generate the virtual module content
          let content = `// Generated by vite-plugin-teskooano-ui\n// Timestamp: ${new Date().toISOString()}\n\n`;

          // Export the raw *merged* component config object (without the temporary _configPath)
          const finalComponentRegistry = Object.entries(
            mergedComponentConfig,
          ).reduce((acc, [key, value]) => {
            const { _configPath, ...rest } = value as any; // Remove internal property
            acc[key] = rest;
            return acc;
          }, {} as ComponentRegistryConfig);

          content += `export const componentRegistryConfig = ${JSON.stringify(finalComponentRegistry, null, 2)};\n\n`;

          // Generate component loaders using the merged config
          content += "export const componentLoaders = {\n";
          for (const [key, configData] of Object.entries(
            mergedComponentConfig,
          )) {
            // Retrieve the original config path stored earlier
            const originalConfigPath = (configData as any)._configPath;
            if (!originalConfigPath) {
              console.error(
                `[Teskooano UI Plugin] Internal error: Missing _configPath for component '${key}'. Cannot generate loader.`,
              );
              continue;
            }
            const loadConfig = configData as ComponentLoadConfig;
            // Resolve path relative to the *original* config file's directory
            const resolvedCompPath = path
              .resolve(path.dirname(originalConfigPath), loadConfig.path) // Use originalConfigPath
              .replace(/\\/g, "/"); // Ensure forward slashes
            // console.log(`    - Generating component loader for '${key}' (from ${path.basename(originalConfigPath)}): import('${resolvedCompPath}')`); // DEBUG
            content += `  ${JSON.stringify(key)}: () => import('${resolvedCompPath}'),\n`;
          }
          content += "};\n\n";

          // Generate plugin loaders
          content += "export const pluginLoaders = {\n";
          for (const [pluginId, config] of Object.entries(pluginConfig)) {
            const loadConfig = config as PluginLoadConfig;
            const resolvedPluginPath = path
              .resolve(path.dirname(pluginConfigPath), loadConfig.path)
              .replace(/\\/g, "/"); // Ensure forward slashes
            // console.log(`    - Generating plugin loader for '${pluginId}': import('${resolvedPluginPath}')`); // DEBUG
            content += `  ${JSON.stringify(pluginId)}: () => import('${resolvedPluginPath}'),\n`;
          }
          content += "};\n";

          // console.log(`[Teskooano UI Plugin] Generated virtual module content.`); // DEBUG
          return content;
        } catch (error) {
          console.error(
            "[Teskooano UI Plugin] Error loading configuration or generating virtual module:",
            error,
          );
          // Return empty exports on error to prevent build failures
          return "export const componentRegistryConfig = {};\nexport const componentLoaders = {};\nexport const pluginLoaders = {};\n";
        }
      }
      return null; // Let Vite handle other IDs
    },
  };
}
