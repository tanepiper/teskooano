import type {
  AddPanelOptions,
  IContentRenderer,
  IDockviewPanelProps,
  DockviewApi,
} from "dockview-core";
import type { pluginManager } from "./pluginManager.js";

/**
 * Context object passed to plugin function execute methods.
 */
export interface PluginExecutionContext {
  pluginManager: typeof pluginManager;
  dockviewApi: DockviewApi | null;
  dockviewController?: any | null;

  getManager: <T = any>(id: string) => T | undefined;
  executeFunction: <T = any>(
    functionId: string,
    args?: any,
  ) => Promise<T> | T | undefined;
}

/**
 * The signature of the execute function returned by `getFunctionConfig`.
 * It hides the injected context from the caller.
 */
export type PluginFunctionCallerSignature = (
  context: PluginExecutionContext,
  args?: any,
) => any;

/** Configuration for dynamically loading a component. */
export interface ComponentLoadConfig {
  /** Path to the module exporting the class (e.g., '../components/shared/Button.ts'). */
  path: string;
  /** The name of the exported class. */
  className: string;
  /**
   * Whether this module defines a custom element to be registered with customElements.define.
   * @default true
   */
  isCustomElement?: boolean;
  /** Internal: Used by the Vite plugin to track the source config file for relative path resolution. */
  _configPath?: string;
}

/** Configuration for dynamically loading a plugin. */
export interface PluginLoadConfig {
  /** Path to the module exporting the plugin object (e.g., '@teskooano/focus-plugin/plugin'). */
  path: string;
  /** Optional name of the exported plugin object if not exported as 'plugin'. */
  exportName?: string;
}

/** Map of component tag names to their loading configuration. */
export type ComponentRegistryConfig = Record<string, ComponentLoadConfig>;

/** Map of plugin IDs to their loading configuration. */
export type PluginRegistryConfig = Record<string, PluginLoadConfig>;

/**
 * Represents the target UI area for a toolbar item.
 * - 'main-toolbar': The primary application toolbar.
 * - 'engine-toolbar': The toolbar associated with a specific engine view.
 */
export type ToolbarTarget = "main-toolbar" | "engine-toolbar";

/**
 * Defines the configuration for a custom web component registered by a plugin.
 * NOTE: This might become deprecated if components are always registered separately.
 */
export interface ComponentConfig {
  /** The HTML tag name for the custom element (e.g., 'focus-control'). */
  tagName: string;
  /** The class implementing the custom element. */
  componentClass: CustomElementConstructor;
}

/**
 * Defines the configuration for a Dockview panel registered by a plugin.
 */
export interface PanelConfig {
  /** The unique identifier Dockview uses for this panel type (e.g., 'focus_control'). */
  componentName: string;
  /**
   * The class implementing the Dockview panel's content.
   * Can be a standard class implementing IContentRenderer,
   * OR a Custom Element constructor that also implements IContentRenderer.
   */
  panelClass:
    | ({ new (): IContentRenderer } & Partial<CustomElementConstructor>)
    | CustomElementConstructor;
  /** Default title for the panel (can be overridden). */
  defaultTitle: string;
  /** Optional default parameters to pass to the panel on creation. */
  defaultParams?: Record<string, any>;
  /** Optional default options for adding the panel (e.g., floating behavior). */
  defaultAddPanelOptions?: Partial<AddPanelOptions>;
}

/**
 * Defines the structure for declaring dependencies required by a plugin function.
 */
export interface FunctionDependencies {
  dockView?: {
    api?: boolean;
    controller?: boolean;
  };
}

/**
 * Defines the configuration for a standalone function/action registered by a plugin.
 */
export interface FunctionConfig {
  /** A unique identifier for this function/action. */
  id: string;
  /**
   * The function to execute. Can be async.
   * Receives the execution context (with APIs) as the first argument,
   * followed by any specific arguments passed during the call.
   */
  execute: PluginFunctionCallerSignature;

  /** Optional: Specifies the dependencies required by this function. */
  dependencies?: FunctionDependencies;
}

/**
 * Base interface for items that can be added to a toolbar.
 * Includes the `target` property for internal use by the registry and getters.
 */
export interface BaseToolbarItemConfig {
  /** A unique identifier for this toolbar item. */
  id: string;
  /** The target toolbar where this item should appear. */
  target: ToolbarTarget;
  /** Tooltip text displayed on hover. Falls back to title if not provided. */
  title?: string;
  /** Raw SVG string for the icon. */
  iconSvg?: string;
  /** Optional display order (lower numbers appear first). */
  order?: number;

  tooltipText?: string;
  tooltipTitle?: string;
  tooltipIconSvg?: string;
}

/**
 * Configuration for a toolbar item that triggers opening a panel.
 */
export interface PanelToolbarItemConfig extends BaseToolbarItemConfig {
  type: "panel";
  /** The componentName of the panel to open (must match a registered PanelConfig). */
  componentName: string;
  /** Optional specific title for the panel instance. Defaults to PanelConfig.defaultTitle. */
  panelTitle?: string;
  /**
   * Behavior when the button is clicked:
   * - 'toggle' (default): Opens the panel if closed, closes it if open.
   * - 'create': Always creates a new instance of the panel.
   */
  behaviour?: "toggle" | "create";
  /**
   * Optional initial position and size for floating panels.
   * Used if the panel is opened as floating (either by default or behavior).
   */
  initialPosition?: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

/**
 * Configuration for a toolbar item that executes a function.
 */
export interface FunctionToolbarItemConfig extends BaseToolbarItemConfig {
  type: "function";
  /** The ID of the function to execute (must match a registered FunctionConfig). */
  functionId: string;
}

/**
 * Union type representing any possible toolbar item configuration.
 * This includes the 'target' property.
 */
export type ToolbarItemConfig =
  | PanelToolbarItemConfig
  | FunctionToolbarItemConfig;

/**
 * Helper type for defining toolbar items within a plugin registration,
 * excluding the 'target' property as it's specified in the registration block.
 */
export type ToolbarItemDefinition =
  | Omit<PanelToolbarItemConfig, "target">
  | Omit<FunctionToolbarItemConfig, "target">;

/**
 * Configuration for a custom element widget to be directly embedded
 * within a designated toolbar area.
 */
export interface ToolbarWidgetConfig {
  /** A unique identifier for this widget registration. */
  id: string;
  /** The target toolbar area ID (e.g., 'main-toolbar', 'engine-toolbar'). */
  target: string;
  /** The tag name of the custom element to render (e.g., 'teskooano-system-controls'). */
  componentName: string;
  /** Optional rendering order (lower numbers appear first/earlier). */
  order?: number;
  /** Optional parameters or initial attributes to pass to the widget element. */
  params?: Record<string, any>;
}

/**
 * Defines a block for registering toolbar items to a specific target toolbar.
 */
export interface ToolbarRegistration {
  /** The target toolbar ID where these items should be added. */
  target: ToolbarTarget;
  /** An array of toolbar item definitions for this target. */
  items?: ToolbarItemDefinition[];
  /** Optional: Widgets to be embedded directly into toolbars. */
  widgets?: ToolbarWidgetConfig[];
}

/**
 * Defines the configuration for a non-UI manager/service class registered by a plugin.
 */
export interface ManagerConfig {
  /** A unique identifier for this manager/service. */
  id: string;
  /** The class constructor itself. */
  managerClass: { new (...args: any[]): any };
}

/**
 * Defines the structure of a Teskooano UI plugin.
 */
export interface TeskooanoPlugin {
  /** A unique identifier for the plugin (e.g., 'core-focus-controls'). */
  id: string;
  /** The version of the plugin. */
  version?: string;
  /** A user-friendly name for the plugin (e.g., 'Core Focus Controls'). */
  name: string;
  /** Optional description of the plugin's purpose. */
  description?: string;
  /** Optional icon SVG for the plugin. */
  icon?: string;
  /** Optional array of plugin IDs that this plugin depends on. */
  dependencies?: string[];

  /** Array of Dockview panels provided by this plugin. */
  panels?: PanelConfig[];
  /** Array of standalone functions/actions provided by this plugin. */
  functions?: FunctionConfig[];
  /** Array of toolbar registrations, grouping items by target toolbar. */
  toolbarRegistrations?: ToolbarRegistration[];

  /** Array of non-UI manager/service classes provided by this plugin. */
  managerClasses?: ManagerConfig[];

  /** Array of custom element components provided by this plugin. */
  components?: ComponentConfig[];

  /**
   * Optional initialization function called after registration.
   * Can be used for setting up listeners, etc.
   * Note: This will NO LONGER automatically receive API/Controller instances.
   * Use the context passed to function `execute` methods instead for API access.
   */
  initialize?: (...args: any[]) => void;

  /**
   * Optional cleanup function called when the plugin is unloaded (if supported).
   */
  dispose?: () => void;

  /** Optional: Widgets to be embedded directly into toolbars. */
  toolbarWidgets?: ToolbarWidgetConfig[];
}

/**
 * Internal type used by the PluginManager to store registered items
 * along with the ID of the plugin that provided them.
 */
export type RegisteredItem<T> = T & { pluginId: string };

export type PluginRegistrationStatus =
  | { type: "loading_started"; pluginIds: string[] }
  | { type: "loading_plugin"; pluginId: string }
  | { type: "loaded_plugin"; pluginId: string }
  | { type: "load_error"; pluginId: string; error: Error }
  | { type: "registration_started"; pluginIds: string[] }
  | { type: "registering_plugin"; pluginId: string }
  | { type: "registered_plugin"; pluginId: string }
  | { type: "register_error"; pluginId: string; error: Error }
  | { type: "init_error"; pluginId: string; error: Error }
  | { type: "disposing"; pluginId: string }
  | { type: "disposed"; pluginId: string }
  | { type: "dispose_error"; pluginId: string; error: any }
  | { type: "unloading"; pluginId: string }
  | { type: "unloaded"; pluginId: string }
  | {
      type: "dependency_error";
      pluginId: string;
      missingDependencies: string[];
    }
  | {
      type: "loading_complete";
      successfullyRegistered: string[];
      failed: string[];
      notFound: string[];
    };
