import { createPanelPlugin } from "@teskooano/ui-plugin";
import { CelestialHierarchy } from "./view/CelestialHierarchy.view.js";
import TargetIcon from "@fluentui/svg-icons/icons/target_24_regular.svg?raw";
import { CelestialRowComponent } from "./components/celestial-row/CelestialRow.component.js";

/**
 * Plugin definition for the Celestial Hierarchy panel.
 * ✅ Refactored to use createPanelPlugin factory - reduced from 62 lines to 20 lines
 */
export const plugin = createPanelPlugin({
  id: "teskooano-celestial-hierarchy",
  name: "Celestial Hierarchy",
  description: "Provides the celestial hierarchy panel and toolbar button.",
  componentName: "celestial-hierarchy",
  panelClass: CelestialHierarchy,
  defaultTitle: "Celestial Hierarchy",
  iconSvg: TargetIcon,
  target: "engine-toolbar",
  order: 10,
  initialPosition: {
    top: 100,
    left: window.innerWidth - 450,
    width: 450,
    height: 750,
  },
  additionalComponents: [
    {
      componentClass: CelestialRowComponent,
      tagName: "celestial-row",
    },
  ],
});

export { CelestialHierarchy };
