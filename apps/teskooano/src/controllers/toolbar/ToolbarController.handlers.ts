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

/**
 * Creates the event handlers for the toolbar buttons and window events.
 * @param deps - An object containing the necessary methods and properties from the ToolbarController.
 * @returns An object containing the handler functions.
 */
export const createToolbarHandlers = (deps: ToolbarHandlerDependencies) => {
  const handleGitHubClick = (event: MouseEvent) => {
    // Check if the related popover is open before navigating
    const popover = document.getElementById("github-button-popover");
    if (!popover?.matches(":popover-open")) {
      deps.openGitHubRepo();
    }
  };

  const handleSettingsClick = () => {
    deps.toggleSettingsPanel();
  };

  const handleTourClick = () => {
    deps.startTour();
  };

  const handleAddViewClick = () => {
    deps.addCompositeEnginePanel();
  };

  /**
   * Handle window resize events to update mobile detection and UI
   */
  const handleResize = () => {
    const wasMobile = deps.isMobileDevice();
    const isNowMobile = deps.detectMobileDevice(); // Assuming detectMobileDevice updates internal state if needed

    // Only update if the mobile state actually changed
    if (wasMobile !== isNowMobile) {
      deps.updateToolbarForMobileState();
    }
  };

  return {
    handleGitHubClick,
    handleSettingsClick,
    handleTourClick,
    handleAddViewClick,
    handleResize,
  };
};
