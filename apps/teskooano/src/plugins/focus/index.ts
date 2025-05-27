import TargetIcon from "@fluentui/svg-icons/icons/target_24_regular.svg?raw";
import type {
  PanelConfig,
  TeskooanoPlugin,
  ToolbarRegistration,
} from "@teskooano/ui-plugin";
import { CelestialRow } from "./components/celestial-row.js";
import { DestroyedObjectsList } from "./components/destroyed-objects-list.js";
import { FocusTreeList } from "./components/focus-tree-list.js";
import { RelativeTime } from "./components/relative-time.js";
import { FocusControl } from "./FocusControl.js";

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
  components: [
    {
      componentClass: CelestialRow,
      tagName: "celestial-row",
    },
    {
      componentClass: FocusTreeList,
      tagName: "focus-tree-list",
    },
    {
      componentClass: DestroyedObjectsList,
      tagName: "destroyed-objects-list",
    },
    {
      componentClass: RelativeTime,
      tagName: "relative-time",
    },
  ],
};

export { CelestialRow } from "./components/celestial-row.js";
export { DestroyedObjectsList } from "./components/destroyed-objects-list.js";
export { FocusTreeList } from "./components/focus-tree-list.js";
export { RelativeTime } from "./components/relative-time.js";
export { FocusControl };
