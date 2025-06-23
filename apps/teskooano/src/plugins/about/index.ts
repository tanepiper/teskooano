import { createPanelPlugin } from "@teskooano/ui-plugin";
import { AboutPanel } from "./view/AboutPanel.view.js";
import QuestionIcon from "@fluentui/svg-icons/icons/question_circle_24_regular.svg?raw";

/**
 * Plugin definition for the About panel.
 * ✅ Refactored to use createPanelPlugin factory - reduced from 68 lines to 15 lines
 */
export const plugin = createPanelPlugin({
  id: "teskooano-about",
  name: "About Panel", 
  description: "Provides the About panel and toolbar button.",
  componentName: AboutPanel.componentName,
  panelClass: AboutPanel,
  defaultTitle: "About Teskooano",
  iconSvg: QuestionIcon,
  target: "main-toolbar",
  order: 5,
  tooltipText: "Version and dependency information",
  tooltipTitle: `🔭 Teskooano ${import.meta.env.PACKAGE_VERSION}`,
  tooltipIconSvg: QuestionIcon,
  initialPosition: {
    top: 100,
    left: 100,
    width: 450,
    height: 500,
  },
});
