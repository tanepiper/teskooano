import type {
  TeskooanoPlugin,
  PanelConfig,
  ToolbarRegistration,
} from "@teskooano/ui-plugin";
import { FocusControl } from "./FocusControl.js";
import TargetIcon from "@fluentui/svg-icons/icons/target_24_regular.svg?raw";
import { CelestialRow } from "./CelestialRow.js";
import { FocusTreeList } from "./FocusTreeList.js";
import { GroupPanelPartInitParameters, IContentRenderer } from "dockview-core";
import type { CompositeEnginePanel } from "../engine-panel/panels/CompositeEnginePanel.js";
import { DestroyedObjectsList } from "./DestroyedObjectsList.js";

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
  ],
};

export { FocusControl };
export { FocusTreeList } from "./FocusTreeList.js";
export { DestroyedObjectsList } from "./DestroyedObjectsList.js";
export { CelestialRow } from "./CelestialRow.js";
