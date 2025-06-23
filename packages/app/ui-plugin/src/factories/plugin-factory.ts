import type {
  TeskooanoPlugin,
  PanelConfig,
  ToolbarRegistration,
  ComponentConfig,
  ToolbarTarget,
  FunctionConfig,
  ManagerConfig,
} from "../types.js";

interface PanelPluginConfig {
  id: string;
  name: string;
  description: string;
  componentName: string;
  panelClass: any;
  defaultTitle: string;
  iconSvg: string;
  buttonTitle?: string;
  order?: number;
  target?: ToolbarTarget;
  additionalComponents?: ComponentConfig[];
  additionalFunctions?: any[];
  initialPosition?: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  tooltipText?: string;
  tooltipTitle?: string;
  tooltipIconSvg?: string;
}

interface ComponentPluginConfig {
  id: string;
  name: string;
  description: string;
  components: ComponentConfig[];
  managerClasses?: ManagerConfig[];
  version?: string;
  icon?: string;
}

interface ControllerPluginConfig {
  id: string;
  name: string;
  description: string;
  functions: FunctionConfig[];
  panels?: PanelConfig[];
  managerClasses?: ManagerConfig[];
}

interface InterfacePluginConfig {
  id: string;
  name: string;
  description: string;
  functions: FunctionConfig[];
  toolbarRegistrations?: ToolbarRegistration[];
  managerClasses?: ManagerConfig[];
}

/**
 * Factory function to create standard panel plugins with minimal boilerplate.
 * Eliminates the repetitive pattern found across 15+ plugin definitions.
 */
export function createPanelPlugin(config: PanelPluginConfig): TeskooanoPlugin {
  const panelConfig: PanelConfig = {
    componentName: config.componentName,
    panelClass: config.panelClass,
    defaultTitle: config.defaultTitle,
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
          ...(config.initialPosition && { initialPosition: config.initialPosition }),
          ...(config.tooltipText && { tooltipText: config.tooltipText }),
          ...(config.tooltipTitle && { tooltipTitle: config.tooltipTitle }),
          ...(config.tooltipIconSvg && { tooltipIconSvg: config.tooltipIconSvg }),
        },
      ],
    });
  }

  // Always include the main component
  const components: ComponentConfig[] = [
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
 * Factory for component-only plugins (like core UI components).
 */
export function createComponentPlugin(config: ComponentPluginConfig): TeskooanoPlugin {
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
 * Factory for controller plugins (initialization functions + panels).
 */
export function createControllerPlugin(config: ControllerPluginConfig): TeskooanoPlugin {
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
 * Factory for interface plugins (functions + toolbar registrations).
 */
export function createInterfacePlugin(config: InterfacePluginConfig): TeskooanoPlugin {
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
 * Factory for plugins that only provide functions (no UI).
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
 * Factory for plugins that only provide toolbar widgets (no panels).
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