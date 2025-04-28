import type {
  AddPanelOptions,
  IContentRenderer,
  IDockviewPanelProps,
  DockviewApi,
} from "dockview-core";

/**
 * Context object passed to plugin function execute methods.
 */
export interface PluginExecutionContext {
  dockviewApi: DockviewApi;
  dockviewController?: any;
  // Add other shared dependencies here if needed in the future
}

/**
 * The signature of the execute function returned by `getFunctionConfig`.
 * It hides the injected context from the caller.
 */
export type PluginFunctionCallerSignature = (
  ...args: any[]
) => void | Promise<void>;

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
  /** The class implementing the Dockview panel's content (IContentRenderer). */
  panelClass: { new (): IContentRenderer }; // Constructor signature
  /** Default title for the panel (can be overridden). */
  defaultTitle: string;
  /** Optional default parameters to pass to the panel on creation. */
  defaultParams?: Record<string, any>;
  /** Optional default options for adding the panel (e.g., floating behavior). */
  defaultAddPanelOptions?: Partial<AddPanelOptions>; // Make specific options partial
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
  execute: (
    context: PluginExecutionContext,
    ...args: any[]
  ) => any | Promise<any>;
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
  /** Tooltip text displayed on hover. */
  title: string;
  /** Raw SVG string for the icon. */
  iconSvg: string;
  /** Optional display order (lower numbers appear first). */
  order?: number;
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
 * Defines a block for registering toolbar items to a specific target toolbar.
 */
export interface ToolbarRegistration {
  /** The target toolbar ID where these items should be added. */
  target: ToolbarTarget;
  /** An array of toolbar item definitions for this target. */
  items: ToolbarItemDefinition[];
}

/**
 * Configuration for a custom element widget to be directly embedded
 * within a designated toolbar area.
 */
export interface ToolbarWidgetConfig {
  /** A unique identifier for this widget registration. */
  id: string;
  /** The target toolbar area ID (e.g., 'main-toolbar', 'engine-toolbar'). */
  target: string;
  /** The tag name of the custom element to render (e.g., 'system-controls'). */
  componentName: string;
  /** Optional rendering order (lower numbers appear first/earlier). */
  order?: number;
  /** Optional parameters or initial attributes to pass to the widget element. */
  params?: Record<string, any>; // Could be used for initial state
}

/**
 * Defines the structure of a Teskooano UI plugin.
 */
export interface TeskooanoPlugin {
  /** A unique identifier for the plugin (e.g., 'core-focus-controls'). */
  id: string;
  /** A user-friendly name for the plugin (e.g., 'Core Focus Controls'). */
  name: string;
  /** Optional description of the plugin's purpose. */
  description?: string;

  /** Array of Dockview panels provided by this plugin. */
  panels?: PanelConfig[];
  /** Array of standalone functions/actions provided by this plugin. */
  functions?: FunctionConfig[];
  /** Array of toolbar registrations, grouping items by target toolbar. */
  toolbarRegistrations?: ToolbarRegistration[];

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
