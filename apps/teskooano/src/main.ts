import "@teskooano/design-system/styles.css";
import "dockview-core/dist/styles/dockview.css";
import "./vite-env.d";

import { celestialObjectsStore } from "@teskooano/core-state";
import { EnginePlaceholder } from "./components/engine/EnginePlaceholder";
// import type { TeskooanoModalManager } from "./components/shared/ModalManager";
import { TeskooanoTourModal } from "./components/tours/TourModal";
import { DockviewController } from "./controllers/dockview/DockviewController";
import { ToolbarController } from "./controllers/toolbar/ToolbarController";
// import { TourController } from "./controllers/tourController"; // REMOVED - Plugin handles this now
import { layoutOrientationStore, Orientation } from "./stores/layoutStore";
// import { ProgressPanel } from "./components/engine/ProgressPanel"; // REMOVED Import

// --- Import Plugin System --- //
import {
  getFunctionConfig,
  getLoadedModuleClass,
  getPlugins,
  loadAndRegisterComponents,
  loadAndRegisterPlugins,
  PanelConfig,
  TeskooanoPlugin,
} from "@teskooano/ui-plugin";
import { componentConfig } from "./config/componentRegistry";
import { pluginConfig } from "./config/pluginRegistry";

// --- Centralized instance store (Example) ---
// You could use Nanostores or a simple exported object
interface AppContext {
  modalManager?: any; // Use the actual ModalManager type here
  // other shared instances...
}
export const appContext: AppContext = {}; // Export this for other modules

// --- Application Initialization --- //

async function startApp() {
  console.log("[App] Starting initialization...");

  // Define which components/modules are critical for initial load
  const criticalComponents = [
    "teskooano-button",
    "teskooano-modal",
    "teskooano-modal-manager", // Make sure manager is loaded early
    // Add other essential tags/keys...
  ];

  try {
    // Ensure critical components/modules are loaded BEFORE initializing the rest
    console.log("[App] Loading critical components/modules...");
    await loadAndRegisterComponents(criticalComponents);
    console.log("[App] Critical components/modules loaded.");

    // Now initialize the main application logic
    initializeApp();
  } catch (error) {
    console.error(
      "[App] Failed during critical component loading or initialization:",
      error,
    );
    // Handle initialization failure (e.g., show error message)
  }
}

async function initializeApp() {
  console.log("Initializing Teskooano...");

  // Get main elements
  const appElement = document.getElementById("app");
  const toolbarElement = document.getElementById("toolbar");

  if (!appElement || !toolbarElement) {
    throw new Error("Required HTML elements (#app or #toolbar) not found.");
  }

  // --- Load UI Components and Plugins --- //
  console.log("Phase 1: Loading and Registering Base Components...");
  // Get component tag names from the config keys
  const componentTags = Object.keys(componentConfig);
  await loadAndRegisterComponents(componentTags);
  console.log("Phase 1 Complete.");

  console.log("Phase 2: Loading and Registering Plugins...");
  // Get plugin IDs from the config keys
  const pluginIds = Object.keys(pluginConfig);
  await loadAndRegisterPlugins(pluginIds);
  console.log("Phase 2 Complete.");

  // --- Initialize Core Controllers & Systems --- //
  console.log("Initializing core controllers...");

  const dockviewController = new DockviewController(appElement);
  // const tourController = new TourController(); // REMOVED - Plugin handles this
  const toolbarController = new ToolbarController(
    toolbarElement,
    dockviewController,
    // No tourController passed here anymore
  );

  // --- Get Loaded Class and Instantiate Singleton ---
  const ModalManagerClass = getLoadedModuleClass("teskooano-modal-manager");
  if (!ModalManagerClass) {
    console.error(
      "[App] Failed to get TeskooanoModalManager class after loading.",
    );
    // Handle this critical failure
    return;
  }
  const modalManager = new ModalManagerClass(dockviewController);
  console.log("[App] TeskooanoModalManager instantiated.");

  // ---> Store the singleton instance for others to use
  appContext.modalManager = modalManager;

  // Inject ModalManager into TourModal class (if TourModal is still needed globally)
  TeskooanoTourModal.setModalManager(modalManager);

  // Set Dockview API for SeedForm & EnginePlaceholder (if still needed globally)
  EnginePlaceholder.setDockviewApi(dockviewController.api);

  // --- Register Dockview Components --- //
  console.log("Registering Dockview panel components...");

  // Register components from plugins
  const plugins = getPlugins();
  plugins.forEach((plugin: TeskooanoPlugin) => {
    plugin.panels?.forEach((panelConfig: PanelConfig) => {
      const panelClass = panelConfig.panelClass;
      if (panelClass) {
        console.log(
          `  - Registering Dockview component: ${panelConfig.componentName} from plugin ${plugin.id}`,
        );
        dockviewController.registerComponent(
          panelConfig.componentName,
          panelClass,
        );
      } else {
        console.error(
          `Panel class not found for ${panelConfig.componentName} in plugin ${plugin.id}`,
        );
      }
    });
  });

  console.log("Dockview panel registration complete.");

  toolbarController.initializeFirstEngineView();
  setupEventListeners();

  console.log("Teskooano Initialized.");
}

function setupEventListeners() {
  const portraitMediaQuery = window.matchMedia("(orientation: portrait)");
  const narrowWidthMediaQuery = window.matchMedia("(max-width: 1024px)");
  function updateOrientation() {
    const isPortraitMode =
      portraitMediaQuery.matches || narrowWidthMediaQuery.matches;
    const newOrientation: Orientation = isPortraitMode
      ? "portrait"
      : "landscape";
    layoutOrientationStore.set(newOrientation);
  }
  updateOrientation(); // Initial check
  portraitMediaQuery.addEventListener("change", updateOrientation);
  narrowWidthMediaQuery.addEventListener("change", updateOrientation);
  window.addEventListener("resize", updateOrientation);

  // Focus changes listener
  document.addEventListener("engine-focus-request", (event: Event) => {
    const focusEvent = event as CustomEvent<{
      targetPanelId: string;
      objectId: string | null;
      distance?: number;
    }>;
    const { objectId } = focusEvent.detail;
    if (objectId) {
      const objects = celestialObjectsStore.get();
      const selectedObject = objects[objectId];
      // tourController.setCurrentSelectedCelestial(selectedObject?.name);
      const func = getFunctionConfig("tour:setCelestialFocus"); // Hypothetical function ID
      if (func?.execute) {
        func.execute({ celestialName: selectedObject?.name });
      } else {
        // console.warn("Function tour:setCelestialFocus not found");
      }
    } else {
      // tourController.setCurrentSelectedCelestial(undefined);
    }
  });

  // Listener for Start Tour Requests from Placeholders
  document.body.addEventListener("start-tour-request", () => {
    // Use plugin function
    const restartFunc = getFunctionConfig("tour:restart");
    if (restartFunc?.execute) {
      restartFunc.execute();
    } else {
      console.warn("Function tour:restart not found for start-tour-request");
    }
  });
}

// --- Start the App --- //
startApp();
