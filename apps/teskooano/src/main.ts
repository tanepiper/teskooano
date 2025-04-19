import "dockview-core/dist/styles/dockview.css";
import "./styles.css"; // Import our custom styles
// import "./components/ui-controls/ui-layout.css"; // Import UI layout styles -- REMOVED

import { DockviewController } from "./controllers/dockviewController";
import { ToolbarController } from "./controllers/toolbarController";
import { TourController } from "./controllers/tourController";
// Import simulation controls component definition
import "./components/ui-controls/FocusControl"; // Import the new component
import "./components/ui-controls/RendererInfoDisplay"; // Import the new renderer info component
// SimulationInfoDisplay has been migrated to the toolbar
import "./components/ui-controls/CelestialInfo"; // Import the new CelestialInfo component
import "./components/shared/Button"; // Add this line
import { SettingsPanel } from "./components/settings/SettingsPanel";
// Also import ProgressPanel for registration
import { ProgressPanel } from "./components/engine/ProgressPanel";
// Import TourModal
import { TourModal } from "./components/ui-controls/TourModal";
import { celestialObjectsStore } from "@teskooano/core-state";
import { layoutOrientationStore, Orientation } from "./stores/layoutStore"; // Import the layout store
import "./components/ui-controls/EngineUISettingsPanel"; // Import for side effect (registers element)

// --- Setup --- //

// Get main elements
const appElement = document.getElementById("app");
const toolbarElement = document.getElementById("toolbar");

if (!appElement || !toolbarElement) {
  throw new Error("Required HTML elements (#app or #toolbar) not found.");
}

// --- Orientation Handling --- //

const portraitMediaQuery = window.matchMedia("(orientation: portrait)");

function updateOrientation(isPortrait: boolean) {
  const newOrientation: Orientation = isPortrait ? "portrait" : "landscape";
  layoutOrientationStore.set(newOrientation);
}

// Initial check
updateOrientation(portraitMediaQuery.matches);

// Listen for changes
portraitMediaQuery.addEventListener("change", (event) => {
  updateOrientation(event.matches);
});

// --- Initialize Controllers --- //

const dockviewController = new DockviewController(appElement);

// Now initialize the tour controller with the correct engine view ID
const tourController = new TourController();

// Initialize the first engine view BEFORE creating the tour controller
const toolbarController = new ToolbarController(
  toolbarElement,
  dockviewController,
);
toolbarController.initializeFirstEngineView();

// Get the first engine view ID after it's been created
tourController.setEngineViewId("engine_view_1");

// Now set the tour controller on the toolbar controller
toolbarController.setTourController(tourController);

// Register dynamically used components
dockviewController.registerComponent("settings_view", SettingsPanel);
dockviewController.registerComponent("progress_view", ProgressPanel);

// --- Set Dockview API for SeedForm & UiPanel --- //
const dockviewApi = dockviewController.api;

// --- Listen for focus changes to update tour --- //
document.addEventListener("engine-focus-request", (event: Event) => {
  // Cast to CustomEvent with the expected detail structure
  const focusEvent = event as CustomEvent<{
    targetPanelId: string;
    objectId: string | null;
    distance?: number;
  }>;

  const { objectId } = focusEvent.detail;

  if (objectId) {
    // Get the celestial object from the store
    const objects = celestialObjectsStore.get();
    const selectedObject = objects[objectId];

    if (selectedObject) {
      // Update the tour controller with the selected celestial name
      tourController.setCurrentSelectedCelestial(selectedObject.name);
    } else {
      tourController.setCurrentSelectedCelestial(undefined);
    }
  } else {
    // Clear the selected celestial when focus is cleared
    tourController.setCurrentSelectedCelestial(undefined);
  }
});

// --- Check for tour preferences and show modal if needed --- //
// Wait for DOM to be fully ready before showing tour modal
window.addEventListener("DOMContentLoaded", () => {
  // Only show if user hasn't chosen to skip the tour
  if (!tourController.isSkippingTour() && !tourController.hasShownTourModal()) {
    // Add the app logo ID for tour targeting
    const appLogo = document.querySelector(".app-logo");
    if (appLogo) {
      appLogo.id = "app-logo";
    }

    // Mark tour modal as shown to avoid showing it again on reload
    tourController.markTourModalAsShown();

    // Create and show tour modal
    const tourModal = new TourModal();
    tourModal.setCallbacks(
      // On Accept - Start Tour
      () => {
        // Check if there's a saved step
        const savedStep = localStorage.getItem("tourCurrentStep");
        if (savedStep) {
          tourController.resumeTour();
        } else {
          tourController.startTour();
        }
      },
      // On Decline - Skip Tour
      () => {
        tourController.setSkipTour(true);
      },
    );

    // Append to document
    document.body.appendChild(tourModal);
  }
});

// --- Cleanup on page unload --- //
window.addEventListener("beforeunload", () => {
  // Clean up controllers
  toolbarController.destroy();
});
