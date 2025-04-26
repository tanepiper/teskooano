import "@teskooano/design-system/styles.css";
import "dockview-core/dist/styles/dockview.css";
import "./vite-env.d";

import { celestialObjectsStore } from "@teskooano/core-state";
import { EnginePlaceholder } from "./components/engine/EnginePlaceholder";
import { ModalManager } from "./components/shared/ModalManager";
import { ToolbarSeedForm } from "./components/toolbar/SeedForm";
import { TeskooanoTourModal } from "./components/tours/TourModal";
import { DockviewController } from "./controllers/dockview/DockviewController";
import { ToolbarController } from "./controllers/toolbar/ToolbarController";
import { TourController } from "./controllers/tourController";
import { layoutOrientationStore, Orientation } from "./stores/layoutStore";

// --- Import Plugin System --- //
import {
  loadAndRegisterComponents,
  loadAndRegisterPlugins,
  getPanelConfig,
  getPlugins,
  TeskooanoPlugin,
  PanelConfig
} from "@teskooano/ui-plugin";
import { componentConfig } from "./config/componentRegistry";
import { pluginConfig } from "./config/pluginRegistry";

// --- Application Initialization --- //

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
    const modalManager = new ModalManager(dockviewController);
    const tourController = new TourController();
    const toolbarController = new ToolbarController(
        toolbarElement,
        dockviewController
    );

    // Inject ModalManager into TourModal class (if TourModal is still needed globally)
    TeskooanoTourModal.setModalManager(modalManager);

    // Set Dockview API for SeedForm & EnginePlaceholder (if still needed globally)
    ToolbarSeedForm.setDockviewApi(dockviewController.api);
    EnginePlaceholder.setDockviewApi(dockviewController.api);

    // Register Dockview panels using loaded plugin metadata
    console.log("Registering Dockview panel components...");
    const plugins = getPlugins();
    plugins.forEach((plugin: TeskooanoPlugin) => {
        plugin.panels?.forEach((panelConfig: PanelConfig) => {
            const panelClass = panelConfig.panelClass;
            if (panelClass) {
                 console.log(`  - Registering Dockview component: ${panelConfig.componentName} from plugin ${plugin.id}`);
                 dockviewController.registerComponent(panelConfig.componentName, panelClass);
            } else {
                 console.error(`Panel class not found for ${panelConfig.componentName} in plugin ${plugin.id}`);
            }
        });
    });
    console.log("Dockview panel registration complete.");

    // --- Initialize first engine view (if still desired as default) --- //
    toolbarController.initializeFirstEngineView();
    tourController.setEngineViewId("engine_view_1"); // Assuming ID is still valid

    // --- Setup Tour (if still needed globally) --- //
    toolbarController.setTourController(tourController); // Set tour controller if needed

    // Setup listeners
    setupEventListeners(tourController);

    console.log("Teskooano Initialized.");
}

// --- Helper to Setup Event Listeners (keeps initializeApp cleaner) --- //
function setupEventListeners(tourController: TourController) {
    // Orientation Handling
    const portraitMediaQuery = window.matchMedia("(orientation: portrait)");
    const narrowWidthMediaQuery = window.matchMedia("(max-width: 1024px)");
    function updateOrientation() {
        const isPortraitMode = portraitMediaQuery.matches || narrowWidthMediaQuery.matches;
        const newOrientation: Orientation = isPortraitMode ? "portrait" : "landscape";
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
            tourController.setCurrentSelectedCelestial(selectedObject?.name);
        } else {
            tourController.setCurrentSelectedCelestial(undefined);
        }
    });

    // Tour Modal Logic
    window.addEventListener("DOMContentLoaded", () => {
        if (!tourController.isSkippingTour() && !tourController.hasShownTourModal()) {
            tourController.markTourModalAsShown();
            const tourModalElement = document.createElement("teskooano-tour-modal");
            (tourModalElement as TeskooanoTourModal).setCallbacks(
                () => { // On Accept
                    const savedStep = localStorage.getItem("tourCurrentStep");
                    if (savedStep) tourController.resumeTour(); else tourController.startTour();
                },
                () => { // On Decline
                    tourController.setSkipTour(true);
                }
            );
            document.body.appendChild(tourModalElement);
        }
    });

    // Cleanup on page unload
    // window.addEventListener("beforeunload", () => {
    //     toolbarController.destroy(); // toolbarController might not be accessible here
    // });
    // Note: Cleanup might need a different approach if toolbarController is local to initializeApp

    // Listener for Start Tour Requests from Placeholders
    document.body.addEventListener("start-tour-request", () => {
        tourController.restartTour();
    });
}

// --- Start the App --- //
initializeApp();
