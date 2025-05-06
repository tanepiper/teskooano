import type {
  TeskooanoPlugin,
  PanelConfig,
  ToolbarRegistration,
} from "@teskooano/ui-plugin";
import { FocusControl } from "./FocusControl";
import TargetIcon from "@fluentui/svg-icons/icons/target_24_regular.svg?raw";

const panelConfig: PanelConfig = {
  componentName: "focus-control",
  panelClass: FocusControl,
  defaultTitle: "Focus Control",
};

const toolbarRegistration: ToolbarRegistration = {
  target: "engine-toolbar",
  items: [
    {
      id: "focus-control-button",
      type: "panel",
      title: "Focus Control",
      iconSvg: TargetIcon,
      componentName: "focus-control",
      behaviour: "toggle",

      initialPosition: {
        top: 150,
        left: 50,
        width: 400,
        height: 650,
      },
      order: 10,
    },
  ],
};

/**
 * Plugin definition for the Focus Control panel.
 *
 * Registers the FocusControl panel and its associated toolbar button
 * for selecting and focusing on celestial objects.
 */
export const plugin: TeskooanoPlugin = {
  id: "teskooano-focus-controls",
  name: "Focus Controls",
  description: "Provides the focus control panel and toolbar button.",
  panels: [panelConfig],
  toolbarRegistrations: [toolbarRegistration],
  functions: [],
  toolbarWidgets: [],
  managerClasses: [],
};

export { FocusControl };
