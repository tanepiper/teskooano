/**
 * @fileoverview Plugin Factory Functions
 *
 * This module provides factory functions for creating different types of Teskooano plugins
 * with minimal boilerplate code. Each factory function handles the common patterns and
 * configurations needed for specific plugin types, reducing repetition and ensuring
 * consistency across plugin definitions.
 *
 * ## Available Factories:
 *
 * - **`createPanelPlugin`** - Panel-based plugins with optional toolbar integration
 * - **`createComponentPlugin`** - Component-only plugins for reusable UI elements
 * - **`createControllerPlugin`** - Service plugins with functions and optional panels
 * - **`createInterfacePlugin`** - Function plugins with toolbar button integration
 * - **`createFunctionPlugin`** - Lightweight function-only plugins
 * - **`createWidgetPlugin`** - Toolbar widget plugins for inline functionality
 *
 * ## Usage Pattern:
 *
 * ```typescript
 * // Instead of manually defining all plugin properties:
 * export const plugin: TeskooanoPlugin = {
 *   id: "my-plugin",
 *   name: "My Plugin",
 *   // ... 20+ lines of boilerplate
 * };
 *
 * // Use a factory function:
 * export const plugin = createPanelPlugin({
 *   id: "my-plugin",
 *   name: "My Plugin",
 *   // ... only the essential configuration
 * });
 * ```
 *
 * @author Teskooano Team
 */

import type {
  TeskooanoPlugin,
  PanelConfig,
  ToolbarRegistration,
  ComponentConfig,
  ToolbarTarget,
  FunctionConfig,
  ManagerConfig,
} from "../types.js";

/**
 * Configuration for creating panel-based plugins that provide UI panels with optional toolbar integration.
 * This is the most common plugin type for user-facing features.
 */
interface PanelPluginConfig {
  /** Unique identifier for the plugin */
  id: string;
  /** Display name for the plugin */
  name: string;
  /** Brief description of the plugin's purpose */
  description: string;
  /** HTML tag name for the panel component (used as the DockView component name) */
  componentName: string;
  /**
   * The custom element class that implements the panel.
   * Mutually exclusive with `svelteComponent`.
   */
  panelClass?: any;
  /**
   * A Svelte 5 component to use as the panel content.
   * Mutually exclusive with `panelClass`.
   */
  svelteComponent?: any;
  /** Default title shown in the panel header */
  defaultTitle: string;
  /** SVG icon for the toolbar button */
  iconSvg: string;
  /** Optional custom title for the toolbar button (defaults to defaultTitle) */
  buttonTitle?: string;
  /** Display order in the toolbar (lower numbers appear first) */
  order?: number;
  /** Which toolbar should contain the button (if any) */
  target?: ToolbarTarget;
  /** Additional custom elements to register alongside the main panel */
  additionalComponents?: ComponentConfig[];
  /** Additional functions to register with the plugin */
  additionalFunctions?: any[];
  /** Initial position and size for floating panels */
  initialPosition?: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  /** Tooltip text for the toolbar button */
  tooltipText?: string;
  /** Tooltip title for the toolbar button */
  tooltipTitle?: string;
  /** SVG icon for the tooltip */
  tooltipIconSvg?: string;
}

/**
 * Configuration for creating component-only plugins that register custom elements without UI panels.
 * Used for reusable UI components that don't need their own dedicated panels.
 */
interface ComponentPluginConfig {
  /** Unique identifier for the plugin */
  id: string;
  /** Display name for the plugin */
  name: string;
  /** Brief description of the plugin's purpose */
  description: string;
  /** Array of custom elements to register */
  components: ComponentConfig[];
  /** Optional manager/service classes to instantiate */
  managerClasses?: ManagerConfig[];
  /** Plugin version (semantic versioning recommended) */
  version?: string;
  /** Optional icon for the plugin */
  icon?: string;
}

/**
 * Configuration for creating controller plugins that provide services, functions, and optional panels.
 * These plugins typically handle initialization, provide APIs, or manage background services.
 */
interface ControllerPluginConfig {
  /** Unique identifier for the plugin */
  id: string;
  /** Display name for the plugin */
  name: string;
  /** Brief description of the plugin's purpose */
  description: string;
  /** Functions/actions provided by this plugin */
  functions: FunctionConfig[];
  /** Optional panels to register alongside the functions */
  panels?: PanelConfig[];
  /** Optional manager/service classes to instantiate */
  managerClasses?: ManagerConfig[];
}

/**
 * Configuration for creating interface plugins that provide functions with toolbar integration.
 * Used when you need to expose functionality through toolbar buttons without dedicated panels.
 */
interface InterfacePluginConfig {
  /** Unique identifier for the plugin */
  id: string;
  /** Display name for the plugin */
  name: string;
  /** Brief description of the plugin's purpose */
  description: string;
  /** Functions/actions provided by this plugin */
  functions: FunctionConfig[];
  /** Toolbar button configurations for the functions */
  toolbarRegistrations?: ToolbarRegistration[];
  /** Optional manager/service classes to instantiate */
  managerClasses?: ManagerConfig[];
}

/**
 * Creates a panel-based plugin with automatic toolbar integration and component registration.
 *
 * This factory simplifies the creation of plugins that provide UI panels, automatically:
 * - Registering the panel component as a custom element
 * - Creating toolbar button configuration (if target is specified)
 * - Setting up proper panel-to-toolbar bindings
 * - Handling additional components and functions
 *
 * @param config Configuration object defining the panel plugin
 * @returns A complete TeskooanoPlugin ready for registration
 *
 * @example
 * ```typescript
 * export const plugin = createPanelPlugin({
 *   id: "my-feature",
 *   name: "My Feature",
 *   description: "A useful feature panel",
 *   componentName: "my-feature-panel",
 *   panelClass: MyFeaturePanel,
 *   defaultTitle: "My Feature",
 *   iconSvg: myIcon,
 *   target: "engine-toolbar",
 *   order: 100
 * });
 * ```
 */
export function createPanelPlugin(config: PanelPluginConfig): TeskooanoPlugin {
  const panelConfig: PanelConfig = {
    componentName: config.componentName,
    defaultTitle: config.defaultTitle,
    ...(config.svelteComponent
      ? { svelteComponent: config.svelteComponent }
      : { panelClass: config.panelClass }),
  };

  // Only create toolbar registration if target is specified (not undefined)
  const toolbarRegistrations: ToolbarRegistration[] = [];
  if (config.target !== undefined) {
    toolbarRegistrations.push({
      target: config.target || "engine-toolbar",
      items: [
        {
          id: `${config.id}-button`,
          type: "panel",
          title: config.buttonTitle || config.defaultTitle,
          iconSvg: config.iconSvg,
          componentName: config.componentName,
          behaviour: "toggle",
          order: config.order || 10,
          ...(config.initialPosition && {
            initialPosition: config.initialPosition,
          }),
          ...(config.tooltipText && { tooltipText: config.tooltipText }),
          ...(config.tooltipTitle && { tooltipTitle: config.tooltipTitle }),
          ...(config.tooltipIconSvg && {
            tooltipIconSvg: config.tooltipIconSvg,
          }),
        },
      ],
    });
  }

  // For web-component panels include the main element in the component registry.
  // Svelte panels don't register custom elements.
  const components: ComponentConfig[] = config.svelteComponent
    ? config.additionalComponents || []
    : [
        {
          tagName: config.componentName,
          componentClass: config.panelClass,
        },
        ...(config.additionalComponents || []),
      ];

  return {
    id: config.id,
    name: config.name,
    description: config.description,
    panels: [panelConfig],
    toolbarRegistrations: toolbarRegistrations,
    components: components,
    functions: config.additionalFunctions || [],
    managerClasses: [],
  };
}

/**
 * Creates a component-only plugin that registers custom elements without panels or toolbars.
 *
 * Use this factory for reusable UI components that don't need their own dedicated panels
 * but should be available throughout the application. Perfect for shared components like
 * buttons, form controls, or layout elements.
 *
 * @param config Configuration object defining the component plugin
 * @returns A complete TeskooanoPlugin with only component registrations
 *
 * @example
 * ```typescript
 * export const plugin = createComponentPlugin({
 *   id: "ui-components",
 *   name: "UI Components",
 *   description: "Shared UI component library",
 *   components: [
 *     { tagName: "custom-button", componentClass: CustomButton },
 *     { tagName: "icon-display", componentClass: IconDisplay }
 *   ]
 * });
 * ```
 */
export function createComponentPlugin(
  config: ComponentPluginConfig,
): TeskooanoPlugin {
  return {
    id: config.id,
    name: config.name,
    description: config.description,
    ...(config.version && { version: config.version }),
    ...(config.icon && { icon: config.icon }),
    components: config.components,
    managerClasses: config.managerClasses || [],
    panels: [],
    functions: [],
    toolbarRegistrations: [],
    toolbarWidgets: [],
  };
}

/**
 * Creates a controller plugin that provides services, functions, and optional panels.
 *
 * Controller plugins are the backbone of the application architecture. They typically:
 * - Initialize services and manager classes
 * - Provide API functions for other plugins to use
 * - Handle background tasks and data processing
 * - Optionally include panels for configuration or monitoring
 *
 * @param config Configuration object defining the controller plugin
 * @returns A complete TeskooanoPlugin with functions and optional panels
 *
 * @example
 * ```typescript
 * export const plugin = createControllerPlugin({
 *   id: "data-manager",
 *   name: "Data Manager",
 *   description: "Handles data persistence and synchronization",
 *   functions: [
 *     { id: "data:save", execute: (ctx, data) => saveData(data) },
 *     { id: "data:load", execute: (ctx, id) => loadData(id) }
 *   ],
 *   managerClasses: [
 *     { id: "data-cache", managerClass: DataCacheManager }
 *   ]
 * });
 * ```
 */
export function createControllerPlugin(
  config: ControllerPluginConfig,
): TeskooanoPlugin {
  return {
    id: config.id,
    name: config.name,
    description: config.description,
    functions: config.functions,
    panels: config.panels || [],
    managerClasses: config.managerClasses || [],
    components: [],
    toolbarRegistrations: [],
    toolbarWidgets: [],
  };
}

/**
 * Creates an interface plugin that provides functions with toolbar button integration.
 *
 * Interface plugins are ideal when you want to expose functionality through toolbar
 * buttons without creating dedicated panels. They're perfect for:
 * - Action buttons (save, export, reset)
 * - Toggle switches (show/hide features)
 * - Quick access functions
 * - Modal dialog triggers
 *
 * @param config Configuration object defining the interface plugin
 * @returns A complete TeskooanoPlugin with functions and toolbar integration
 *
 * @example
 * ```typescript
 * export const plugin = createInterfacePlugin({
 *   id: "quick-actions",
 *   name: "Quick Actions",
 *   description: "Common actions accessible from toolbar",
 *   functions: [
 *     { id: "action:export", execute: () => exportData() },
 *     { id: "action:reset", execute: () => resetView() }
 *   ],
 *   toolbarRegistrations: [{
 *     target: "main-toolbar",
 *     items: [
 *       { id: "export-btn", type: "function", functionId: "action:export" }
 *     ]
 *   }]
 * });
 * ```
 */
export function createInterfacePlugin(
  config: InterfacePluginConfig,
): TeskooanoPlugin {
  return {
    id: config.id,
    name: config.name,
    description: config.description,
    functions: config.functions,
    toolbarRegistrations: config.toolbarRegistrations || [],
    managerClasses: config.managerClasses || [],
    panels: [],
    components: [],
    toolbarWidgets: [],
  };
}

/**
 * Creates a lightweight plugin that only provides functions without any UI components.
 *
 * Function-only plugins are perfect for:
 * - API services and utilities
 * - Background processing tasks
 * - Data transformation functions
 * - Integration with external services
 * - Shared business logic
 *
 * These plugins have minimal overhead since they don't register any UI elements.
 *
 * @param config Basic plugin configuration with functions array
 * @returns A complete TeskooanoPlugin with only function registrations
 *
 * @example
 * ```typescript
 * export const plugin = createFunctionPlugin({
 *   id: "math-utils",
 *   name: "Math Utilities",
 *   description: "Common mathematical functions",
 *   functions: [
 *     { id: "math:distance", execute: (ctx, p1, p2) => calculateDistance(p1, p2) },
 *     { id: "math:angle", execute: (ctx, v1, v2) => calculateAngle(v1, v2) }
 *   ]
 * });
 * ```
 */
export function createFunctionPlugin(config: {
  id: string;
  name: string;
  description: string;
  functions: any[];
}): TeskooanoPlugin {
  return {
    id: config.id,
    name: config.name,
    description: config.description,
    panels: [],
    toolbarRegistrations: [],
    components: [],
    functions: config.functions,
    managerClasses: [],
  };
}

/**
 * Creates a plugin that provides toolbar widgets without dedicated panels.
 *
 * Widget plugins are specialized for creating custom elements that are directly
 * embedded in toolbars. Unlike panel plugins, these don't open separate windows
 * but provide inline functionality within the toolbar itself. Perfect for:
 * - Status indicators and displays
 * - Inline controls (sliders, dropdowns)
 * - Real-time data displays
 * - Quick settings toggles
 * - Progress indicators
 *
 * @param config Configuration with components and toolbar widget definitions
 * @returns A complete TeskooanoPlugin with widget registrations
 *
 * @example
 * ```typescript
 * export const plugin = createWidgetPlugin({
 *   id: "status-widgets",
 *   name: "Status Widgets",
 *   description: "Real-time status indicators for toolbar",
 *   components: [
 *     { tagName: "fps-counter", componentClass: FPSCounter },
 *     { tagName: "memory-gauge", componentClass: MemoryGauge }
 *   ],
 *   toolbarWidgets: [
 *     { id: "fps-widget", target: "main-toolbar", componentName: "fps-counter" },
 *     { id: "memory-widget", target: "main-toolbar", componentName: "memory-gauge" }
 *   ]
 * });
 * ```
 */
export function createWidgetPlugin(config: {
  id: string;
  name: string;
  description: string;
  components: ComponentConfig[];
  toolbarWidgets: any[];
}): TeskooanoPlugin {
  return {
    id: config.id,
    name: config.name,
    description: config.description,
    panels: [],
    toolbarRegistrations: [],
    components: config.components,
    functions: [],
    managerClasses: [],
    toolbarWidgets: config.toolbarWidgets,
  };
}
