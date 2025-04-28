// Define the dependencies needed from the controller
interface ToolbarHandlerDependencies {
  openGitHubRepo: () => void;
  toggleSettingsPanel: () => void;
  startTour: () => void;
  addCompositeEnginePanel: () => void;
  isMobileDevice: () => boolean; // Use a function to get current state
  detectMobileDevice: () => boolean;
  updateToolbarForMobileState: () => void;
}

// Handlers for toolbar actions
import type { ToolbarController } from "./ToolbarController";
import { getFunctionConfig } from "@teskooano/ui-plugin"; // Import plugin manager function

// Interface defining the required handler functions
export interface ToolbarTemplateHandlers {
  handleGitHubClick: (event: MouseEvent) => void;
  handleSettingsClick: (event: MouseEvent) => void;
  handleTourClick: (event: MouseEvent) => void;
  handleAddViewClick: (event: MouseEvent) => void;
}

/**
 * Creates the event handlers for the toolbar buttons.
 * @param controller - The ToolbarController instance.
 * @returns An object containing the handler functions conforming to ToolbarTemplateHandlers.
 */
export const createToolbarHandlers = (
  controller: ToolbarController,
): ToolbarTemplateHandlers => {
  // --- Define individual handlers ---
  const handleGitHubClick = (event: MouseEvent) => {
    controller.openGitHubRepo();
  };

  const handleSettingsClick = (event: MouseEvent) => {
    // Call the toggle function via the plugin manager
    const toggleFunc = getFunctionConfig("settings:toggle_panel");
    if (toggleFunc?.execute) {
      console.log(
        "[Toolbar] Calling settings:toggle_panel function from plugin...",
      );
      toggleFunc.execute(); // Execute the function
    } else {
      console.warn(
        "[Toolbar] Settings button clicked, but settings:toggle_panel function not found in plugin manager.",
      );
    }
  };

  const handleAddViewClick = (event: MouseEvent) => {
    // Call the add panel function via the plugin manager
    const addPanelFunc = getFunctionConfig("engine:add_composite_panel");
    if (addPanelFunc?.execute) {
      console.log(
        "[Toolbar] Calling engine:add_composite_panel function from plugin...",
      );
      addPanelFunc.execute(); // Execute the function
    } else {
      console.warn(
        "[Toolbar] Add View button clicked, but engine:add_composite_panel function not found in plugin manager.",
      );
    }
  };

  const handleTourClick = (event: MouseEvent) => {
    // Call the tour:restart function via the plugin manager
    const restartFunc = getFunctionConfig("tour:restart");
    if (restartFunc?.execute) {
      console.log("[Toolbar] Calling tour:restart function from plugin...");
      restartFunc.execute(); // Execute the function
    } else {
      console.warn(
        "[Toolbar] Tour button clicked, but tour:restart function not found in plugin manager.",
      );
    }
  };

  // --- Assemble handlers object --- //
  const handlers: ToolbarTemplateHandlers = {
    handleGitHubClick: handleGitHubClick,
    handleSettingsClick: handleSettingsClick,
    handleAddViewClick: handleAddViewClick,
    handleTourClick: handleTourClick,
  };

  return handlers;
};
