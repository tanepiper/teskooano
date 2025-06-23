import type {
  TeskooanoPlugin,
  PanelConfig,
  ToolbarRegistration,
  ComponentConfig,
  ToolbarTarget,
} from "@teskooano/ui-plugin";

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

  const toolbarRegistration: ToolbarRegistration = {
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
  };

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
    toolbarRegistrations: [toolbarRegistration],
    components: components,
    functions: config.additionalFunctions || [],
    managerClasses: [],
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