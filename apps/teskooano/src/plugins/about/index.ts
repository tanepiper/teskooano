import { createPanelPlugin } from "@teskooano/ui-plugin";
import QuestionIcon from "@fluentui/svg-icons/icons/question_circle_24_regular.svg?raw";
import AboutPanelSvelte from "./view/AboutPanel.svelte";

/**
 * Plugin definition for the About panel.
 * Migrated to Svelte 5 — uses svelteComponent instead of panelClass.
 */
export const plugin = createPanelPlugin({
  id: "teskooano-about",
  name: "About Panel",
  description: "Provides the About panel and toolbar button.",
  componentName: "teskooano-about-panel",
  svelteComponent: AboutPanelSvelte,
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
