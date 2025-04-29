// Handlers for toolbar actions
import type { ToolbarController } from "./ToolbarController";
import {
  pluginManager,
  type PluginFunctionCallerSignature,
} from "@teskooano/ui-plugin";
import type { DockviewApi } from "dockview-core";

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
  /** Generic handler for plugin functions. */
  handlePluginFunctionClick: (event: MouseEvent) => void;
}

/**
 * Executes a registered plugin function by its ID.
 * Handles potential errors and logs them.
 * @param functionId - The unique ID of the function to execute.
 * @param args - Optional arguments to pass to the function.
 * @returns The result of the function execution, or undefined if the function is not found or fails.
 */
async function executePluginFunction(
  functionId: string,
  ...args: any[]
): Promise<any> {
  console.log(`[Toolbar] Executing function: ${functionId}`);
  const funcConfig = pluginManager.getFunctionConfig(functionId);

  if (funcConfig && funcConfig.execute) {
    try {
      // Await the promise returned by the wrapped execute method
      const result = await funcConfig.execute(...args);

      // Check the awaited result
      // if (result && typeof result === 'object' && result.message) {
      //     console.log(`[Toolbar] Function '${functionId}' success: ${result.message}`);
      //     // TODO: Trigger a global notification/toast here
      // }
      return result;
    } catch (error) {
      console.error(
        `[Toolbar] Error executing function '${functionId}':`,
        error,
      );
      // TODO: Trigger a global error notification/toast here
      return undefined; // Or throw, or return an error object
    }
  } else {
    console.warn(`[Toolbar] Function ID '${functionId}' not found.`);
    return undefined;
  }
}

/**
 * Creates event handlers for the ToolbarController.
 * @param controller - The ToolbarController instance.
 * @param dockviewApi - The Dockview API instance.
 * @returns An object containing event handler functions.
 */
export function createToolbarHandlers(
  controller: ToolbarController,
  dockviewApi: DockviewApi,
): ToolbarTemplateHandlers {
  /**
   * Handler for the GitHub button.
   */
  const handleGitHubClick = (event: MouseEvent): void => {
    controller.openGitHubRepo();
  };

  /**
   * Generic handler for buttons executing plugin functions.
   */
  const handlePluginFunctionClick = (event: MouseEvent): void => {
    const button = (event.target as HTMLElement).closest(
      "teskooano-toolbar-button",
    );
    const functionId = button?.getAttribute("data-function-id");
    if (functionId) {
      executePluginFunction(functionId);
    } else {
      console.warn(
        "[Toolbar] Clicked button is missing data-function-id attribute.",
      );
    }
  };

  /**
   * Handler for the settings toggle.
   */
  const handleSettingsClick = (event: MouseEvent): void => {
    executePluginFunction("settings:toggle_panel");
  };

  /**
   * Handler for adding an engine view.
   */
  const handleAddViewClick = (event: MouseEvent): void => {
    executePluginFunction("engine:add_composite_panel");
  };

  /**
   * Handler for restarting the tour.
   */
  const handleTourClick = (event: MouseEvent): void => {
    executePluginFunction("tour:restart");
  };

  // Return the handlers matching the ToolbarTemplateHandlers interface
  return {
    handleGitHubClick,
    handleSettingsClick,
    handleAddViewClick,
    handleTourClick,
    handlePluginFunctionClick,
  };
}

/**
 * Creates and returns an object containing event handler functions for the main toolbar buttons.
 * These handlers typically interact with the `ToolbarController` or the `ui-plugin` system
 * to perform actions like opening links, toggling panels, or starting tours.
 *
 * @param {ToolbarController} controller - The instance of the ToolbarController to interact with (e.g., for opening GitHub repo).
 * @returns {ToolbarTemplateHandlers} An object containing the handler functions.
 */
// export const createToolbarHandlers = (
//   controller: ToolbarController,
// ): ToolbarTemplateHandlers => {
//   const handleGitHubClick = (event: MouseEvent): void => {
//     controller.openGitHubRepo();
//   };

//   const handleSettingsClick = (event: MouseEvent): void => {
//     const toggleFunc = pluginManager.getFunctionConfig("settings:toggle_panel");
//     if (toggleFunc?.execute) {
//       try {
//         toggleFunc.execute();
//       } catch (error) {
//         console.error(
//           "[Toolbar] Error executing settings:toggle_panel:",
//           error,
//         );
//       }
//     } else {
//       console.error(
//         "[Toolbar] Function settings:toggle_panel not found in plugin manager.",
//       );
//     }
//   };

//   const handleAddViewClick = (event: MouseEvent): void => {
//     const addPanelFunc = pluginManager.getFunctionConfig("engine:add_composite_panel");
//     if (addPanelFunc?.execute) {
//       try {
//         addPanelFunc.execute();
//       } catch (error) {
//         console.error(
//           "[Toolbar] Error executing engine:add_composite_panel:",
//           error,
//         );
//       }
//     } else {
//       console.error(
//         "[Toolbar] Function engine:add_composite_panel not found in plugin manager.",
//       );
//     }
//   };

//   const handleTourClick = (event: MouseEvent): void => {
//     const restartFunc = pluginManager.getFunctionConfig("tour:restart");
//     if (restartFunc?.execute) {
//       try {
//         restartFunc.execute();
//       } catch (error) {
//         console.error("[Toolbar] Error executing tour:restart:", error);
//       }
//     } else {
//       console.error(
//         "[Toolbar] Function tour:restart not found in plugin manager.",
//       );
//     }
//   };

//   const handlers: ToolbarTemplateHandlers = {
//     handleGitHubClick,
//     handleSettingsClick,
//     handleAddViewClick,
//     handleTourClick,
//   };

//   return handlers;
// };
