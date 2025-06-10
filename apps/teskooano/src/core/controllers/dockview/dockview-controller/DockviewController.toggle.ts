import type { DockviewApi } from "dockview-core";
import type { RegisteredComponentInfo } from "../types";
import { addFloatingPanel } from "./DockviewController.api";

/**
 * Handles the action triggered by a toolbar button configured with type: 'panel'.
 * Toggles or creates a floating panel based on the provided configuration.
 * @param api The DockviewApi instance.
 * @param config The configuration object for the panel button.
 */
export function handlePanelToggleAction(
  api: DockviewApi,
  config: RegisteredComponentInfo["toolbarConfig"],
): void {
  if (!config) {
    console.error(
      "[DockviewController] handlePanelToggleAction called with undefined config",
    );
    return;
  }

  const panelId = `${config.componentName}_float`;
  const behaviour = config.behaviour ?? "toggle";

  const existingPanel = api.getPanel(panelId);

  if (behaviour === "toggle") {
    if (existingPanel?.api.isVisible) {
      try {
        api.removePanel(existingPanel);
      } catch (error) {
        console.error(
          `[DockviewController] Error removing panel ${panelId}:`,
          error,
        );
      }
    } else {
      if (existingPanel) {
        existingPanel.api.setActive();
      } else {
        let position = { top: 100, left: 100, width: 500, height: 400 };
        const toolbarItemConfig = config as any;

        if (toolbarItemConfig.initialPosition) {
          const ip = toolbarItemConfig.initialPosition;
          position = {
            top:
              typeof ip.top === "function"
                ? ip.top()
                : (ip.top ?? position.top),
            left:
              typeof ip.left === "function"
                ? ip.left()
                : (ip.left ?? position.left),
            width:
              typeof ip.width === "function"
                ? ip.width()
                : (ip.width ?? position.width),
            height:
              typeof ip.height === "function"
                ? ip.height()
                : (ip.height ?? position.height),
          };
        }

        addFloatingPanel(
          api,
          {
            id: panelId,
            component: config.componentName,
            title: config.panelTitle ?? config.title,
            params: { title: config.panelTitle ?? config.title },
          },
          position,
        );
      }
    }
  } else if (behaviour === "create") {
    const newPanelId = `${config.componentName}_float_${Date.now()}`;
    const position = { top: 100, left: 100, width: 500, height: 400 };
    addFloatingPanel(
      api,
      {
        id: newPanelId,
        component: config.componentName,
        title: config.panelTitle ?? config.title,
        params: { title: config.panelTitle ?? config.title },
      },
      position,
    );
  }
}
