// Handlers for toolbar actions
import type { ToolbarController } from "./ToolbarController";
import { pluginManager } from "@teskooano/ui-plugin"; // Import the instance

/**
 * @interface ToolbarTemplateHandlers
 * @description Defines the structure for the object containing event handlers for toolbar buttons.
 */
export interface ToolbarTemplateHandlers {
  /** Handler for the GitHub button click. */
  handleGitHubClick: (event: MouseEvent) => void;
  /** Handler for the Settings button click. */
  handleSettingsClick: (event: MouseEvent) => void;
  /** Handler for the Tour button click. */
  handleTourClick: (event: MouseEvent) => void;
  /** Handler for the Add View (or equivalent) button click. */
  handleAddViewClick: (event: MouseEvent) => void;
}

/**
 * Creates and returns an object containing event handler functions for the main toolbar buttons.
 * These handlers typically interact with the `ToolbarController` or the `ui-plugin` system
 * to perform actions like opening links, toggling panels, or starting tours.
 *
 * @param {ToolbarController} controller - The instance of the ToolbarController to interact with (e.g., for opening GitHub repo).
 * @returns {ToolbarTemplateHandlers} An object containing the handler functions.
 */
export const createToolbarHandlers = (
  controller: ToolbarController,
): ToolbarTemplateHandlers => {
  const handleGitHubClick = (event: MouseEvent): void => {
    controller.openGitHubRepo();
  };

  const handleSettingsClick = (event: MouseEvent): void => {
    const toggleFuncConfig = pluginManager.getFunctionConfig(
      "settings:toggle_panel",
    );
    if (toggleFuncConfig?.execute) {
      try {
        pluginManager.execute("settings:toggle_panel");
      } catch (error) {
        console.error(
          "[Toolbar] Error executing settings:toggle_panel:",
          error,
        );
      }
    } else {
      console.error(
        "[Toolbar] Function settings:toggle_panel not found in plugin manager.",
      );
    }
  };

  const handleAddViewClick = (event: MouseEvent): void => {
    const addPanelFuncConfig = pluginManager.getFunctionConfig(
      "engine:add_composite_panel",
    );
    if (addPanelFuncConfig?.execute) {
      try {
        pluginManager.execute("engine:add_composite_panel");
      } catch (error) {
        console.error(
          "[Toolbar] Error executing engine:add_composite_panel:",
          error,
        );
      }
    } else {
      console.error(
        "[Toolbar] Function engine:add_composite_panel not found in plugin manager.",
      );
    }
  };

  const handleTourClick = (event: MouseEvent): void => {
    const restartFuncConfig = pluginManager.getFunctionConfig("tour:restart");
    if (restartFuncConfig?.execute) {
      try {
        pluginManager.execute("tour:restart");
      } catch (error) {
        console.error("[Toolbar] Error executing tour:restart:", error);
      }
    } else {
      console.error(
        "[Toolbar] Function tour:restart not found in plugin manager.",
      );
    }
  };

  const handlers: ToolbarTemplateHandlers = {
    handleGitHubClick,
    handleSettingsClick,
    handleAddViewClick,
    handleTourClick,
  };

  return handlers;
};
