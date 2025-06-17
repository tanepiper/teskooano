import type {
  TeskooanoPlugin,
  PanelConfig,
  ToolbarRegistration,
} from "@teskooano/ui-plugin";
import { CelestialHierarchy } from "./view/CelestialHierarchy.view.js";
import TargetIcon from "@fluentui/svg-icons/icons/target_24_regular.svg?raw";
import { CelestialRowComponent } from "./components/celestial-row/CelestialRow.component.js";

const panelConfig: PanelConfig = {
  componentName: "celestial-hierarchy",
  panelClass: CelestialHierarchy,
  defaultTitle: "Celestial Hierarchy",
};

const toolbarRegistration: ToolbarRegistration = {
  target: "engine-toolbar",
  items: [
    {
      id: "celestial-hierarchy-button",
      type: "panel",
      title: "Celestial Hierarchy",
      iconSvg: TargetIcon,
      componentName: "celestial-hierarchy",
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
 * Plugin definition for the Celestial Hierarchy panel.
 *
 * Registers the CelestialHierarchy panel and its associated toolbar button
 * for selecting and focusing on celestial objects.
 */
export const plugin: TeskooanoPlugin = {
  id: "teskooano-celestial-hierarchy",
  name: "Celestial Hierarchy",
  description: "Provides the celestial hierarchy panel and toolbar button.",
  panels: [panelConfig],
  toolbarRegistrations: [toolbarRegistration],
  functions: [],
  toolbarWidgets: [],
  managerClasses: [],
  components: [
    {
      componentClass: CelestialRowComponent,
      tagName: "celestial-row",
    },
  ],
};

export { CelestialHierarchy };
