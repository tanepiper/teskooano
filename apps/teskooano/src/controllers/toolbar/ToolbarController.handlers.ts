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
import type { TourController } from "../tourController";

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
 * @param tourController - The TourController instance (optional).
 * @returns An object containing the handler functions conforming to ToolbarTemplateHandlers.
 */
export const createToolbarHandlers = (
  controller: ToolbarController,
  tourController: TourController | null,
): ToolbarTemplateHandlers => {
  // --- Define individual handlers ---
  const handleGitHubClick = (event: MouseEvent) => {
    window.open(
      "https://github.com/tanepiper/open-space-2",
      "_blank",
      "noopener,noreferrer",
    );
  };

  const handleSettingsClick = (event: MouseEvent) => {
    controller.toggleSettingsPanel();
  };

  const handleAddViewClick = (event: MouseEvent) => {
    controller.addCompositeEnginePanel();
  };

  const handleTourClick = (event: MouseEvent) => {
    if (tourController) {
      controller.startTour();
    } else {
      console.warn("Tour handler called but tourController is null");
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
